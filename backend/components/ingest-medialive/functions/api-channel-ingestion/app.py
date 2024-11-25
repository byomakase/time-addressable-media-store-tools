import json
from http import HTTPStatus

import boto3
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.event_handler import APIGatewayRestResolver, CORSConfig
from aws_lambda_powertools.logging import correlation_paths
from aws_lambda_powertools.utilities.typing import LambdaContext

tracer = Tracer()
logger = Logger()
app = APIGatewayRestResolver(cors=CORSConfig())

eb = boto3.client("events")
ml = boto3.client("medialive")
s3 = boto3.client("s3")


@tracer.capture_method(capture_response=False)
def get_existing(channel_id):
    list_rules = eb.list_rules(NamePrefix=f"{channel_id}-")["Rules"]
    if len(list_rules) == 0:
        return {}
    list_rules.sort(key=lambda k: int(k["Name"].split("-")[-1]))
    source_id = "-".join(list_rules[0]["Name"].split("-")[1:-1])
    outputs = []
    for rule in list_rules:
        event_pattern = json.loads(rule["EventPattern"])
        if (
            "detail" not in event_pattern
            or "bucket" not in event_pattern["detail"]
            or "object" not in event_pattern["detail"]
            or "name" not in event_pattern["detail"]["bucket"]
            or "key" not in event_pattern["detail"]["object"]
        ):
            return {}
        bucket = event_pattern["detail"]["bucket"]["name"]
        if len(bucket) != 1:
            return {}
        prefix_list = [
            v
            for key in event_pattern["detail"]["object"]["key"]
            for k, v in key.items()
            if k == "prefix"
        ]
        if len(prefix_list) != 1:
            return {}
        prefix = prefix_list[0][:-1]
        outputs.append({"bucket": bucket[0], "prefix": prefix})
    return {"SourceId": source_id, "Output": outputs}


@tracer.capture_method(capture_response=False)
def get_channel_info():
    list_channels = ml.list_channels()
    channels = list_channels["Channels"]
    while "NextToken" in list_channels:
        list_channels = ml.list_channels(
            NextToken=list_channels["NextToken"],
        )
        channels.extend(list_channels["executions"])
    data = []
    for channel in channels:
        urls = list(
            set(
                setting["Url"]
                for destination in channel.get("Destinations", [])
                for setting in destination.get("Settings", [])
                if "Url" in setting
            )
        )
        valid_buckets = all(is_eventbridge_trigger(url.split("/")[2]) for url in urls)
        data.append(
            {
                "Id": channel["Id"],
                "Name": channel["Name"],
                "State": channel["State"],
                "Destinations": urls,
                "Valid": valid_buckets and not any("_" in url for url in urls),
            }
        )
    return data


@tracer.capture_method(capture_response=False)
def is_eventbridge_trigger(bucket_name):
    try:
        return "EventBridgeConfiguration" in s3.get_bucket_notification_configuration(
            Bucket=bucket_name
        )
    # pylint: disable=broad-exception-caught
    except Exception as e:
        logger.warning(e)
        return False


@app.get("/channel-ingestion")
@tracer.capture_method(capture_response=False)
def get_channel_ingestions():
    channels = get_channel_info()
    for channel in channels:
        duplicate_destination = not any(
            dest in c["Destinations"]
            for c in channels
            for dest in channel["Destinations"]
            if c["Id"] != channel["Id"]
        )
        channel["Valid"] = channel["Valid"] and duplicate_destination
    return (
        json.dumps(
            [{**channel, **get_existing(channel["Id"])} for channel in channels]
        ),
        HTTPStatus.OK.value,
    )  # 200


@logger.inject_lambda_context(
    log_event=True, correlation_id_path=correlation_paths.API_GATEWAY_REST
)
@tracer.capture_lambda_handler(capture_response=False)
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    return app.resolve(event, context)
