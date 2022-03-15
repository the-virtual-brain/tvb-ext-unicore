import { ModalWidget, ModalType } from '../components/ModalComponent';
import { render } from '@testing-library/react';
import React from 'react';

function renderModal(visible: boolean) {
  const modalProps = {
    modalType: ModalType.Error,
    visible: visible,
    setVisible: (val: boolean): void => {
      return;
    },
    message: 'Test message'
  };
  return render(
    <ModalWidget
      modalType={modalProps.modalType}
      visible={modalProps.visible}
      setVisible={modalProps.setVisible}
      message={modalProps.message}
    />
  );
}

describe('<ModalWidget />', () => {
  it('should display a visible modal', async () => {
    const { findByTestId } = renderModal(true);
    const modal = await findByTestId('modal-widget');
    // modal should be rendered
    expect(modal).toBeTruthy();

    // modal should be visible
    expect(modal.style.display).toEqual('flex');
  });

  it('should find an invisible modal in dom', async () => {
    const { findByTestId } = renderModal(false);
    const modal = await findByTestId('modal-widget');
    expect(modal).toBeTruthy();
    expect(modal.style.display).toEqual('none');
  });
});
