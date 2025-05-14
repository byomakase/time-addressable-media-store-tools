import "@byomakase/omakase-react-components/dist/omakase-react-components.css";

import { OmakasePlayerTamsComponent } from ".";
import { Spinner } from "@cloudscape-design/components";
import { useOmakaseData } from "../../hooks/useFlows";
import { useParams } from "react-router-dom";
import { useState } from "react";

export const OmakaseHlsPlayer = () => {
  const { type, id } = useParams();
  const [timerange, setTimerange] = useState("[)");
  const {
    flow,
    relatedFlows: filteredChildFlows,
    flowSegments,
    maxTimerange,
    isLoading,
    error,
  } = useOmakaseData(type, id, timerange);
  console.log({
    flow,
    relatedFlows: filteredChildFlows,
    flowSegments,
    maxTimerange,
    isLoading,
    error,
  });
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

// Flow could not be fetched from backend

// if (
//   flow &&
//   (flow.tags?.hls_exclude === "true" ||
//     flow.tags?.hls_exclude === true ||
//     flow.tags?.hls_exclude === "1" ||
//     flow.tags?.hls_exclude === 1)
// ) {
//   return <div>Flow is excluded from HLS</div>;
// }

//   if (
//     !loadingFlow &&
//     !childFlows.isLoading &&
//     !childFlowsSegmentsRaw.isLoading &&
//     !flowSegments.isLoading &&
//     !containsAudioOrVideoFlow(flow, filteredChildFlows) &&
//     (flow || filteredChildFlows)
//   ) {
//     return <div>Selected {type} don’t contain video or audio</div>;
//   }
