import { PanelLayout, Widget } from '@lumino/widgets';
import { Message } from '@lumino/messaging';

const DUMMY_LOG = [
  'Fri Feb 18 10:11:21 CET 2022: Created with ID 12242ef1-5731-4372-b7fb-9789ed2bf5db',
  "Fri Feb 18 10:11:21 CET 2022: Created with type 'JSON'",
  "Fri Feb 18 10:11:21 CET 2022: Client: Name: UID=david.bacter@codemart.ro\nXlogin: uid: [bacter1], gids: [icei-hbp-2021-0007, addingOSgroups: true]\nRole: user: role from attribute source\nSecurity tokens: User: UID=david.bacter@codemart.ro\nClient's original IP: 134.94.88.93",
  'Fri Feb 18 10:11:23 CET 2022: No staging in needed.',
  'Fri Feb 18 10:11:23 CET 2022: Status set to READY.',
  'Fri Feb 18 10:11:23 CET 2022: Status set to PENDING.',
  'Fri Feb 18 10:11:23 CET 2022: Requesting resources: [Queue=batch, Runtime=3600, Nodes=1]',
  'Fri Feb 18 10:11:24 CET 2022: Command is:',
  'Fri Feb 18 10:11:24 CET 2022: #!/bin/bash -l \n. /etc/profile > /dev/null 2>&1 \nACTIVE_PROJECT=$(id -gn); export ACTIVE_PROJECT \njutil env activate -p $ACTIVE_PROJECT > /dev/null 2>&1 \n#TSI_SUBMIT\n \n\n#TSI_OUTCOME_DIR /p/scratch/icei-hbp-2021-0007/unicore-jobs//12242ef1-5731-4372-b7fb-9789ed2bf5db/\n#TSI_USPACE_DIR /p/scratch/icei-hbp-2021-0007/unicore-jobs//12242ef1-5731-4372-b7fb-9789ed2bf5db/\n#TSI_STDOUT stdout\n#TSI_STDERR stderr\n#TSI_JOBNAME UNICORE_Job\n#TSI_EMAIL NONE\n#TSI_TIME 3600\n#TSI_NODES 1\n#TSI_PROCESSORS_PER_NODE -1\n#TSI_TOTAL_PROCESSORS -1\n#TSI_QUEUE batch\nUC_NODES=1; export UC_NODES;\nUC_PROCESSORS_PER_NODE=-1; export UC_PROCESSORS_PER_NODE;\nUC_TOTAL_PROCESSORS=-1; export UC_TOTAL_PROCESSORS;\nUC_RUNTIME=3600; export UC_RUNTIME;\nUC_MEMORY_PER_NODE=-1; export UC_MEMORY_PER_NODE;\n \n#TSI_SCRIPT\n#TSI_UMASK 77\numask 77\nUC_USERDN="UID=david.bacter@codemart.ro"; export UC_USERDN\nPATH=$PATH:. ; export PATH\ncd /p/scratch/icei-hbp-2021-0007/unicore-jobs//12242ef1-5731-4372-b7fb-9789ed2bf5db/\nUC_EXECUTABLE=\'sleep 2\'; export UC_EXECUTABLE\nchmod u+x sleep 2> /dev/null \nrm -f /p/scratch/icei-hbp-2021-0007/unicore-jobs//12242ef1-5731-4372-b7fb-9789ed2bf5db//UNICORE_SCRIPT_EXIT_CODE\nsleep 2\n\necho $? > /p/scratch/icei-hbp-2021-0007/unicore-jobs//12242ef1-5731-4372-b7fb-9789ed2bf5db//UNICORE_SCRIPT_EXIT_CODE\n',
  'Fri Feb 18 10:11:24 CET 2022: TSI reply: FAILED.',
  "Fri Feb 18 10:11:24 CET 2022: Submit attempt 1 (of 3) failed: de.fzj.unicore.xnjs.ems.ExecutionException: Submission to TSI failed. Reply was <TSI_FAILED: Submit failed? Submission result:sbatch: error: QOSMaxNodePerUserLimit:sbatch: error: Batch job submission failed: Job violates accounting/QOS policy (job submit limit, user's size and/or time limits):\n>",
  'Fri Feb 18 10:11:35 CET 2022: Requesting resources: [Queue=batch, Runtime=3600, Nodes=1]',
  'Fri Feb 18 10:11:35 CET 2022: TSI reply: FAILED.',
  "Fri Feb 18 10:11:35 CET 2022: Submit attempt 2 (of 3) failed: de.fzj.unicore.xnjs.ems.ExecutionException: Submission to TSI failed. Reply was <TSI_FAILED: Submit failed? Submission result:sbatch: error: QOSMaxNodePerUserLimit:sbatch: error: Batch job submission failed: Job violates accounting/QOS policy (job submit limit, user's size and/or time limits):\n>",
  'Fri Feb 18 10:11:45 CET 2022: Requesting resources: [Queue=batch, Runtime=3600, Nodes=1]',
  'Fri Feb 18 10:11:46 CET 2022: TSI reply: FAILED.',
  "Fri Feb 18 10:11:46 CET 2022: Submit attempt 3 (of 3) failed: de.fzj.unicore.xnjs.ems.ExecutionException: Submission to TSI failed. Reply was <TSI_FAILED: Submit failed? Submission result:sbatch: error: QOSMaxNodePerUserLimit:sbatch: error: Batch job submission failed: Job violates accounting/QOS policy (job submit limit, user's size and/or time limits):\n>",
  "Fri Feb 18 10:11:49 CET 2022: Could not abort action on BSS: java.lang.IllegalArgumentException Can't abort: no batch system ID.",
  'Fri Feb 18 10:11:49 CET 2022: Job was aborted by the user.',
  'Fri Feb 18 10:11:49 CET 2022: Job was aborted by the user.'
];
/**
 * interface to describe how a table shoul look like, what field from the cols array represents
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
  onClick(...args: string[]): any;
  onClickFieldArgs: string[];
  isAsync: boolean;
}

/**
 * interface describing how a function that gets data from server should behave,
 * should take an optional 'page' parameter and should return a promise with DataType
 */
