<script setup lang="ts">
import { computed, ref } from "vue";
import { requestRmb } from "../client/client";
import { COMMAND_EXAMPLES, type CommandExample } from "../client/networks";
import { resolveScope, runPool, type Scope } from "../client/scan";
import { useRmb } from "../stores/client";

type NoticeType = "error" | "warning" | "info" | "success";

interface Row {
  nodeId: number;
  twinId: number;
  status: "pending" | "ok" | "error";
  output: string;
}

const rmbStore = useRmb();

const scope = ref<Scope>("node");
const nodeId = ref<number | null>(null);
const farmId = ref<number | null>(null);
const command = ref("");
const payload = ref("");
const timeoutSeconds = ref(60);

const busy = ref(false);
const rows = ref<Row[]>([]);
const openRows = ref<Set<number>>(new Set());
const notice = ref("");
const noticeType = ref<NoticeType>("error");

const connected = computed(() => !!rmbStore.rmbClient);
const activeExample = computed(() => command.value.trim());

const scopeOptions: { key: Scope; label: string; icon: string }[] = [
  { key: "node", label: "Single node", icon: "mdi-server" },
  { key: "farm", label: "Farm", icon: "mdi-barn" },
  { key: "all", label: "All nodes", icon: "mdi-earth" },
];

const okCount = computed(() => rows.value.filter((r) => r.status === "ok").length);
const errCount = computed(() => rows.value.filter((r) => r.status === "error").length);

function setNotice(msg: string, type: NoticeType = "error") {
  notice.value = msg;
  noticeType.value = type;
}

const prettify = (value: unknown): string => {
  if (value == null) return "";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
};

const applyExample = (ex: CommandExample) => {
  command.value = ex.command;
  payload.value = ex.payload;
};

const formatPayload = () => {
  try {
    payload.value = JSON.stringify(JSON.parse(payload.value), null, 2);
  } catch {
    /* leave non-JSON payloads untouched */
  }
};

const toggleRow = (id: number) => {
  const next = new Set(openRows.value);
  next.has(id) ? next.delete(id) : next.add(id);
  openRows.value = next;
};

async function execute() {
  setNotice("", "info");
  if (!connected.value) {
    setNotice("Connect first — open the status chip in the top-right.", "warning");
    return;
  }
  if (!command.value.trim()) {
    setNotice("Enter a command.", "warning");
    return;
  }

  busy.value = true;
  rows.value = [];
  openRows.value = new Set();

  try {
    const id = scope.value === "farm" ? farmId.value : nodeId.value;
    const nodes = await resolveScope(rmbStore.settings.gridProxyUrl, scope.value, id);

    rows.value = nodes
      .slice()
      .sort((a, b) => a.nodeId - b.nodeId)
      .map((n) => ({
        nodeId: n.nodeId,
        twinId: n.twinId,
        status: "pending" as const,
        output: "",
      }));

    if (scope.value !== "node") {
      setNotice(
        `Running "${command.value.trim()}" on ${rows.value.length} node${rows.value.length === 1 ? "" : "s"}…`,
        "info"
      );
    }

    const limit = scope.value === "all" ? 12 : 8;
    await runPool(rows.value.slice(), limit, async (row) => {
      const idx = rows.value.findIndex((r) => r.nodeId === row.nodeId);
      try {
        const resp = await requestRmb(
          rmbStore.rmbClient!,
          command.value.trim(),
          payload.value,
          row.twinId,
          Number(timeoutSeconds.value) / 60,
          2
        );
        if (idx !== -1)
          rows.value[idx] = { ...row, status: "ok", output: prettify(resp) };
      } catch (err) {
        if (idx !== -1)
          rows.value[idx] = { ...row, status: "error", output: String(err) };
      }
    });

    // Auto-open the single-node result so it's visible without a click.
    if (scope.value === "node" && rows.value.length === 1) {
      openRows.value = new Set([rows.value[0].nodeId]);
    }
    setNotice("", "info");
  } catch (err) {
    setNotice(String(err), "error");
  } finally {
    busy.value = false;
  }
}

