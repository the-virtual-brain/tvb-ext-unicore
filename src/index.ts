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

import { PyunicoreWidget } from './pyunicoreWidget';

import { requestAPI } from './handler';

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

    const sites = await requestAPI<any>('sites');
    const columns = ['id', 'name', 'owner', 'site', 'status', 'start_time'];
    const command = 'tvbextunicore:open';
    app.commands.addCommand(command, {
      label: 'PyUnicore Task Stream',
      execute: () => {
        if (!widget || widget.isDisposed) {
          const content = new PyunicoreWidget({
            tableFormat: {
              cols: columns,
              idField: 'id',
              buttonRenderConditionField: 'is_cancelable'
            },
            data: { message: '', jobs: [] },
            buttonSettings: {
              onClick: cancelJob,
              onClickFieldArgs: ['resource_url'],
              isAsync: false,
              name: 'Cancel Job'
            },
            sites: sites,
            reloadRate: 60000
          });

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
