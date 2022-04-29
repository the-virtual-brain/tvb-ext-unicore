import {
  ILabShell,
  ILayoutRestorer,
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import {
  ICommandPalette,
  MainAreaWidget,
  WidgetTracker
} from '@jupyterlab/apputils';

import { FileBrowser, IFileBrowserFactory } from '@jupyterlab/filebrowser';

import { INotebookTracker, NotebookPanel } from '@jupyterlab/notebook';

import { PyunicoreWidget } from './pyunicoreWidget';

import { requestAPI } from './handler';
import { Kernel } from '@jupyterlab/services';
import { ConsolePanel, IConsoleTracker } from '@jupyterlab/console';
import { NO_SITE, getJobCode } from './constants';

async function cancelJob(resource_url: string): Promise<any> {
  const dataToSend = { resource_url: resource_url };
  return requestAPI<any>('jobs', {
    method: 'POST',
    body: JSON.stringify(dataToSend)
  });
}

export type SitesResponse = {
  sites: { [site: string]: string }; // we get the response as a dict { '<siteName>' : '<siteUrl>' }
  message: string;
};

export type NullableIKernelConnection =
  | Kernel.IKernelConnection
  | null
  | undefined;

/**
 * Initialization data for the tvb-ext-unicore extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'tvbextunicore:plugin',
  autoStart: true,
  requires: [
    ICommandPalette,
    ILayoutRestorer,
    IConsoleTracker,
    ILabShell,
    INotebookTracker,
    IFileBrowserFactory
  ],
  activate: async (
    app: JupyterFrontEnd,
    palette: ICommandPalette,
    restorer: ILayoutRestorer,
    consoleTracker: IConsoleTracker,
    labShell: ILabShell,
    notebookTracker: INotebookTracker,
    factory: IFileBrowserFactory
  ) => {
    console.log('JupyterLab extension tvb-ext-unicore is activated!');
    let widget: MainAreaWidget<PyunicoreWidget>;
    const columns = ['id', 'name', 'owner', 'site', 'status', 'start_time'];
    const command = 'tvbextunicore:open';
    app.commands.addCommand(command, {
      label: 'PyUnicore Task Stream',
      execute: async (): Promise<any> => {
        if (!widget || widget.isDisposed) {
          const sitesResponse = await requestAPI<SitesResponse>('sites');
          const content = new PyunicoreWidget({
            tableFormat: {
              cols: columns,
              idField: 'id',
              buttonRenderConditionField: 'is_cancelable'
            },
            data: { message: sitesResponse.message, jobs: [] },
            buttonSettings: {
              onClick: cancelJob,
              onClickFieldArgs: ['resource_url'],
              isAsync: false,
              name: 'Cancel Job'
            },
            sites: [NO_SITE, ...Object.keys(sitesResponse.sites)],
            reloadRate: 60000,
            getKernel: async () => {
              const kernel = Private.getCurrentKernel(
                labShell,
                notebookTracker,
                consoleTracker
              );
              return (await Private.shouldUseKernel(kernel)) ? kernel : null; // make sure kernel is usable
            },
            getJobCode: getJobCode,
            getFileBrowser: () => Private.getFileBrowser(factory)
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

namespace Private {
  /**
   * Whether a kernel should be used. Only evaluates to true
   * if it is valid and in python.
   */
  export async function shouldUseKernel(
    kernel: NullableIKernelConnection
  ): Promise<boolean> {
    if (!kernel) {
      return false;
    }
    const spec = await kernel.spec;
    return !!spec && spec.language.toLowerCase().indexOf('python') !== -1;
  }

  /**
   * Get the currently focused kernel in the application,
   * checking both notebooks and consoles.
   */
  export function getCurrentKernel(
    shell: ILabShell,
    notebookTracker: INotebookTracker,
    consoleTracker: IConsoleTracker
  ): NullableIKernelConnection {
    // Get a handle on the most relevant kernel,
    // whether it is attached to a notebook or a console.
    let current = shell.currentWidget;
    let kernel: Kernel.IKernelConnection | null | undefined;
    if (current && notebookTracker.has(current)) {
      kernel = (current as NotebookPanel).sessionContext.session?.kernel;
    } else if (current && consoleTracker.has(current)) {
      kernel = (current as ConsolePanel).sessionContext.session?.kernel;
    } else if (notebookTracker.currentWidget) {
      current = notebookTracker.currentWidget;
      kernel = (current as NotebookPanel).sessionContext.session?.kernel;
    } else if (consoleTracker.currentWidget) {
      current = consoleTracker.currentWidget;
      kernel = (current as ConsolePanel).sessionContext.session?.kernel;
    }
    return kernel;
  }

  export function getFileBrowser(factory: IFileBrowserFactory): FileBrowser {
    return factory.defaultBrowser;
  }
}
