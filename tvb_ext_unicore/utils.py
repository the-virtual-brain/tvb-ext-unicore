# -*- coding: utf-8 -*-
#
# "TheVirtualBrain - Widgets" package
#
# (c) 2022-2025, TVB Widgets Team
#

import json
import enum
import os

from jupyter_core.paths import jupyter_config_dir
from tvb_ext_unicore.logger.builder import get_logger
from pyunicore.client import _HBP_REGISTRY_URL

LOGGER = get_logger(__name__)


class DownloadStatus(str, enum.Enum):  # inherit str for json serialization
    """
    Describes the status of a file download attempt
    """
    WARNING = 'warning'
    ERROR = 'error'
    SUCCESS = 'success'


def get_user_settings():
    data_dir = jupyter_config_dir()  # path to jupyter configs folder; usually it's $HOME/.jupyter
    # path to user-settings for this extension
    settings_path = os.path.join(data_dir, 'lab', 'user-settings', 'tvb-ext-unicore', 'settings.jupyterlab-settings')
    if os.path.exists(settings_path):
        with open(settings_path, 'r', encoding='utf-8') as f:
            settings = json.load(f)
    else:
        settings = {}

    return settings


def get_registry():
    user_settings = get_user_settings()
    registry = user_settings.get('registry', _HBP_REGISTRY_URL)  # if registry is not set, use a default value
    return registry


def build_response(status, message):
    # type: (DownloadStatus, str) -> str
    """
    function to build a response as json string
    """
    return json.dumps({'status': status, 'message': message})
