// mock the handler for api requests
import { FileBrowser } from '@jupyterlab/filebrowser';

jest.mock('@jupyterlab/apputils', () => {
  return {
    __esModule: true,
    showErrorMessage: (_title: string, _message: any) => ''
  };
});

const FAIL_MESSAGE = 'fail';
jest.mock('../handler', () => {
  return {
    __esModule: true,
    requestAPI: jest
      .fn()
      .mockImplementationOnce((_url, _init, _settings) => Promise.resolve(data))
      .mockImplementationOnce((_url, _init, _settings) =>
        Promise.reject({ message: FAIL_MESSAGE })
      ),
    requestStream: jest
      .fn()
      .mockImplementation((_url, _init) => Promise.resolve(new Blob()))
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

const UPLOAD_ERROR = 'Something went wrong';
const MOCK_BROWSER = {
  model: {
    upload: jest
      .fn()
      .mockImplementationOnce((file: File, name: string) =>
        Promise.resolve({ name: name })
      )
      .mockImplementationOnce((_file: File, _name: string) =>
        Promise.reject({ message: UPLOAD_ERROR })
      )
  }
} as unknown as FileBrowser;

const TEST_FILE_NAME = 'test_file';
const getFileBrowserMock = jest
  .fn()
  .mockImplementationOnce(() => {
    throw new Error();
  })
  .mockImplementation(() => MOCK_BROWSER);

function renderJobOutput(is_file: boolean) {
  return render(
    <JobOutput
      output={TEST_FILE_NAME}
      outputType={{ is_file: is_file }}
      jobUrl={'test_url'}
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
  });

  it('downloads file on click - success', async () => {
    const { findByTestId } = renderJobOutput(true);
    const downloadIcon = await findByTestId('download-file');
    expect(downloadIcon).toBeTruthy();
    await waitFor(() => fireEvent.click(downloadIcon));
    expect(getFileBrowserMock).toBeCalledTimes(2);
  });

  it('catches error on upload file', async () => {
    const { findByTestId } = renderJobOutput(true);
    const output = await findByTestId(`output-${TEST_FILE_NAME}`);
    const downloadIcon = await findByTestId('download-file');
    expect(downloadIcon).toBeTruthy();
    await waitFor(() => fireEvent.click(downloadIcon));
    expect(getFileBrowserMock).toBeCalledTimes(3);
    const error = await findByText(output, UPLOAD_ERROR);
    expect(error).toBeTruthy();
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
