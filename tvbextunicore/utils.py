# -*- coding: utf-8 -*-
#
# "TheVirtualBrain - Widgets" package
#
# (c) 2022-2023, TVB Widgets Team
#

import json
import enum
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
