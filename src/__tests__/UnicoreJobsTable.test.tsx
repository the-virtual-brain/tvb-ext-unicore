// mock the handler for api requests
import { generateJobs, JobStatus, generateJob } from './pyunicoreWidget.test';

const data = {
  file1: { is_file: true },
  dir1: { is_file: false }
};
jest.mock('../handler', () => {
  return {
    __esModule: true,
    requestAPI: jest
      .fn()
      .mockImplementation((url, init, settings) => Promise.resolve(data))
  };
});

import { UnicoreJobsTable, JobRow } from '../components/UnicoreJobsTable';
import {
  findByText,
  fireEvent,
  render,
  screen,
  waitFor
} from '@testing-library/react';
import React from 'react';
import { IKernelConnection } from '@jupyterlab/services/lib/kernel/kernel';
import { FileBrowser } from '@jupyterlab/filebrowser';

// mock function to cancel a job (must return a promise of a job object)
async function cancelJob(resource_url: string): Promise<any> {
  return Promise.resolve({
    job: generateJob('failed'),
    message: ''
  });
}
const mockCancel = jest.fn(cancelJob);

async function getData(): Promise<void> {
  return Promise.resolve();
}
const mockGetData = jest.fn(getData);

// mock function to get kernel
export async function getKernel(): Promise<
  IKernelConnection | null | undefined
> {
  return Promise.resolve(null);
}
const mockGetKernel = jest.fn(getKernel);

// mock get job
export const mockGetJob = jest.fn((job_url: string) => {
  return 'print("get job")';
});

// mock handle error
const mockHandleError = jest.fn((reason: any) => {
  return;
});

// mock set message state
const mockSetMessageState = jest.fn((message: string) => {
  return;
});

export const BUTTON_SETTINGS = {
  onClick: mockCancel,
  onClickFieldArgs: ['resource_url'],
  isAsync: true,
  name: 'Cancel Job'
};

const COLUMNS = ['id', 'name', 'owner', 'site', 'status', 'start_time'];

// helper function to render a table row
function renderRow(status: JobStatus) {
  const props = {
    buttonSettings: BUTTON_SETTINGS,
    cols: COLUMNS,
    job: generateJob(status),
    setMessageState: mockSetMessageState,
    getKernel: mockGetKernel,
    getJob: mockGetJob,
    id: 'test',
    handleError: mockHandleError
  };
  return render(
    <JobRow
      {...props}
      getFileBrowser={() => jest.fn as unknown as FileBrowser}
      afterButtonSettingClick={mockGetData}
    />,
    {
      wrapper: p => (
        <table>
          <tbody>{p.children}</tbody>
        </table>
      )
    }
  );
}

// helper function to render a table
function renderTable() {
  return render(
    <UnicoreJobsTable
      buttonSettings={BUTTON_SETTINGS}
      columns={COLUMNS}
      data={generateJobs(3)}
      setMessageState={mockSetMessageState}
      getKernel={mockGetKernel}
      getJob={mockGetJob}
      handleError={mockHandleError}
      getFileBrowser={() => jest.fn as unknown as FileBrowser}
      afterButtonSettingClick={mockGetData}
    />
  );
}

describe('<UnicoreJobsTable />, <JobRow />', () => {
  it('renders job row with finished job correctly', async () => {
    const { findByTestId } = renderRow('successful');
    const row = await findByTestId('table-row-test1');
    expect(row).toBeTruthy();
    // rendered row has 7 td children (one for each col and one for the button)
    expect(row.querySelectorAll('td').length).toBe(7);
    // actual values of a job ar actually rendered in the row
    expect(await findByText(row, 'test1')).toBeTruthy();
    expect(await findByText(row, 'test_name_1')).toBeTruthy();
    expect(await findByText(row, 'test')).toBeTruthy();
    expect(await findByText(row, 'JUDAC')).toBeTruthy();
    expect(await findByText(row, 'successful')).toBeTruthy();
    expect(await findByText(row, '2022-02-18T10:54:08+0100')).toBeTruthy();
    // no button is rendered
    expect(document.querySelectorAll('button').length).toBe(0);
    // logs are not rendered
    expect(document.getElementsByClassName('detailsRow').length).toBe(0);
    // after click on row the logs are visible
    await waitFor(() => fireEvent.click(row));
    expect(document.getElementsByClassName('detailsRow').length).toBe(1);
    expect(document.getElementsByClassName('detailsRow')[0].innerHTML).toBe(
      '<td colspan="100"><textarea readonly="">line 1\nline 2</textarea></td>'
    );
  });

  it('renders job row with job in progress correctly, renders button to cancel', async () => {
    const { findByTestId } = renderRow('running');
    const row = await findByTestId('table-row-test1');
    expect(row).toBeTruthy();
    // button should be rendered
    const btn = await findByText(row, 'Cancel Job');
    expect(btn).toBeTruthy();
    // click on cancel job button and wait until finished
    await waitFor(() => fireEvent.click(btn));
    // function to cancel job should be called
    expect(mockCancel).toBeCalledTimes(1);
    // function to set message state should be called
    expect(mockSetMessageState).toBeCalledTimes(1);
    // try to drag a job
    await waitFor(() => fireEvent.dragStart(row));
    // get kernel should have been called
    expect(mockGetKernel).toBeCalledTimes(1);
    // handle error should have been called as get kernel returns null
    expect(mockHandleError).toBeCalledTimes(1);
  });

  it('renders jobs table with header and a line for each job', async () => {
    const { findByTestId } = renderTable();
    // expect a table to be rendered
    const table = document.querySelector('table');
    expect(table).toBeTruthy();
    // table has a header
    const head = table?.querySelector('thead');
    expect(head).toBeTruthy();
    // header has all columns rendered
    expect(await screen.findByText('ID')).toBeTruthy();
    expect(await screen.findByText('NAME')).toBeTruthy();
    expect(await screen.findByText('OWNER')).toBeTruthy();
    expect(await screen.findByText('SITE')).toBeTruthy();
    expect(await screen.findByText('STATUS')).toBeTruthy();
    expect(await screen.findByText('START_TIME')).toBeTruthy();
    expect(await screen.findByText('ACTIONS')).toBeTruthy();
    // there are two rows one for each job
    expect(await findByTestId('table-row-test1')).toBeTruthy();
    expect(await findByTestId('table-row-test2')).toBeTruthy();
  });
});
