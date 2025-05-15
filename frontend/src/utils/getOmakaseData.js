import { useApi } from "@/hooks/useApi";
import paginationFetcher from "@/utils/paginationFetcher";
import { parseTimerangeStr, parseTimerangeObj } from "@/utils/parseTimerange";
import { DateTime } from "luxon";

const getFlowAndQueue = async ({ type, id }) => {
  const { get } = useApi();
  let flow = {};
  const relatedFlowQueue = [];
  if (type === "flows") {
    const getFlow = (await get(`/flows/${id}?include_timerange=true`)).data;
    if (getFlow.tags?.hls_exclude?.toLowerCase() === "true") {
      console.error("No valid Flows found.");
      return { flow: null, relatedFlowQueue: [] };
    }
    flow = getFlow;
    if (flow.flow_collection) {
      relatedFlowQueue.push(...flow.flow_collection.map(({ id }) => id));
    }
  } else {
    const sourceFlows = (await get(`/flows/?source_id=${id}`)).data;
    const filteredSourceFlows = sourceFlows.filter(
      (sourceFlow) =>
        !sourceFlow.tags ||
        sourceFlow.tags?.hls_exclude?.toLowerCase() !== "true"
    );
    if (filteredSourceFlows.length == 0) {
      console.error("No valid Flows found.");
      return { flow: null, relatedFlowQueue: [] };
    }
    flow = (
      await get(`/flows/${filteredSourceFlows[0].id}?include_timerange=true`)
    ).data;
    relatedFlowQueue.push(...filteredSourceFlows.slice(1).map(({ id }) => id));
    if (flow.flow_collection) {
      relatedFlowQueue.push(...flow.flow_collection.map(({ id }) => id));
    }
  }
  const relatedFlows = await getFlowHierachy(relatedFlowQueue);
  return { flow, relatedFlows };
};

const getFlowHierachy = async (relatedFlowQueue) => {
  const { get } = useApi();
  let relatedFlows = [];
  let checkedFlowIds = [];
  while (relatedFlowQueue.length > 0) {
    const relatedFlowId = relatedFlowQueue.pop();
    checkedFlowIds.push(relatedFlowId);
    const getFlow = (
      await get(`/flows/${relatedFlowId}?include_timerange=true`)
    ).data;
    if (!getFlow.tags || getFlow.tags?.hls_exclude?.toLowerCase() !== "true") {
      relatedFlows.push(getFlow);
    }
    if (getFlow.flow_collection) {
      relatedFlowQueue.push(
        ...getFlow.flow_collection
          .filter((collectedFlow) => !checkedFlowIds.includes(collectedFlow.id))
          .map(({ id }) => id)
      );
    }
  }
  return relatedFlows;
};

const getMaxTimerange = ({ flow, relatedFlows }) => {
  const allTimeranges = [
    parseTimerangeStr(flow.timerange),
    ...relatedFlows.map(({ timerange }) => parseTimerangeStr(timerange)),
  ];
  return {
    // Minimum start of timerange for all flows
    start: DateTime.min(
      ...allTimeranges.filter(({ start }) => start).map(({ start }) => start)
    ),
    // Maxiumum end of timerange for all flows
    end: DateTime.max(
      ...allTimeranges.filter(({ end }) => end).map(({ end }) => end)
    ),
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
  const flowSegments = Object.fromEntries([
    [
      flow.id,
      await paginationFetcher(
        `/flows/${flow.id}/segments?limit=300&timerange=${segmentsTimerange}`
      ),
    ],
    ...(await Promise.all(
      relatedFlows.map(async ({ id }) => [
        id,
        await paginationFetcher(
          `/flows/${id}/segments?limit=300&timerange=${segmentsTimerange}`
        ),
      ])
    )),
  ]);

  return {
    flow,
    relatedFlows,
    flowSegments,
    maxTimerange: parseTimerangeObj(maxTimerange),
    timerange: segmentsTimerange,
  };
};

export default getOmakaseData;
