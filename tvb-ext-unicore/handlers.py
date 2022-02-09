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
        self.finish(json.dumps(['DAINT-CSCS', 'JUSUF', 'JURECA']))


class JobsHandler(APIHandler):
class SitesHandler(APIHandler):
    pass

class JobsHandler(APIHandler):
    CURRENT_JOBS = UnicoreWrapper('DAINT-CSCS').get_jobs()

    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        """
        Retrieve all jobs for current user.
        """
        all_jobs = UnicoreWrapper('DAINT-CSCS').get_jobs()
        self.CURRENT_JOBS = all_jobs
        self.finish(json.dumps({'jobs': [job.to_json() for job in all_jobs]}))

    @tornado.web.authenticated
    def post(self):
        """
        Cancel the job corresponding to the id sent as post param.
        """
        post_params = self.get_json_body()
        job_id = post_params["id"]

        current_job = None

        unicore_wrapper = UnicoreWrapper('DAINT-CSCS')
        all_jobs = self.CURRENT_JOBS
        for job in all_jobs:
            if job.id == job_id:
                current_job = job

        LOGGER.info(f"Cancelling job at URL: {job_id}")
        is_canceled = unicore_wrapper.cancel_job(current_job.resource_url)

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
