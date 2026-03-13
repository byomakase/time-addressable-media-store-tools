import { useApi } from "@/hooks/useApi";
import useSWR from "swr";

export const useObjects = (objectId) => {
  const { get } = useApi();
  const {
    data: response,
    error,
    isLoading,
  } = useSWR(
    objectId ? ["/objects", objectId] : null,
    ([path, objectId]) => get(`${path}/${objectId}?accept_get_urls=`),
    {
      refreshInterval: 3000,
    }
  );

  return {
    object: response?.data,
    isLoading,
    error,
  };
};
