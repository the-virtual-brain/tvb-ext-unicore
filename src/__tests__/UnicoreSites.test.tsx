import { UnicoreSites } from '../components/UnicoreSites';
import {
  findByText,
  fireEvent,
  getByTestId,
  getByText,
  render
} from '@testing-library/react';
import React from 'react';

function renderSites(
  disabled: boolean,
  onChange: (site: string) => void = (s: string) => {
    return;
  }
) {
  const props = {
    sites: ['JUDAC', 'JUSUF', 'DAINT'],
    onChangeSite: onChange,
    disableSelection: disabled,
    refreshSite: () => console.log('Refresh sites'),
    loading: false,
    setAutoReload: (val: boolean) => console.log(val)
  };

  return render(<UnicoreSites {...props} />);
}

describe('<UnicoreSites />', () => {
  it('renders sites dropdown correctly', async () => {
    const { findByTestId } = renderSites(false);
    const sites = await findByTestId('pyunicore-sites');
    expect(sites).toBeTruthy();
    const options = sites.querySelectorAll('option');
    // select element should not be disabled
    const select = sites.querySelector('select');
    expect(select?.disabled).toBeFalsy();
    // should have 3 option elements generated
    expect(options).toHaveLength(3);
    // should have option with value 'JUDAC'
    expect(await findByText(sites, 'JUDAC')).toBeTruthy();
    // should have option with value 'JUSUF'
    expect(await findByText(sites, 'JUSUF')).toBeTruthy();
    // should have option with value 'DAINT'
    expect(await findByText(sites, 'DAINT')).toBeTruthy();
  });

  it('renders sites dropdown disabled correctly', async () => {
    const { findByTestId } = renderSites(true);
    const sites = await findByTestId('pyunicore-sites');
    expect(sites).toBeTruthy();
    const options = sites.querySelectorAll('option');
    // select element should be disabled
    const select = sites.querySelector('select');
    expect(select?.disabled).toBeTruthy();
    // should have 3 option elements generated
    expect(options).toHaveLength(3);
    // should have option with value 'JUDAC'
    expect(await findByText(sites, 'JUDAC')).toBeTruthy();
    // should have option with value 'JUSUF'
    expect(await findByText(sites, 'JUSUF')).toBeTruthy();
    // should have option with value 'DAINT'
    expect(await findByText(sites, 'DAINT')).toBeTruthy();
  });

  it('calls the onchange method', async () => {
    const mockFn = jest.fn((site: string) => {
      return;
    });
    const { findByTestId } = renderSites(true, mockFn);
    const sites = await findByTestId('pyunicore-sites');
    expect(sites).toBeTruthy();

    // manually fire the onchange event on selection
    fireEvent.change(getByTestId(sites, 'select'), {
      target: { value: 'JUSUF' }
    });

    // test the onchange method was fired
    expect(mockFn).toBeCalledTimes(1);

    // test the selected value is now 'JUSUF'
    expect(getByText(sites, 'JUSUF')).toHaveProperty('selected', true);
  });
});
