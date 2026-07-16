export interface GridNode {
  nodeId: number;
  twinId: number;
  farmId: number;
}

interface RawNode {
  nodeId: number;
  twinId: number;
  farmId: number;
}

function trimBase(url: string): string {
  return url.replace(/\/+$/, "");
}

/** Resolve a single node ID to its node/twin info via Grid Proxy. */
export async function getNode(
  gridProxyUrl: string,
  nodeId: number
): Promise<GridNode> {
  const res = await fetch(`${trimBase(gridProxyUrl)}/nodes/${nodeId}`);
  if (!res.ok) {
    throw new Error(`Grid Proxy returned ${res.status} for node ${nodeId}`);
  }
  const data = (await res.json()) as RawNode & { error?: string };
  if (data.error || !data.twinId) {
    throw new Error(`Node ${nodeId} not found on this network`);
  }
  return { nodeId: data.nodeId, twinId: data.twinId, farmId: data.farmId };
}

/** List every node in a farm via Grid Proxy (handles pagination). */
export async function getFarmNodes(
  gridProxyUrl: string,
  farmId: number
): Promise<GridNode[]> {
  const base = trimBase(gridProxyUrl);
  const size = 50;
  let page = 1;
  const nodes: GridNode[] = [];

  // Cap pages defensively so a huge farm can't loop forever.
  for (let i = 0; i < 40; i++) {
    const res = await fetch(
      `${base}/nodes?farm_ids=${farmId}&size=${size}&page=${page}`
    );
    if (!res.ok) {
      throw new Error(`Grid Proxy returned ${res.status} for farm ${farmId}`);
    }
    const batch = (await res.json()) as RawNode[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const n of batch) {
      nodes.push({ nodeId: n.nodeId, twinId: n.twinId, farmId: n.farmId });
    }
    if (batch.length < size) break;
    page += 1;
  }

  if (nodes.length === 0) {
    throw new Error(`No nodes found in farm ${farmId} on this network`);
  }
  return nodes;
}
