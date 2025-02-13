import { useApi } from "@/hooks/useApi";
import useSWR from "swr";

export const useSegments = (flowId) => {
  const { get } = useApi();
  const { data, mutate, error, isLoading, isValidating } = useSWR(
    `/flows/${flowId}/segments`,
    (path) => get(`${path}?accept_get_urls=&reverse_order=true`),
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
