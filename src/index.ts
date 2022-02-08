import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ICommandPalette, MainAreaWidget } from '@jupyterlab/apputils';
// todo: add WidgetTracker and ILayoutRestorer to monitor state

import { PyunicoreWidget, DataType } from "./pyunicoreWidget";
import { requestAPI } from './handler';
// todo: create an interface for API response

/**
 * Initialization data for the tvb-ext-unicore extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'tvb-ext-unicore:plugin',
  autoStart: true,
  requires: [ICommandPalette],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette) => {
    console.log('JupyterLab extension tvb-ext-unicore is activated!');
    console.log('ICommandPalette:', palette);
    // todo: replace constant with api call (or add method to be called in constructor maybe tbd)
    const data: DataType = {
      rows: [
        {id: "mockid_1", name: "mock_name_1", user: "mock_user_1", time: "mock_time_1"},
        {id: "mockid_2", name: "mock_name_2", user: "mock_user_2", time: "mock_time_2"},
        {id: "mockid_3", name: "mock_name_3", user: "mock_user_3", time: "mock_time_3"},
        {id: "mockid_4", name: "mock_name_4", user: "mock_user_4", time: "mock_time_4"},
        {id: "mockid_5", name: "mock_name_5", user: "mock_user_5", time: "mock_time_5"},
      ]
    }

    const content = new PyunicoreWidget({cols: ["id", "name", "user", "time"]}, data);
    const widget = new MainAreaWidget({ content });
    widget.id = 'tvb-ext-unicore';
    widget.title.label = 'PyUnicore Task Stream';
    widget.title.closable = true;

    function updateTasks():void {
      //call api
      requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
        //set data to table (currently mock data)
        content.data = {
          rows: [
            {id: "updated_id", name: "updated_name", user: "updated_user", time: "mock_time"}
          ]
        };
      })
      .catch(reason => {
        console.error(
          `The tvb-ext-unicore server extension appears to be missing.\n${reason}`
        );
      });
    }

    //add a button to update tasks table
    const btn = document.createElement("button");
    btn.innerText = "Update Tasks";
    btn.onclick = updateTasks;
    content.node.prepend(btn);

    const command: string = 'tvb-ext-unicore:open';
    app.commands.addCommand(command, {
      label: 'PyUnicore Task Stream',
      execute: () => {
        if (!widget.isAttached) {
          app.shell.add(widget, 'main');
        }
        app.shell.activateById(widget.id);
      }
    })

    palette.addItem({command, category: 'PyUnicore'});
    requestAPI<any>('get_example')
      .then(data => {
        console.log(data);
      })
      .catch(reason => {
        console.error(
          `The tvb-ext-unicore server extension appears to be missing.\n${reason}`
        );
      });
  }
};

export default plugin;
