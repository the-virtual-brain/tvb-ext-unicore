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

async function cancelJob(resource_url: string): Promise<any> {
  console.log('Cancelling job');
  const dataToSend = { resource_url: resource_url };
  const response = requestAPI<any>('jobs', {
    method: 'POST',
    body: JSON.stringify(dataToSend)
  });
  return response;
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

    const sites = await requestAPI<any>('sites');
    const columns = ['id', 'name', 'owner', 'site', 'status', 'start_time'];
    const command = 'tvb-ext-unicore:open';
    app.commands.addCommand(command, {
      label: 'PyUnicore Task Stream',
      execute: async () => {
        if (!widget || widget.isDisposed) {
          const sitesWidget = new PyunicoreSites(sites);
          const content = new PyunicoreWidget(
            {
              cols: columns,
              idField: 'id',
              buttonRenderConditionField: 'is_cancelable' // button will be rendered if 'is_cancelable' is true
            },
            { jobs: [], message: '' }, // initialize with an empty DataType object
            {
              name: 'Cancel Job',
              onClick: cancelJob,
              onClickFieldArgs: ['resource_url'], // args for onClick function
              isAsync: true
            },
            async () => {
              const endPoint = `jobs?site=${sitesWidget.activeSite}`;
              const data: IDataType = await requestAPI<any>(endPoint);
              return data;
            }
          );

          // hack to update jobs list on select change
          sitesWidget.changeHandler = () => content.update();

          content.node.prepend(sitesWidget.node);
          widget = new MainAreaWidget({ content });
          widget.id = 'tvb-ext-unicore';
          widget.title.label = 'PyUnicore Task Stream';
          widget.title.closable = true;
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
