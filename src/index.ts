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
import { PanelLayout } from '@lumino/widgets';

async function cancelJob(resource_url: string): Promise<any> {
  const dataToSend = { resource_url: resource_url };
  return requestAPI<any>('jobs', {
    method: 'POST',
    body: JSON.stringify(dataToSend)
  });
}

/**
 * Initialization data for the tvb-ext-unicore extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'tvbextunicore:plugin',
  autoStart: true,
  requires: [ICommandPalette, ILayoutRestorer],
  activate: async (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    restorer: ILayoutRestorer
  ) => {
    console.log('JupyterLab extension tvb-ext-unicore is activated!');
    let widget: MainAreaWidget<PyunicoreWidget>;

    const columns = ['id', 'name', 'owner', 'site', 'status', 'start_time'];
    const command = 'tvbextunicore:open';
    app.commands.addCommand(command, {
      label: 'PyUnicore Task Stream',
      execute: async () => {
        if (!widget || widget.isDisposed) {
          const sites = await requestAPI<any>('sites');
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
            async (page?: string) => {
              let endPoint = `jobs?site=${sitesWidget.activeSite}`;
              if (page) {
                endPoint += `&page=${page}`;
              }
              const data: IDataType = await requestAPI<any>(endPoint);
              return data;
            }
          );

          // hack to update jobs list on select change and reset page number
          sitesWidget.changeHandler = () => {
            content.pagination.page = 1;
            content.update();
          };

          (content.layout as PanelLayout).addWidget(sitesWidget);
          widget = new MainAreaWidget({ content });
          widget.id = 'tvbextunicore';
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
