import { fetchAuthSession } from "aws-amplify/auth";
import {
  EventBridgeClient,
  PutEventsCommand,
} from "@aws-sdk/client-eventbridge";
import { AWS_REGION, OMAKASE_EVENT_BUS } from "@/constants"

export async function executeExport(formData, editTimeranges, flows) {
  const { credentials } = await fetchAuthSession();

  if (AWS_REGION === undefined) {
    console.error("AWS_REGION is not defined");
  }

  const client = new EventBridgeClient({
    region: AWS_REGION,
    credentials: credentials,
  });
  let configuration = {};

  if (formData.operation === "Segment Concatenation") {
    configuration.format = formData.format;
    configuration.output = {
      bucket: formData.bucket !== "" ? formData.bucket : undefined,
      path: formData.path !== "" ? formData.path : undefined,
      filename: formData.filename !== "" ? formData.filename : undefined,
    };
  } else if (formData.operation === "Flow Creation") {
    configuration.label = formData.label;
  }

  const operation = formData.operation.replaceAll(" ", "_").toUpperCase();

  const editFlows = Object.keys(formData.flows).filter(
    (key) => formData.flows[key]
  );

  const firstVideoFlow = flows?.filter((flow) => {
    return flow.format === "urn:x-nmos:format:video";
  })[0];

  if (firstVideoFlow) {
    editFlows.push(firstVideoFlow.id);
  }

  const editPayload = editTimeranges.map((timeRange) => ({
    timerange: timeRange,
    flows: editFlows,
  }));
  const params = {
    Entries: [
      {
        Source: "TAMS_UX",
        DetailType: "TAMS_PROCESSING_REQUEST",
        Detail: JSON.stringify({
          edit: editPayload,
          operation: operation,
          configuration: configuration,
        }),
        EventBusName: OMAKASE_EVENT_BUS,
      },
    ],
  };

  await client.send(new PutEventsCommand(params));
}