export interface IDataTypeRetriever {
  (page?: string): Promise<IDataType>;
}

/**
 * main class for the PyUnicore integration, extends Widget to render a table and other custom behaviour
 */
export class PyunicoreWidget extends Widget {
  constructor(
    tableFormat: ITableFormat,
    data: IDataType,
    buttonSettings: IButtonSettings,
    dataTypeRetriever: IDataTypeRetriever
  ) {
    super();
    this.layout = new PanelLayout();
    this._loadingRoot = document.createElement('div');
    this._loadingRoot.id = 'loadingRoot';
    this._loadingRoot.classList.add('lm-Widget', 'p-Widget', 'loadingRoot');
    this.node.appendChild(this._loadingRoot);
    this.addClass('tvb-pyunicoreWidget');
    this.buttonSettings = buttonSettings;
    this.getData = dataTypeRetriever;
    this.table = document.createElement('table');
    this.tHead = document.createElement('thead');
    this.tBody = document.createElement('tbody');
    this.table.appendChild(this.tHead);
    this.table.appendChild(this.tBody);
    this.node.appendChild(this.table);
    this.tableFormat = tableFormat;
    this._data = data;
    this.buildTable();
    this._modal = new ModalWidget(ModalType.Error, 'Unknown Error');
    this.node.appendChild(this._modal.node);
    // trigger method that checks if at least 60 seconds passed from last update and if so update
    this._updateIntervalId = setInterval(
      () => this._onTriggerUpdateInterval(),
      10000
    ); // check every 10 sec if widget should update - widget will update every 60 - 70 sec
    this._pagination = this._createPagination();
    (this.layout as PanelLayout).addWidget(this._pagination);
  }

  private _awaitingOperation = false;
  private _lastUpdateTime = new Date();
  /**
   * root element for the loading wheel
   * @private
   */
  private readonly _loadingRoot: HTMLDivElement;

  /**
   * contains a pagination object
   * @private
   */
  private readonly _pagination: PaginationWidget;
  public get pagination(): PaginationWidget {
    return this._pagination;
  }

  /**
   * the id of the interval that triggers an update
   * @private
   */
  private readonly _updateIntervalId: number;
  /**
   * button configuration for button that is showed in table row
   * @private
   */
  private readonly buttonSettings: IButtonSettings;

  /**
   *  Data for table
   */
  private _data: IDataType;
  public get data(): IDataType {
    return this._data;
  }

  public set data(data: IDataType) {
    this._data = data;
    this.buildTBody();
  }

