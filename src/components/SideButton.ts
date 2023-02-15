import { Widget } from '@lumino/widgets';
import { Message } from '@lumino/messaging';
import { CommandRegistry } from '@lumino/commands';
import { launcherIcon, LabIcon } from '@jupyterlab/ui-components';

export class SideButton extends Widget {
  private readonly _command: string;
  private readonly _commands: CommandRegistry;
  constructor(options: SideButton.IOptions) {
    super(options);
    this._command = options.command;
    this._commands = options.commandRegistry;
    this.title.icon = options.icon ? options.icon : launcherIcon;
    this.title.caption = options.caption
      ? options.caption
      : 'PyUnicore Task Stream';
    this.id = options.id ? options.id : 'tvb-ext-unicore-side-btn';
    this.title.className = this.id;
  }

  protected async onAfterShow(msg: Message): Promise<void> {
    super.onAfterShow(msg);
    this.hide();
    await this._click();
  }

  private async _click(): Promise<void> {
    if (this.isVisible) {
      this.hide();
    }
    await this._commands.execute(this._command);
  }
}

export namespace SideButton {
  export interface IOptions extends Widget.IOptions {
    command: string;
    commandRegistry: CommandRegistry;
    icon?: LabIcon;
    caption?: string;
    id?: string;
  }
}
