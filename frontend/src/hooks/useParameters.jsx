import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

import { AWS_REGION } from "@/constants";
import { fetchAuthSession } from "aws-amplify/auth";
import useSWRMutation from "swr/mutation";

export const useParameter = () => {
  const { trigger, isMutating } = useSWRMutation(
    "/ssm-parameters",
    (_, { arg }) =>
      fetchAuthSession().then((session) =>
        new SSMClient({
          region: AWS_REGION,
          credentials: session.credentials,
        }).send(new GetParameterCommand(arg)).then((response) => response)
      )
  );

  return {
    get: trigger,
    isGetting: isMutating,
  };
};
