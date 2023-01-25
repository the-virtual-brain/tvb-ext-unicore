# -*- coding: utf-8 -*-
#
# "TheVirtualBrain - Widgets" package
#
# (c) 2022-2023, TVB Widgets Team
#

import json
import os
import pytest
from datetime import datetime

from tvbextunicore.exceptions import TVBExtUnicoreException, SitesDownException, \
    FileNotExistsException, JobRunningException
from tvbextunicore.unicore_wrapper.unicore_wrapper import UnicoreWrapper
from tvbextunicore.unicore_wrapper.job_dto import JobDTO, NAME, OWNER, SITE_NAME, STATUS, SUBMISSION_TIME, \
    TERMINATION_TIME, \
    MOUNT_POINT
from tvbextunicore.utils import build_response, DownloadStatus

GET_JOB = 'tvbextunicore.unicore_wrapper.unicore_wrapper.UnicoreWrapper.get_job'
SHUTIL_MOVE = 'shutil.move'
DOWNLOAD_MESSAGE = 'Downloaded successfully!'


class MockFilePath:
    def __init__(self, is_file=True):
        self.is_file = is_file

    def isfile(self):
        """
        mock method
        Returns
        -------

        """
        return self.is_file

    def download(self, file):
        """
        mock method
        Parameters
        ----------
        file

        Returns
        -------

        """
        pass

    def raw(self, offset=0, size=-1):
        """
        mock method
        Parameters
        ----------
        offset
        size

        Returns
        -------

        """
        return b'test'


class WorkingDirMock:
    def __init__(self, dirs={}):
        self.dirs = dirs or {
            'file1': MockFilePath(),
            'dir1': MockFilePath(is_file=False)
        }

    def listdir(self, subdir=''):
        return self.dirs


class MockPyUnicoreJob:
    def __init__(self, job_url='test', isrunning=False, job_id='test'):
        self.job_url = job_url
        self.job_id = job_id
        self.working_dir = WorkingDirMock()
        self.isrunning = isrunning

    def is_running(self):
        return self.isrunning


class MockPyunicoreRegistry:
    def __init__(self, transport, url, *args, **kwargs):
        self.transport = transport
        self.url = url
        self.site_urls = ['TEST_SITE1', 'TEST_SITE2']


class MockPyunicoreRegistryWithE:
    def __init__(self, transport, url, *args, **kwargs):
        self.transport = transport
        self.url = url

    @property
    def site_urls(self):
        raise AttributeError


class MockPyUnicoreResource(object):
    def __init__(self, job_id, properties, working_dir=None, resource_url=None):
        self.job_id = job_id
        self.properties = properties
        self.working_dir = working_dir
        self.resource_url = resource_url


class MockPyUnicoreClient(object):

    def __generate_list_of_jobs(self):
        jobs = list()
        wd_properties = {MOUNT_POINT: 'test_folder'}
        working_dir = MockPyUnicoreResource('0', wd_properties)

        properties = {NAME: 'test_job', OWNER: 'test_user', SITE_NAME: 'TEST_SITE', STATUS: 'QUEUED',
                      SUBMISSION_TIME: '2022-02-10T10:30:45+0100', TERMINATION_TIME: '2022-02-10T13:30:45+0100'}

        job = MockPyUnicoreResource('100', properties, working_dir, 'test/url')
        jobs.append(job)

        return jobs

    def get_jobs(self, offset, num):
        return self.__generate_list_of_jobs()


def test_get_jobs(mocker):
    os.environ['CLB_AUTH'] = "test_auth_token"

    def mockk(self, site=''):
        return MockPyUnicoreClient()

    mocker.patch('tvbextunicore.unicore_wrapper.unicore_wrapper.UnicoreWrapper._UnicoreWrapper__build_client', mockk)
    unicore_wrapper = UnicoreWrapper()
    jobs, msg = unicore_wrapper.get_jobs('TEST_SITE')

    assert len(jobs) == 1
    assert len(msg) == 0
    assert isinstance(jobs[0], JobDTO)
    assert isinstance(jobs[0].start_time, datetime)
    assert isinstance(jobs[0].finish_time, datetime)


