// mock the handler for api requests
import { FileBrowser } from '@jupyterlab/filebrowser';

const FAIL_MESSAGE = 'fail';
jest.mock('../handler', () => {
  return {
    __esModule: true,
    requestAPI: jest
      .fn()
      .mockImplementationOnce((url, init, settings) => Promise.resolve(data))
      .mockImplementationOnce((url, init, settings) =>
        Promise.reject({ message: FAIL_MESSAGE })
      ),
    requestStream: jest
      .fn()
      .mockImplementation((url, init) => Promise.resolve(new Blob()))
  };
});

const data = {
  file1: { is_file: true },
  dir1: { is_file: false }
};

import { findByText, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import {
  JobOutput,
  JobOutputFiles,
  ProgressBar
} from '../components/JobOutputFiles';

function renderJobOutputFiles(url: string) {
  return render(
    <JobOutputFiles
      job_url={url}
      getFileBrowser={() => jest.fn as unknown as FileBrowser}
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

const MOCK_BROWSER = {
  model: {
    upload: jest
      .fn()
      .mockImplementation((file: File, name: string) =>
        Promise.resolve({ name: name })
      )
  }
} as unknown as FileBrowser;
const TEST_FILE_NAME = 'test_file';
const setStatusMock = jest.fn();
const getFileBrowserMock = jest
  .fn()
  .mockImplementationOnce(() => {
    throw new Error();
  })
  .mockImplementationOnce(() => MOCK_BROWSER);
function renderJobOutput(is_file: boolean) {
  return render(
    <JobOutput
      output={TEST_FILE_NAME}
      outputType={{ is_file: is_file }}
      jobUrl={'test_url'}
      setStatusMessage={setStatusMock}
      getFileBrowser={getFileBrowserMock}
    />
  );
}
describe('test <JobOutput />', () => {
  it('renders correctly for file', async () => {
    const { findByTestId } = renderJobOutput(true);
    const output = await findByTestId(`output-${TEST_FILE_NAME}`);
    expect(output).toBeTruthy();
    const file = await findByText(output, TEST_FILE_NAME);
    expect(file).toBeTruthy();
    expect(document.getElementsByClassName('fa-file').length).toEqual(1);
    expect(document.getElementsByClassName('fa-folder').length).toEqual(0);
    //renders download icon
    expect(document.getElementsByClassName('clickableIcon').length).toEqual(1);
  });

  it('renders correctly for directory', async () => {
    const { findByTestId } = renderJobOutput(false);
    const output = await findByTestId(`output-${TEST_FILE_NAME}`);
    expect(output).toBeTruthy();
    const file = await findByText(output, TEST_FILE_NAME);
    expect(file).toBeTruthy();
    expect(document.getElementsByClassName('fa-file').length).toEqual(0);
    expect(document.getElementsByClassName('fa-folder').length).toEqual(1);
    //doesn't render download icon
    expect(document.getElementsByClassName('clickableIcon').length).toEqual(0);
  });

  it('downloads file on click - error', async () => {
    const { findByTestId } = renderJobOutput(true);
    const downloadIcon = await findByTestId('download-file');
    expect(downloadIcon).toBeTruthy();
    await waitFor(() => fireEvent.click(downloadIcon));
    expect(getFileBrowserMock).toBeCalledTimes(1);
    // sets status before download, after download and after upload
    expect(setStatusMock).toBeCalledTimes(3);
  });

  it('downloads file on click - success', async () => {
    const { findByTestId } = renderJobOutput(true);
    const downloadIcon = await findByTestId('download-file');
    expect(downloadIcon).toBeTruthy();
    await waitFor(() => fireEvent.click(downloadIcon));
    expect(getFileBrowserMock).toBeCalledTimes(2);
    // sets status before download, after download and after upload
    expect(setStatusMock).toBeCalledTimes(6);
    expect(MOCK_BROWSER.model.upload).toBeCalledTimes(1);
  });
});

describe('test <JobOutputFiles />', () => {
  it('renders component correctly', async () => {
    const url = 'test';
    const { findByTestId } = renderJobOutputFiles(url);
    const outputTr = await findByTestId(`output-${url}`);
    expect(outputTr).toBeTruthy();
    expect(document.getElementsByClassName('fa-file').length).toEqual(1);
    expect(document.getElementsByClassName('fa-folder').length).toEqual(1);
  });

  it('renders message in case of error', async () => {
    const url = 'test';
    const { findByTestId } = renderJobOutputFiles(url);
    const outputTr = await findByTestId(`output-${url}`);
    expect(outputTr).toBeTruthy();
    const fail = await findByText(outputTr, FAIL_MESSAGE);
    expect(fail).toBeTruthy();
    expect(document.getElementsByClassName('fa-file').length).toEqual(0);
    expect(document.getElementsByClassName('fa-folder').length).toEqual(0);
  });

  it('renders progress barr correctly', async () => {
    const { findByTestId } = render(<ProgressBar size={3} done={40} />);
    const progress = await findByTestId('progress-bar');
    expect(progress).toBeTruthy();
    expect(progress.style.width).toEqual('3rem');
  });
});
