import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import useSWR from "swr";
import { AWS_REGION } from "@/constants";
import { fetchAuthSession } from "aws-amplify/auth";

export const useParameter = (parameterName) => {
  const { data, error, isLoading } = useSWR(
    ["/ssm-parameters", parameterName],
    ([, parameterName]) =>
      fetchAuthSession().then((session) =>
        new SSMClient({ region: AWS_REGION, credentials: session.credentials })
          .send(new GetParameterCommand({ Name: parameterName }))
          .then((response) => JSON.parse(response.Parameter.Value))
      )
  );

  return {
    parameter: data,
    isLoading,
    error,
  };
};
