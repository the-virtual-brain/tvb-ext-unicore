import React from 'react';

/**
 * enum to describe possible modals
 */
export enum ModalType {
  Warning = 'WARNING',
  Error = 'ERROR',
  Success = 'SUCCESS',
  Confirm = 'CONFIRM'
}

export namespace types {
  export type Props = {
    modalType: ModalType;
    message: string;
    visible: boolean;
    setVisible: (visible: boolean) => void;
  };
}

/**
 * Widget to display a modal on screen
 */
export const ModalWidget = (props: types.Props): JSX.Element => {
  return (
    <div
      className={'unicoreModal'}
      style={{ display: props.visible ? 'flex' : 'none' }}
      data-testid={'modal-widget'}
    >
      <div>
        <div>
          <h3>{props.modalType}</h3>
        </div>
        <div>
          <p>{String(props.message)}</p>
        </div>
        <div>
          <button onClick={() => props.setVisible(false)}>CLOSE</button>
        </div>
      </div>
    </div>
  );
};
