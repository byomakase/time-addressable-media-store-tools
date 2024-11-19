import os
from collections import deque
from http import HTTPStatus

import requests
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import (
    APIGatewayRestResolver,
    CORSConfig,
    Response,
)
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext
from openid_auth import Credentials

tracer = Tracer()
logger = Logger()
app = APIGatewayRestResolver(cors=CORSConfig())

endpoint = os.environ["TAMS_ENDPOINT"]
creds = Credentials(
    token_url=os.environ["TOKEN_URL"],
    user_pool_id=os.environ["USER_POOL_ID"],
    client_id=os.environ["CLIENT_ID"],
    scopes=["tams-api/read"],
)


@tracer.capture_method(capture_response=False)
def get_flow(flow_id):
    get = requests.get(
        f"{endpoint}/flows/{flow_id}?include_timerange=true",
        headers={
            "Authorization": f"Bearer {creds.token()}",
        },
        timeout=30,
    )
    get.raise_for_status()
    return get.json()


@tracer.capture_method(capture_response=False)
def get_flows(source_id):
    get = requests.get(
        f"{endpoint}/flows?source_id={source_id}",
        headers={
            "Authorization": f"Bearer {creds.token()}",
        },
        timeout=30,
    )
    get.raise_for_status()
    return get.json()


@tracer.capture_method(capture_response=False)
def get_source(source_id):
    get = requests.get(
        f"{endpoint}/sources/{source_id}",
        headers={
            "Authorization": f"Bearer {creds.token()}",
        },
        timeout=30,
    )
    get.raise_for_status()
    return get.json()


@tracer.capture_method(capture_response=False)
def get_tree(obj):
    entity_queue = deque([obj])
    nodes = {}
    while entity_queue:
        item = entity_queue.pop()
        if (item["type"], item["id"]) not in nodes:
            if item["type"] == "source":
                source = get_source(item["id"])
                nodes[(item["type"], item["id"])] = source
                if "collected_by" in source:
                    for c in source["collected_by"]:
                        entity_queue.append({"type": "source", "id": c})
                if "source_collection" in source:
                    for c in source["source_collection"]:
                        entity_queue.append({"type": "source", "id": c["id"]})
                for flow in get_flows(item["id"]):
                    entity_queue.append({"type": "flow", "id": flow["id"]})
            if item["type"] == "flow":
                flow = get_flow(item["id"])
                nodes[(item["type"], item["id"])] = flow
                entity_queue.append({"type": "source", "id": flow["source_id"]})
                if "collected_by" in flow:
                    for c in flow["collected_by"]:
                        entity_queue.append({"type": "flow", "id": c})
                if "flow_collection" in flow:
                    for c in flow["flow_collection"]:
                        entity_queue.append({"type": "flow", "id": c["id"]})
    return dict(
        sorted(
            sorted(nodes.items(), key=lambda item: item[1]["format"]),
            key=lambda item: item[0][0],
            reverse=True,
        )
    )


@app.get("/mermaid/<entity>/<entityId>")
@tracer.capture_method(capture_response=False)
def get_mermaid(entity: str, entityId: str):
    nodes = []
    links = []
    classDefs = {
        "source": {
            "style": "color:#000000,fill:#daa520,stroke:#FFFFFF,text-align:left",
            "nodes": [],
        },
        "flow": {
            "style": "color:#000000,fill:#f08080,stroke:#FFFFFF,text-align:left",
            "nodes": [],
        },
        "highlight": {
            "style": "stroke:#FF0000,stroke-width:5px",
            "nodes": [entityId],
        },
    }
    tree = get_tree({"type": entity[:-1], "id": entityId})
    for entity, data in tree.items():
        fields = [
            ("desc", "description"),
            ("label", "label"),
            ("updBy", "updated_by"),
        ]
        details = "<br>".join([f'{f[0]}: {data.get(f[1], "")}' for f in fields])
        tags = "<br>".join([f"tag: {k} = {v}" for k, v in data.get("tags", {}).items()])
        nodes.append(
            f'{entity[1]}("<center><b>&lt;&lt;{entity[0].title()}&gt;&gt;</b></center><br>id: {entity[1]}<br>type: {data["format"].split(":")[-1]}<br>{details}<br>{tags}")'
        )
        classDefs[entity[0]]["nodes"].append(entity[1])
        if "source_id" in data:
            links.append(
                (
                    entity[1],
                    " ",
                    data["source_id"],
                    0,
                )
            )
        for c in data.get("flow_collection", []):
            links.append(
                (
                    c["id"],
                    c["role"],
                    entity[1],
                    10,
                )
            )
        for c in reversed(data.get("source_collection", [])):
            links.append(
                (
                    c["id"],
                    c["role"],
                    entity[1],
                    2,
                )
            )
    mermaid = "\n".join(
        [
            "flowchart BT",
            *[f"  {node}" for node in nodes],
            *[f"  {link[0]} --> |{link[1]}| {link[2]}" for link in links],
            *[
                f"  linkStyle {n} stroke-dasharray:{link[3]}"
                for n, link in enumerate(links)
            ],
            *[f'  classDef {name} {data["style"]}' for name, data in classDefs.items()],
            *[
                f'  class {",".join(data["nodes"])} {name}'
                for name, data in classDefs.items()
            ],
        ]
    )
    return Response(
        status_code=HTTPStatus.OK.value,  # 200
        content_type="text/plain",
        body=mermaid,
    )


@logger.inject_lambda_context(
    log_event=True, correlation_id_path=correlation_paths.API_GATEWAY_REST
)
@tracer.capture_lambda_handler(capture_response=False)
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    return app.resolve(event, context)
