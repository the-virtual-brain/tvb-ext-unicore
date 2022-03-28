import React, { ReactElement } from 'react';
import { UnicoreJobsTable } from './components/UnicoreJobsTable';
import { PaginationComponent } from './components/PaginationComponent';
import { UnicoreSites } from './components/UnicoreSites';
import {
  ModalType,
  ModalWidget,
  types as modalTypes
} from './components/ModalComponent';
import { requestAPI } from './handler';
import { ReactWidget } from '@jupyterlab/apputils';
import { Kernel } from '@jupyterlab/services';

/**
 * interface to describe how a table should look like, what field from the cols array represents
 * the id of each row, what field if evaluated to true allows rendering of a button in the table
 */
export interface ITableFormat {
  cols: Array<string>;
  idField: string;
  buttonRenderConditionField: string; // the IJob field which dictates if the button is visible
}

/**
 * interface to describe how a job ( a row in a table) should look like - a dict of any number of string:any pair
 */
export interface IJob {
  [propName: string]: any;
}

/**
 * Interface to describe how the response from api cals to populate the table should look like
 */
export interface IDataType {
  message: string;
  jobs: IJob[];
}

/**
 * describes the table row button functionality
 * if isAsync is true the button will be replaced by a loading animation while the onClick is performed
 */
export interface IButtonSettings {
  name: string;
  onClick: (...args: string[]) => Promise<any>;
  onClickFieldArgs: string[];
  isAsync: boolean;
}

namespace types {
  export type Props = {
    tableFormat: ITableFormat;
    data: IDataType;
    buttonSettings: IButtonSettings;
    sites: string[];
    reloadRate: number;
    getKernel: () => Promise<Kernel.IKernelConnection | null | undefined>;
    getJob: (job_url: string) => string;
  };

  export type State = {
    jobs: Array<IJob>;
    message: string;
    buttonSettings: IButtonSettings;
    tableFormat: ITableFormat;
    reloadRate: number;
    loading: boolean;
    sites: string[];
    site: string;
    page: number;
    itemsPerPage: number;
    lastUpdate: Date;
    renderLeftArrow: boolean;
    renderRightArrow: boolean;
    disableSitesSelection: boolean;
    updateIntervalId?: number;
    modalState: modalTypes.Props;
  };
}

/**
 * React Widget wrapper over the React component to add the @lumino widget functionality
 */
export class PyunicoreWidget extends ReactWidget {
  readonly props: types.Props;
  constructor(props: types.Props) {
    super();
    this.addClass('tvb-pyunicoreWidget');
    this.props = props;
  }

  protected render(): JSX.Element {
    return (
      <PyunicoreComponent
        tableFormat={this.props.tableFormat}
        data={this.props.data}
        buttonSettings={this.props.buttonSettings}
        sites={this.props.sites}
        reloadRate={60000}
        getKernel={this.props.getKernel}
        getJob={this.props.getJob}
      /> // see how we can wrap this to use signal
    );
  }
}

/**
 * main React class component for the PyUnicore integration, extends React.Component to render
 * a table and other custom behaviour
 */
export class PyunicoreComponent extends React.Component<
  types.Props,
  types.State
