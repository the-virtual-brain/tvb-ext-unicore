# -*- coding: utf-8 -*-
#
# "TheVirtualBrain - Widgets" package
#
# (c) 2022-2023, TVB Widgets Team
#
import io
import json
import shutil
import enum

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
from tornado.web import MissingArgumentError

from tvbextunicore.exceptions import SitesDownException, FileNotExistsException, JobRunningException
from tvbextunicore.unicore_wrapper.unicore_wrapper import UnicoreWrapper
from tvbextunicore.drive_wrapper.drive_wrapper import DriveWrapper
from tvbextunicore.logger.builder import get_logger

LOGGER = get_logger(__name__)


class DownloadStatus(str, enum.Enum):  # inherit str for json serialization
    """
    Describes the status of a file download attempt
    """
    WARNING = 'warning'
    ERROR = 'error'
    SUCCESS = 'success'


class SitesHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        LOGGER.info(f"Retrieving sites...")
        message = ''
        try:
            sites = UnicoreWrapper().get_sites()
        except SitesDownException as e:
            sites = list()
            message = e.message
        self.finish(json.dumps({'sites': sites, 'message': message}))


class JobsHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        """
        Retrieve all jobs for current user, launched at site given as POST param.
        """
        try:
            site = self.get_argument("site")
            page = int(self.get_argument("page", "0")) - 1
            LOGGER.info(f"Retrieving jobs (page {page}) for site {site}...")
        except MissingArgumentError:
            site = 'DAINT-CSCS'
            LOGGER.warn(f"No site has been found in query params, defaulting to {site}...")

        all_jobs, message = UnicoreWrapper().get_jobs(site, page)

        self.finish(json.dumps({'jobs': [job.to_json() for job in all_jobs], 'message': message}))

    @tornado.web.authenticated
    def post(self):
        """
        Cancel the job corresponding to the id sent as post param.
        """
        post_params = self.get_json_body()
        job_url = post_params["resource_url"]

        LOGGER.info(f"Cancelling job at URL: {job_url}")
        is_canceled, job = UnicoreWrapper().cancel_job(job_url)

        if not is_canceled:
            resp = {'message': 'Job could not be cancelled!'}
        else:
            resp = {'job': job.to_json(), 'message': ''}

        self.finish(json.dumps(resp))


class JobOutputHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        try:
            job_url = self.get_argument("job_url")
            output = UnicoreWrapper().get_job_output(f'{job_url}')
            self.finish(json.dumps(output))
        except MissingArgumentError:
            self.set_status(400)
            self.finish(json.dumps({'message': 'Can\'t access job outputs: No job url provided!'}))


class DownloadHandler(APIHandler):
    @tornado.web.authenticated
    def get(self, job_url, file):
        try:
            response = UnicoreWrapper().download_file(job_url, file)
        except FileNotExistsException as e:
            response = {'success': False, 'message': e.message}

        self.finish(json.dumps(response))


class DownloadStreamHandler(APIHandler):
    @tornado.web.authenticated
    def get(self, job_url, file):
        try:
            response = UnicoreWrapper().stream_file(job_url, file).data
            self.set_header('Accept', 'application/octet-stream')
        except FileNotExistsException as e:
            self.set_status(400)
            response = json.dumps({'success': False, 'message': e.message})

        self.finish(response)


def try_move(from_path, to_path):
    # type: (str, str) -> bool
    """
    helper function to move a file
    if to_path is empty string the file will not be moved assuming that is already where it
    is supposed to be
    """
    if to_path == '':
        return True
    try:
        shutil.move(rf'{from_path}', rf'{to_path}')  # r to avoid error ‘unicodeescape’ codec can’t decode bytes
        return True
    except (shutil.Error, IOError) as e:
        LOGGER.error(e)
        return False


class DriveHandler(APIHandler):
    @tornado.web.authenticated
    def get(self, job_url, file):
        try:
            path = self.get_argument("path")
        except MissingArgumentError:
            path = ''
        LOGGER.info('Downloading file from unicore')
        unicore_wrapper = UnicoreWrapper()
        try:
            bytes_file = unicore_wrapper.stream_file(job_url, file).data
        except FileNotExistsException as e:
            self.set_status(400)
            self.finish(json.dumps({'success': False, 'message': e.message}))
            return
        file_obj = io.BytesIO(bytes_file)
        LOGGER.info('INIT DRIVE')
        drive = DriveWrapper(token=unicore_wrapper.transport.auth_token)
        LOGGER.info('UPLOADING TO DRIVE')
        drive.upload_to_repo(path, file_obj, file)
        self.finish(json.dumps({'message': 'Downloaded to drive!'}))

    @tornado.web.authenticated
    def post(self, *args):
        status, message = DownloadStatus.SUCCESS, ''
        post_params = self.get_json_body()
        try:
            path = post_params['path']
            file = post_params['file']
            job_url = post_params['job_url']
        except KeyError as e:
            LOGGER.error(e)
            self.set_status(400, 'Request body missing required params!')
            self.finish()
            return
        LOGGER.info('Downloading file from unicore using local download')
        unicore_wrapper = UnicoreWrapper()
        with open(file, 'wb') as f:
            try:
                message = unicore_wrapper.download_file(job_url, file, f)
            except FileNotExistsException as e:
                LOGGER.error(e)
                status, message = DownloadStatus.ERROR, e.message
            except JobRunningException as e:
                LOGGER.warning(e)
                status, message = DownloadStatus.WARNING, e.message
        LOGGER.info(f'MOVING FILE TO {path}')
        moved = try_move(file, path)
        if not moved:
            status, message = DownloadStatus.ERROR, f'Can\'t move file to location {path}'
        self.finish(json.dumps({'status': status, 'message': message}))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    sites_pattern = url_path_join(base_url, "tvbextunicore", "sites")
    jobs_pattern = url_path_join(base_url, "tvbextunicore", "jobs")
    output_pattern = url_path_join(base_url, "tvbextunicore", "job_output")
    download_pattern = url_path_join(base_url, "tvbextunicore", r"download/([^/]+)?/([^/]+)?")
    stream_pattern = url_path_join(base_url, "tvbextunicore", r"stream/([^/]+)?/([^/]+)?")
    drive_pattern = url_path_join(base_url, "tvbextunicore", r"drive/([^/]+)?/([^/]+)?")
    handlers = [
        (jobs_pattern, JobsHandler),
        (sites_pattern, SitesHandler),
        (output_pattern, JobOutputHandler),
        (download_pattern, DownloadHandler),
        (stream_pattern, DownloadStreamHandler),
        (drive_pattern, DriveHandler)
    ]
    web_app.add_handlers(host_pattern, handlers)
