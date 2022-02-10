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

import { PyunicoreWidget, IDataType } from './pyunicoreWidget';
import { requestAPI } from './handler';

function cancelJob(resource_url: string): void {
  console.log('Cancelling job');
  const dataToSend = { resource_url: resource_url };
  requestAPI<any>('jobs', {
    method: 'POST',
    body: JSON.stringify(dataToSend)
  }).catch(reason => console.error('Error on POST:', reason));
}

async function updateHandler(): Promise<IDataType> {
  const data: IDataType = await requestAPI<any>('jobs');
  return data;
}
/**
 * Initialization data for the tvb-ext-unicore extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'tvb-ext-unicore:plugin',
  autoStart: true,
  requires: [ICommandPalette, ILayoutRestorer],
  activate: async (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    restorer: ILayoutRestorer
  ) => {
    console.log('JupyterLab extension tvb-ext-unicore is activated!');
    let widget: MainAreaWidget<PyunicoreWidget>;

    const data = (await requestAPI<any>('jobs')) as IDataType;
    const columns = ['id', 'name', 'owner', 'site', 'status', 'start_time'];
    const command = 'tvb-ext-unicore:open';
    app.commands.addCommand(command, {
      label: 'PyUnicore Task Stream',
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new PyunicoreWidget(
            { cols: columns, idField: 'id' },
            data,
            {
              name: 'Cancel Job',
              onClick: cancelJob,
              onClickFieldArgs: ['resource_url'] // must be a field in a Job from jobs array
            },
            updateHandler
          );
          widget = new MainAreaWidget({ content });
          widget.id = 'tvb-ext-unicore';
          widget.title.label = 'PyUnicore Task Stream';
          widget.title.closable = true;

          //add a button to update tasks table
          // eslint-disable-next-line no-inner-declarations
          function updateTasks(): void {
            //call api
            requestAPI<any>('jobs')
              .then(data => {
                console.log(data);
                //set data to table -> triggers a rebuild of table body
                content.data = data;
              })
              .catch(reason => {
                console.error(
                  `The tvb-ext-unicore server extension appears to be missing.\n${reason}`
                );
              });
          }
          const btn = document.createElement('button');
          btn.innerText = 'Update Tasks';
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

    palette.addItem({ command, category: 'PyUnicore' });
    const tracker = new WidgetTracker<MainAreaWidget<PyunicoreWidget>>({
      namespace: 'pyunicore'
    });

    restorer.restore(tracker, {
      command,
      name: () => 'pyunicore'
    });
  }
};

export default plugin;
