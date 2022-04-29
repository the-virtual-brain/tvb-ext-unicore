import { getJobCode, getDownloadFileCode } from '../constants';

describe('test getJobCode, getDownloadFileCode', () => {
  it('generates code to get a job', () => {
    const expected = `from tvbextunicore.unicore_wrapper import unicore_wrapper
unicore = unicore_wrapper.UnicoreWrapper()
job = unicore.get_job('url')
job`;
    expect(getJobCode('url')).toBe(expected);
  });

  it('generates code to download a file', () => {
    const expected = `from tvbextunicore.unicore_wrapper import unicore_wrapper
unicore = unicore_wrapper.UnicoreWrapper()
download_result = unicore.download_file('test_url', 'test_file')
download_result`;
    expect(getDownloadFileCode('test_url', 'test_file')).toBe(expected);
  });
});
