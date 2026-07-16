<script setup lang="ts">
import { computed, ref } from "vue";
import { CUSTOM_NETWORK, NETWORKS } from "../client/networks";
import { useRmb } from "../stores/client";

const emit = defineEmits<{ (e: "connected"): void }>();

const rmbStore = useRmb();

const showMnemonic = ref(false);

const networkItems = computed(() => [
  ...NETWORKS.map((n) => ({ title: n.label, value: n.key })),
  { title: "Custom endpoints", value: CUSTOM_NETWORK },
]);

const isCustom = computed(() => rmbStore.settings.network === CUSTOM_NETWORK);
const connecting = computed(() => rmbStore.status === "connecting");
const connected = computed(() => rmbStore.status === "connected");

const onNetworkChange = async (key: string) => {
  rmbStore.selectNetwork(key);
  // Switch smoothly — reconnect in place if we can, no page reload.
  if (key !== CUSTOM_NETWORK && rmbStore.settings.mnemonic.trim()) {
    await rmbStore.connect();
    if (rmbStore.status === "connected") emit("connected");
  }
};

const connect = async () => {
  await rmbStore.connect();
  if (rmbStore.status === "connected") emit("connected");
};
</script>

<template>
  <v-card class="glass-card settings" elevation="0">
    <div class="settings-head">
      <span class="settings-title">
        <v-icon size="18" color="primary">mdi-tune-variant</v-icon>
        Connection
      </span>
    </div>

    <div class="settings-body">
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

      <div class="url-grid">
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
        <v-text-field
          v-model="rmbStore.settings.gridProxyUrl"
          label="Grid Proxy URL"
          :readonly="!isCustom"
          hide-details="auto"
          prepend-inner-icon="mdi-api"
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

      <span class="hint">
        <v-icon size="13">mdi-shield-lock-outline</v-icon>
        Kept in this browser session only — never uploaded or saved to disk.
      </span>

      <v-btn
        block
        class="btn-gradient"
        rounded="lg"
        :loading="connecting"
        @click="connect"
      >
        <v-icon start>{{ connected ? "mdi-refresh" : "mdi-power-plug" }}</v-icon>
        {{ connected ? "Reconnect" : "Connect" }}
      </v-btn>

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
  </v-card>
</template>

<style scoped>
.settings {
  width: 440px;
  max-width: 92vw;
  padding: 1rem;
}

.settings-head {
  margin-bottom: 0.9rem;
}

.settings-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  color: #e2e8f0;
}

.settings-body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.url-grid {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.mono-field :deep(input) {
  font-family: var(--font-mono);
  font-size: 0.85rem;
}

.mnemonic-field :deep(input) {
  letter-spacing: 0.04em;
}

.hint {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  color: #64748b;
  line-height: 1.4;
}

.settings-alert {
  font-size: 0.82rem;
}
</style>
