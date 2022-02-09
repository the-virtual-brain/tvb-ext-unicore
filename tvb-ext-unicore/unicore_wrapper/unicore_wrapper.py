# -*- coding: utf-8 -*-
#
# "TheVirtualBrain - Widgets" package
#
# (c) 2022-2023, TVB Widgets Team
#

import os

import clb_nb_utils.oauth as clb_oauth
import pyunicore.client as unicore_client
from requests.exceptions import ConnectionError

from ..exceptions import TVBExtUnicoreException
from ..logger.builder import get_logger
from .job_dto import JobDTO

LOGGER = get_logger(__name__)

NAME = 'name'
MOUNT_POINT = 'mountPoint'
TERMINATION_TIME = 'terminationTime'
SUBMISSION_TIME = 'submissionTime'
STATUS = 'status'
SITE_NAME = 'siteName'
OWNER = 'owner'


class UnicoreWrapper(object):

    def __init__(self, site):
        token = self.__retrieve_token()
        self.client = self.__build_client(site, token)

    def __retrieve_token(self):
        try:
            token = clb_oauth.get_token()
        except ConnectionError as e:
            LOGGER.warn(f"Could not connect to EBRAINS to retrieve an auth token: {e}")
            LOGGER.info("Will try to use the auth token defined by environment variable AUTH_TOKEN...")

            token = os.environ.get('AUTH_TOKEN')
            if token is None:
                LOGGER.error("No auth token defined as environment variable AUTH_TOKEN! Please define one!")
                raise TVBExtUnicoreException("Cannot connect to EBRAINS HPC without an auth token! Either run this on "
                                          "Collab, or define the AUTH_TOKEN environment variable!")

            LOGGER.info("Successfully retrieved the auth token from environment variable AUTH_TOKEN!")
        return token

    def __build_client(self, site, token):
        transport = unicore_client.Transport(token, oidc=True)
        sites = unicore_client.get_sites(transport)
        site_url = sites.get(site)

        if site_url is None:
            raise AttributeError(f'Requested HPC site: {site}, does not exist!')

        client = unicore_client.Client(transport, site_url)

        return client

    def get_jobs(self):
        # type: () -> list
        """
        Retrieve the all jobs started by the current user at the selected site and return them in a list.
        """
        jobs_list = list()

        # TODO: use pagination
        all_jobs = self.client.get_jobs()

        for job in all_jobs:
            jobs_list.append(JobDTO(job.job_id,
                                    job.properties.get(NAME),
                                    job.properties.get(OWNER),
                                    job.properties.get(SITE_NAME),
                                    job.properties.get(STATUS),
                                    job.properties.get(SUBMISSION_TIME),
                                    job.properties.get(TERMINATION_TIME),
                                    job.working_dir.properties.get(MOUNT_POINT),
                                    job.resource_url))
        return jobs_list

    def cancel_job(self, job_url):
        # type: (str) -> bool
        """
        Abort HPC job accessible at the given URL.
        """
        if job_url is None:
            LOGGER.error("Cannot abort job as URL has not been provided!")
            return False

        job = unicore_client.Job(self.client.transport, job_url)
        if job.is_running():
            job.abort()
            LOGGER.info(f"Aborted job {job.job_id} from URL: {job_url}")
        else:
            LOGGER.info(f"Job {job.job_id} already finished, no need to abort, URL: {job_url}")
        return True