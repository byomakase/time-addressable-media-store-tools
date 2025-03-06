import logging

import boto3
from crhelper import CfnResource

logger = logging.getLogger(__name__)
helper = CfnResource()

idp = boto3.client("cognito-idp")

try:
    pass
# pylint: disable=broad-exception-caught
except Exception as e:
    helper.init_failure(e)


@helper.create
@helper.update
# pylint: disable=unused-argument
def create(event, context):
    props = event.get("ResourceProperties")
    user_pool_id = props.get("UserPoolId")
    client_id = props.get("ClientId")
    client_secret = get_client_secret(user_pool_id, client_id)
    helper.Data["ClientSecret"] = client_secret


def lambda_handler(event, context):
    helper(event, context)


def get_client_secret(user_pool_id, client_id):
    user_pool_client = idp.describe_user_pool_client(
        UserPoolId=user_pool_id, ClientId=client_id
    )
    return user_pool_client["UserPoolClient"]["ClientSecret"]
