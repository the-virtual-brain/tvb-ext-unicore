import json
import enum
import os

from tvbextunicore.exceptions import FileNotExistsException, JobRunningException
from tvbextunicore.unicore_wrapper.unicore_wrapper import UnicoreWrapper
from tvbextunicore.logger.builder import get_logger

LOGGER = get_logger(__name__)


class DownloadStatus(str, enum.Enum):  # inherit str for json serialization
    """
    Describes the status of a file download attempt
    """
    WARNING = 'warning'
    ERROR = 'error'
    SUCCESS = 'success'


def build_response(status, message):
    # type: (DownloadStatus, str) -> str
    """
    function to build a response as json string
    """
    return json.dumps({'status': status, 'message': message})


def download_file(file_path, file_name, unicore_wrapper, job_url):
    # type: (str, str, UnicoreWrapper, str) -> str
    """
    Parameters
    ----------
    file_path: path where the file will be downloaded. ex: destination_dir/stdout
    file_name: name of the file to download. ex: stdout
    unicore_wrapper
    job_url

    Returns
    -------
    json string with result of download process. ex: {"status": "success", "message": "Downloaded"}
    """
    downloaded = True
    with open(file_path, 'wb') as f:
        try:
            message = unicore_wrapper.download_file(job_url, file_name, f)
            response = build_response(DownloadStatus.SUCCESS, message)
        except FileNotExistsException as e:
            LOGGER.error(e)
            downloaded = False
            response = build_response(DownloadStatus.ERROR, e.message)
        except JobRunningException as e:
            LOGGER.warning(e)
            downloaded = False
            response = build_response(DownloadStatus.WARNING, e.message)
    if not downloaded and os.path.exists(file_path):
        os.remove(file_path)
    return response
