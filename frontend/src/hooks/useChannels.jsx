import {
  MediaLiveClient,
  StartChannelCommand,
  StopChannelCommand,
} from "@aws-sdk/client-medialive";

import { AWS_REGION } from "@/constants";
import { fetchAuthSession } from "aws-amplify/auth";
import { get } from "aws-amplify/api";
import useSWR from "swr";
import useSWRMutation from "swr/mutation";

const fetcher = async (path) =>
  get({ apiName: "HlsIngest", path })
    .response.then((res) => res.body)
    .then((body) => body.json());

export const useChannels = () => {
  const { data, mutate, error, isLoading, isValidating } = useSWR(
    "/channel-ingestion",
    fetcher,
    {
      refreshInterval: 3000,
    }
  );

  return {
    channels: data,
    mutate,
    isLoading,
    isValidating,
    error,
  };
};

export const useChannelStart = () => {
  const { trigger, isMutating } = useSWRMutation(
    "/channel-ingestion",
    (_, { arg }) =>
      fetchAuthSession().then((session) =>
        new MediaLiveClient({
          region: AWS_REGION,
          credentials: session.credentials,
        }).send(new StartChannelCommand(arg)).then((response) => response)
      )
  );

  return {
    start: trigger,
    isStarting: isMutating,
  };
};

export const useChannelStop = () => {
  const { trigger, isMutating } = useSWRMutation(
    "/channel-ingestion",
    (_, { arg }) =>
      fetchAuthSession().then((session) =>
        new MediaLiveClient({
          region: AWS_REGION,
          credentials: session.credentials,
        }).send(new StopChannelCommand(arg)).then((response) => response)
      )
  );

  return {
    stop: trigger,
    isStopping: isMutating,
  };
};
