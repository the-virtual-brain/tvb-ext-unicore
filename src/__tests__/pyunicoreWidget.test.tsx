// mock the handler for api requests
jest.mock('../handler', () => {
  return {
    __esModule: true,
    requestAPI: jest
      .fn()
      .mockImplementation((url, init, settings) => Promise.resolve(data))
  };
});
// mock the ReactWidget
jest.mock('@jupyterlab/apputils', () => {
  return {
    __esModule: true,
    ReactWidget: jest.fn().mockImplementation(() => {
      return {
        render: () => {
          console.log('render');
        }
      };
    })
  };
});

import { IJob, PyunicoreComponent } from '../pyunicoreWidget';
import {
  findByText,
  fireEvent,
  getByTestId,
  render,
  waitFor
} from '@testing-library/react';

import {
  BUTTON_SETTINGS,
  getKernel,
  mockGetJob
} from './UnicoreJobsTable.test';
import React from 'react';

const JUDAC = 'JUDAC';
const JUSUF = 'JUSUF';
const data = {
  message: '',
  jobs: generateJobs(12)
};

export function generateJobs(count: number): Array<IJob> {
  const generatedJobs = [];
  // add more jobs to have next button visible
  for (let i = 0; i < count; i++) {
    generatedJobs.push({
      id: `test${i}`,
      name: `test_name_${i}`,
      owner: 'test',
      site: JUDAC,
      status: 'FAILED',
      resource_url: `test_url_2${i}`,
      start_time: '2022-02-18T10:54:08+0100',
      is_cancelable: false,
      logs: ['line 1', 'line 2']
    });
  }
  return generatedJobs;
}

const RELOAD_RATE_MS = 60000;
const RELOAD_RATE_S = RELOAD_RATE_MS / 1000;

function renderUnicoreComponent() {
  const columns = ['id', 'name', 'owner', 'site', 'status', 'start_time'];
  const tableFormat = {
    cols: columns,
    idField: 'id',
    buttonRenderConditionField: 'is_cancelable'
  };

  return render(
    <PyunicoreComponent
      tableFormat={tableFormat}
      data={data}
      buttonSettings={BUTTON_SETTINGS}
      sites={[JUSUF, JUDAC]}
      reloadRate={RELOAD_RATE_MS}
      getKernel={getKernel}
      getJob={mockGetJob}
    />
  );
}

beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.useRealTimers();
});

describe('<PyunicoreComponent />', () => {
  it('renders component correctly', async () => {
    // jest.useFakeTimers();
    const mockDate = new Date();
    const mockLaterDate = new Date();
    jest.setSystemTime(mockDate.getTime());

    const { findByTestId } = renderUnicoreComponent();

    // simulate 60 seconds passed in system time to trigger update
    mockLaterDate.setSeconds(mockLaterDate.getSeconds() + RELOAD_RATE_S);
    jest.setSystemTime(mockLaterDate.getTime());
    jest.advanceTimersByTime(10000); // component checks every 10s if 60s passed since last update

    const pagination = await findByTestId('pagination-component');
    expect(pagination).toBeTruthy();
    expect(await findByTestId('table-row-test1')).toBeTruthy();
    const sites = await findByTestId('pyunicore-sites');
    expect(sites).toBeTruthy();
    expect(document.getElementsByTagName('table')).toBeTruthy();
    // test pagination buttons
    const next = await findByTestId('p-btn-right');
    expect(next).toBeTruthy();
    await waitFor(() => fireEvent.click(next));
    expect(await findByText(pagination, 'Page: 2')).toBeTruthy();

    expect(await findByText(sites, JUSUF)).toHaveProperty('selected', true);
    expect(await findByText(sites, JUDAC)).toHaveProperty('selected', false);
    // change site
    fireEvent.change(getByTestId(sites, 'select'), {
      target: { value: JUDAC }
    });
    expect(await findByText(sites, JUDAC)).toHaveProperty('selected', true);
    expect(await findByText(sites, JUSUF)).toHaveProperty('selected', false);
  });
});
