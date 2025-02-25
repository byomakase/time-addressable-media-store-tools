import json
import os
import re
from datetime import datetime

import boto3
import requests
from openid_auth import Credentials

s3 = boto3.resource("s3")
ssm = boto3.client("ssm")
endpoint = os.environ["TAMS_ENDPOINT"]
creds = Credentials(
    token_url=os.environ["TOKEN_URL"],
    user_pool_id=os.environ["USER_POOL_ID"],
    client_id=os.environ["CLIENT_ID"],
    scopes=["tams-api/write"],
)


def upload_file(bucket, key, flow_id):
    get_url = requests.post(
        f"{endpoint}/flows/{flow_id}/storage",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {creds.token()}",
        },
        data=json.dumps({"limit": 1}),
        timeout=30,
    )
    get_url.raise_for_status()
    print(get_url.status_code)
    media_object = get_url.json()["media_objects"][0]
    s3_object = s3.Object(bucket, key)
    put_file = requests.put(
        media_object["put_url"]["url"],
        headers={"Content-Type": media_object["put_url"]["content-type"]},
        data=s3_object.get()["Body"].read(),
        timeout=30,
    )
    put_file.raise_for_status()
    print(put_file.status_code)
    return media_object


def post_segment(flow_id, object_id, timerange):
    segment = {
        "object_id": object_id,
        "timerange": timerange,
    }
    print(json.dumps(segment))
    response = requests.post(
        f"{endpoint}/flows/{flow_id}/segments",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {creds.token()}",
        },
        data=json.dumps(segment),
        timeout=30,
    )
    response.raise_for_status()
    print(response.status_code)


# pylint: disable=unused-argument
def lambda_handler(event, context):
    print(json.dumps(event))
    # Ignore event if file is empty
    if event["detail"]["object"]["size"] == 0:
        return
    bucket = event["detail"]["bucket"]["name"]
    key = event["detail"]["object"]["key"]
    # Ignore event if file is an m3u8 file
    if key.split(".")[-1] == "m3u8":
        return
    match = re.match(r".*_(?P<file_no>\d{5})\.[^\.]+$", key)
    # Ignore event if it does not match this pattern (written to exclude temporary files)
    if not match:
        return
    file_no = int(match.groupdict()["file_no"])
    key_split = key.split("/")
    key_split[-1] = key.split("/")[-1].split("_")[0]
    parameter_name = f'/{bucket}/{"/".join(key_split)}'
    get_parameter = ssm.get_parameter(Name=parameter_name)
    mappings = json.loads(get_parameter["Parameter"]["Value"])
    segment_size = mappings["segment_length"]
    if mappings["use_start_epoch"]:
        if file_no == 1 and "start_epoch" not in mappings:
            mappings["start_epoch"] = int(
                datetime.strptime(event["time"], "%Y-%m-%dT%H:%M:%SZ").timestamp()
            )
            ssm.put_parameter(
                Name=parameter_name,
                Type="String",
                Value=json.dumps(mappings),
                Overwrite=True,
            )
        if "start_epoch" not in mappings:
            print(
                "start_epoch not found in SSM parameter therefore unable to ingest segment"
            )
            return
        start_epoch = mappings["start_epoch"]
        end_timerange = start_epoch + (file_no * segment_size)
    else:
        end_timerange = file_no * segment_size
    flow_id = [v for k, v in mappings.items() if key.startswith(k)][0]
    object_id = upload_file(bucket, key, flow_id)["object_id"]
    timerange = f"[{end_timerange - segment_size}:0_{end_timerange}:0)"
    post_segment(flow_id, object_id, timerange)
