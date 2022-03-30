import React, { useState, useEffect } from 'react';
import { requestAPI } from '../handler';

namespace Types {
  export type Output = {
    [key: string]: { is_file: boolean };
  } | null;

  export type DownloadResponse = {
    message: string;
    success: boolean;
  };

  export type Props = {
    job_url: string;
  };
}

export const JobOutputFiles = (props: Types.Props): JSX.Element => {
  const [outputFiles, setOutputFiles] = useState<Types.Output>(null);
  const [message, setMessage] = useState<string>('');
  const [cursor, setCursor] = useState('auto');

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

  function handleDownload(file: string): void {
    setCursor('progress');
    requestAPI<Types.DownloadResponse>(
      `download/${encodeURIComponent(props.job_url)}/${file}`
    )
      .then(r => {
        setMessage(r.message);
        setCursor('auto');
      })
      .catch(err => {
        setMessage(err.message);
        setCursor('auto');
      });
  }

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
    <tr
      className={'outputFiles'}
      data-testid={`output-${props.job_url}`}
      style={{ cursor: cursor }}
    >
      {outputFiles ? (
        <td colSpan={100}>
          <p className={'unicoreMessage'}>{message}</p>
          Output Files:
          {Object.entries(outputFiles).map(([output, outputType]) => (
            <div key={output}>
              {outputType.is_file ? (
                <i className="fa fa-file" />
              ) : (
                <i className="fas fa-folder" />
              )}
              <p draggable={true} className={'outputFileName'}>
                {output}
              </p>
              {outputType.is_file && (
                <i
                  className="fa fa-download clickableIcon"
                  onClick={() => handleDownload(output)}
                />
              )}
            </div>
          ))}
        </td>
      ) : (
        <td colSpan={100}>{waitingOrFailed()}</td>
      )}
    </tr>
  );
};
