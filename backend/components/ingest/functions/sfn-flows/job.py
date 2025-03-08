import base64
import json
import uuid

import boto3

# pylint: disable=no-name-in-module
from mediainfo import get_media_info_link


class Job:
    def __init__(self, bucket, key, source_id, execution_name):
        self.spec = {}
        self.media_info = get_media_info_link(bucket, key)
        self.label = key.rsplit("/", 1)[-1].split("_", 1)[0]
        self.job_type, self.input_key = key.split("/", 2)[1:]
        self.base64_name = (
            base64.b64encode(self.input_key.encode("utf-8"))
            .decode("utf-8")
            .replace("=", "")
        )
        self.description = f"File Import ({self.job_type})"
        self.error = {}

        try:
            self.spec = json.loads(
                boto3.client("s3")
                .get_object(
                    Bucket=bucket,
                    Key=f'{"/".join(key.split("/")[:2])}/mediaconvert.json',
                )["Body"]
                .read()
            )
        # pylint: disable=broad-exception-caught
        except Exception as ex:
            print(ex)

        if "Settings" not in self.spec:
            self.error = {
                "type": "Property not found",
                "message": "Settings property not found in JobSpec",
            }
        else:
            inputs = self.spec["Settings"].get("Inputs", [])
            if len(inputs) != 1:
                self.error = {
                    "type": "Property not found",
                    "message": "Inputs property not found, empty or more than one specified in JobSpec Settings",
                }
            else:
                inputs = [i for i in inputs if "FileInput" in i]
                if len(inputs) == 0:
                    self.error = {
                        "type": "Property not found",
                        "message": "Inputs do not contain the required FileInput property",
                    }
                else:
                    inputs = [inputs[0]]
                    inputs[0][
                        "FileInput"
                    ] = f"s3://{bucket}/jobs/{execution_name}/{self.base64_name}"
                    self.spec["Settings"]["Inputs"] = inputs
                    output_groups = self.spec["Settings"].get("OutputGroups", [])
                    if len(output_groups) == 0:
                        self.error = {
                            "type": "Property not found",
                            "message": "OutputGroups property not found, or empty in JobSpec Settings",
                        }
                    else:
                        output_groups = [
                            og
                            for og in output_groups
                            if "OutputGroupSettings" in og
                            and og["OutputGroupSettings"]["Type"]
                            == "HLS_GROUP_SETTINGS"
                        ]
                        if len(output_groups) == 0:
                            self.error = {
                                "type": "Property not found",
                                "message": "OutputGroups does not contain the required HLS_GROUP_SETTINGS OutputGroupSettings type",
                            }
                        else:
                            output_groups = [output_groups[0]]
                            output_groups[0]["OutputGroupSettings"]["HlsGroupSettings"][
                                "Destination"
                            ] = f"s3://{bucket}/jobs/{execution_name}/{source_id}/"
                            output_groups[0]["OutputGroupSettings"]["HlsGroupSettings"][
                                "DirectoryStructure"
                            ] = "SINGLE_DIRECTORY"
                            if (
                                "DestinationSettings"
                                in output_groups[0]["OutputGroupSettings"][
                                    "HlsGroupSettings"
                                ]
                            ):
                                if (
                                    "S3Settings"
                                    in output_groups[0]["OutputGroupSettings"][
                                        "HlsGroupSettings"
                                    ]["DestinationSettings"]
                                ):
                                    output_groups[0]["OutputGroupSettings"][
                                        "HlsGroupSettings"
                                    ]["DestinationSettings"]["S3Settings"][
                                        "StorageClass"
                                    ] = "STANDARD"
                                else:
                                    output_groups[0]["OutputGroupSettings"][
                                        "HlsGroupSettings"
                                    ]["DestinationSettings"]["S3Settings"] = {
                                        "StorageClass": "STANDARD"
                                    }
                            else:
                                output_groups[0]["OutputGroupSettings"][
                                    "HlsGroupSettings"
                                ]["DestinationSettings"] = {
                                    "S3Settings": {"StorageClass": "STANDARD"}
                                }
                            self.spec["Settings"]["OutputGroups"] = output_groups

    def tams(self):
        flows = []
        ssm_parameters = []
        for output_group in self.spec.get("Settings", {}).get("OutputGroups", []):
            segment_length = output_group["OutputGroupSettings"]["HlsGroupSettings"][
                "SegmentLength"
            ]
            destination = f'{output_group["OutputGroupSettings"]["HlsGroupSettings"]["Destination"]}{self.base64_name}'
            url_split = destination.split("/")
            s3_bucket = url_split[2]
            s3_prefix = "/".join(url_split[3:])
            ssm_parameter_value = {
                "use_start_epoch": False,
            }
            for output in output_group["Outputs"]:
                flow_id = str(uuid.uuid4())
                name_modifier = output["NameModifier"]
                ssm_parameter_value[f"{s3_prefix}{name_modifier}_"] = flow_id
                flow = {
                    "id": flow_id,
                    "label": self.label,
                    "description": f"{self.description} - {name_modifier}",
                    "container": "video/mp2t",
                    "segment_duration": {"numerator": segment_length, "denominator": 1},
                    "essence_parameters": {},
                }
                media_info_track = []
                if "VideoDescription" in output:
                    flow["format"] = "urn:x-nmos:format:video"
                    media_info_track = [
                        t
                        for t in self.media_info["tracks"]
                        if t["track_type"] == "Video"
                    ][0]
                elif "AudioDescriptions" in output:
                    flow["format"] = "urn:x-nmos:format:audio"
                    media_info_track = [
                        t
                        for t in self.media_info["tracks"]
                        if t["track_type"] == "Audio"
                    ][0]
                match flow["format"]:
                    case "urn:x-nmos:format:video":
                        codec_setting_name = [
                            k
                            for k in output["VideoDescription"]["CodecSettings"].keys()
                            if k.endswith("Settings")
                        ][0]
                        codec_setting = output["VideoDescription"]["CodecSettings"][
                            codec_setting_name
                        ]
                    case "urn:x-nmos:format:audio":
                        codec_setting_name = [
                            k
                            for k in output["AudioDescriptions"][0][
                                "CodecSettings"
                            ].keys()
                            if k.endswith("Settings")
                        ][0]
                        codec_setting = output["AudioDescriptions"][0]["CodecSettings"][
                            codec_setting_name
                        ]
                flow["codec"] = (
                    f'{flow["format"].split(":")[-1]}/{codec_setting_name[:-8].lower()}'
                )
                flow["avg_bit_rate"] = (
                    codec_setting["Bitrate"]
                    if "Bitrate" in codec_setting
                    else codec_setting["MaxBitrate"]
                )
                flow["max_bit_rate"] = (
                    codec_setting["MaxBitrate"]
                    if "MaxBitrate" in codec_setting
                    else codec_setting["Bitrate"]
                )
                match flow["format"]:
                    case "urn:x-nmos:format:video":
                        flow["essence_parameters"]["frame_rate"] = {
                            "numerator": (
                                codec_setting["FramerateNumerator"]
                                if "FramerateNumerator" in codec_setting
                                else int(media_info_track["framerate_num"])
                            ),
                            "denominator": (
                                codec_setting["FramerateDenominator"]
                                if "FramerateDenominator" in codec_setting
                                else int(media_info_track["framerate_den"])
                            ),
                        }
                        flow["essence_parameters"]["frame_width"] = (
                            output["VideoDescription"]["Width"]
                            if "Width" in output["VideoDescription"]
                            else media_info_track["width"]
                        )
                        flow["essence_parameters"]["frame_height"] = (
                            output["VideoDescription"]["Height"]
                            if "Height" in output["VideoDescription"]
                            else media_info_track["height"]
                        )
                        flow["essence_parameters"]["interlace_mode"] = (
                            codec_setting["InterlaceMode"].lower()
                            if "InterlaceMode" in codec_setting
                            else media_info_track["scan_type"].lower()
                        )
                    case "urn:x-nmos:format:audio":
                        channels = {
                            "AD_RECEIVER_MIX": 2,  # default value used since unsure how to infer this
                            "CODING_MODE_1_0": 1,
                            "CODING_MODE_1_1": 2,
                            "CODING_MODE_2_0": 2,
                            "CODING_MODE_5_1": 6,
                        }
                        flow["essence_parameters"]["sample_rate"] = (
                            codec_setting["SampleRate"]
                            if "SampleRate" in codec_setting
                            else media_info_track["sampling_rate"]
                        )
                        flow["essence_parameters"]["channels"] = (
                            channels[codec_setting["CodingMode"]]
                            if "CodingMode" in codec_setting
                            else media_info_track["channel_s"]
                        )
                flows.append(flow)
            ssm_parameters.append(
                {"bucket": s3_bucket, "prefix": s3_prefix, "value": ssm_parameter_value}
            )
        return flows, ssm_parameters
