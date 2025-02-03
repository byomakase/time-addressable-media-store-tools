import { ColumnLayout, SpaceBetween } from "@cloudscape-design/components";

import { Link } from "react-router-dom";
import ValueWithLabel from "@/components/ValueWithLabel";
import chunkArray from "@/utils/chunkArray";
import parseTimerange from "@/utils/parseTimerange";

const EntityDetails = ({ entity }) => {
  const keyValues = entity
    ? Object.entries(entity).filter(
        (prop) => typeof prop[1] !== "object" && prop[0] !== "timerange"
      )
    : [];
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
