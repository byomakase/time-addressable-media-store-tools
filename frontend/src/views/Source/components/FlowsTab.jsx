import { Link } from "react-router-dom";
import { Table } from "@cloudscape-design/components";
import { useSourceFlows } from "@/hooks/useSources";

const FlowsTab = ({ sourceId }) => {
  const { flows, isLoading: loadingFlows } = useSourceFlows(sourceId);

  return flows ? (
    <Table
      trackBy="id"
      variant="borderless"
      columnDefinitions={[
        {
          id: "id",
          header: "Id",
          cell: (item) => <Link to={`/flows/${item.id}`}>{item.id}</Link>,
          isRowHeader: true,
        },
        {
          id: "description",
          header: "Description",
          cell: (item) => item.description,
        },
      ]}
      items={flows}
      sortingDisabled
      loading={loadingFlows}
      loadingText="Loading segments..."
    />
  ) : (
    "No flows"
  );
};

export default FlowsTab;
