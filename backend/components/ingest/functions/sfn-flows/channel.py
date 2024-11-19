import uuid

import boto3


class Channel:
    def __init__(self, channel_id):
        self.dict = {}
        eml = boto3.client("medialive")

        try:
            self.dict = eml.describe_channel(ChannelId=channel_id)
            self.dict.pop("ResponseMetadata")
        except eml.exceptions.NotFoundException as ex:
            print(ex)

        if "Destinations" in self.dict:
            self.dict["Destinations"] = {
                d.pop("Id"): d for d in self.dict["Destinations"]
            }

        if (
            "EncoderSettings" in self.dict
            and "AudioDescriptions" in self.dict["EncoderSettings"]
        ):
            self.dict["EncoderSettings"]["AudioDescriptions"] = {
                d.pop("Name"): d
                for d in self.dict["EncoderSettings"]["AudioDescriptions"]
            }

        if (
            "EncoderSettings" in self.dict
            and "VideoDescriptions" in self.dict["EncoderSettings"]
        ):
            self.dict["EncoderSettings"]["VideoDescriptions"] = {
                d.pop("Name"): d
                for d in self.dict["EncoderSettings"]["VideoDescriptions"]
            }

        if (
            "EncoderSettings" in self.dict
            and "CaptionDescriptions" in self.dict["EncoderSettings"]
        ):
            self.dict["EncoderSettings"]["CaptionDescriptions"] = {
                d.pop("Name"): d
                for d in self.dict["EncoderSettings"]["CaptionDescriptions"]
            }

    def tams(self, label):
        flows = []
        ssm_parameters = []
        for output_group in self.dict.get("EncoderSettings", {}).get(
            "OutputGroups", []
        ):
            destination_id = (
                output_group.get("OutputGroupSettings", {})
                .get("HlsGroupSettings", {})
                .get("Destination", {})
                .get("DestinationRefId")
            )
            urls = [
                s["Url"]
                for s in self.dict.get("Destinations", {})
                .get(destination_id, {})
                .get("Settings", [])
                if "Url" in s and s["Url"].startswith("s3://")
            ]
            if len(urls) > 0:
                output_group_name = output_group.get("Name", "")
                segment_length = output_group["OutputGroupSettings"][
                    "HlsGroupSettings"
                ]["SegmentLength"]
                url_split = urls[0].split("/")
                s3_bucket = url_split[2]
                s3_prefix = "/".join(url_split[3:])
                ssm_parameter_value = {
                    "use_start_epoch": self.dict.get("Tags", {})
                    .get("use_start_epoch", "false")
                    .lower()
                    == "true",
                    "segment_length": segment_length,
                }
                for output in output_group["Outputs"]:
                    flow_id = str(uuid.uuid4())
                    name_modifier = output["OutputSettings"]["HlsOutputSettings"][
                        "NameModifier"
                    ]
                    ssm_parameter_value[f"{s3_prefix}{name_modifier}_"] = flow_id
                    output_name = output.get("OutputName", name_modifier)
                    flow = {
                        "id": flow_id,
                        "label": label,
                        "description": " - ".join(
                            [
                                f'{self.dict["Name"]} ({self.dict["Id"]})',
                                output_group_name,
                                output_name,
                            ]
                        ),
                        "container": "video/mp2t",
                        "essence_parameters": {},
                    }
                    video_description_name = output.get("VideoDescriptionName", None)
                    audio_description_name = next(
                        iter(output["AudioDescriptionNames"]), None
                    )  # Always get first Audio description as unclear if/how multiple audio descriptions produce files.
                    if video_description_name:
                        flow["format"] = "urn:x-nmos:format:video"
                    else:
                        flow["format"] = "urn:x-nmos:format:audio"
                    match flow["format"]:
                        case "urn:x-nmos:format:video":
                            description = self.dict["EncoderSettings"][
                                "VideoDescriptions"
                            ].get(video_description_name, {})
                        case "urn:x-nmos:format:audio":
                            description = self.dict["EncoderSettings"][
                                "AudioDescriptions"
                            ].get(audio_description_name, {})
                    codec_setting_name = list(description["CodecSettings"].keys())[0]
                    flow["codec"] = (
                        f'{flow["format"].split(":")[-1]}/{codec_setting_name[:-len("Settings")].lower()}'
                    )
                    codec_setting = description["CodecSettings"][codec_setting_name]
                    flow["avg_bit_rate"] = codec_setting["Bitrate"]
                    flow["max_bit_rate"] = codec_setting["Bitrate"]
                    match flow["format"]:
                        case "urn:x-nmos:format:video":
                            flow["essence_parameters"]["frame_rate"] = {
                                "numerator": codec_setting["FramerateNumerator"],
                                "denominator": codec_setting["FramerateDenominator"],
                            }
                            flow["essence_parameters"]["frame_width"] = description[
                                "Width"
                            ]
                            flow["essence_parameters"]["frame_height"] = description[
                                "Height"
                            ]
                            flow["essence_parameters"]["interlace_mode"] = (
                                codec_setting["ScanType"].lower()
                            )
                        case "urn:x-nmos:format:audio":
                            channels = {
                                "AD_RECEIVER_MIX": 2,  # default value used since unsure how to infer this
                                "CODING_MODE_1_0": 1,
                                "CODING_MODE_1_1": 2,
                                "CODING_MODE_2_0": 2,
                                "CODING_MODE_5_1": 6,
                            }
                            flow["essence_parameters"]["sample_rate"] = codec_setting[
                                "SampleRate"
                            ]
                            flow["essence_parameters"]["channels"] = channels[
                                codec_setting["CodingMode"]
                            ]
                    flows.append(flow)
                ssm_parameters.append(
                    {
                        "bucket": s3_bucket,
                        "prefix": s3_prefix,
                        "value": ssm_parameter_value,
                    }
                )
        return flows, ssm_parameters
