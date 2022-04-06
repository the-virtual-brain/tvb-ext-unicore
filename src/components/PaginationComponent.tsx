import React from 'react';

namespace types {
  export type Props = {
    setPageState: (page: number) => void;
    showPrevButton: boolean;
    showNextButton: boolean;
    currentPage: number;
  };
}

export const PaginationComponent = (props: types.Props): JSX.Element => {
  function handleNextPage(): void {
    props.setPageState(props.currentPage + 1);
  }

  function handlePreviousPage(): void {
    props.setPageState(props.currentPage - 1);
  }

  return (
    <div className={'unicorePagination'} data-testid={'pagination-component'}>
      <div>
        <div className={'btnLeftContainer'}>
          {props.showPrevButton && (
            <button onClick={handlePreviousPage} data-testid={'p-btn-left'}>
              <i className={'fa fa-arrow-left'} />
            </button>
          )}
        </div>
        <div className={'currentPageContainer'}>
          <span>{`Page: ${props.currentPage}`}</span>
        </div>
        <div className={'btnRightContainer'}>
          {props.showNextButton && (
            <button onClick={handleNextPage} data-testid={'p-btn-right'}>
              <i className={'fa fa-arrow-right'} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
