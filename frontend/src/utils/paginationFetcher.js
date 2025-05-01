import { AWS_TAMS_ENDPOINT } from "@/constants";
import { useApi } from "@/hooks/useApi";

const paginationFetcher = async (path) => {
  const { get } = useApi();
  let response = await get(path);
  let records = await response.data;
  while (response.nextLink) {
    const nextPath = response.nextLink.slice(AWS_TAMS_ENDPOINT.length);
    response = await get(nextPath);
    records = records.concat(response.data);
  }
  // Remove segments_updated field from record if present. This is required to avoid excessive re-renders for the flows view.
  return records.map(({segments_updated, ...remainder}) => remainder);
};

export default paginationFetcher;