def test_get_jobs_exception_at_sites(mocker):
    os.environ['CLB_AUTH'] = "test_auth_token"
    exception_msg = 'Test message!'

    def mockk(self, site=''):
        raise SitesDownException(exception_msg)

    mocker.patch('tvbextunicore.unicore_wrapper.unicore_wrapper.UnicoreWrapper._UnicoreWrapper__build_client', mockk)
    unicore_wrapper = UnicoreWrapper()
    jobs, msg = unicore_wrapper.get_jobs('TEST_SITE')

    assert jobs is not None
    assert len(jobs) == 0
    assert msg == exception_msg


def test_get_jobs_failed_auth():
    os.environ.pop('CLB_AUTH')
    with pytest.raises(TVBExtUnicoreException):
        UnicoreWrapper()


def test_get_jobs_wrong_site():
    os.environ['CLB_AUTH'] = "test_auth_token"
    with pytest.raises(AttributeError):
        UnicoreWrapper().get_jobs('TEST_SITE')


def test_get_sites(mocker):
    os.environ['CLB_AUTH'] = "test_auth_token"

    mocker.patch('pyunicore.client.Registry', MockPyunicoreRegistry)

    sites = UnicoreWrapper().get_sites()
    assert sites is not None
    assert len(sites) == 2


def test_get_sites_exception(mocker):
    os.environ['CLB_AUTH'] = "test_auth_token"

    mocker.patch('pyunicore.client.Registry', MockPyunicoreRegistryWithE)

    with pytest.raises(SitesDownException):
        UnicoreWrapper().get_sites()


def test_get_job_output(mocker):
    os.environ['CLB_AUTH'] = "test_auth_token"

    def mockk(self, job_url):
        return MockPyUnicoreJob(job_url)

    mocker.patch(GET_JOB, mockk)
    job_output = UnicoreWrapper().get_job_output('test')
    expected = {
        'file1': {'is_file': True},
        'dir1': {'is_file': False}
    }

    assert job_output == expected


def test_download_file_fails_when_job_is_running(mocker):
    def mockk(self, job_url):
        return MockPyUnicoreJob(job_url=job_url, isrunning=True)

    mocker.patch(GET_JOB, mockk)
    test_file, job_url = 'test_file', 'test_url'
    with pytest.raises(JobRunningException):
        UnicoreWrapper().download_file(job_url, test_file)


def test_download_file_fails_when_file_doesnt_exist(mocker):
    def mockk(self, job_url):
        return MockPyUnicoreJob(job_url=job_url)

    mocker.patch(GET_JOB, mockk)
    test_file, job_url = 'test_file', 'test_url'
    with pytest.raises(FileNotExistsException):
        UnicoreWrapper().download_file(job_url, test_file)


def test_download_file_success(mocker):
    def mockk(self, job_url):
        return MockPyUnicoreJob(job_url=job_url)

    mocker.patch(GET_JOB, mockk)
    test_file, job_url = 'file1', 'file1'
    assert UnicoreWrapper().download_file(job_url, test_file) == DOWNLOAD_MESSAGE


def test_download_stream_fails_when_job_is_running(mocker):
    def mockk(self, job_url):
        return MockPyUnicoreJob(job_url=job_url, isrunning=True)

    mocker.patch(GET_JOB, mockk)
    with pytest.raises(FileNotExistsException):
        UnicoreWrapper().stream_file('test_url', 'test_file')


def test_download_stream_fails_when_file_doesnt_exist(mocker):
    def mockk(self, job_url):
        return MockPyUnicoreJob(job_url=job_url)

    mocker.patch(GET_JOB, mockk)
    with pytest.raises(FileNotExistsException):
        UnicoreWrapper().stream_file('test_url', 'test_file')


def test_download_stream_success(mocker):
    def mockk(self, job_url):
        return MockPyUnicoreJob(job_url=job_url)

    mocker.patch(GET_JOB, mockk)
    assert UnicoreWrapper().stream_file('file1', 'file1') == b'test'


def test_build_response(mocker):
    mocker.patch(SHUTIL_MOVE, lambda x, y: True)
    status, message = DownloadStatus.SUCCESS, 'Downloaded'
    assert build_response(status, message) == json.dumps({'status': status, 'message': message})
