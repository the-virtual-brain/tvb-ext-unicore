import { ModalWidget, ModalType } from '../components/ModalComponent';
import { findByText, fireEvent, render } from '@testing-library/react';
import React from 'react';

const mockSetVisible = jest.fn((val: boolean) => {
  return;
});
function renderModal(visible: boolean) {
  const modalProps = {
    modalType: ModalType.Error,
    visible: visible,
    setVisible: mockSetVisible,
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

    // click the close button
    const btn = await findByText(modal, 'CLOSE');
    fireEvent.click(btn);
    expect(mockSetVisible).toBeCalledTimes(1);
  });

  it('should find an invisible modal in dom', async () => {
    const { findByTestId } = renderModal(false);
    const modal = await findByTestId('modal-widget');
    expect(modal).toBeTruthy();
    expect(modal.style.display).toEqual('none');
  });
});
