<script setup lang="ts">
import { computed, ref } from "vue";
import { requestRmb } from "../client/client";
import { getFarmNodes, getNode } from "../client/gridProxy";
import { useRmb } from "../stores/client";

interface Row {
  nodeId: number;
  twinId: number;
  version: string;
  match: boolean | null; // null = couldn't reach / parse
  error?: string;
}

const rmbStore = useRmb();

const targetVersion = ref("3.1.0");
const nodeId = ref<number | null>(null);
const farmId = ref<number | null>(null);

const busy = ref<"node" | "farm" | null>(null);
const rows = ref<Row[]>([]);
const notice = ref("");

const connected = computed(() => !!rmbStore.rmbClient);

const normalize = (v: string) => v.trim().replace(/^v/i, "");

const parseVersion = (resp: unknown): string => {
  if (resp == null) return "";
  if (typeof resp === "string") return resp;
  if (typeof resp === "object") {
    const o = resp as Record<string, unknown>;
    if (typeof o.zos === "string") return o.zos;
    if (typeof o.zosVersion === "string") return o.zosVersion;
  }
  return JSON.stringify(resp);
};

const matched = computed(() => rows.value.filter((r) => r.match === true).length);
const reachable = computed(() => rows.value.filter((r) => !r.error).length);

async function versionForTwin(twinId: number): Promise<string> {
  const resp = await requestRmb(
    rmbStore.rmbClient!,
    "zos.system.version",
    "",
    twinId,
    0.5,
    2
  );
  return parseVersion(resp);
}

function makeRow(nodeId: number, twinId: number): Row {
  return { nodeId, twinId, version: "", match: null };
}

async function resolveRow(row: Row): Promise<Row> {
  try {
    const version = await versionForTwin(row.twinId);
    return {
      ...row,
      version,
      match: normalize(version) === normalize(targetVersion.value),
    };
  } catch (err) {
    return { ...row, version: "—", match: null, error: String(err) };
  }
}

// Small concurrency pool so a big farm doesn't fire hundreds of calls at once.
async function runPool<T>(items: T[], limit: number, fn: (t: T) => Promise<void>) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) {
      const next = queue.shift()!;
      await fn(next);
    }
  });
  await Promise.all(workers);
}

const guard = (): boolean => {
  notice.value = "";
  if (!connected.value) {
    notice.value = "Connect first — open the status chip in the top-right.";
    return false;
  }
  return true;
};

async function checkNode() {
  if (!guard()) return;
  if (!nodeId.value) {
    notice.value = "Enter a node ID.";
    return;
  }
  busy.value = "node";
  rows.value = [];
  try {
    const node = await getNode(rmbStore.settings.gridProxyUrl, Number(nodeId.value));
    rows.value = [await resolveRow(makeRow(node.nodeId, node.twinId))];
  } catch (err) {
    notice.value = String(err);
  } finally {
    busy.value = null;
  }
}

async function checkFarm() {
  if (!guard()) return;
  if (!farmId.value) {
    notice.value = "Enter a farm ID.";
    return;
  }
  busy.value = "farm";
  rows.value = [];
  try {
    const nodes = await getFarmNodes(
      rmbStore.settings.gridProxyUrl,
      Number(farmId.value)
    );
    // Seed the table so the user sees progress as results stream in.
    rows.value = nodes
      .sort((a, b) => a.nodeId - b.nodeId)
      .map((n) => makeRow(n.nodeId, n.twinId));

    await runPool(rows.value.slice(), 8, async (row) => {
      const resolved = await resolveRow(row);
      const idx = rows.value.findIndex((r) => r.nodeId === row.nodeId);
      if (idx !== -1) rows.value[idx] = resolved;
    });
  } catch (err) {
    notice.value = String(err);
  } finally {
    busy.value = null;
  }
}

function rowStatus(r: Row): { icon: string; color: string; text: string } {
  if (r.error) return { icon: "mdi-lan-disconnect", color: "#64748b", text: "unreachable" };
  if (r.match === true) return { icon: "mdi-check-circle", color: "#4ade80", text: "match" };
  return { icon: "mdi-close-circle", color: "#fbbf24", text: "mismatch" };
}
</script>

