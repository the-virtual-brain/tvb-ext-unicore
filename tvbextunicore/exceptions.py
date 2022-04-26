# -*- coding: utf-8 -*-
#
# "TheVirtualBrain - Widgets" package
#
# (c) 2022-2023, TVB Widgets Team
#

class TVBExtUnicoreException(Exception):

    def __init__(self, message):
        super().__init__(message)
        self.message = str(message)

    def __str__(self):
        return self.message


class ClientAuthException(TVBExtUnicoreException):
    """
    Throw if the current user does not have access to chosen client site.
    """


class SitesDownException(TVBExtUnicoreException):
    """
    Throw if the sites cannot be retrieved due to a Pyunicore error.
    """


class FileNotExistsException(TVBExtUnicoreException):
    """
    Throw if trying to access a file that doesn't exist
    """


class JobRunningException(TVBExtUnicoreException):
    """
    Throw if trying to download files of a running job
    """