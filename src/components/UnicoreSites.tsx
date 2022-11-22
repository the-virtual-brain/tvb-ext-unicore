import React, { useState } from 'react';
import { CheckBoxToggle } from './CheckBoxToggle';

namespace types {
  export type Props = {
    sites: string[];
    onChangeSite: (site: string) => void;
    disableSelection: boolean;
    refreshSite: () => void;
    loading: boolean;
    setAutoReload: (active: boolean) => void;
  };
}

/**
 * select component
 * @param props
 * @constructor
 */
export const UnicoreSites = (props: types.Props): JSX.Element => {
  /**
   * function to handle the change of selected option - meant to call the handler from props with
   * the new option value as param
   * @param event
   */
  function handleSiteChange(event: React.ChangeEvent<HTMLSelectElement>): void {
    props.onChangeSite(event.target.value);
  }

  const [spin, setSpin] = useState<boolean>(false);

  function doSpin() {
    setSpin(true);
    setTimeout(() => setSpin(false), 500);
  }

  return (
    <div className={'pyunicoreSites'} data-testid={'pyunicore-sites'}>
      <div>
        <span>SITE:</span>
        <select
          onChange={handleSiteChange}
          disabled={props.disableSelection}
          data-testid={'select'}
        >
          {props.sites.map(site => (
            <option key={site} id={site} value={site}>
              {site}
            </option>
          ))}
        </select>
      </div>
      <button
        className={`refreshBtn ${spin && 'spin'}`}
        onClick={() => {
          doSpin();
          props.refreshSite();
        }}
        disabled={props.loading}
      >
        <i className="fa fa-refresh" />
      </button>
      <CheckBoxToggle
        onToggle={props.setAutoReload}
        initialCheckedState={true}
        label={'Auto refresh'}
      />
    </div>
  );
};
