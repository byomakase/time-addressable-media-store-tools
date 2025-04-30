import useSWR from "swr";
import paginationFetcher from "@/utils/paginationFetcher";

export const useSegments = (flowId) => {
  const {
    data: response,
    mutate,
    error,
    isLoading,
    isValidating,
  } = useSWR(
    `/flows/${flowId}/segments`,
    paginationFetcher
  );

  return {
    segments: response?.data,
    mutate,
    isLoading,
    isValidating,
    error,
  };
};

export const useLastN = (flowId, n) => {
  const { data, mutate, error, isLoading, isValidating } = useSWR(
    `/flows/${flowId}/segments`,
    (path) =>
      paginationFetcher(`${path}?limit=${n}&accept_get_urls=&reverse_order=true`, 60),
    {
      refreshInterval: 3000,
    }
  );

  return {
    segments: data,
    mutate,
    isLoading,
    isValidating,
    error,
  };
};
