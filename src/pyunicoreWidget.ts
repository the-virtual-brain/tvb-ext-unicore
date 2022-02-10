import {Widget} from '@lumino/widgets';
import {Message} from '@lumino/messaging';

export interface TableFormat {
  cols: Array<string>,
  idField: string
}

export interface Job {
  [propName: string]: any;
}

export interface DataType {
  jobs: Job[]
}

export interface ButtonSettings {
  name: string,
  onClick(...args: string[]): void,
  onClickFieldArgs: string[]
}

export interface DataRetriever {
  (): Promise<DataType>
}

export class PyunicoreWidget extends Widget {
  constructor(
    tableFormat: TableFormat,
    data: DataType,
    buttonSettings: ButtonSettings,
    updateHandler: DataRetriever) {
    // todo: see if there is a better way to use element creation in widgets (maybe a template?)
    //  maybe splitting in more widgets?
    super();
    this.addClass('tvb-pyunicoreWidget');
    this.buttonSettings = buttonSettings;
    this.handleUpdate = updateHandler;
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
  private readonly buttonSettings: ButtonSettings;

  /**
   *  Data for table
   */
  private _data: DataType;
  public get data() {
    return this._data;
  }

  public set data(data: DataType) {
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
  readonly tableFormat: TableFormat;

  /**
   * Function to fetch data from server
   */
  readonly handleUpdate: DataRetriever;

  /**
   * builder function for table
   */
  buildTable(): void {
    this.tHead.innerHTML = '';
    this.buildTHead();
    this.buildTBody();
  }

  buildTHead(): void{
    const tr = document.createElement('tr');
    this.tHead.appendChild(tr);
    this.tableFormat.cols.forEach((colText) => {
      let thCol = document.createElement('th');
      thCol.innerText = colText.toUpperCase();
        tr.appendChild(thCol);
      })
      let th = document.createElement('th');
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