  /**
   * The jobs table
   */
  readonly table: HTMLTableElement;

  /**
   * Table header
   */
  readonly tHead: HTMLElement;

  /**
   * Table body
   */
  readonly tBody: HTMLElement;

  /**
   * Table format
   */
  readonly tableFormat: ITableFormat;

  /**
   * Function to fetch data from server
   */
  readonly getData: IDataTypeRetriever;

  private readonly _modal: ModalWidget;

  /**
   * defines pagiation and it's behaviour, returns the created pagination
   * @private
   */
  private _createPagination(): PaginationWidget {
    return new PaginationWidget(
      () => {
        // trigger update to query data for the next page
        this.update();
      },
      () => {
        // trigger update to query data for the previous page
        this.update();
      }
    );
  }

  /**
   * builder function for table
   */
  buildTable(): void {
    this.tHead.innerHTML = '';
    this.buildTHead();
    this.buildTBody();
  }

  buildTHead(): void {
    const tr = document.createElement('tr');
    this.tHead.appendChild(tr);
    this.tableFormat.cols.forEach(colText => {
      const thCol = document.createElement('th');
      thCol.innerText = colText.toUpperCase();
      tr.appendChild(thCol);
    });
    const th = document.createElement('th');
    th.innerText = 'ACTIONS';
    tr.appendChild(th);
  }

  buildTBody(): void {
    this.tBody.innerHTML = '';
    this.data.jobs.forEach((rowData: any) => {
      const tr = document.createElement('tr');
      tr.id = rowData[this.tableFormat.idField];
      this.tableFormat.cols.forEach((colName: string) => {
        const td = document.createElement('td');
        td.innerText = rowData[colName];
        td.classList.add(colName); // add class of column name for easier identification in a later rerender
        tr.appendChild(td);
      });
      // add button for a table row
      const btn = this._getBuiltButton(rowData);
      const td = document.createElement('td');
      td.id = `action-${rowData[this.tableFormat.idField]}`;
      td.classList.add('actions');
      if (rowData[this.tableFormat.buttonRenderConditionField]) {
        td.appendChild(btn);
      }

      tr.appendChild(td);
      this.tBody.appendChild(tr);

      // build hidden data for job
      const details = PyunicoreWidget._getBuiltDetailsSection(rowData);
      this.tBody.appendChild(details);
      tr.onclick = () => PyunicoreWidget._toggleDisplay(details);
      // details.onclick = () => this._toggleDisplay(details);
    });
  }

  /**
   * method to toggle visibility of an HTML element
   * @param element
   * @private
   */
  private static _toggleDisplay(element: HTMLElement): void {
    element.style.display === 'none'
      ? (element.style.display = 'revert')
      : (element.style.display = 'none');
  }

