import os

import boto3
from aws_lambda_powertools import Logger, Tracer
from aws_lambda_powertools.utilities.typing import LambdaContext

tracer = Tracer()
logger = Logger()

events = boto3.client("events")
queue_arn = os.environ["QUEUE_ARN"]
event_bus_name = os.environ["EVENT_BUS_NAME"]
rule_id_prefix = "ffmpeg-flow-segments-"


@logger.inject_lambda_context(log_event=False)
@tracer.capture_lambda_handler(capture_response=False)
# pylint: disable=unused-argument
def lambda_handler(event: dict, context: LambdaContext) -> dict:
    flow_id = event["detail"]["flow_id"]
    for rule in get_rule_names():
        target_ids = [target["Id"] for target in get_rule_targets(rule)]
        # Check if deleted flow was the rule trigger or deleted flow is the only rule target
        if (rule[len(rule_id_prefix) :] == flow_id) or (target_ids == [flow_id]):
            for target_id in target_ids:
                events.remove_targets(
                    Rule=rule,
                    EventBusName=event_bus_name,
                    Ids=[target_id],
                )
            events.delete_rule(
                Name=rule,
                EventBusName=event_bus_name,
            )
        # Check if delete flow is a rule target
        elif flow_id in target_ids:
            events.remove_targets(
                Rule=rule,
                EventBusName=event_bus_name,
                Ids=[flow_id],
            )


@tracer.capture_method(capture_response=False)
def get_rule_names():
    list_rules = events.list_rule_names_by_target(
        TargetArn=queue_arn, EventBusName=event_bus_name
    )
    for rule in list_rules["RuleNames"]:
        yield rule
    while "NextToken" in list_rules:
        list_rules = events.list_rule_names_by_target(
            TargetArn=queue_arn,
            EventBusName=event_bus_name,
            NextToken=list_rules["NextToken"],
        )
        for rule in list_rules["RuleNames"]:
            yield rule


@tracer.capture_method(capture_response=False)
def get_rule_targets(rule_name):
    list_targets = events.list_targets_by_rule(
        Rule=rule_name,
        EventBusName=event_bus_name,
    )
    targets = list_targets["Targets"]
    while "NextToken" in list_targets:
        list_targets = events.list_targets_by_rule(
            Rule=rule_name,
            EventBusName=event_bus_name,
            NextToken=list_targets["NextToken"],
        )
        targets.extend(list_targets["Targets"])
    return targets
