# -*- coding: utf-8 -*-
#
# "TheVirtualBrain - Widgets" package
#
# (c) 2022-2023, TVB Widgets Team
#

from datetime import datetime

NAME = 'name'
MOUNT_POINT = 'mountPoint'
TERMINATION_TIME = 'terminationTime'
SUBMISSION_TIME = 'submissionTime'
STATUS = 'status'
SITE_NAME = 'siteName'
OWNER = 'owner'
LOGS = 'log'


class JobDTO(object):

    def __init__(self, id, name, user, site, status, start_time, finish_time, working_dir, resource_url, logs):
        self.id = id
        self.name = name
        self.owner = self.__strip_prefix(user)
        self.site = site
        self.status = status
        self.start_time = self.__format_datetime(start_time)
        self.finish_time = self.__format_datetime(finish_time)
        self.working_dir = working_dir
        self.resource_url = resource_url
        self.logs = logs

    def __str__(self):
        return f"{type(self)}: id={self.id}, name={self.name}, owner={self.owner}, site={self.site}, " \
               f"status={self.status}, start time={self.start_time}, finish time={self.finish_time}," \
               f"working dir={self.working_dir}, resource_url={self.resource_url}"

    def __strip_prefix(self, username):
        prefix = "UID="
        username = username[len(prefix):]
        return username

    def __format_datetime(self, datetime_str):
        date = datetime.strptime(datetime_str, '%Y-%m-%dT%H:%M:%S+%f')
        return date

    def to_json(self):
        attrs = vars(self)
        attrs['start_time'] = self.start_time.strftime("%m.%d.%Y, %H:%M:%S")
        attrs['finish_time'] = self.finish_time.strftime("%m.%d.%Y, %H:%M:%S")
        attrs['is_cancelable'] = self.is_cancelable
        return attrs

    @property
    def is_cancelable(self):
        finished_status = ['SUCCESSFUL', 'FAILED']
        return self.status not in finished_status

    @staticmethod
    def from_unicore_job(job):
        return JobDTO(job.job_id,
                      job.properties.get(NAME),
                      job.properties.get(OWNER),
                      job.properties.get(SITE_NAME),
                      job.properties.get(STATUS),
                      job.properties.get(SUBMISSION_TIME),
                      job.properties.get(TERMINATION_TIME),
                      job.working_dir.properties.get(MOUNT_POINT),
                      job.resource_url,
                      job.properties.get(LOGS))

    def execution_time(self):
        # TODO: Termination time is always the same, how to compute real execution time?
        pass
