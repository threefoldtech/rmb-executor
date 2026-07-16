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

/** Page through Grid Proxy /nodes with an arbitrary filter. */
async function listNodes(
  gridProxyUrl: string,
  params: Record<string, string>
): Promise<GridNode[]> {
  const base = trimBase(gridProxyUrl);
  const size = 100;
  let page = 1;
  const nodes: GridNode[] = [];

  // Page cap (200 * 100 = 20k nodes) as a defensive backstop.
  for (let i = 0; i < 200; i++) {
    const qs = new URLSearchParams({
      ...params,
      size: String(size),
      page: String(page),
    });
    const res = await fetch(`${base}/nodes?${qs.toString()}`);
    if (!res.ok) {
      throw new Error(`Grid Proxy returned ${res.status}`);
    }
    const batch = (await res.json()) as RawNode[];
    if (!Array.isArray(batch) || batch.length === 0) break;
    for (const n of batch) {
      nodes.push({ nodeId: n.nodeId, twinId: n.twinId, farmId: n.farmId });
    }
    if (batch.length < size) break;
    page += 1;
  }

  return nodes;
}

/** List every node in a farm via Grid Proxy. */
export async function getFarmNodes(
  gridProxyUrl: string,
  farmId: number
): Promise<GridNode[]> {
  const nodes = await listNodes(gridProxyUrl, { farm_ids: String(farmId) });
  if (nodes.length === 0) {
    throw new Error(`No nodes found in farm ${farmId} on this network`);
  }
  return nodes;
}

/**
 * List every node on the network. Defaults to online ("up") nodes only —
 * scanning offline nodes just produces a wall of unreachable timeouts.
 */
export async function getAllNodes(
  gridProxyUrl: string,
  onlyUp = true
): Promise<GridNode[]> {
  const nodes = await listNodes(
    gridProxyUrl,
    onlyUp ? { status: "up" } : {}
  );
  if (nodes.length === 0) {
    throw new Error("No nodes found on this network");
  }
  return nodes;
}