  /**
   * method to build details section of a table row.
   * By default, the built row will have display=none.
   * @param rowData
   * @private
   */
  private static _getBuiltDetailsSection(rowData: IJob): HTMLElement {
    const row = document.createElement('tr');
    row.classList.add('detailsRow');
    const td = document.createElement('td');
    row.appendChild(td);
    let dataToShow = '';
    if (rowData?.log) {
      dataToShow = rowData.log.join('\n'); // assume the log is a list of strings and show them on separate lines
    } else {
      dataToShow = DUMMY_LOG.join('\n');
    }
    td.innerHTML = `<textarea>${dataToShow}</textarea>`;
    td.colSpan = 100;
    row.style.display = 'none';
    return row;
  }
  private _getBuiltButton(rowData: IJob): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.innerText = this.buttonSettings.name;
    const onClickArgs = this.buttonSettings.onClickFieldArgs.map(
      field => rowData[field]
    );
    btn.onclick = () => {
      if (this.buttonSettings.isAsync) {
        this._showBtnLoader(`action-${rowData[this.tableFormat.idField]}`);
        this.buttonSettings
          .onClick(...onClickArgs)
          .then((res: IJob): void => {
            // reload row data
            if (res.job) {
              this._reRenderRowWithData(
                rowData[this.tableFormat.idField],
                res.job
              );
            } else {
              this._reRenderRowWithData(
                rowData[this.tableFormat.idField],
                rowData
              );
            }
            this._showMessage(this._loadingRoot.id, res.message);
          })
          .catch((error: any) => {
            this.showModal(ModalType.Error, error);
            this._reRenderRowWithData(
              rowData[this.tableFormat.idField],
              rowData
            );
          });
      } else {
        this.buttonSettings.onClick(...onClickArgs);
      }
    };
    return btn;
  }

  /**
   * function to show modal (for errors or confirmations)
   * @param type
   * @param msg
   */
  showModal(type: ModalType, msg: string): void {
    this._modal.type = type;
    this._modal.message = msg;
    this._modal.showModal();
  }

  /**
   * function to show loader while the button onclick is performed
   */
  private _showBtnLoader(parentId: string) {
    const parent = document.getElementById(parentId);
    const loader = "<div class='unicoreLoading'></div>";
    if (parent) {
      parent.innerHTML = loader;
    }
  }

  /**
   * function to show a danger colored text inside an element withe the provided ID
   * @param parentId
   * @param message
   * @private
   */
  private _showMessage(parentId: string, message: string) {
    const parent = document.getElementById(parentId);
    const shownMessage = `<span class="unicoreMessage">${message}</span>`;
    if (parent) {
      parent.innerHTML = shownMessage;
    }
  }

  /**
   * finds a row by given rowId and repopulates the row with given data
   * @param rowId
   * @param data
   * @private
   */
  private _reRenderRowWithData(rowId: string, data: IJob): void {
    const row = document.getElementById(rowId);
    if (!row) {
      return;
    }
    this.tableFormat.cols.forEach(col => {
      const td = row.querySelector(`.${col}`); // get child td with col class
      if (td) {
        td.innerHTML = data[col];
      }
    });
    const actionTd = row.querySelector('.actions');
    if (actionTd) {
      actionTd.innerHTML = '';
    }
    if (data[this.tableFormat.buttonRenderConditionField]) {
      if (actionTd) {
        actionTd.appendChild(this._getBuiltButton(data));
      }
    }
  }

  /**
   * lifecycle method triggered on update()
   * @param msg
   */
  async onUpdateRequest(msg: Message): Promise<void> {
    super.onUpdateRequest(msg);
    if (this._awaitingOperation) {
      return;
    }
    // disable pagination buttons while data is loading
    this._pagination.disableButtons();
    this._disableSelection(); // disable select elements until update is done
    // show loading wheel while data is loading to prevent multiple clicks
    this._showBtnLoader(this._loadingRoot.id);
    this._awaitingOperation = true;
    this.getData(String(this._pagination.page))
      .then(data => {
        this.data = data;
        this._clearInnerHtmlById(this._loadingRoot.id);
        this._showMessage(this._loadingRoot.id, data.message);
        // show last update time
        const lastUpdate = document.createElement('span');
        lastUpdate.innerHTML = `Last update: ${this._lastUpdateTime.toLocaleString()}`;
        document.getElementById(this._loadingRoot.id)?.appendChild(lastUpdate);
        // if the length of jobs array is less than itemsPerPage don't enable nextButton
        if (data.jobs.length < this._pagination.itemsPerPage) {
          this._pagination.enablePrevBtn(); // prev button is enabled only if not on first page
        } else {
          this._pagination.enableButtons();
        }
        this._awaitingOperation = false;
        this._lastUpdateTime = new Date();
        this._enableSelection(); // enable select after update is done
      })
      .catch(error => {
        console.log(error);
        this.showModal(ModalType.Error, error);
        this._clearInnerHtmlById(this._loadingRoot.id);
        this._awaitingOperation = false;
        this._enableSelection(); // make sure select elements are enabled
      });
  }

  /**
   * method to disable all select elements from the pyunicore widget node
   * - used in combination with _enableSelection()
   * @private
   */
  private _disableSelection(): void {
    const select = this.node.querySelectorAll('select');
    if (select) {
      select.forEach(el => el.setAttribute('disabled', 'disabled'));
    }
  }

  /**
   * method to enable all select elements from the pyunicore widget node
   * - used in combination with _disableSelection()
   * @private
   */
  private _enableSelection(): void {
    const select = this.node.querySelectorAll('select');
    if (select) {
      select.forEach(el => el.removeAttribute('disabled'));
    }
  }

  /**
   * empties innerHtml of the element with provided ID
   * @param id
   * @private
   */
  private _clearInnerHtmlById(id: string): void {
    const element = document.getElementById(id);
    if (element) {
      element.innerHTML = '';
    }
  }

  /**
   * triggers an update on widget if at least 50sec have passed since last successful update
   * @private
   */
  private _onTriggerUpdateInterval(): void {
    const now = new Date().valueOf();
    const previous = this._lastUpdateTime.valueOf();
    const diff = now - previous;
    if (diff >= 60000) {
      this.update();
    }
  }
  /**
   * lifecycle method override to clear interval on detaching widget (stop update requests)
   * @param msg
   * @protected
   */
  protected onAfterDetach(msg: Message): void {
    super.onAfterDetach(msg);
    clearInterval(this._updateIntervalId);
  }
}

