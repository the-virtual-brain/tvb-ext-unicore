/**
 * this file was created to avoid imports from index.ts in tests which would
 * require mocking multiple external modules due to the way how imports work
 */

/**
 * represents the option in dropdown when no site is selected
 */
export const NO_SITE = 'NONE';

/**
 * mime type for text data (usually attached to a Drag object)
 */
export const TEXT_PLAIN_MIME = 'text/plain';

/**
 * How often should the component reload jobs expressed in milliseconds
 */
export const RELOAD_RATE_MS = 60000;

/**
 * How often should the component check if RELOAD_RATE_MS have passed since the last update
 */
export const RELOAD_CHECK_RATE_MS = 10000; //should check every 10sec
