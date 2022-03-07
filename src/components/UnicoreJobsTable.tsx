import React, { useState } from 'react';
import { IButtonSettings, IJob } from '../pyunicoreWidget';

export namespace types {
  export type JobsTableProps = {
    buttonSettings: IButtonSettings;
    columns: string[];
    data: Array<IJob>;
    cancelJob: (url: string) => Promise<void>;
  };

  export type ThProps = {
    columns: string[];
  };

  export type JobRowProps = {
    buttonSettings: IButtonSettings;
    cols: string[];
    job: IJob;
    cancelJob: (url: string) => Promise<any>; // async action for button
  };
}

export const UnicoreJobsTable = (props: types.JobsTableProps): JSX.Element => {
  return (
    <table>
      <TableHeader columns={props.columns} />
      <TableBody
        buttonSettings={props.buttonSettings}
        columns={props.columns}
        data={props.data}
        cancelJob={props.cancelJob}
      />
    </table>
  );
};

export const TableHeader = (props: types.ThProps): JSX.Element => {
  return (
    <thead>
      <tr>
        {props.columns.map(colName => (
          <td key={colName} className={colName}>
            {colName}
          </td>
        ))}
        <td>Actions</td>
      </tr>
    </thead>
  );
};

export const TableBody = (props: types.JobsTableProps): JSX.Element => {
  return (
    <tbody>
      {props.data.map(job => (
        <JobRow
          key={job.id}
          cols={props.columns}
          job={job}
          cancelJob={props.cancelJob}
          buttonSettings={props.buttonSettings}
        />
      ))}
    </tbody>
  );
};

export const JobRow = (props: types.JobRowProps): JSX.Element => {
  const [job, setJob] = useState(props.job);
  const [loading, setLoading] = useState(false);
  const [logsVisible, setLogsVisible] = useState(false);

  function handleButton(ev: React.MouseEvent<HTMLElement>) {
    ev.stopPropagation(); // stop event to avoid opening the logs
    setLoading(true);
    props.buttonSettings
      .onClick(
        ...props.buttonSettings.onClickFieldArgs.map(field => job[field])
      )
      .then(r => {
        setLoading(false);
        setJob(r.job);
      });
  }
  return (
    <>
      <tr onClick={() => setLogsVisible(!logsVisible)}>
        {props.cols.map(col => (
          <td>{job[col]}</td>
        ))}
        {loading ? (
          <td>
            <div className={'loadingRoot'}>
              <span className={'unicoreLoading'}></span>
            </div>
          </td>
        ) : (
          <td>
            {job.is_cancelable && !loading && (
              <button onClick={handleButton}>Cancel Job</button>
            )}
          </td>
        )}
      </tr>
      {logsVisible && (
        <tr className={'detailsRow'}>
          <td colSpan={100}>
            <textarea>{job.logs.join('\n')}</textarea>
          </td>
        </tr>
      )}
    </>
  );
};
