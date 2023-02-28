import { requestAPI, requestBucketApi } from './handler';

export async function downloadFileToBucket(
  jobUrl: string,
  file: string,
  options?: IOptions
): Promise<any> {
  if (!options) {
    throw new Error('No data about bucket!');
  }
  const uploadUrl = await requestBucketApi<IUploadURLResponse>(
    `local_upload?to_bucket=${
      options.bucketName
    }&with_name=${file}&to_path=${encodeURIComponent(options.currentPath)}`
  );

  return await requestAPI(
    `tvbextunicore/bucket_download?job_id=${encodeURIComponent(
      jobUrl
    )}&output_file=${encodeURIComponent(file)}&upload_url=${uploadUrl.url}`
  );
}

export interface IUploadURLResponse {
  success: boolean;
  url: string;
}

export interface IOptions {
  bucketName: string;
  currentPath: string;
}
