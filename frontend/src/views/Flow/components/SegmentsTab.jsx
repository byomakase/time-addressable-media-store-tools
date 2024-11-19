import { Box, SpaceBetween, Table } from "@cloudscape-design/components";

import { useSegments } from "@/hooks/useSegments";

const SegmentsTab = ({ flowId }) => {
  const { segments, isLoading: loadingSegments } = useSegments(flowId);

  return (
    <SpaceBetween size="xs">
      <i>Showing a maxiumum of 30 segments</i>
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
        ]}
        items={segments}
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
