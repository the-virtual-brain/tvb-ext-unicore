import { NO_SITE } from './constants';
import { showErrorMessage } from '@jupyterlab/apputils';

/**
 * Checks if a site name is among the available sites. If site is not available 'NONE' is returned
 * @param site
 * @param availableSites
 */
export function validateDefaultSite(
  site: string,
  availableSites: string[]
): string {
  if (site !== NO_SITE && site !== undefined && site !== null) {
    if (!availableSites.includes(site)) {
      showErrorMessage(
        'SITE ERROR',
        `Site ${site} is not available at this time! Available sites: ${availableSites}`
      );
      return NO_SITE;
    }
    return site;
  }

  return NO_SITE;
}
