import {
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';

import { PyunicoreWidget, DataType } from "./pyunicoreWidget";
import { requestAPI } from './handler';
// todo: create an interface for API response

/**
 * Initialization data for the tvb-ext-unicore extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'tvb-ext-unicore:plugin',
  autoStart: true,
  requires: [ICommandPalette, ILayoutRestorer],
  activate: (app: JupyterFrontEnd, palette: ICommandPalette, restorer: ILayoutRestorer) => {
    console.log('JupyterLab extension tvb-ext-unicore is activated!');
    let widget: MainAreaWidget<PyunicoreWidget>;
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

    const command: string = 'tvb-ext-unicore:open';
    app.commands.addCommand(command, {
      label: 'PyUnicore Task Stream',
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new PyunicoreWidget({cols: ["id", "name", "user", "time"]}, data);
          widget = new MainAreaWidget({ content });
          widget.id = 'tvb-ext-unicore';
          widget.title.label = 'PyUnicore Task Stream';
          widget.title.closable = true;

          //add a button to update tasks table
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
          const btn = document.createElement("button");
          btn.innerText = "Update Tasks";
          btn.onclick = updateTasks;
          content.node.prepend(btn);
        }
        if (!tracker.has(widget)) {
          //Track the state of the widget for later restore
          tracker.add(widget);
        }
        if (!widget.isAttached) {
          app.shell.add(widget, 'main');
        }
        widget.content.update();
        app.shell.activateById(widget.id);
      }
    });

    palette.addItem({command, category: 'PyUnicore'});
    let tracker = new WidgetTracker<MainAreaWidget<PyunicoreWidget>>({
      namespace: 'pyunicore'
    });
    restorer.restore(tracker, {
      command,
      name: () => 'pyunicore'
    });
  }
};

export default plugin;
