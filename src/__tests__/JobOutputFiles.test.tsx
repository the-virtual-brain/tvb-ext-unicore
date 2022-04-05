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
      )
  };
});

const data = {
  file1: { is_file: true },
  dir1: { is_file: false }
};

import { findByText, render } from '@testing-library/react';
import React from 'react';
import { JobOutputFiles } from '../components/JobOutputFiles';

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
});
