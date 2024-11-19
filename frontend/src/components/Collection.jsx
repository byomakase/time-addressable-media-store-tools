import { Link } from "react-router-dom";
import { Table } from "@cloudscape-design/components";

const Collection = ({ entityType, collection }) => {
  return collection ? (
    <Table
      trackBy="id"
      variant="borderless"
      columnDefinitions={[
        {
          id: "id",
          header: "Id",
          cell: (item) => (
            <Link to={`/${entityType}/${item.id}`}>{item.id}</Link>
          ),
          isRowHeader: true,
        },
        {
          id: "role",
          header: "Role",
          cell: (item) => item.role,
        },
      ]}
      items={collection.map(({ id, role }) => ({
        id,
        role,
      }))}
      sortingDisabled
    />
  ) : (
    "No source collection(s)"
  );
};

export default Collection;
