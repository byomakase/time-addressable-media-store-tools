import { ColumnLayout, SpaceBetween } from "@cloudscape-design/components";

import { Link } from "react-router-dom";
import ValueWithLabel from "@/components/ValueWithLabel";
import chunkArray from "@/utils/chunkArray";
import parseTimerange from "@/utils/parseTimerange";

const EntityDetails = ({ entity }) => {
  const filteredEntity = entity
    ? Object.entries(entity).filter(
        (prop) =>
          ![
            "source_collection",
            "flow_collection",
            "collected_by",
            "essence_parameters",
            "tags",
          ].includes(prop[0])
      )
    : [];
  // Filter out timerange so that it can be added again later to keep timerange fields together.
  const keyValues = filteredEntity.filter(
    (prop) => typeof prop[1] !== "object" && prop[0] !== "timerange"
  );
  // Add object types back in as stringify value
  filteredEntity
    .filter((prop) => typeof prop[1] == "object")
    .forEach(([k, v]) => keyValues.push([k, JSON.stringify(v)]));
  // Add human readable timerange fields back in.
  if (entity.timerange) {
    keyValues.push(["timerange", entity.timerange]);
    if (entity.timerange !== "()") {
      const { start, end } = parseTimerange(entity.timerange);
      keyValues.push(["timerange_start", start], ["timerange_end", end]);
    }
  }
  const keyValueColumns = chunkArray(keyValues, 2);

  return (
    <ColumnLayout columns={2} variant="text-grid">
      {keyValueColumns.map((chunk, index) => (
        <SpaceBetween key={index} size="l">
          {chunk.map(([label, value]) => (
            <ValueWithLabel key={label} label={label}>
              {label === "source_id" ? (
                <Link to={`/sources/${value}`}>{value}</Link>
              ) : typeof value === "boolean" ? (
                value.toString()
              ) : (
                value
              )}
            </ValueWithLabel>
          ))}
        </SpaceBetween>
      ))}
    </ColumnLayout>
  );
};

export default EntityDetails;
