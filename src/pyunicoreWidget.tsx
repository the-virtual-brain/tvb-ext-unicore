// import { Message } from '@lumino/messaging';
import React, { ReactElement } from 'react';
import { UnicoreJobsTable } from './components/UnicoreJobsTable';
import { PaginationComponent } from './components/PaginationComponent';
import { UnicoreSites } from './components/UnicoreSites';
import { requestAPI } from './handler';
import { ReactWidget } from '@jupyterlab/apputils';

/**
 * interface to describe how a table should look like, what field from the cols array represents
 * the id of each row, what field if evaluated to true allows rendering of a button in the table
 */
export interface ITableFormat {
  cols: Array<string>;
  idField: string;
  buttonRenderConditionField: string; // the field which dictates if the button is visible
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
  };
}

/**
 * React Widget wrapper over the React component to add the @lumino widget functionality
 */
export class PyunicoreWidget extends ReactWidget {
  readonly state: types.State;
  readonly props: types.Props;
  constructor(props: types.Props) {
    super();
    this.addClass('tvb-pyunicoreWidget');
    this.state = {
      jobs: [],
      message: '',
      site: props.sites[0],
      buttonSettings: props.buttonSettings,
      tableFormat: props.tableFormat,
      reloadRate: 60000,
      loading: true,
      sites: props.sites,
      page: 1,
      itemsPerPage: 10,
      lastUpdate: new Date(),
      renderLeftArrow: false,
      renderRightArrow: false,
      disableSitesSelection: true
    };
    this.props = props;
  }

  protected render(): JSX.Element {
    return (
      <PyunicoreComponent
        tableFormat={this.props.tableFormat}
        data={this.props.data}
        buttonSettings={this.props.buttonSettings}
        sites={this.props.sites}
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

    this.state = {
      jobs: [],
      message: '',
      site: props.sites[0],
      buttonSettings: props.buttonSettings,
      tableFormat: props.tableFormat,
      reloadRate: 60000,
      loading: true,
      sites: props.sites,
      page: 1,
      itemsPerPage: 10,
      lastUpdate: new Date(),
      renderLeftArrow: false,
      renderRightArrow: false,
      disableSitesSelection: true
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
    requestAPI<any>(this._getEndpoint()).then(data => {
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
      console.log('state: ', this.state);
    });
  }

  /**
   * helper method to set page state from a child component
   * @param page
   * @protected
   */
  protected setPageState(page: number): void {
    this.setState({ ...this.state, page: page });
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

  componentDidUpdate(
    prevProps: Readonly<types.Props>,
    prevState: Readonly<types.State>
  ): void {
    if (
      prevState.page !== this.state.page ||
      prevState.site !== this.state.site
    ) {
      this.getData().catch(reason => console.log(reason));
    }
  }

  /**
   * lifecycle method, override to load data from api when component is mounted
   */
  componentDidMount(): void {
    this.getData().then(() => console.log('data loaded'));
  }

  /**
   * combine the React components together
   */
  render(): ReactElement {
    return (
      <>
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
            <span className={'loadingRoot'}>
              <span className={'unicoreLoading'} />
            </span>
          ) : (
            <span>
              {this.state.message}
              <span className={'lastUpdate'}>
                Last update: {this.state.lastUpdate.toLocaleTimeString()}
              </span>
            </span>
          )}
        </div>

        <UnicoreJobsTable
          buttonSettings={this.state.buttonSettings}
          cancelJob={this.state.buttonSettings.onClick}
          columns={this.state.tableFormat.cols}
          data={this.state.jobs}
        />
      </>
    );
  }
}
