import { Widget } from '@lumino/widgets';
import { Message } from '@lumino/messaging';

export interface ITableFormat {
  cols: Array<string>;
  idField: string;
}

export interface IJob {
  [propName: string]: any;
}

export interface IDataType {
  jobs: IJob[];
}

export interface IButtonSettings {
  name: string;
  onClick(...args: string[]): void;
  onClickFieldArgs: string[];
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
    this.addClass('tvb-pyunicoreWidget');
    this.buttonSettings = buttonSettings;
    this.handleUpdate = dataTypeRetriever;
    this.table = document.createElement('table');
    this.tHead = document.createElement('thead');
    this.tBody = document.createElement('tbody');
    this.table.appendChild(this.tHead);
    this.table.appendChild(this.tBody);
    this.node.appendChild(this.table);
    this.tableFormat = tableFormat;
    this._data = data;
    this.buildTable();
  }

  /**
   * button configuration for button that is showed in table row
   * @private
   */
  private readonly buttonSettings: IButtonSettings;

  /**
   *  Data for table
   */
  private _data: IDataType;
  public get data() {
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
  readonly handleUpdate: IDataTypeRetriever;

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
        tr.appendChild(td);
      });
      // add button for a table row
      const btn = document.createElement('button');
      btn.innerText = this.buttonSettings.name;
      const onClickArgs = this.buttonSettings.onClickFieldArgs.map(
        field => rowData[field]
      );
      btn.onclick = () => {
        this.buttonSettings.onClick(...onClickArgs);
        this.update();
      };
      const td = document.createElement('td');
      td.appendChild(btn);
      tr.appendChild(td);
      this.tBody.appendChild(tr);
    });
  }
  /**
   * lifecycle method triggered on update()
   * @param msg
   */
  async onUpdateRequest(msg: Message): Promise<void> {
    super.onUpdateRequest(msg);
    const newData = await this.handleUpdate();
    this.data = newData;
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
  public get activeSite() {
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
}