/**
 * builds a dropdown list with the provided list of strings,
 * represented as a <select> element with <option> elements as children for each string
 */
export class PyunicoreSites extends Widget {
  constructor(sites: string[]) {
    super();
    this.addClass('pyunicoreSites');
    this.sites = sites;
    this._label = document.createElement('span');
    this._label.innerText = 'Site:';
    this._activeSite = sites.length > 0 ? sites[0] : '';
    const container = document.createElement('div');
    container.appendChild(this._label);
    this._select = document.createElement('select');
    container.appendChild(this._select);
    this.node.appendChild(container);
    // when site is changed trigger changeHandler
    this._select.onchange = () => {
      this._activeSite = this._select.value;
      this.changeHandler();
    };
    this._buildSelection();
  }

  /**
   * list of sites
   */
  readonly sites: string[];

  /**
   * site for which jobs will be fetched
   * @private
   */
  private _activeSite: string;
  public get activeSite(): string {
    return this._activeSite;
  }
  private readonly _select: HTMLSelectElement;

  /**
   * label for selection
   */
  readonly _label: HTMLSpanElement;

  /**
   * function to build the select options (which sites can be chosen in dropdown)
   * @private
   */
  private _buildSelection() {
    this.sites.forEach(site => {
      const option = document.createElement('option');
      option.id = site;
      option.value = site;
      option.innerText = site;
      this._select.appendChild(option);
    });
  }

  /**
   *  this function is called every time the value of the selection is changed,
   *  after assigning the new value to this._activeSite
   *  !!! for now it is reassigned from exterior as a hack - should find better solution!
   * @private
   */
  changeHandler(): void {
    return;
  }
}

/**
 * enum to describe possible modals
 */
export enum ModalType {
  Warning = 'WARNING',
  Error = 'ERROR',
  Success = 'SUCCESS',
  Confirm = 'CONFIRM'
}

/**
 * Widget to display a modal on screen
 */
export class ModalWidget extends Widget {
  constructor(type: ModalType, message: string) {
    super();
    this._type = type;
    this._message = message;
    this._modalHeader = document.createElement('div');
    this._modalBody = document.createElement('div');
    this._modalFooter = document.createElement('div');
    this.addClass('unicoreModal');
    this._buildModal();
  }

  private readonly _modalHeader: HTMLDivElement;
  private readonly _modalBody: HTMLDivElement;
  private readonly _modalFooter: HTMLDivElement;

  /**
   * modal type (ModalType) - dictates message in modal header
   * @private
   */
  private _type: ModalType;
  public get type(): ModalType {
    return this._type;
  }
  public set type(value: ModalType) {
    this._type = value;
    this._buildModalHeader();
  }

  /**
   * modal message - dictates what will be shown in modal body
   * @private
   */
  private _message: string;
  public get message(): string {
    return this._message;
  }
  public set message(value: string) {
    this._message = value;
    this._buildModalBody();
  }

  /**
   * method ment to be called only once in the constructor to init modal html
   * @private
   */
  private _buildModal(): void {
    this.node.style.display = 'none'; // modal is invisible initially
    const modalBox = document.createElement('div');
    modalBox.appendChild(this._modalHeader);
    this._buildModalHeader();
    modalBox.appendChild(this._modalBody);
    this._buildModalBody();
    modalBox.appendChild(this._modalFooter);
    this._buildModalFooter();
    this.node.innerHTML = '';
    this.node.appendChild(modalBox);
  }

  private _buildModalHeader(): void {
    this._modalHeader.innerHTML = '';
    const modalHeaderText = document.createElement('h3');
    modalHeaderText.innerText = this._type;
    this._modalHeader.appendChild(modalHeaderText);
  }

  private _buildModalBody(): void {
    this._modalBody.innerHTML = '';
    const modalBodyText = document.createElement('p');
    modalBodyText.innerText = this._message;
    this._modalBody.appendChild(modalBodyText);
  }

