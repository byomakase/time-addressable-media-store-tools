import { fetchAuthSession } from "aws-amplify/auth";
import { AWS_REGION, AWS_CREATE_NEW_FLOW_ARN } from "@/constants";
import { SFNClient, StartSyncExecutionCommand } from "@aws-sdk/client-sfn";

const createFFmegFlow = async (flowId, changes) => {
  const session = await fetchAuthSession();
  const sfnClient = new SFNClient({
    region: AWS_REGION,
    credentials: session.credentials,
  });
  const response = await sfnClient.send(
    new StartSyncExecutionCommand({
      stateMachineArn: AWS_CREATE_NEW_FLOW_ARN,
      input: JSON.stringify({ flowId, changes }),
    })
  );
  return JSON.parse(response.output);
};

export default createFFmegFlow;
