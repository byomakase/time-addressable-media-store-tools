import { get } from "aws-amplify/api";
import useSWR from "swr";

const fetcher = (path, apiName = "HlsIngest") =>
  get({ apiName, path })
    .response.then((res) => res.body)
    .then((body) => body.json());

const useJobs = () => {
  const { data, mutate, error, isLoading, isValidating } = useSWR(
    "/job-ingestion",
    fetcher,
    {
      refreshInterval: 3000,
    }
  );

  return {
    jobs: data,
    mutate,
    isLoading,
    isValidating,
    error,
  };
};

export default useJobs;
