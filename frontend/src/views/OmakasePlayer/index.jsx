import "@byomakase/omakase-react-components/dist/omakase-react-components.css";

import { OmakasePlayerTamsComponent } from ".";
import { Spinner } from "@cloudscape-design/components";
import { useOmakaseData } from "../../hooks/useFlows";
import { useParams } from "react-router-dom";

export const OmakaseHlsPlayer = () => {
  const { type, id } = useParams();
  const {
    flow,
    relatedFlows: filteredChildFlows,
    flowSegments,
    timerange,
    setTimerange,
    maxTimerange,
    isLoading,
    error,
  } = useOmakaseData(type, id);

  if (error) {
    return <div>{error.message}</div>;
  }
  return !isLoading ? (
    <OmakasePlayerTamsComponent
      flow={flow}
      childFlows={filteredChildFlows}
      flowSegments={flowSegments[flow.id]} // TODO: intended to be removed once implemented in OmakasePlayerTamsComponent
      childFlowsSegments={
        new Map(
          Object.entries(flowSegments).filter(
            ([flowId, _]) => flowId !== flow.id
          )
        )
      } // TODO: intended to be removed once implemented in OmakasePlayerTamsComponent
      timeRange={timerange}
      maxTimeRange={maxTimerange}
      setTimeRange={setTimerange}
      displayConfig={{}}
    />
  ) : (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      Loading Media <Spinner />
    </div>
  );
};

export default OmakaseHlsPlayer;
