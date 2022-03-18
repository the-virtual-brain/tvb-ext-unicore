import { PaginationComponent } from '../components/PaginationComponent';
import {
  findByText,
  fireEvent,
  queryAllByTestId,
  render
} from '@testing-library/react';
import React from 'react';

const mockSetPage = jest.fn((page: number) => {
  return;
});
function renderPagination(showPrev: boolean, showNext: boolean) {
  const props = {
    setPageState: mockSetPage,
    showPrevButton: showPrev,
    showNextButton: showNext,
    currentPage: 1
  };

  return render(<PaginationComponent {...props} />);
}

describe('<PaginationComponent />', () => {
  it('renders pagination with both buttons visible and page number', async () => {
    const { findByTestId } = renderPagination(true, true);
    const pagination = await findByTestId('pagination-component');
    expect(pagination).toBeTruthy();
    const left = await findByTestId('p-btn-left');
    expect(left).toBeTruthy();
    const right = await findByTestId('p-btn-right');
    expect(right).toBeTruthy();
    const page = await findByText(pagination, 'Page: 1');
    expect(page).toBeTruthy();
    // test click right
    fireEvent.click(left);
    expect(mockSetPage).toBeCalledTimes(1);
    // test click left
    fireEvent.click(right);
    expect(mockSetPage).toBeCalledTimes(2);
  });

  it('renders pagination without left button and with right button visible', async () => {
    const { findByTestId } = renderPagination(false, true);
    const pagination = await findByTestId('pagination-component');
    expect(pagination).toBeTruthy();
    const left = queryAllByTestId(pagination, 'p-btn-left');
    expect(left).toHaveLength(0);
    const right = await findByTestId('p-btn-right');
    expect(right).toBeTruthy();
    const page = await findByText(pagination, 'Page: 1');
    expect(page).toBeTruthy();
  });

  it('renders pagination with left visible and right not existing', async () => {
    const { findByTestId } = renderPagination(true, false);
    const pagination = await findByTestId('pagination-component');
    expect(pagination).toBeTruthy();
    const left = queryAllByTestId(pagination, 'p-btn-left');
    expect(left).toHaveLength(1);
    const right = queryAllByTestId(pagination, 'p-btn-right');
    expect(right).toHaveLength(0);
    const page = await findByText(pagination, 'Page: 1');
    expect(page).toBeTruthy();
  });

  it('renders pagination without both buttons', async () => {
    const { findByTestId } = renderPagination(false, false);
    const pagination = await findByTestId('pagination-component');
    expect(pagination).toBeTruthy();
    const left = queryAllByTestId(pagination, 'p-btn-left');
    expect(left).toHaveLength(0);
    const right = queryAllByTestId(pagination, 'p-btn-right');
    expect(right).toHaveLength(0);
    const page = await findByText(pagination, 'Page: 1');
    expect(page).toBeTruthy();
  });
});
