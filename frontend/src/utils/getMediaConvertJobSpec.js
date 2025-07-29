import { MEDIACONVERT_ROLE_ARN, MEDIACONVERT_BUCKET } from "@/constants";
import outputOptions from "./mediaconvert-outputs.json";

export const getMediaConvertJobSpec = (selectedSourceId, optionsName) => ({
  Role: MEDIACONVERT_ROLE_ARN,
  Settings: {
    TimecodeConfig: {
      Source: "ZEROBASED",
    },
    OutputGroups: [
      {
        Name: "File Group",
        OutputGroupSettings: {
          Type: "FILE_GROUP_SETTINGS",
          FileGroupSettings: {
            Destination: `s3://${MEDIACONVERT_BUCKET}/${selectedSourceId}`,
          },
        },
        Outputs: outputOptions[optionsName],
      },
    ],
    FollowSource: 1,
  },
});
