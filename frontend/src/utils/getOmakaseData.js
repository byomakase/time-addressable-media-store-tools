import { parseTimerangeObj, parseTimerangeStr } from "@/utils/parseTimerange";

import { DateTime } from "luxon";
import paginationFetcher from "@/utils/paginationFetcher";
import { useApi } from "@/hooks/useApi";

const shouldExcludeFlow = (flow) =>
  flow.tags?.hls_exclude?.toLowerCase() === "true";

const getFlowAndQueue = async ({ type, id }) => {
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
  return { flow, relatedFlows };
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

const getMaxTimerange = ({ flow, relatedFlows }) => {
  const allTimeranges = [
    parseTimerangeStr(flow.timerange),
    ...relatedFlows.map(({ timerange }) => parseTimerangeStr(timerange)),
  ];

  const validStartTimes = allTimeranges
    .filter(({ start }) => start)
    .map(({ start }) => start);

  const validEndTimes = allTimeranges
    .filter(({ end }) => end)
    .map(({ end }) => end);

  return {
    start: validStartTimes.length ? DateTime.min(...validStartTimes) : null,
    end: validEndTimes.length ? DateTime.max(...validEndTimes) : null,
  };
};

const getOmakaseData = async ({ type, id, timerange }) => {
  const { flow, relatedFlows } = await getFlowAndQueue({ type, id });

  const maxTimerange = getMaxTimerange({ flow, relatedFlows });
  const maxTimerangeDuration =
    maxTimerange.end.toSeconds() - maxTimerange.start.toSeconds();
  const segmentsTimerange =
    timerange ??
    parseTimerangeObj({
      includesStart: true,
      start:
        maxTimerangeDuration > 30
          ? DateTime.fromSeconds(maxTimerange.end.toSeconds() - 30)
          : maxTimerange.start,
      end: maxTimerange.end,
      includesEnd: false,
    });
  const parsedMaxTimeRange = parseTimerangeObj(maxTimerange);
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
