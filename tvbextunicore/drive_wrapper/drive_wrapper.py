# -*- coding: utf-8 -*-
#
# "TheVirtualBrain - Widgets" package
#
# (c) 2022-2023, TVB Widgets Team
#
import re

from io import BytesIO

from ebrains_drive.client import DriveApiClient
from ebrains_drive.files import SeafDir
from ebrains_drive.repo import Repo

from tvbextunicore.logger.builder import get_logger

LOGGER = get_logger(__name__)


class DriveWrapper(object):
    def __init__(self, token=None):
        self.token = token
        self.client = self.__build_client()

    def __build_client(self):
        try:
            client = DriveApiClient(token=self.token)
        except Exception as e:
            LOGGER.error(f"Failed to build Drive client: {e}")
            raise ConnectionError('Failed to build Drive client')
        return client

    @staticmethod
    def get_dir_from_path(repo, path):
        # type: (Repo, str) -> SeafDir

        path_from_repo = '/' + '/'.join(path.split('/')[path.split('/').index(repo.name) + 1:])
        LOGGER.info('Getting dir from repo')
        return repo.get_dir(path_from_repo)

    @staticmethod
    def get_upload_link_from_dir(seaf_dir):
        # type: (SeafDir) -> str
        url = '/api2/repos/%s/upload-link/?p=%s' % (seaf_dir.repo.id, seaf_dir.path)
        resp = seaf_dir.client.get(url)
        return re.match(r'"(.*)"', resp.text).group(1)

    def get_repo_from_path(self, path):
        # type: (str) -> Repo | None

        path_parts = path.split('/')
        repos = self.client.repos.list_repos()
        assert repos, 'No repos found!'
        for part in path_parts:
            for repo in repos:
                if part == repo.name:
                    return repo
        return None

    def get_upload_link(self, path):
        # type: (str) -> str
        repo = self.get_repo_from_path(path)
        target_dir = self.get_dir_from_path(repo, path)
        return self.get_upload_link_from_dir(target_dir)

    def upload_to_repo(self, path_to_dir, file, filename):
        # type: (str, BytesIO, str) -> None
        LOGGER.info('Uploading to drive...')
        repo = self.get_repo_from_path(path_to_dir)
        assert repo is not None
        target_dir = self.get_dir_from_path(repo, path_to_dir)
        res = target_dir.upload(fileobj=file, filename=filename)
        return res
