from ._version import __version__
from .handlers import setup_handlers



def _jupyter_labextension_paths():
    return [{
        "src": "labextension",
        "dest": "tvbextunicore"
    }]



def _jupyter_server_extension_points():
    return [{
        "module": "tvbextunicore"
    }]


def _load_jupyter_server_extension(server_app):
    """Registers the API handler to receive HTTP requests from the frontend extension.

    Parameters
    ----------
    server_app: jupyterlab.labapp.LabApp
        JupyterLab application instance
    """
    setup_handlers(server_app.web_app)
    server_app.log.info("Registered tvbextunicore server extension")


# For backward compatibility with notebook server - useful for Binder/JupyterHub
load_jupyter_server_extension = _load_jupyter_server_extension

