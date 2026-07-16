<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { requestRmb } from "../client/client";
import { useRmb } from "../stores/client";

interface HistoryEntry {
  command: string;
  payload: string;
  twinId: number;
  ok: boolean;
}

const rmbStore = useRmb();

const formData = ref({
  command: "",
  payload: "",
  twinId: 17,
});

const loading = ref(false);
const hasResponse = ref(false);
const responseOk = ref(true);
const response = ref("");
const elapsedMs = ref(0);
const copied = ref(false);
const history = ref<HistoryEntry[]>([]);

onMounted(() => {
  if (rmbStore.status === "idle" || rmbStore.status === "error") {
    rmbStore.set();
  }
});

const canSubmit = computed(
  () => formData.value.command.trim().length > 0 && !loading.value
);

const prettify = (value: unknown): string => {
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  return JSON.stringify(value, null, 2);
};

const formatPayload = () => {
  try {
    formData.value.payload = JSON.stringify(
      JSON.parse(formData.value.payload),
      null,
      2
    );
  } catch {
    /* leave non-JSON payloads untouched */
  }
};

const pushHistory = (ok: boolean) => {
  const entry: HistoryEntry = {
    command: formData.value.command,
    payload: formData.value.payload,
    twinId: Number(formData.value.twinId),
    ok,
  };
  history.value = [
    entry,
    ...history.value.filter(
      (h) => !(h.command === entry.command && h.twinId === entry.twinId)
    ),
  ].slice(0, 5);
};

const handleSubmit = async () => {
  if (!canSubmit.value) return;

  if (!rmbStore.rmbClient) {
    hasResponse.value = true;
    responseOk.value = false;
    response.value =
      "RMB client is not connected. Check the relay/chain endpoints and your mnemonic, then use the status chip to reconnect.";
    return;
  }

  loading.value = true;
  copied.value = false;
  const started = performance.now();

  try {
    const result = await requestRmb(
      rmbStore.rmbClient,
      formData.value.command.trim(),
      formData.value.payload,
      Number(formData.value.twinId)
    );
    response.value = prettify(result);
    responseOk.value = true;
    pushHistory(true);
  } catch (err) {
    response.value = String(err);
    responseOk.value = false;
    pushHistory(false);
  } finally {
    elapsedMs.value = Math.round(performance.now() - started);
    hasResponse.value = true;
    loading.value = false;
  }
};

const copyResponse = async () => {
  try {
    await navigator.clipboard.writeText(response.value);
    copied.value = true;
    setTimeout(() => (copied.value = false), 1600);
  } catch {
    /* clipboard unavailable (e.g. insecure context) */
  }
};

const applyHistory = (entry: HistoryEntry) => {
  formData.value = {
    command: entry.command,
    payload: entry.payload,
    twinId: entry.twinId,
  };
};
</script>