  private _buildModalFooter(): void {
    this._modalFooter.innerHTML = '';
    const modalFooterBtn = document.createElement('button');
    modalFooterBtn.innerText = 'CLOSE';
    modalFooterBtn.onclick = () => this.hideModal();
    this._modalFooter.appendChild(modalFooterBtn);
  }

  hideModal(): void {
    this.node.style.display = 'none';
  }

  showModal(): void {
    this.node.style.display = 'flex';
  }
}

/**
 * simple implementation for a pagination, has two buttons for previous page and next page,
 * between the buttons it is shown the current page
 */
export class PaginationWidget extends Widget {
  constructor(
    onNextPage: () => void,
    onPreviousPage: () => void,
    options?: Widget.IOptions
  ) {
    super(options);
    this.addClass('unicorePagination');
    this._page = 1;
    this._currentPage = document.createElement('span');
    this._currentPage.innerText = 'Page: ' + String(this._page);
    this._onNextPage = onNextPage;
    this._onPreviousPage = onPreviousPage;
    this._buildUi();
  }

  /**
   * container for the number of current page
   * @private
   */
  private readonly _currentPage: HTMLSpanElement;
  private _itemsPerPage = 10;
  public get itemsPerPage(): number {
    return this._itemsPerPage;
  }
  private readonly _prevButton = document.createElement('button');
  private readonly _nextButton = document.createElement('button');
  /**
   * helper function to be called after increasing the page count
   * @private
   */
  private readonly _onNextPage: () => void;

  /**
   * helper function to be called after decreasing the page count
   * @private
   */
  private readonly _onPreviousPage: () => void;
  private _page: number;
  public get page(): number {
    return this._page;
  }
  public set page(value: number) {
    this._page = value;
    this._currentPage.innerText = 'Page: ' + String(this._page);
  }

  /**
   * builds pagination ui
   * @private
   */
  private _buildUi() {
    this.node.innerHTML = '';
    const container = document.createElement('div');
    const btnLeftContainer = document.createElement('div');
    btnLeftContainer.classList.add('btnLeftContainer');
    const currentPageContainer = document.createElement('div');
    currentPageContainer.classList.add('currentPageContainer');
    const btnRightContainer = document.createElement('div');
    btnRightContainer.classList.add('btnRightContainer');
    this.node.appendChild(container);
    this._prevButton.onclick = () => this.previousPage();
    container.appendChild(btnLeftContainer);
    btnLeftContainer.appendChild(this._prevButton);
    currentPageContainer.appendChild(this._currentPage);
    container.appendChild(currentPageContainer);
    btnRightContainer.appendChild(this._nextButton);
    container.appendChild(btnRightContainer);
    this._nextButton.innerHTML = '<i class="fa fa-arrow-right"></i>';
    this._prevButton.innerHTML = '<i class="fa fa-arrow-left"></i>';
    this._nextButton.onclick = () => this.nextPage();
  }

  /**
   * method called when the _nextButton is clicked
   */
  nextPage(): void {
    this.page += 1;
    this._onNextPage();
  }

  /**
   * method called when the _prevButton is called
   */
  previousPage(): void {
    this.page -= 1;
    this._onPreviousPage();
  }

  /**
   * method to disable _prevButton
   */
  disablePrevBtn(): void {
    this._prevButton.disabled = true;
    this._prevButton.style.display = 'none';
  }

  /**
   * method to enable _prevButton if current page is not the first page
   */
  enablePrevBtn(): void {
    if (this._page === 1) {
      return;
    }
    this._prevButton.disabled = false;
    this._prevButton.style.display = 'inline-block';
  }

  /**
   * method to disable _nextButton
   */
  disableNextBtn(): void {
    this._nextButton.disabled = true;
    this._nextButton.style.display = 'none';
  }

  /**
   * method to enable _nextButton
   */
  enableNextBtn(): void {
    this._nextButton.disabled = false;
    this._nextButton.style.display = 'inline-block';
  }

  /**
   * method to disable both buttons
   */
  disableButtons(): void {
    this.disablePrevBtn();
    this.disableNextBtn();
  }

  /**
   * method to enable both buttons
   */
  enableButtons(): void {
    this.enablePrevBtn();
    this.enableNextBtn();
  }
}
