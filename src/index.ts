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

import { PyunicoreWidget, IDataType, PyunicoreSites } from './pyunicoreWidget';
import { requestAPI } from './handler';

function cancelJob(resource_url: string): void {
  console.log('Cancelling job');
  const dataToSend = { resource_url: resource_url };
  requestAPI<any>('jobs', {
    method: 'POST',
    body: JSON.stringify(dataToSend)
  }).catch(reason => console.error('Error on POST:', reason));
}

// async function fetchJobs(): Promise<IDataType> {
//   const data: IDataType = await requestAPI<any>('jobs');
//   return data;
// }
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

    const sites = await requestAPI<any>('sites');
    const columns = ['id', 'name', 'owner', 'site', 'status', 'start_time'];
    const command = 'tvb-ext-unicore:open';
    app.commands.addCommand(command, {
      label: 'PyUnicore Task Stream',
      execute: async () => {
        if (!widget || widget.isDisposed) {
          const sitesWidget = new PyunicoreSites(sites);
          // eslint-disable-next-line no-inner-declarations
          async function fetchJobs(): Promise<IDataType> {
            const endPoint = `jobs?site=${sitesWidget.activeSite}`;
            const data: IDataType = await requestAPI<any>(endPoint);
            return data;
          }
          const data = await fetchJobs();
          const content = new PyunicoreWidget(
            { cols: columns, idField: 'id' },
            data,
            {
              name: 'Cancel Job',
              onClick: cancelJob,
              onClickFieldArgs: ['resource_url'] // args for onClick function
            },
            fetchJobs
          );

          content.node.prepend(sitesWidget.node);
          widget = new MainAreaWidget({ content });
          widget.id = 'tvb-ext-unicore';
          widget.title.label = 'PyUnicore Task Stream';
          widget.title.closable = true;

          //add a button to update tasks table
          const btn = document.createElement('button');
          btn.innerText = 'Update Tasks';
          btn.onclick = () => {
            fetchJobs().then(data => (content.data = data));
          };
          content.node.prepend(btn);
        }
        if (!tracker.has(widget)) {
          //Track the state of the widget for later restore
          tracker.add(widget);
        }
        if (!widget.isAttached) {
          app.shell.add(widget, 'main');
        }
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
