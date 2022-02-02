import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';

import { ISettingRegistry } from '@jupyterlab/settingregistry';

/**
 * Initialization data for the tvb-ext-unicore extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'tvb-ext-unicore:plugin',
  autoStart: true,
  optional: [ISettingRegistry],
  activate: (app: JupyterFrontEnd, settingRegistry: ISettingRegistry | null) => {
    console.log('JupyterLab extension tvb-ext-unicore is activated!');

    if (settingRegistry) {
      settingRegistry
        .load(plugin.id)
        .then(settings => {
          console.log('tvb-ext-unicore settings loaded:', settings.composite);
        })
        .catch(reason => {
          console.error('Failed to load settings for tvb-ext-unicore.', reason);
        });
    }
  }
};

export default plugin;
