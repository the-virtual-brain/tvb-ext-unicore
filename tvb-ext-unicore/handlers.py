import json
import os

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado
from .unicore_wrapper.unicore_wrapper import UnicoreWrapper
from .logger.builder import get_logger

LOGGER = get_logger(__name__)


class SitesHandler(APIHandler):
    @tornado.web.authenticated
    def get(self):
        sites = UnicoreWrapper().get_sites()
        self.finish(json.dumps([site_name for site_name in sites]))


class JobsHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        """
        Retrieve all jobs for current user, launched at site given as POST param.
        """
        # TODO: get site from request
        all_jobs = UnicoreWrapper().get_jobs('DAINT-CSCS')
        self.finish(json.dumps({'jobs': [job.to_json() for job in all_jobs]}))

    @tornado.web.authenticated
    def post(self):
        """
        Cancel the job corresponding to the id sent as post param.
        """
        post_params = self.get_json_body()
        job_url = post_params["job_url"]

        LOGGER.info(f"Cancelling job at URL: {job_url}")
        is_canceled = UnicoreWrapper().cancel_job(current_job.resource_url)

        if not is_canceled:
            self.finish(json.dumps({'message': f'Job {job_id} could not be cancelled!'}))

        self.finish(json.dumps({'message': f'Job {job_id} has been cancelled!'}))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    sites_pattern = url_path_join(base_url, "tvb-ext-unicore", "sites")
    jobs_pattern = url_path_join(base_url, "tvb-ext-unicore", "jobs")
    handlers = [(jobs_pattern, JobsHandler), (sites_pattern, SitesHandler)]
    web_app.add_handlers(host_pattern, handlers)