function rowStatus(r: Row): { icon: string; color: string; text: string } {
  if (r.status === "ok") return { icon: "mdi-check-circle", color: "#4ade80", text: "ok" };
  if (r.status === "error")
    return { icon: "mdi-alert-circle", color: "#f87171", text: "error" };
  return { icon: "mdi-timer-sand", color: "#64748b", text: "…" };
}
</script>

<template>
  <div class="nodes-page">
    <section class="hero rise-in">
      <h1 class="gradient-text">Execute across nodes</h1>
      <p>
        Address nodes by <strong>node ID</strong> — run any RMB command on a single
        node, a whole farm, or every online node on the network at once.
      </p>
    </section>

    <v-card class="glass-card composer rise-in" elevation="0" style="animation-delay: 0.06s">
      <!-- Scope selector -->
      <div class="scope">
        <button
          v-for="opt in scopeOptions"
          :key="opt.key"
          type="button"
          class="scope-btn"
          :class="{ active: scope === opt.key }"
          @click="scope = opt.key"
        >
          <v-icon size="16">{{ opt.icon }}</v-icon>
          {{ opt.label }}
        </button>
      </div>

      <!-- Target input for the chosen scope -->
      <div class="target">
        <v-text-field
          v-if="scope === 'node'"
          v-model="nodeId"
          label="Node ID"
          type="number"
          min="1"
          hide-details="auto"
          prepend-inner-icon="mdi-server"
        />
        <v-text-field
          v-else-if="scope === 'farm'"
          v-model="farmId"
          label="Farm ID"
          type="number"
          min="1"
          hide-details="auto"
          prepend-inner-icon="mdi-barn"
        />
        <div v-else class="target-all">
          <v-icon size="18" color="secondary">mdi-earth</v-icon>
          Targets every online node on
          <span class="mono">{{ rmbStore.settings.network }}</span> net.
        </div>
      </div>

      <!-- Example presets -->
      <div class="examples">
        <span class="examples-label">Examples</span>
        <button
          v-for="ex in COMMAND_EXAMPLES"
          :key="ex.command"
          type="button"
          class="example-chip"
          :class="{ active: activeExample === ex.command }"
          :title="ex.command"
          @click="applyExample(ex)"
        >
          <v-icon size="14">{{ ex.icon }}</v-icon>
          {{ ex.label }}
        </button>
      </div>

      <v-text-field
        v-model="command"
        label="Command"
        placeholder="zos.system.version"
        hide-details="auto"
        prepend-inner-icon="mdi-console-line"
        class="mono-field"
      />

      <div class="payload-wrap">
        <v-textarea
          v-model="payload"
          label="Payload"
          placeholder='{ "key": "value" } — leave empty if the command takes none'
          rows="4"
          auto-grow
          hide-details="auto"
          class="mono-field"
        />
        <v-btn
          class="format-btn"
          size="x-small"
          variant="tonal"
          color="secondary"
          @click="formatPayload"
        >
          <v-icon start size="14">mdi-code-json</v-icon>
          Format
        </v-btn>
      </div>

      <div class="composer-actions">
        <v-text-field
          v-model="timeoutSeconds"
          label="Expiration (s)"
          type="number"
          min="1"
          hide-details="auto"
          density="compact"
          prepend-inner-icon="mdi-timer-sand"
          class="timeout-field"
        />
        <div class="spacer"></div>
        <v-btn
          class="btn-gradient submit-btn"
          size="large"
          rounded="lg"
          :loading="busy"
          @click="execute"
        >
          <v-icon start>mdi-send-variant</v-icon>
          Execute
        </v-btn>
      </div>

      <v-alert
        v-if="notice"
        :type="noticeType"
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
          {{ okCount }} ok · {{ errCount }} error · {{ rows.length }} total
        </span>
      </div>

      <div class="results-list">
        <div v-for="r in rows" :key="r.nodeId" class="result">
          <button class="result-row" type="button" @click="toggleRow(r.nodeId)">
            <span class="mono node-cell">#{{ r.nodeId }}</span>
            <span class="mono twin-cell muted">twin {{ r.twinId }}</span>
            <span class="status" :style="{ color: rowStatus(r).color }">
              <v-icon size="15" :color="rowStatus(r).color">{{ rowStatus(r).icon }}</v-icon>
              {{ rowStatus(r).text }}
            </span>
            <v-icon size="16" color="#64748b" class="chevron">
              {{ openRows.has(r.nodeId) ? "mdi-chevron-up" : "mdi-chevron-down" }}
            </v-icon>
          </button>
          <v-expand-transition>
            <pre v-if="openRows.has(r.nodeId)" class="result-output">{{ r.output || "—" }}</pre>
          </v-expand-transition>
        </div>
      </div>
    </v-card>
  </div>