> {
  readonly state: types.State;
  constructor(props: types.Props) {
    super(props);
    // bind helper methods to pass them as props to children
    this.setPageState = this.setPageState.bind(this);
    this.setSiteState = this.setSiteState.bind(this);
    this.setModalSateVisible = this.setModalSateVisible.bind(this);
    this.getData = this.getData.bind(this);
    this.catchError = this.catchError.bind(this);
    const lastUpdate = new Date();
    this.state = {
      jobs: [],
      message: props.data.message,
      site: props.sites[0],
      buttonSettings: props.buttonSettings,
      tableFormat: props.tableFormat,
      reloadRate: 60000,
      loading: props.sites.length > 0,
      sites: props.sites,
      page: 1,
      itemsPerPage: 10,
      lastUpdate: lastUpdate,
      renderLeftArrow: false,
      renderRightArrow: false,
      disableSitesSelection: true,
      modalState: {
        modalType: ModalType.Error,
        message: '',
        visible: false,
        setVisible: this.setModalSateVisible
      },
      updateIntervalId: 0 // set when component mounts
    };
  }

  /**
   * method to get the api endpoint from current state
   * @private
   */
  private _getEndpoint(): string {
    return `jobs?site=${this.state.site}&page=${this.state.page}`;
  }

  /**
   * method to fetch data from api and toggle pagination buttons, sites, loading wheel,
   * before and after data loads
   * @protected
   */
  protected async getData(): Promise<void> {
    this.setState({
      ...this.state,
      loading: true,
      renderLeftArrow: false,
      renderRightArrow: false,
      disableSitesSelection: true
    });
    const data = await requestAPI<any>(this._getEndpoint());

    this.setState({
      ...this.state,
      jobs: data.jobs,
      message: data.message,
      loading: false,
      lastUpdate: new Date(),
      renderLeftArrow: this.state.page > 1,
      renderRightArrow: data.jobs.length >= this.state.itemsPerPage,
      disableSitesSelection: false
    });

    return data;
  }

  private _triggerUpdate = (): void => {
    const now = new Date().valueOf();
    const previous = this.state.lastUpdate.valueOf();
    const diff = now - previous;
    if (diff >= this.state.reloadRate && !this.state.loading) {
      this.getData().catch(this.catchError);
    }
  };

  /**
   * helper method to set page state from a child component
   * @param page
   * @protected
   */
  protected setPageState(page: number): void {
    this.setState({ ...this.state, page: page });
  }

  /**
   * helper method to set modal visibility from modal component
   * @param visible
   * @protected
   */
  protected setModalSateVisible(visible: boolean): void {
    this.setState({
      ...this.state,
      loading: false,
      renderLeftArrow: true,
      renderRightArrow: true,
      disableSitesSelection: false,
      modalState: { ...this.state.modalState, visible: visible }
    });
  }
  /**
   * helper method to set site state from a child component
   * @param site
   * @protected
   */
  protected setSiteState(site: string): void {
    // reset the page to 1 when changing site
    this.setState({ ...this.state, page: 1, site: site });
  }

  /**
   * if page or site changed reload data
   * @param prevProps
   * @param prevState
   */
  componentDidUpdate(
    prevProps: Readonly<types.Props>,
    prevState: Readonly<types.State>
  ): void {
    if (
      (prevState.page !== this.state.page ||
        prevState.site !== this.state.site) &&
      this.state.sites.length > 0
    ) {
      this.getData().catch(this.catchError);
    }
  }

  /**
   * helper function to catch an error and update the state to show modal with error
   * @param reason
   * @private
   */
  private catchError(reason?: any): void {
    this.setState({
      ...this.state,
      modalState: {
        ...this.state.modalState,
        visible: true,
        message: reason
      }
    });
  }
  /**
   * clear interval to avoid unnecessary reloads
   */
  componentWillUnmount(): void {
    clearInterval(this.state.updateIntervalId);
  }

  /**
   * lifecycle method, override to load data from api when component is mounted
   */
  componentDidMount(): void {
    if (this.state.sites.length <= 0) {
      return;
    }
    this.getData().catch(this.catchError);
    const updateIntervalId = setInterval(this._triggerUpdate, 10000);
    this.setState({ ...this.state, updateIntervalId: updateIntervalId });
  }

  /**
   * combine the React components together
   */
  render(): ReactElement {
    return (
      <>
        <ModalWidget
          modalType={this.state.modalState.modalType}
          message={this.state.modalState.message}
          visible={this.state.modalState.visible}
          setVisible={this.state.modalState.setVisible}
        />
        <div className={'unicoreTopBar'}>
          <PaginationComponent
            setPageState={this.setPageState}
            showNextButton={this.state.renderRightArrow}
            showPrevButton={this.state.renderLeftArrow}
            currentPage={this.state.page}
          />
          <UnicoreSites
            sites={this.state.sites}
            onChangeSite={this.setSiteState}
            disableSelection={this.state.disableSitesSelection}
          />
          {this.state.loading ? (
            <div>
              <div className={'loadingRoot'}>
                <span className={'unicoreLoading'} />
              </div>
            </div>
          ) : (
            <div>
              <span className={'unicoreMessage'}>{this.state.message}</span>
              <span className={'lastUpdate'}>
                Last update: {this.state.lastUpdate.toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>

        <UnicoreJobsTable
          buttonSettings={this.state.buttonSettings}
          columns={this.state.tableFormat.cols}
          data={this.state.jobs}
          setMessageState={(message: string) => {
            this.setState({ ...this.state, message: message });
          }}
          getKernel={this.props.getKernel}
          getJob={this.props.getJob}
          handleError={this.catchError}
        />
      </>
    );
  }
}
