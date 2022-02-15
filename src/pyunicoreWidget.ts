import { Widget } from '@lumino/widgets';
import { Message } from '@lumino/messaging';

export interface ITableFormat {
  cols: Array<string>;
  idField: string;
  buttonRenderConditionField: string; // the field which dictates if the button is visible
}

export interface IJob {
  [propName: string]: any;
}

export interface IDataType {
  message: string;
  jobs: IJob[];
}

/**
 * describes the table row button functionality
 * if isAsync is true the button will be replaced by a loading animation while the job is performed
 */
export interface IButtonSettings {
  name: string;
  onClick(...args: string[]): any;
  onClickFieldArgs: string[];
  isAsync: boolean;
}

export interface IDataTypeRetriever {
  (): Promise<IDataType>;
}

export class PyunicoreWidget extends Widget {
  constructor(
    tableFormat: ITableFormat,
    data: IDataType,
    buttonSettings: IButtonSettings,
    dataTypeRetriever: IDataTypeRetriever
  ) {
    super();
    const loadingRoot = document.createElement('span');
    loadingRoot.id = 'loadingRoot';
    this.node.appendChild(loadingRoot);
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
    this._updateIntervalId = setInterval(() => this.update(), 30000); // trigger an update on widget every 30 seconds
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
    th.innerText = 'Actions';
    tr.appendChild(th);
  }

  buildTBody(): void {
    console.log('build tbody');
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
    });
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
            }
            this._showMessage('loadingRoot', res.message);
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
    console.log('re-render');
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
    console.log('actionTd: ', actionTd);
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
    console.log('update!');
    super.onUpdateRequest(msg);
    this._showBtnLoader('loadingRoot');
    this.getData()
      .then(data => {
        this.data = data;
        this._clearInnerHtmlById('loadingRoot');
        this._showMessage('loadingRoot', data.message);
      })
      .catch(error => {
        console.log(error);
        this.showModal(ModalType.Error, error);
        this._clearInnerHtmlById('loadingRoot');
      });
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
   * lifecycle method override to clear interval on detaching widget (stop update requests)
   * @param msg
   * @protected
   */
  protected onAfterDetach(msg: Message): void {
    super.onAfterDetach(msg);
    clearInterval(this._updateIntervalId);
  }
}

export class PyunicoreSites extends Widget {
  constructor(sites: string[]) {
    super();
    this.addClass('pyunicoreSites');
    this.sites = sites;
    this._label = document.createElement('span');
    this._label.innerText = 'Site:';
    this.node.appendChild(this._label);
    this._activeSite = sites.length > 0 ? sites[0] : '';
    this._select = document.createElement('select');
    this.node.appendChild(this._select);
    this._select.onchange = ev => {
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
   * function to build the select options
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

export enum ModalType {
  Warning = 'WARNING',
  Error = 'ERROR',
  Success = 'SUCCESS',
  Confirm = 'CONFIRM'
}

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
