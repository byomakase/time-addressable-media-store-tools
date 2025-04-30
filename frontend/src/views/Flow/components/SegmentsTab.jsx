import { Box, SpaceBetween, Table } from "@cloudscape-design/components";

import { SEGMENT_COUNT } from "@/constants";
import parseTimerange from "@/utils/parseTimerange";
import { useLastN } from "@/hooks/useSegments";

const SegmentsTab = ({ flowId }) => {
  const { segments, isLoading: loadingSegments } = useLastN(flowId, SEGMENT_COUNT);

  return (
    <SpaceBetween size="xs">
      <i>Showing last {SEGMENT_COUNT} segments</i>
      <Table
        trackBy="object_id"
        variant="borderless"
        columnDefinitions={[
          {
            id: "id",
            header: "Id",
            cell: (item) => item.object_id,
            isRowHeader: true,
          },
          {
            id: "timerange",
            header: "Timerange",
            cell: (item) => item.timerange,
          },
          {
            id: "timerange_start",
            header: "Timerange Start",
            cell: (item) => item.localeTimerange.start,
          },
          {
            id: "timerange_end",
            header: "Timerange End",
            cell: (item) => item.localeTimerange.end,
          },
        ]}
        contentDensity="compact"
        items={
          segments &&
          segments.map((segment) => ({
            ...segment,
            localeTimerange: parseTimerange(segment.timerange),
          }))
        }
        sortingDisabled
        loading={loadingSegments}
        loadingText="Loading segments..."
        empty={
          <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
            <b>No segments</b>
          </Box>
        }
      />
    </SpaceBetween>
  );
};

export default SegmentsTab;
