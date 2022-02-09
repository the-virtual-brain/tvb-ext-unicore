import { Widget } from '@lumino/widgets';
import {requestAPI} from "./handler";

export interface TableFormat {
    cols: Array<string>
}

export interface DataType {
    jobs: any[]
}

export class PyunicoreWidget extends Widget {
    constructor(format: TableFormat, data: DataType) {
        // todo: see if there is a better way to use element creation in widgets (maybe a template?)
        super();
        this.addClass("tvb-pyunicoreWidget");
        this.table = document.createElement("table");
        this.tHead = document.createElement("thead");
        this.tBody = document.createElement("tbody");
        this.table.appendChild(this.tHead);
        this.table.appendChild(this.tBody);
        this.node.appendChild(this.table);
        this.tableFormat = format;
        this._data = data;
        this.buildTable();
    }

    /**
     * Data for table - fixme: currently this handles state and ui sync - there must be a better way to do this
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
     * builder function for table
     */
    buildTable(): void {
        this.tHead.innerHTML = '';
        this.buildTHead();
        this.buildTBody();
    }

    buildTHead(): void {
        const tr = document.createElement("tr");
        this.tHead.appendChild(tr);
        this.tableFormat.cols.forEach((colText) => {
            let thCol = document.createElement("th");
            thCol.innerText = colText.toUpperCase();
            tr.appendChild(thCol);
        })
        let th = document.createElement("th");
        th.innerText = "Actions";
        tr.appendChild(th);
    }

    buildTBody(): void {
        console.log("build tbody");
        this.tBody.innerHTML = "";
        // function to cancel a job fixme: have it passed down as param for a more dynamic widget
        function cancelJob(id: string): void {
            console.log("Cancelling job");
            const dataToSend = {id: id};
            try {
                requestAPI<any>('jobs', {method: 'POST', body: JSON.stringify(dataToSend)});
            } catch (reason) {
                console.error('Error on POST.\n${reason}')
            }
            // TODO: refresh table after cancel
            // newData.jobs = newData.jobs.filter((row)=>row.id!==id);
            // this.data = newData;
        }
        this.data.jobs.forEach((rowData: any) => {
            let tr = document.createElement("tr");
            let id = rowData["id"]; //fixme: should be dynamic
            tr.id = id;
            this.tableFormat.cols.forEach((colName: string) => {
                let td = document.createElement("td");
                td.innerText = rowData[colName];
                tr.appendChild(td);
            });

            // add button to cancel job
            const btn = document.createElement("button");
            btn.innerText = "Cancel Job";
            btn.onclick = () => cancelJob(id);
            let td = document.createElement("td");
            td.appendChild(btn);
            tr.appendChild(td);
            this.tBody.appendChild(tr);
        });
    }
}