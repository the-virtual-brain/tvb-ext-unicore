import React, { useState } from 'react';
import { IButtonSettings, IJob } from '../pyunicoreWidget';
import { Kernel } from '@jupyterlab/services';
import { Drag } from '@lumino/dragdrop';
import { MimeData } from '@lumino/coreutils';
import { JobOutputFiles } from './JobOutputFiles';
import { FileBrowser } from '@jupyterlab/filebrowser';
import { TEXT_PLAIN_MIME } from '../constants';

export namespace types {
  export type JobsTableProps = {
    buttonSettings: IButtonSettings;
    afterButtonSettingClick: () => Promise<void>;
    columns: string[];
    data: Array<IJob>;
    setMessageState: (message: string) => void;
    getKernel: () => Promise<Kernel.IKernelConnection | null | undefined>;
    getFileBrowser: () => FileBrowser;
    getJob: (job_url: string) => string;
    handleError: (reason: any) => void;
  };

  export type ThProps = {
    columns: string[];
  };

  export type JobRowProps = {
    buttonSettings: IButtonSettings;
    afterButtonSettingClick: () => Promise<void>;
    cols: string[];
    job: IJob;
    setMessageState: (message: string) => void;
    getKernel: () => Promise<Kernel.IKernelConnection | null | undefined>;
    getFileBrowser: () => FileBrowser;
    getJob: (job_url: string) => string;
    id: string;
    handleError: (reason: any) => void; // function to handle error (set modal state)
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
        setMessageState={props.setMessageState}
        getKernel={props.getKernel}
        getJob={props.getJob}
        handleError={props.handleError}
        getFileBrowser={props.getFileBrowser}
        afterButtonSettingClick={props.afterButtonSettingClick}
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
            {colName.toUpperCase()}
          </td>
        ))}
        <td>ACTIONS</td>
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
          id={job.id}
          cols={props.columns}
          job={job}
          buttonSettings={props.buttonSettings}
          setMessageState={props.setMessageState}
          getKernel={props.getKernel}
          getJob={props.getJob}
          handleError={props.handleError}
          getFileBrowser={props.getFileBrowser}
          afterButtonSettingClick={props.afterButtonSettingClick}
        />
      ))}
    </tbody>
  );
};

export const JobRow = (props: types.JobRowProps): JSX.Element => {
  const [loading, setLoading] = useState(false);
  const [logsVisible, setLogsVisible] = useState(false);

  function handleButton(ev: React.MouseEvent<HTMLElement>) {
    ev.stopPropagation(); // stop event to avoid opening the logs
    setLoading(true);
    props.buttonSettings
      .onClick(
        ...props.buttonSettings.onClickFieldArgs.map(field => props.job[field])
      )
      .then(r => {
        props.afterButtonSettingClick().then(() => setLoading(false));
        props.setMessageState(r.message);
      });
  }

  /**
   * instantiate and start the Drag event with the cell and code to be injected
   * @param event
   */
  async function handleDragStart(event: React.DragEvent): Promise<void> {
    // make sure we have a kernel that can handle python code
    const kernel = await props.getKernel();
    if (!kernel) {
      // show error modal
      props.handleError(
        "Current kernel can't be used to handle this operation!"
      );
      return;
    }
    const code = props.getJob(props.job.resource_url);
    const drag = new Drag({
      mimeData: new MimeData(),
      supportedActions: 'copy',
      proposedAction: 'copy',
      dragImage: document
        .getElementById(`${props.job.id}`)
        ?.cloneNode(true) as HTMLElement,
      source: props.job
    });

    // set data for copy in an existing cell
    drag.mimeData.setData(TEXT_PLAIN_MIME, code);
    drag.start(event.clientX, event.clientY).then(r => console.log('r: ', r));
  }

  return (
    <>
      <tr
        onClick={() => setLogsVisible(!logsVisible)}
        draggable={'true'}
        onDragStart={handleDragStart}
        data-testid={`table-row-${props.job.id}`}
      >
        {props.cols.map((col, index) => (
          <td key={`${props.job.id}-${index}`}>{props.job[col]}</td>
        ))}
        {loading ? (
          <td>
            <div className={'loadingRoot'}>
              <span className={'unicoreLoading'} />
            </div>
          </td>
        ) : (
          <td>
            {props.job.is_cancelable && !loading && (
              <button onClick={handleButton}>Cancel Job</button>
            )}
          </td>
        )}
      </tr>
      {logsVisible && (
        <>
          <JobOutputFiles
            job_url={props.job.resource_url}
            getFileBrowser={props.getFileBrowser}
            getKernel={props.getKernel}
            jobId={props.job.id}
          />
          <tr className={'detailsRow'}>
            <td colSpan={100}>
              <textarea value={props.job.logs.join('\n')} readOnly={true} />
            </td>
          </tr>
        </>
      )}
    </>
  );
};
