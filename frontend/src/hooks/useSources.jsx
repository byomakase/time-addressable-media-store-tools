import { TAMS_PAGE_LIMIT } from "@/constants";
import { useApi } from "@/hooks/useApi";
import useSWR from "swr";

export const useSources = () => {
  const { get } = useApi();
  const { data, mutate, error, isLoading, isValidating } = useSWR(
    "/sources",
    (path) => get(`${path}?limit=${TAMS_PAGE_LIMIT}`),
    {
      refreshInterval: 3000,
    }
  );

  return {
    sources: data,
    mutate,
    isLoading,
    isValidating,
    error,
  };
};

export const useSource = (sourceId) => {
  const { get } = useApi();
  const { data, mutate, error, isLoading, isValidating } = useSWR(
    ["/sources", sourceId],
    ([path, sourceId]) => get(`${path}/${sourceId}`),
    {
      refreshInterval: 3000,
    }
  );

  return {
    source: data,
    mutate,
    isLoading,
    isValidating,
    error,
  };
};

export const useSourceFlows = (sourceId) => {
  const { get } = useApi();
  const { data, mutate, error, isLoading, isValidating } = useSWR(
    ["/flows", sourceId],
    ([path, sourceId]) => get(`${path}?source_id=${sourceId}`),
    {
      refreshInterval: 3000,
    }
  );

  return {
    flows: data,
    mutate,
    isLoading,
    isValidating,
    error,
  };
};