</template>

<style scoped>
.nodes-page {
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

.composer {
  padding: clamp(1.25rem, 3vw, 1.75rem);
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

/* ---- scope selector ---- */
.scope {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  border-radius: 12px;
  border: 1px solid var(--glass-border);
  background: rgba(7, 11, 20, 0.5);
  align-self: flex-start;
}

.scope-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font: inherit;
  font-size: 0.83rem;
  font-weight: 500;
  color: #94a3b8;
  padding: 0.4rem 0.85rem;
  border-radius: 9px;
  cursor: pointer;
  transition: color 0.2s ease, background-color 0.2s ease;
}

.scope-btn:hover {
  color: #e2e8f0;
}

.scope-btn.active {
  color: #04211d;
  background: linear-gradient(92deg, #14b8a6, #0ea5e9);
  font-weight: 600;
}

.target-all {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  font-size: 0.9rem;
  color: #94a3b8;
  padding: 0.9rem 1rem;
  border: 1px dashed var(--glass-border);
  border-radius: 12px;
}

/* ---- examples ---- */
.examples {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.examples-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.example-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  color: #cbd5e1;
  padding: 0.32rem 0.75rem;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: rgba(24, 34, 56, 0.55);
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, color 0.2s ease;
}

.example-chip:hover {
  border-color: rgba(45, 212, 191, 0.5);
  color: #e2e8f0;
}

.example-chip.active {
  border-color: rgba(45, 212, 191, 0.65);
  background: rgba(45, 212, 191, 0.12);
  color: #2dd4bf;
}

.mono-field :deep(input),
.mono-field :deep(textarea) {
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

.payload-wrap {
  position: relative;
}

.format-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1;
  text-transform: none;
}

.composer-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.timeout-field {
  max-width: 150px;
}

.spacer {
  flex: 1 1 auto;
}

.submit-btn {
  min-width: 160px;
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

.results-list {
  display: flex;
  flex-direction: column;
}

.result {
  border-bottom: 1px solid rgba(148, 163, 184, 0.06);
}

.result:last-child {
  border-bottom: none;
}

.result-row {
  display: grid;
  grid-template-columns: 80px 1fr 90px 24px;
  gap: 0.75rem;
  align-items: center;
  width: 100%;
  font: inherit;
  text-align: left;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.6rem 1.1rem;
  color: #d7e2f0;
  transition: background-color 0.15s ease;
}

.result-row:hover {
  background: rgba(148, 163, 184, 0.05);
}

.node-cell {
  font-size: 0.85rem;
}

.twin-cell {
  font-size: 0.8rem;
}

.muted {
  color: #64748b;
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-size: 0.82rem;
  font-weight: 500;
}

.result-output {
  margin: 0;
  padding: 0.9rem 1.25rem 1.1rem;
  font-family: var(--font-mono);
  font-size: 0.82rem;
  line-height: 1.55;
  color: #cbd5e1;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 340px;
  overflow: auto;
  background: rgba(7, 11, 20, 0.55);
}

@media (max-width: 620px) {
  .twin-cell {
    display: none;
  }

  .result-row {
    grid-template-columns: 70px 1fr 24px;
  }
}
</style>
