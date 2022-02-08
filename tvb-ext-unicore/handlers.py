import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado


class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
        self.finish(json.dumps({
            "jobs": [
                {
                    "id": "10cb8cd2-200a-442d-b3ae-46e3f7aa0bac",
                    "name": "UNICORE_Job",
                    "owner": "paula.popa@codemart.ro",
                    "site": "DAINT-CSCS",
                    "status": "FAILED",
                    "start_time": "2022-02-07 16:43:03.010000",
                    "finish_time": "2022-03-09 16:43:02.010000",
                    "working_dir": "/scratch/snx3000/unicore/FILESPACE/10cb8cd2-200a-442d-b3ae-46e3f7aa0bac/",
                    "resource_url": "https://brissago.cscs.ch:8080/DAINT-CSCS/rest/core/jobs/10cb8cd2-200a-442d-b3ae-46e3f7aa0bac"
                },
                {
                    "id": "1d7c6939-0fe5-4d56-b7af-898b470e99f7",
                    "name": "UNICORE_Job",
                    "owner": "paula.popa@codemart.ro",
                    "site": "DAINT-CSCS",
                    "status": "FAILED",
                    "start_time": "2022-02-07 16:43:54.010000",
                    "finish_time": "2022-03-09 16:43:54.010000",
                    "working_dir": "/scratch/snx3000/unicore/FILESPACE/1d7c6939-0fe5-4d56-b7af-898b470e99f7/",
                    "resource_url": "https://brissago.cscs.ch:8080/DAINT-CSCS/rest/core/jobs/1d7c6939-0fe5-4d56-b7af-898b470e99f7"
                },
                {
                    "id": "20bcca59-4294-41f3-bba7-56ce95cb384d",
                    "name": "UNICORE_Job",
                    "owner": "paula.popa@codemart.ro",
                    "site": "DAINT-CSCS",
                    "status": "SUCCESSFUL",
                    "start_time": "2022-02-07 16:15:07.010000",
                    "finish_time": "2022-03-09 16:15:06.010000",
                    "working_dir": "/scratch/snx3000/unicore/FILESPACE/20bcca59-4294-41f3-bba7-56ce95cb384d/",
                    "resource_url": "https://brissago.cscs.ch:8080/DAINT-CSCS/rest/core/jobs/20bcca59-4294-41f3-bba7-56ce95cb384d"
                },
                {
                    "id": "278ca5bb-7444-476d-980f-7ccc0e334239",
                    "name": "UNICORE_Job",
                    "owner": "paula.popa@codemart.ro",
                    "site": "DAINT-CSCS",
                    "status": "SUCCESSFUL",
                    "start_time": "2022-02-07 17:00:52.010000",
                    "finish_time": "2022-03-09 17:00:52.010000",
                    "working_dir": "/scratch/snx3000/unicore/FILESPACE/278ca5bb-7444-476d-980f-7ccc0e334239/",
                    "resource_url": "https://brissago.cscs.ch:8080/DAINT-CSCS/rest/core/jobs/278ca5bb-7444-476d-980f-7ccc0e334239"
                },
                {
                    "id": "5432f433-8a0a-4a7b-9357-8320f41a5c51",
                    "name": "UNICORE_Job",
                    "owner": "paula.popa@codemart.ro",
                    "site": "DAINT-CSCS",
                    "status": "FAILED",
                    "start_time": "2022-02-07 12:47:34.010000",
                    "finish_time": "2022-03-09 12:47:34.010000",
                    "working_dir": "/scratch/snx3000/unicore/FILESPACE/5432f433-8a0a-4a7b-9357-8320f41a5c51/",
                    "resource_url": "https://brissago.cscs.ch:8080/DAINT-CSCS/rest/core/jobs/5432f433-8a0a-4a7b-9357-8320f41a5c51"
                },
                {
                    "id": "9622141a-42d1-432d-882b-808db5568c33",
                    "name": "UNICORE_Job",
                    "owner": "paula.popa@codemart.ro",
                    "site": "DAINT-CSCS",
                    "status": "SUCCESSFUL",
                    "start_time": "2022-02-07 16:56:42.010000",
                    "finish_time": "2022-03-09 16:56:42.010000",
                    "working_dir": "/scratch/snx3000/unicore/FILESPACE/9622141a-42d1-432d-882b-808db5568c33/",
                    "resource_url": "https://brissago.cscs.ch:8080/DAINT-CSCS/rest/core/jobs/9622141a-42d1-432d-882b-808db5568c33"
                },
                {
                    "id": "d0d69e82-c56b-42d0-88ad-3344f99f579a",
                    "name": "UNICORE_Job",
                    "owner": "paula.popa@codemart.ro",
                    "site": "DAINT-CSCS",
                    "status": "FAILED",
                    "start_time": "2022-02-07 16:55:50.010000",
                    "finish_time": "2022-03-09 16:55:50.010000",
                    "working_dir": "/scratch/snx3000/unicore/FILESPACE/d0d69e82-c56b-42d0-88ad-3344f99f579a/",
                    "resource_url": "https://brissago.cscs.ch:8080/DAINT-CSCS/rest/core/jobs/d0d69e82-c56b-42d0-88ad-3344f99f579a"
                }
            ]
        }))


def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "tvb-ext-unicore", "get_example")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)
