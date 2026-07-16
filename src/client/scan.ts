import { getAllNodes, getFarmNodes, getNode, type GridNode } from "./gridProxy";

export type Scope = "node" | "farm" | "all";

/** Resolve a target scope to the set of nodes (with twin IDs) to act on. */
export async function resolveScope(
  gridProxyUrl: string,
  scope: Scope,
  id: number | null
): Promise<GridNode[]> {
  switch (scope) {
    case "node":
      if (!id) throw new Error("Enter a node ID.");
      return [await getNode(gridProxyUrl, id)];
    case "farm":
      if (!id) throw new Error("Enter a farm ID.");
      return getFarmNodes(gridProxyUrl, id);
    case "all":
      return getAllNodes(gridProxyUrl, true);
  }
}

/** Run `fn` over `items` with at most `limit` in flight at once. */
export async function runPool<T>(
  items: T[],
  limit: number,
  fn: (t: T) => Promise<void>
): Promise<void> {
  const queue = [...items];
  const workers = Array.from(
    { length: Math.min(limit, queue.length) },
    async () => {
      while (queue.length) {
        const next = queue.shift()!;
        await fn(next);
      }
    }
  );
  await Promise.all(workers);
}
