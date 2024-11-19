import json
import os

import boto3
from botocore.config import Config
from pymediainfo import MediaInfo


def get_signed_url(expires_in, bucket, obj):
    s3_cli = boto3.client(
        "s3",
        region_name=os.environ["AWS_REGION"],
        config=Config(signature_version="s3v4", s3={"addressing_style": "virtual"}),
    )
    presigned_url = s3_cli.generate_presigned_url(
        "get_object", Params={"Bucket": bucket, "Key": obj}, ExpiresIn=expires_in
    )
    return presigned_url


def get_media_info_link(bucket, key, parse_speed=0.5):
    signed_url = get_signed_url(300, bucket, key)
    media_info = MediaInfo.parse(
        signed_url, parse_speed=parse_speed, library_file="/opt/lib/libmediainfo.so.0"
    )
    return json.loads(media_info.to_json())


def get_media_info_download(bucket, key, parse_speed=0.5):
    tmp_filename = "/tmp/temp"  # nosec B108
    boto3.resource("s3").Bucket(bucket).download_file(key, tmp_filename)
    media_info = MediaInfo.parse(
        tmp_filename, parse_speed=parse_speed, library_file="/opt/lib/libmediainfo.so.0"
    )
    return json.loads(media_info.to_json())
