import {
  parseTimerangeObjNano,
  parseTimerangeStrNano,
} from "@/utils/parseTimerange";

import paginationFetcher from "@/utils/paginationFetcher";
import { useApi } from "@/hooks/useApi";

const DEFAULT_SEGMENTATION_DURATION = 300;
const NANOS_PER_SECOND = 1_000_000_000n;

const shouldExcludeFlow = (flow) =>
  flow.tags?.hls_exclude?.toLowerCase() === "true";

const getFlowAndRelated = async ({ type, id }) => {
  const { get } = useApi();
  let flow = {};
  const relatedFlowQueue = [];

  if (type === "flows") {
    const flowData = (await get(`/flows/${id}?include_timerange=true`)).data;
    if (shouldExcludeFlow(flowData)) {
      console.error("No valid Flows found.");
      return { flow: null, relatedFlows: [] };
    }
    flow = flowData;
  } else {
    const sourceFlows = (await get(`/flows/?source_id=${id}`)).data;
    const filteredSourceFlows = sourceFlows.filter(
      (sourceFlow) => !shouldExcludeFlow(sourceFlow)
    );

    if (filteredSourceFlows.length === 0) {
      console.error("No valid Flows found.");
      return { flow: null, relatedFlows: [] };
    }

    flow = (
      await get(`/flows/${filteredSourceFlows[0].id}?include_timerange=true`)
    ).data;
    relatedFlowQueue.push(...filteredSourceFlows.slice(1).map(({ id }) => id));
  }

  if (flow.flow_collection) {
    relatedFlowQueue.push(...flow.flow_collection.map(({ id }) => id));
  }

  const relatedFlows = await getFlowHierarchy(relatedFlowQueue);
  const sortedRelatedFlows = relatedFlows.sort(
    (a, b) => a.avg_bit_rate - b.avg_bit_rate
  );
  return { flow, relatedFlows: sortedRelatedFlows };
};

const getFlowHierarchy = async (relatedFlowQueue) => {
  const { get } = useApi();
  const relatedFlows = [];
  const checkedFlowIds = new Set();

  while (relatedFlowQueue.length > 0) {
    const relatedFlowId = relatedFlowQueue.pop();
    checkedFlowIds.add(relatedFlowId);

    const flowData = (
      await get(`/flows/${relatedFlowId}?include_timerange=true`)
    ).data;

    if (!shouldExcludeFlow(flowData)) {
      relatedFlows.push(flowData);
    }

    if (flowData.flow_collection) {
      const newFlowIds = flowData.flow_collection
        .filter(({ id }) => !checkedFlowIds.has(id))
        .map(({ id }) => id);

      relatedFlowQueue.push(...newFlowIds);
    }
  }

  return relatedFlows;
};

const getMaxTimerange = (flows) => {
  if (!flows.length) return { start: null, end: null };
  
  let minStart = flows[0].timerange.start;
  let maxEnd = flows[0].timerange.end;
  
  for (let i = 1; i < flows.length; i++) {
    const { start, end } = flows[i].timerange;
    if (start < minStart) minStart = start;
    if (end > maxEnd) maxEnd = end;
  }
  
  return { start: minStart, end: maxEnd };
};

const parseAndFilterFlows = (flows) => {
  const result = [];
  const validFormats = new Set(["urn:x-nmos:format:video", "urn:x-nmos:format:audio"]);
  
  for (const flow of flows) {
    if (!validFormats.has(flow.format)) continue;
    
    try {
      const parsedTimerange = parseTimerangeStrNano(flow.timerange);
      if (parsedTimerange.start && parsedTimerange.end) {
        result.push({ ...flow, timerange: parsedTimerange });
      }
    } catch (error) {
      // Skip flows with parsing errors
    }
  }
  
  return result;
};

const getsegmentationTimerange = (maxTimerange) => {
  const maxTimerangeDuration = Number(
    (maxTimerange.end - maxTimerange.start) / NANOS_PER_SECOND
  );
  return {
    includesStart: true,
    start:
      maxTimerangeDuration > DEFAULT_SEGMENTATION_DURATION
        ? maxTimerange.end -
          BigInt(DEFAULT_SEGMENTATION_DURATION) * NANOS_PER_SECOND
        : maxTimerange.start,
    end: maxTimerange.end,
    includesEnd: false,
  };
};

const getOmakaseData = async ({ type, id, timerange }) => {
  const { flow, relatedFlows } = await getFlowAndRelated({ type, id });

  const timerangeValidFlows = parseAndFilterFlows([flow, ...relatedFlows]);
  const maxTimerange = getMaxTimerange(timerangeValidFlows);

  const segmentsTimerange =
    timerange ?? parseTimerangeObjNano(getsegmentationTimerange(maxTimerange));

  const parsedMaxTimeRange = parseTimerangeObjNano(maxTimerange);

  const fetchPromises = [
    paginationFetcher(
      `/flows/${flow.id}/segments?limit=300&timerange=${segmentsTimerange}`
    ).then((result) => [flow.id, result]),
    ...relatedFlows.map(({ id }) =>
      paginationFetcher(
        `/flows/${id}/segments?limit=300&timerange=${segmentsTimerange}`
      ).then((result) => [id, result])
    ),
  ];

  const flowSegments = Object.fromEntries(await Promise.all(fetchPromises));

  return {
    flow,
    relatedFlows,
    flowSegments,
    maxTimerange: parsedMaxTimeRange,
    timerange: segmentsTimerange,
  };
};

export default getOmakaseData;
