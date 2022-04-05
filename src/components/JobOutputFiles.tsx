import React, { useState, useEffect } from 'react';
import { requestAPI } from '../handler';
import { FileBrowser } from '@jupyterlab/filebrowser';

import { URLExt } from '@jupyterlab/coreutils';

import { ServerConnection } from '@jupyterlab/services';

namespace Types {
  export type Output = {
    [key: string]: { is_file: boolean };
  } | null;

  export type JobOutputProps = {
    output: string;
    outputType: { is_file: boolean };
    jobUrl: string;
    setStatusMessage: (msg: string) => void;
    getFileBrowser: () => FileBrowser;
  };

  export type DownloadResponse = {
    message: string;
    success: boolean;
  };

  export type Props = {
    job_url: string;
    getFileBrowser: () => FileBrowser;
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
              setStatusMessage={msg => setMessage(msg)}
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
  const { output, outputType, jobUrl, setStatusMessage, getFileBrowser } =
    props;

  const [downloading, setDownloading] = useState(false);

  function handleDownloadStream(file: string): void {
    setStatusMessage(`Trying to download ${file}...`);
    setDownloading(true);
    Private.requestStream<Blob>(`stream/${encodeURIComponent(jobUrl)}/${file}`)
      .then(r => {
        setStatusMessage(`Uploading file ${file}...`);
        const browser = getFileBrowser();
        browser.model.upload(new File([r], file)).then(model => {
          setDownloading(false);
          setStatusMessage(`Download finished for ${model.name}!`);
        });
      })
      .catch(err => {
        console.log('error at server: ', err);
        setStatusMessage(err.message);
        setDownloading(false);
      });
  }

  return (
    <div className={'unicore-jobOutput'}>
      {outputType.is_file ? (
        <i className="fa fa-file" />
      ) : (
        <i className="fas fa-folder" />
      )}
      <p draggable={true} className={'outputFileName'}>
        {output}
      </p>
      {outputType.is_file && downloading ? (
        <div className={'loadingRoot'}>
          <span className={'unicoreLoading'} />
        </div>
      ) : (
        <i
          className="fa fa-download clickableIcon"
          onClick={() => handleDownloadStream(output)}
        />
      )}
    </div>
  );
};

// todo: use when downloading file and add style
export const ProgressBar = (props: Types.ProgressBarProps): JSX.Element => {
  return (
    <div
      style={{ width: `${props.size}rem` }}
      className={'unicore-progressBar'}
    >
      <div style={{ width: `${props.done}%` }} />
    </div>
  );
};

namespace Private {
  /**
   * Call the API extension
   *
   * @param endPoint API REST end point for the extension
   * @param init Initial values for the request
   * @returns The response body interpreted as BLOB
   */
  export async function requestStream<T>(
    endPoint = '',
    init: RequestInit = {}
  ): Promise<T> {
    // Make request to Jupyter API
    const settings = ServerConnection.makeSettings();
    const requestUrl = URLExt.join(
      settings.baseUrl,
      'tvbextunicore', // API Namespace
      endPoint
    );
    let response: Response;
    try {
      response = await ServerConnection.makeRequest(requestUrl, init, settings);
    } catch (error) {
      throw new ServerConnection.NetworkError(error);
    }
    console.log('response body before parse: ', response.body);
    const data: any = await response.blob();

    if (!response.ok) {
      throw new ServerConnection.ResponseError(response, data.message || data);
    }

    return data;
  }
}
