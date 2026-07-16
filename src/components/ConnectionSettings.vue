<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { CUSTOM_NETWORK, NETWORKS } from "../client/networks";
import { useRmb } from "../stores/client";

const rmbStore = useRmb();

const showMnemonic = ref(false);
const expanded = ref(true);

const networkItems = computed(() => [
  ...NETWORKS.map((n) => ({ title: n.label, value: n.key })),
  { title: "Custom endpoints", value: CUSTOM_NETWORK },
]);

const isCustom = computed(() => rmbStore.settings.network === CUSTOM_NETWORK);
const connecting = computed(() => rmbStore.status === "connecting");
const connected = computed(() => rmbStore.status === "connected");

const statusView = computed(() => {
  switch (rmbStore.status) {
    case "connected":
      return { label: "Connected", color: "#4ade80", icon: "mdi-check-circle" };
    case "connecting":
      return { label: "Connecting…", color: "#fbbf24", icon: "mdi-loading" };
    case "error":
      return { label: "Disconnected", color: "#f87171", icon: "mdi-alert-circle" };
    default:
      return { label: "Not connected", color: "#64748b", icon: "mdi-circle-outline" };
  }
});

onMounted(() => {
  // Auto-connect when a mnemonic is already available (e.g. from .env).
  if (rmbStore.settings.mnemonic.trim() && rmbStore.status === "idle") {
    rmbStore.connect();
  }
  // Collapse the panel if we start out connected.
  expanded.value = rmbStore.status !== "connected";
});

const onNetworkChange = async (key: string) => {
  rmbStore.selectNetwork(key);
  // Switch smoothly — reconnect in place if we can, no page reload.
  if (key !== CUSTOM_NETWORK && rmbStore.settings.mnemonic.trim()) {
    await rmbStore.connect();
  }
};

const connect = async () => {
  await rmbStore.connect();
  if (rmbStore.status === "connected") expanded.value = false;
};
</script>

<template>
  <v-card class="glass-card settings rise-in" elevation="0">
    <button class="settings-head" type="button" @click="expanded = !expanded">
      <span class="settings-title">
        <v-icon size="18" color="primary">mdi-tune-variant</v-icon>
        Connection
      </span>
      <span class="settings-status" :style="{ color: statusView.color }">
        <v-icon
          size="16"
          :class="{ spin: connecting }"
          :color="statusView.color"
        >
          {{ statusView.icon }}
        </v-icon>
        {{ statusView.label }}
        <v-icon size="18" color="#64748b">
          {{ expanded ? "mdi-chevron-up" : "mdi-chevron-down" }}
        </v-icon>
      </span>
    </button>

    <v-expand-transition>
      <div v-show="expanded" class="settings-body">
        <div class="settings-grid">
          <v-select
            :model-value="rmbStore.settings.network"
            :items="networkItems"
            label="Network"
            variant="outlined"
            color="primary"
            density="comfortable"
            hide-details="auto"
            prepend-inner-icon="mdi-lan"
            @update:model-value="onNetworkChange"
          />
          <v-text-field
            v-model="rmbStore.settings.chainUrl"
            label="Chain URL"
            :readonly="!isCustom"
            hide-details="auto"
            prepend-inner-icon="mdi-link-variant"
            class="mono-field"
          />
          <v-text-field
            v-model="rmbStore.settings.relayUrl"
            label="Relay URL"
            :readonly="!isCustom"
            hide-details="auto"
            prepend-inner-icon="mdi-transit-connection-variant"
            class="mono-field"
          />
        </div>

        <v-text-field
          v-model="rmbStore.settings.mnemonic"
          label="Mnemonic"
          placeholder="twelve or twenty-four words…"
          :type="showMnemonic ? 'text' : 'password'"
          :append-inner-icon="showMnemonic ? 'mdi-eye-off' : 'mdi-eye'"
          hide-details="auto"
          prepend-inner-icon="mdi-key-variant"
          autocomplete="off"
          class="mono-field mnemonic-field"
          @click:append-inner="showMnemonic = !showMnemonic"
          @keyup.enter="connect"
        />

        <div class="settings-footer">
          <span class="hint">
            <v-icon size="13">mdi-shield-lock-outline</v-icon>
            Kept in this browser session only — never uploaded or saved to disk.
          </span>
          <v-btn
            class="btn-gradient"
            rounded="lg"
            :loading="connecting"
            @click="connect"
          >
            <v-icon start>{{ connected ? "mdi-refresh" : "mdi-power-plug" }}</v-icon>
            {{ connected ? "Reconnect" : "Connect" }}
          </v-btn>
        </div>

        <v-alert
          v-if="rmbStore.status === 'error' && rmbStore.error"
          type="error"
          variant="tonal"
          density="compact"
          class="settings-alert"
        >
          {{ rmbStore.error }}
        </v-alert>
      </div>
    </v-expand-transition>
  </v-card>
</template>

<style scoped>
.settings {
  padding: 0.5rem 0.5rem 0.5rem;
  overflow: hidden;
}

.settings-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font: inherit;
  color: #e2e8f0;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0.65rem 0.85rem;
}

.settings-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
}

.settings-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  font-weight: 500;
}

.settings-body {
  padding: 0.35rem 0.85rem 0.85rem;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
}

.settings-grid {
  display: grid;
  grid-template-columns: 200px 1fr 1fr;
  gap: 0.85rem;
}

.mnemonic-field :deep(input) {
  letter-spacing: 0.04em;
}

.settings-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.hint {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.76rem;
  color: #64748b;
}

.settings-alert {
  font-size: 0.82rem;
}

.spin {
  animation: spin 0.9s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}
</style>
