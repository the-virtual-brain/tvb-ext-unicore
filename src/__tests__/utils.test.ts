import { validateDefaultSite } from '../utils';
import { NO_SITE } from '../constants';

jest.mock('@jupyterlab/apputils', () => {
  return {
    __esModule: true,
    showErrorMessage: jest.fn((_title: string, _message: any) =>
      Promise.resolve('')
    )
  };
});

const SITES = ['JUDAC', 'JUSUF', 'JURECA'];

describe('Test index.ts Utils.validateDefaultSite', () => {
  it('returns NONE when none is provided', () => {
    const expected = NO_SITE;
    const actual = validateDefaultSite(NO_SITE, SITES);
    expect(actual).toEqual(expected);
  });

  it('returns site name if site is available', () => {
    const expected = 'JUDAC';
    const actual = validateDefaultSite(expected, SITES);
    expect(actual).toEqual(expected);
  });

  it('returns NONE when site is not available', () => {
    const expected = NO_SITE;
    const actual = validateDefaultSite('DAINT-CSCS', SITES);
    expect(actual).toEqual(expected);
  });

  it('returns NONE when site is undefined', () => {
    const expected = NO_SITE;
    const actual = validateDefaultSite(undefined as unknown as string, SITES);
    expect(actual).toEqual(expected);
  });

  it('returns NONE when site is null', () => {
    const expected = NO_SITE;
    const actual = validateDefaultSite(null as unknown as string, SITES);
    expect(actual).toEqual(expected);
  });
});
