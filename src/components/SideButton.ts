import { Widget } from '@lumino/widgets';
import { Message } from '@lumino/messaging';
import { CommandRegistry } from '@lumino/commands';
import { LabIcon } from '@jupyterlab/ui-components';
import { ILabShell } from '@jupyterlab/application';
import { DocumentRegistry } from '@jupyterlab/docregistry';
import { Drag } from '@lumino/dragdrop';

/**
 * A customizable button to be added in left or right sidebars of the LabShell.
 * When clicked, this button will execute the command given in the constructor and will collapse any other
 * opened sidebar.
 */
export class SideButton extends Widget {
  private readonly _command: string;
  private readonly _commands: CommandRegistry;
  private readonly _labShell: ILabShell;
  private readonly _area: SideButton.Area;
  private readonly _shellOptions: DocumentRegistry.IOpenOptions | undefined;
  constructor(options: SideButton.IOptions) {
    super(options);
    this._labShell = options.labShell;
    this._command = options.command;
    this._commands = options.commandRegistry;
    this._area = options.area;
    this._shellOptions = options.shellOptions;
    this.title.icon = options.icon;
    this.title.caption = options.caption;
    this.id = options.id ? options.id : 'tvb-ext-unicore-side-btn';
    this.title.className = this.id;
  }

  /**
   * Method to be called after instantiating this button in order for it to be added in the sidebar.
   */
  addToLabShell(): void {
    this._labShell.add(this, this._area, this._shellOptions);
  }

  /**
   * When a show message is received by button it changes the cursor aspect
   * while waiting for the command to be executed then changes it back to normal
   * @param msg
   * @protected
   */
  protected async onAfterShow(msg: Message): Promise<void> {
    console.log('after show');
    super.onAfterShow(msg);
    const cursorOverride = Drag.overrideCursor('wait');
    await this._click();
    cursorOverride.dispose();
  }

  /**
   * Collapse the sidebar corresponding to the area in which the button is placed then
   * execute the command received in the constructor if it exists in the command registry
   * @private
   */
  private async _click(): Promise<void> {
    switch (this._area) {
      case 'left':
        this._labShell.collapseLeft();
        break;
      case 'right':
        this._labShell.collapseRight();
        break;
      default:
        break;
    }
    await this._commands.execute(this._command);
  }
}

export namespace SideButton {
  /**
   * Options for a SideButton:
   * @command: the command to be executed on click
   * @commandRegistry: the CommandRegistry containing the command to be executed
   * @labShell: ILabShell containing the button;
   * @area: Area of the shell to display the button (left or right)
   * @shellOptions: IOpenOptions like {rank: 111}
   * @icon: LabIcon to be used when displaying the button
   * @caption: what will be displayed in the tooltip when hover over button
   * @id: Button id
   */
  export interface IOptions extends Widget.IOptions {
    caption: string;
    command: string;
    commandRegistry: CommandRegistry;
    labShell: ILabShell;
    area: Area;
    shellOptions?: DocumentRegistry.IOpenOptions;
    icon: LabIcon;
    id?: string;
  }

  export type Area =
    | 'main'
    | 'header'
    | 'top'
    | 'menu'
    | 'left'
    | 'right'
    | 'bottom'
    | 'down'
    | undefined;
}
