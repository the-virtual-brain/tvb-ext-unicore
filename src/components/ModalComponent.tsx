import { Widget } from '@lumino/widgets';
/**
 * enum to describe possible modals
 */
export enum ModalType {
  Warning = 'WARNING',
  Error = 'ERROR',
  Success = 'SUCCESS',
  Confirm = 'CONFIRM'
}

/**
 * Widget to display a modal on screen
 */
export class ModalWidget extends Widget {
  constructor(type: ModalType, message: string) {
    super();
    this._type = type;
    this._message = message;
    this._modalHeader = document.createElement('div');
    this._modalBody = document.createElement('div');
    this._modalFooter = document.createElement('div');
    this.addClass('unicoreModal');
    this._buildModal();
  }

  private readonly _modalHeader: HTMLDivElement;
  private readonly _modalBody: HTMLDivElement;
  private readonly _modalFooter: HTMLDivElement;

  /**
   * modal type (ModalType) - dictates message in modal header
   * @private
   */
  private _type: ModalType;
  public get type(): ModalType {
    return this._type;
  }
  public set type(value: ModalType) {
    this._type = value;
    this._buildModalHeader();
  }

  /**
   * modal message - dictates what will be shown in modal body
   * @private
   */
  private _message: string;
  public get message(): string {
    return this._message;
  }
  public set message(value: string) {
    this._message = value;
    this._buildModalBody();
  }

  /**
   * method ment to be called only once in the constructor to init modal html
   * @private
   */
  private _buildModal(): void {
    this.node.style.display = 'none'; // modal is invisible initially
    const modalBox = document.createElement('div');
    modalBox.appendChild(this._modalHeader);
    this._buildModalHeader();
    modalBox.appendChild(this._modalBody);
    this._buildModalBody();
    modalBox.appendChild(this._modalFooter);
    this._buildModalFooter();
    this.node.innerHTML = '';
    this.node.appendChild(modalBox);
  }

  private _buildModalHeader(): void {
    this._modalHeader.innerHTML = '';
    const modalHeaderText = document.createElement('h3');
    modalHeaderText.innerText = this._type;
    this._modalHeader.appendChild(modalHeaderText);
  }

  private _buildModalBody(): void {
    this._modalBody.innerHTML = '';
    const modalBodyText = document.createElement('p');
    modalBodyText.innerText = this._message;
    this._modalBody.appendChild(modalBodyText);
  }

  private _buildModalFooter(): void {
    this._modalFooter.innerHTML = '';
    const modalFooterBtn = document.createElement('button');
    modalFooterBtn.innerText = 'CLOSE';
    modalFooterBtn.onclick = () => this.hideModal();
    this._modalFooter.appendChild(modalFooterBtn);
  }

  hideModal(): void {
    this.node.style.display = 'none';
  }

  showModal(): void {
    this.node.style.display = 'flex';
  }
}
