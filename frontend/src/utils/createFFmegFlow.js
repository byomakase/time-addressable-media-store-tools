import { useApi } from "@/hooks/useApi";

const applyChanges = (flow, changes) => {
  const newFlow = {
    ...flow,
    id: crypto.randomUUID(),
    source_id: crypto.randomUUID(),
  };
  Object.entries(changes).forEach(([key, value]) => {
    if (value === null) {
      const pathParts = key.split(".");
      let current = newFlow;
      for (let i = 0; i < pathParts.length - 1; i++) {
        current = current[pathParts[i]];
      }
      delete current[pathParts[pathParts.length - 1]];
    } else {
      if (key.includes(".")) {
        const pathParts = key.split(".");
        let current = newFlow;
        for (let i = 0; i < pathParts.length - 1; i++) {
          current = current[pathParts[i]] = current[pathParts[i]] || {};
        }
        current[pathParts[pathParts.length - 1]] = value;
      } else {
        newFlow[key] = value;
      }
    }
  });
  return newFlow;
};

const createFFmegFlow = async (flowId, changes) => {
  const { get, put } = useApi();
  const flow = await get(`/flows/${flowId}`);
  const newFlow = applyChanges(flow, changes);
  delete newFlow.created_by;
  delete newFlow.updated_by;
  await put(`/flows/${newFlow.id}`, newFlow);
  flow.collected_by.forEach(async (collectedById) => {
    const flowCollection = await get(`/flows/${collectedById}/flow_collection`);
    await put(`/flows/${collectedById}/flow_collection`, [
      ...flowCollection,
      { id: newFlow.id, role: newFlow.format.split(":")[3] },
    ]);
  });
  return newFlow.id;
};

export default createFFmegFlow;
