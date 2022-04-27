// mock the handler for api requests
import { FileBrowser } from '@jupyterlab/filebrowser';

// mock the jupyter error modal handler
jest.mock('@jupyterlab/apputils', () => {
  return {
    __esModule: true,
    showErrorMessage: jest
      .fn()
      .mockImplementation((_title: string, _error: any) =>
        Promise.resolve(null)
      )
  };
});

// mock the jupyter Drag
const startDrag = jest
  .fn()
  .mockImplementation((_clientX: number, _clientY: number) =>
    Promise.resolve(true)
  );
jest.mock('@lumino/dragdrop', () => {
  return {
    __esModule: true,
    Drag: jest.fn().mockImplementation(() => {
      return {
        data: '',
        mimeData: { setData: (_mimeType: string, _code: string) => true },
        start: startDrag
      };
    })
  };
});

const SHOW_ERROR = jest.fn((_title: string, _message: any) => '');

jest.mock('@jupyterlab/apputils', () => {
  return {
    __esModule: true,
    showErrorMessage: SHOW_ERROR
  };
});

const data = {
  file1: { is_file: true },
  dir1: { is_file: false }
};
const FAIL_MESSAGE = 'fail';
const URL = 'test';
jest.mock('../handler', () => {
  return {
    __esModule: true,
    requestAPI: jest.fn().mockImplementation((_url, _init, _settings) => {
      if (_init && _init.method === 'POST') {
        return Promise.resolve({ status: 'success', message: 'Downloaded' });
      }
      if (_url === `job_output?job_url=${URL}`) {
        return Promise.resolve(data);
      }
      return Promise.reject({ message: FAIL_MESSAGE });
    }),
    requestStream: jest
      .fn()
      .mockImplementation((_url, _init) => Promise.resolve(new Blob()))
  };
});

const getKernelMock = jest
  .fn()
  .mockImplementationOnce(() => Promise.resolve(null))
  .mockImplementation(() => Promise.resolve(true));

import { findByText, fireEvent, render, waitFor } from '@testing-library/react';
import React from 'react';
import {
  JobOutput,
  JobOutputFiles,
  ProgressBar
} from '../components/JobOutputFiles';

import { showErrorMessage } from '@jupyterlab/apputils';

function renderJobOutputFiles(url: string) {
  return render(
    <JobOutputFiles
      job_url={url}
      getFileBrowser={() => jest.fn as unknown as FileBrowser}
      getKernel={getKernelMock}
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
      ),
    path: 'file'
  },
  update: () => jest.fn()
} as unknown as FileBrowser;

const TEST_FILE_NAME = 'test_file';
const getFileBrowserMock = jest.fn().mockImplementation(() => MOCK_BROWSER);

function renderJobOutput(
  is_file: boolean,
  getFileBrowser: () => FileBrowser = getFileBrowserMock
) {
  return render(
    <JobOutput
      output={TEST_FILE_NAME}
      outputType={{ is_file: is_file }}
      jobUrl={'test_url'}
      getKernel={getKernelMock}
      getFileBrowser={getFileBrowser}
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

  it('downloads file on click - catches error', async () => {
    const errorBrowser = {
      model: { path: 'test' },
      update: () => {
        throw new Error('error on down');
      }
    } as unknown as FileBrowser;
    const getBrowser = jest.fn(() => errorBrowser);
    const { findByTestId } = renderJobOutput(true, getBrowser);
    const downloadIcon = await findByTestId('download-file');
    expect(downloadIcon).toBeTruthy();
    await waitFor(() => fireEvent.click(downloadIcon));
    expect(getBrowser).toBeCalledTimes(1);
    expect(SHOW_ERROR).toBeCalledTimes(1);
  });

  it('downloads file on click - success', async () => {
    const { findByTestId } = renderJobOutput(true);
    const downloadIcon = await findByTestId('download-file');
    expect(downloadIcon).toBeTruthy();
    await waitFor(() => fireEvent.click(downloadIcon));
    expect(getFileBrowserMock).toBeCalledTimes(1);
    const container = await findByTestId(`output-${TEST_FILE_NAME}`);
    expect(container).toBeTruthy();
    const msg = await findByText(container, 'Downloaded');
    expect(msg).toBeTruthy();
  });

  it('handles drag event - no available kernel', async () => {
    const { findByTestId } = renderJobOutput(true);
    const output = await findByTestId(`output-${TEST_FILE_NAME}`);
    const file = await findByText(output, TEST_FILE_NAME);
    await waitFor(() => fireEvent.dragStart(file));
    expect(showErrorMessage).toBeCalledTimes(2);
  });

  it('handles drag event - usable kernel', async () => {
    const { findByTestId } = renderJobOutput(true);
    const output = await findByTestId(`output-${TEST_FILE_NAME}`);
    const file = await findByText(output, TEST_FILE_NAME);
    await waitFor(() => fireEvent.dragStart(file));
    expect(startDrag).toBeCalledTimes(1);
  });
});

describe('test <JobOutputFiles />', () => {
  it('renders component correctly', async () => {
    const { findByTestId } = renderJobOutputFiles(URL);
    const outputTr = await findByTestId(`output-${URL}`);
    expect(outputTr).toBeTruthy();
    expect(document.getElementsByClassName('fa-file').length).toEqual(1);
    expect(document.getElementsByClassName('fa-folder').length).toEqual(1);
  });

  it('renders message in case of error', async () => {
    const url = 'error';
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
