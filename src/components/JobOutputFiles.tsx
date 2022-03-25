import React, { useState, useEffect } from 'react';
import { requestAPI } from '../handler';

namespace Types {
  export type Output = {
    [key: string]: { is_file: boolean };
  } | null;

  export type Props = {
    job_url: string;
  };
}
// todo: unit tests
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
    console.log('draw');
    return message ? (
      <p className={'unicoreMessage'}>{message}</p>
    ) : (
      <div className={'loadingRoot'}>
        <span className={'unicoreLoading'} />
      </div>
    );
  }

  return (
    <tr className={'outputFiles'}>
      {outputFiles ? (
        <td colSpan={100}>
          Output Files:
          {Object.entries(outputFiles).map(([output, outputType]) => (
            <p key={output}>
              {outputType.is_file ? (
                <i className="fa fa-file" />
              ) : (
                <i className="fas fa-folder" />
              )}
              {output}
            </p>
          ))}
        </td>
      ) : (
        <td colSpan={100}>{waitingOrFailed()}</td>
      )}
    </tr>
  );
};
