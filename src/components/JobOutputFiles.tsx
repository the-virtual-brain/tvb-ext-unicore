import React, { useState, useEffect } from 'react';
import { requestAPI, requestStream } from '../handler';
// requestStream
import { FileBrowser } from '@jupyterlab/filebrowser';
import { showErrorMessage } from '@jupyterlab/apputils';

namespace Types {
  export type Output = {
    [key: string]: { is_file: boolean };
  } | null;

  export type JobOutputProps = {
    output: string;
    outputType: { is_file: boolean };
    jobUrl: string;
    getFileBrowser: () => FileBrowser;
  };

  export type DownloadResponse = {
    message: string;
    status: string;
  };

  export type Props = {
    job_url: string;
    getFileBrowser: () => FileBrowser;
  };

  export type MessageState = {
    text: string;
    className: string;
  };

  export type ProgressBarProps = {
    size: number; // expressed in rem
    done: number; // 1 to 100
  };
}

export const JobOutputFiles = (props: Types.Props): JSX.Element => {
  const [outputFiles, setOutputFiles] = useState<Types.Output>(null);
  const [message, setMessage] = useState<string>('');

  // use effect to load job outputs
  useEffect(() => {
    // encode url for safe passing as param
    const url = encodeURIComponent(props.job_url);
    //fetch output files
    requestAPI<Types.Output>(`job_output?job_url=${url}`)
      .then(resp => setOutputFiles(resp))
      .catch(err => {
        console.log('err: ', err);
        setMessage(err.message);
      });
  }, []);

  function waitingOrFailed(): JSX.Element {
    return message ? (
      <p className={'unicoreMessage'}>{message}</p>
    ) : (
      <div className={'loadingRoot'}>
        <span className={'unicoreLoading'} />
      </div>
    );
  }

  return (
    <tr className={'outputFiles'} data-testid={`output-${props.job_url}`}>
      {outputFiles ? (
        <td colSpan={100}>
          <p className={'unicoreMessage'}>{message}</p>
          Output Files:
          {Object.entries(outputFiles).map(([output, outputType], index) => (
            <JobOutput
              output={output}
              outputType={outputType}
              key={`${output}-${index}`}
              jobUrl={props.job_url}
              getFileBrowser={props.getFileBrowser}
            />
          ))}
        </td>
      ) : (
        <td colSpan={100}>{waitingOrFailed()}</td>
      )}
    </tr>
  );
};

export const JobOutput = (props: Types.JobOutputProps): JSX.Element => {
  const { output, outputType, jobUrl, getFileBrowser } = props;

  const [downloading, setDownloading] = useState(false);
  const downloadStatus: { [string: string]: string } = {
    success: 'unicoreMessage-success',
    warning: 'unicoreMessage-warning',
    error: 'unicoreMessage'
  };
  const [message, setMessage] = useState<Types.MessageState>({
    text: '',
    className: downloadStatus.success
  });

  /**
   * function to download a file to the current path (directory) opened in filebrowser
   * @param file - name of the file to be downloaded from this jobs working dir
   */
  async function downloadToCurrentPath(file: string): Promise<void> {
    const browser = getFileBrowser();
    const path = browser.model.path;
    console.log('File browser path: ', path);
    const dataToSend = {
      job_url: jobUrl,
      file: file,
      path: path
    };
    try {
      setDownloading(true);
      const response: Types.DownloadResponse = await requestAPI(
        `drive/${encodeURIComponent(jobUrl)}/${file}`,
        {
          method: 'POST',
          body: JSON.stringify(dataToSend)
        }
      );
      console.log('response: ', response);
      setMessage({
        text: response.message,
        className: downloadStatus[response.status]
      });
      setDownloading(false);
      browser.update();
    } catch (e) {
      await showErrorMessage('Error on request:', e);
      setMessage({ text: e.text, className: downloadStatus.error });
      setDownloading(false);
    }
  }

  function handleDownloadStream(file: string): void {
    setMessage({ text: 'Downloading ', className: downloadStatus.success });
    setDownloading(true);
    requestStream<Blob>(`stream/${encodeURIComponent(jobUrl)}/${file}`)
      .then(r => {
        setMessage({ className: downloadStatus.success, text: 'Uploading...' });
        const browser = getFileBrowser();
        browser.model
          .upload(new File([r], file))
          .then(_model => {
            setDownloading(false);
            setMessage({
              className: downloadStatus.success,
              text: 'Finished!'
            });
          })
          .catch(e => {
            setMessage({ text: e.message, className: downloadStatus.error });
            setDownloading(false);
          });
      })
      .catch(err => {
        console.log('error at server: ', err);
        setMessage({ text: err.message, className: downloadStatus.error });
        setDownloading(false);
      });
  }

  return (
    <div className={'unicore-jobOutput'} data-testid={`output-${output}`}>
      {outputType.is_file ? (
        <i className={'fa fa-file'} />
      ) : (
        <i className={'fas fa-folder'} />
      )}
      <p draggable={true} className={'outputFileName'}>
        {output}
      </p>
      {outputType.is_file && (
        <>
          <span className={message.className}>{message.text}</span>
          {downloading ? (
            <div className={'loadingRoot'}>
              <span className={'unicoreLoading'} />
            </div>
          ) : (
            <>
              <i
                data-testid={'download-file'}
                className={'fa fa-download clickableIcon'}
                onClick={() => downloadToCurrentPath(output)}
              />
              <span onClick={() => handleDownloadStream(output)}>
                <i className="fal fa-download"></i>Drive API
              </span>
            </>
          )}
        </>
      )}
    </div>
  );
};

// to use when downloading file and add style
export const ProgressBar = (props: Types.ProgressBarProps): JSX.Element => {
  return (
    <div
      style={{ width: `${props.size}rem` }}
      className={'unicore-progressBar'}
      data-testid={'progress-bar'}
    >
      <div style={{ width: `${props.done}%` }} />
    </div>
  );
};