<template>
  <div class="executor">
    <!-- Hero -->
    <section class="hero rise-in">
      <span class="hero-pill">
        <span class="status-dot" style="background: #2dd4bf; color: #2dd4bf"></span>
        ThreeFold Grid · Reliable Message Bus
      </span>
      <h1 class="gradient-text">Talk to any twin on the grid.</h1>
      <p>
        Craft an RMB command, point it at a twin, and inspect the raw response —
        no tooling setup required.
      </p>
    </section>

    <!-- Command composer -->
    <v-card class="glass-card composer rise-in" elevation="0" style="animation-delay: 0.08s">
      <form @submit.prevent="handleSubmit">
        <div class="composer-grid">
          <v-text-field
            v-model="formData.twinId"
            label="Twin ID"
            type="number"
            min="1"
            hide-details="auto"
            prepend-inner-icon="mdi-target"
          />
          <v-text-field
            v-model="formData.command"
            label="Command"
            placeholder="zos.system.version"
            hide-details="auto"
            prepend-inner-icon="mdi-console-line"
            class="mono-field"
          />
        </div>

        <div class="payload-wrap">
          <v-textarea
            v-model="formData.payload"
            label="Payload"
            placeholder='{ "key": "value" } — leave empty if the command takes none'
            rows="5"
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
          <div v-if="history.length" class="history">
            <span class="history-label">Recent</span>
            <button
              v-for="entry in history"
              :key="`${entry.command}-${entry.twinId}`"
              type="button"
              class="history-chip"
              :class="{ failed: !entry.ok }"
              :title="`Twin ${entry.twinId} · ${entry.ok ? 'succeeded' : 'failed'}`"
              @click="applyHistory(entry)"
            >
              <span class="mono">{{ entry.command }}</span>
              <span class="history-twin">#{{ entry.twinId }}</span>
            </button>
          </div>

          <v-btn
            type="submit"
            class="btn-gradient submit-btn"
            size="large"
            rounded="lg"
            :loading="loading"
            :disabled="!canSubmit"
          >
            <v-icon start>mdi-send-variant</v-icon>
            Execute
          </v-btn>
        </div>
      </form>
    </v-card>

    <!-- Response -->
    <v-expand-transition>
      <v-card
        v-if="hasResponse"
        class="glass-card response"
        elevation="0"
        :class="responseOk ? 'response--ok' : 'response--err'"
      >
        <div class="response-head">
          <div class="response-title">
            <v-icon size="18" :color="responseOk ? 'success' : 'error'">
              {{ responseOk ? "mdi-check-circle" : "mdi-alert-circle" }}
            </v-icon>
            <span>{{ responseOk ? "Response" : "Error" }}</span>
            <span class="response-meta mono">{{ elapsedMs }} ms</span>
          </div>
          <v-btn size="small" variant="text" color="secondary" @click="copyResponse">
            <v-icon start size="16">
              {{ copied ? "mdi-check" : "mdi-content-copy" }}
            </v-icon>
            {{ copied ? "Copied" : "Copy" }}
          </v-btn>
        </div>
        <pre class="response-body">{{ response }}</pre>
      </v-card>
    </v-expand-transition>
  </div>
</template>

<style scoped>
.executor {
  width: min(760px, 100%);
  margin: 0 auto;
  padding: clamp(2.5rem, 7vh, 5rem) 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* ---- hero ---- */
.hero {
  text-align: center;
  margin-bottom: 0.75rem;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: #94a3b8;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: rgba(13, 20, 36, 0.6);
  margin-bottom: 1.25rem;
}

.hero h1 {
  font-size: clamp(2rem, 5.5vw, 3.1rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.12;
  margin-bottom: 0.85rem;
}

.hero p {
  color: #94a3b8;
  font-size: 1.02rem;
  max-width: 32rem;
  margin: 0 auto;
  line-height: 1.6;
}

/* ---- composer ---- */
.composer {
  padding: clamp(1.25rem, 3vw, 1.75rem);
}

.composer-grid {
  display: grid;
  grid-template-columns: 160px 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
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

.mono-field :deep(input),
.mono-field :deep(textarea) {
  font-family: var(--font-mono);
  font-size: 0.9rem;
}

.composer-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 1.25rem;
}

.submit-btn {
  min-width: 170px;
}

/* ---- history ---- */
.history {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-right: auto;
}

.history-label {
  font-size: 0.72rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: #64748b;
}

.history-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  font: inherit;
  font-size: 0.78rem;
  color: #cbd5e1;
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: rgba(24, 34, 56, 0.55);
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;
}

.history-chip:hover {
  border-color: rgba(45, 212, 191, 0.5);
  background: rgba(45, 212, 191, 0.08);
}

.history-chip.failed {
  border-color: rgba(248, 113, 113, 0.35);
}

.history-twin {
  color: #64748b;
  font-size: 0.72rem;
}

/* ---- response ---- */
.response {
  overflow: hidden;
}

.response--ok {
  border-color: rgba(74, 222, 128, 0.25) !important;
}

.response--err {
  border-color: rgba(248, 113, 113, 0.3) !important;
}

.response-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1.1rem;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
}

.response-title {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  font-weight: 600;
  font-size: 0.92rem;
}

.response-meta {
  color: #64748b;
  font-size: 0.75rem;
  font-weight: 400;
  margin-left: 0.35rem;
}

.response-body {
  margin: 0;
  padding: 1.1rem 1.25rem 1.35rem;
  font-size: 0.85rem;
  line-height: 1.6;
  color: #d7e2f0;
  white-space: pre-wrap;
  word-break: break-word;
  max-height: 420px;
  overflow: auto;
}

@media (max-width: 560px) {
  .composer-grid {
    grid-template-columns: 1fr;
  }

  .submit-btn {
    width: 100%;
  }

  .history {
    margin-right: 0;
  }
}
</style>