<template>
  <div class="version-page">
    <section class="hero rise-in">
      <h1 class="gradient-text">Check against node's version</h1>
      <p>
        Set a target ZOS version, then verify a single node or every node in a farm —
        each check queries the node live over RMB.
      </p>
    </section>

    <v-card class="glass-card panel rise-in" elevation="0" style="animation-delay: 0.06s">
      <v-text-field
        v-model="targetVersion"
        label="Node's ZOS version"
        placeholder="3.1.0"
        hide-details="auto"
        prepend-inner-icon="mdi-tag-outline"
        class="mono-field target-field"
      />

      <div class="checks">
        <div class="check">
          <v-text-field
            v-model="nodeId"
            label="Node ID"
            type="number"
            min="1"
            hide-details="auto"
            prepend-inner-icon="mdi-server"
            @keyup.enter="checkNode"
          />
          <v-btn
            class="btn-gradient check-btn"
            rounded="lg"
            :loading="busy === 'node'"
            :disabled="busy !== null"
            @click="checkNode"
          >
            Check node's version
          </v-btn>
        </div>

        <div class="check">
          <v-text-field
            v-model="farmId"
            label="Farm ID"
            type="number"
            min="1"
            hide-details="auto"
            prepend-inner-icon="mdi-barn"
            @keyup.enter="checkFarm"
          />
          <v-btn
            class="btn-gradient check-btn"
            rounded="lg"
            :loading="busy === 'farm'"
            :disabled="busy !== null"
            @click="checkFarm"
          >
            Check nodes' version in farm
          </v-btn>
        </div>
      </div>

      <v-alert
        v-if="notice"
        type="info"
        variant="tonal"
        density="compact"
        class="notice"
      >
        {{ notice }}
      </v-alert>
    </v-card>

    <!-- Results -->
    <v-card v-if="rows.length" class="glass-card results" elevation="0">
      <div class="results-head">
        <span class="results-title">
          <v-icon size="18" color="primary">mdi-format-list-checks</v-icon>
          Results
        </span>
        <span class="results-summary mono">
          {{ matched }}/{{ rows.length }} on {{ normalize(targetVersion) }}
          · {{ reachable }} reachable
        </span>
      </div>

      <div class="results-table">
        <div class="results-row results-row--header">
          <span>Node</span>
          <span>Twin</span>
          <span>Reported version</span>
          <span class="ta-right">Status</span>
        </div>
        <div v-for="r in rows" :key="r.nodeId" class="results-row">
          <span class="mono">#{{ r.nodeId }}</span>
          <span class="mono muted">{{ r.twinId }}</span>
          <span class="mono">
            <template v-if="r.version">{{ r.version }}</template>
            <span v-else class="muted">checking…</span>
          </span>
          <span class="ta-right status" :style="{ color: rowStatus(r).color }">
            <v-icon size="15" :color="rowStatus(r).color">{{ rowStatus(r).icon }}</v-icon>
            {{ rowStatus(r).text }}
          </span>
        </div>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.version-page {
  width: min(820px, 100%);
  margin: 0 auto;
  padding: clamp(2.5rem, 7vh, 4.5rem) 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero {
  text-align: center;
  margin-bottom: 0.25rem;
}

.hero h1 {
  font-size: clamp(1.8rem, 4.8vw, 2.7rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.14;
  margin-bottom: 0.7rem;
}

.hero p {
  color: #94a3b8;
  font-size: 1rem;
  max-width: 34rem;
  margin: 0 auto;
  line-height: 1.6;
}

.panel {
  padding: clamp(1.25rem, 3vw, 1.75rem);
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.target-field {
  max-width: 320px;
}

.mono-field :deep(input) {
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

.checks {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.check {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem;
  border: 1px solid var(--glass-border);
  border-radius: 14px;
  background: rgba(24, 34, 56, 0.4);
}

.check-btn {
  text-transform: none;
  font-weight: 600;
}

.notice {
  font-size: 0.85rem;
}

/* ---- results ---- */
.results {
  overflow: hidden;
}

.results-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  padding: 0.85rem 1.1rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.results-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.92rem;
}

.results-summary {
  font-size: 0.78rem;
  color: #94a3b8;
}

.results-table {
  display: flex;
  flex-direction: column;
}

.results-row {
  display: grid;
  grid-template-columns: 90px 90px 1fr 140px;
  gap: 0.75rem;
  align-items: center;
  padding: 0.6rem 1.1rem;
  font-size: 0.85rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.06);
}

.results-row:last-child {
  border-bottom: none;
}

.results-row--header {
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.07em;
  color: #64748b;
  font-weight: 600;
}

.muted {
  color: #64748b;
}

.ta-right {
  text-align: right;
}

.status {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.3rem;
  font-weight: 500;
}

@media (max-width: 620px) {
  .checks {
    grid-template-columns: 1fr;
  }

  .results-row {
    grid-template-columns: 60px 1fr 110px;
  }

  .results-row span:nth-child(2) {
    display: none;
  }
}
</style>
