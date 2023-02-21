import { ILabShell } from '@jupyterlab/application';
import { CommandRegistry } from '@lumino/commands';
import { SideButton } from '../components/SideButton';
import { launcherIcon } from '@jupyterlab/ui-components';
import { Message } from '@lumino/messaging';

jest.mock('@jupyterlab/ui-components', () => {
  return {
    esModule: true,
    LabIcon: jest.fn()
  };
});

const MOCK_COMMAND = 'mock:command';

describe('Test SideButton', () => {
  let registry: CommandRegistry;
  let labShell: ILabShell;
  let toAdd: CommandRegistry.ICommandOptions;

  beforeEach(() => {
    registry = new CommandRegistry();
    labShell = {
      add: jest.fn().mockImplementation((_a: any, _b: any, _c?: any) => {
        return;
      }),
      collapseRight: jest.fn().mockImplementation(() => {
        return;
      }),
      collapseLeft: jest.fn().mockImplementation(() => {
        return;
      })
    } as unknown as ILabShell;
    // Widget.attach(labShell, document.body);
    toAdd = {
      execute: jest.fn().mockImplementation(() => {
        return;
      })
    };
    registry.addCommand(MOCK_COMMAND, toAdd);
  });

  it('Tests button rendered right', () => {
    const btn = new SideButton({
      id: 'test-id',
      caption: 'Test btn',
      icon: launcherIcon,
      command: MOCK_COMMAND,
      commandRegistry: registry,
      labShell: labShell,
      area: 'right'
    });
    expect(btn.id).toEqual('test-id');
    btn.addToLabShell();
    const expectedArgs = [btn, 'right', undefined];
    expect(labShell.add).toBeCalledWith(...expectedArgs);
  });

  it('Tests button rendered left', () => {
    const btn = new SideButton({
      caption: 'Test btn',
      icon: launcherIcon,
      command: MOCK_COMMAND,
      commandRegistry: registry,
      labShell: labShell,
      area: 'left'
    });
    btn.addToLabShell();
    const expectedArgs = [btn, 'left', undefined];
    expect(labShell.add).toBeCalledWith(...expectedArgs);
  });

  it('Tests command is executed and right panel is collapsed', () => {
    const btn = new SideButton({
      caption: 'Test btn',
      icon: launcherIcon,
      command: MOCK_COMMAND,
      commandRegistry: registry,
      labShell: labShell,
      area: 'right'
    });
    btn.addToLabShell();
    // simulate a click on side button (post an after-show message)
    const msg = new Message('after-show');
    btn.processMessage(msg);
    // command was called
    expect(toAdd.execute).toBeCalled();
    // any panel on the same side as btn is closed
    expect(labShell.collapseRight).toBeCalled();
  });

  it('Tests command is executed and right panel is collapsed', () => {
    const btn = new SideButton({
      caption: 'Test btn',
      icon: launcherIcon,
      command: MOCK_COMMAND,
      commandRegistry: registry,
      labShell: labShell,
      area: 'left'
    });
    btn.addToLabShell();
    // simulate a click on side button (post an after-show message)
    const msg = new Message('after-show');
    btn.processMessage(msg);
    // command was called
    expect(toAdd.execute).toBeCalled();
    // any panel on the same side as btn is closed
    expect(labShell.collapseLeft).toBeCalled();
  });

  it('Tests command executes but no pane is collapsed if button is not rendered on sides', () => {
    const btn = new SideButton({
      caption: 'Test btn',
      icon: launcherIcon,
      command: MOCK_COMMAND,
      commandRegistry: registry,
      labShell: labShell,
      area: 'top'
    });
    btn.addToLabShell();
    // simulate a click on side button (post an after-show message)
    const msg = new Message('after-show');
    btn.processMessage(msg);
    // command was called
    expect(toAdd.execute).toBeCalled();
    // no side pane was closed
    expect(labShell.collapseLeft).toBeCalledTimes(0);
  });
});
