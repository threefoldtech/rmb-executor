<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import ConnectionSettings from "./components/ConnectionSettings.vue";
import { useRmb } from "./stores/client";

const rmbStore = useRmb();
const route = useRoute();
const menuOpen = ref(false);

const status = computed(() => {
  switch (rmbStore.status) {
    case "connected":
      return { label: "Connected", color: "#4ade80", pulse: false };
    case "connecting":
      return { label: "Connecting…", color: "#fbbf24", pulse: true };
    case "error":
      return { label: "Disconnected", color: "#f87171", pulse: false };
    default:
      return { label: "Not connected", color: "#64748b", pulse: false };
  }
});

onMounted(() => {
  // Auto-connect once on load when a mnemonic is already available (e.g. .env).
  if (rmbStore.settings.mnemonic.trim() && rmbStore.status === "idle") {
    rmbStore.connect();
  }
});
</script>

<template>
  <v-app>
    <!-- Ambient background: radial glows + grid lines -->
    <div class="bg-layer" aria-hidden="true">
      <div class="bg-glow bg-glow--teal"></div>
      <div class="bg-glow bg-glow--cyan"></div>
      <div class="bg-grid"></div>
    </div>

    <header class="topbar">
      <RouterLink to="/" class="brand">
        <span class="brand-mark">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none">
            <path
              d="M12 2 20.5 7v10L12 22 3.5 17V7L12 2Z"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
            <path
              d="M12 22V12m0 0L3.5 7M12 12l8.5-5"
              stroke="currentColor"
              stroke-width="1.6"
              stroke-linejoin="round"
            />
          </svg>
        </span>
        <span class="brand-name">RMB <em>Executor</em></span>
      </RouterLink>

      <nav class="topnav">
        <RouterLink to="/" :class="{ active: route.name === 'home' }">Execute</RouterLink>
        <RouterLink to="/nodes" :class="{ active: route.name === 'nodes' }">Nodes</RouterLink>
        <RouterLink
          to="/node-version"
          :class="{ active: route.name === 'node-version' }"
        >
          Node Version
        </RouterLink>
        <RouterLink to="/about" :class="{ active: route.name === 'about' }">About</RouterLink>
      </nav>

      <v-menu
        v-model="menuOpen"
        :close-on-content-click="false"
        location="bottom end"
        offset="10"
      >
        <template #activator="{ props }">
          <button
            v-bind="props"
            class="status-chip"
            type="button"
            :title="status.label"
          >
            <span
              class="status-dot"
              :class="{ pulse: status.pulse }"
              :style="{ backgroundColor: status.color, color: status.color }"
            ></span>
            {{ status.label }}
            <v-icon size="16" color="#64748b">mdi-chevron-down</v-icon>
          </button>
        </template>

        <ConnectionSettings @connected="menuOpen = false" />
      </v-menu>
    </header>

    <v-main>
      <RouterView />
    </v-main>

    <footer class="footer">
      <span>Reliable Message Bus · ThreeFold Grid</span>
      <span class="mono">{{ rmbStore.settings.network }} net</span>
    </footer>
  </v-app>
</template>

<style scoped>
/* ---- background ---- */
.bg-layer {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}

.bg-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(90px);
}

.bg-glow--teal {
  width: 560px;
  height: 560px;
  top: -220px;
  left: 50%;
  transform: translateX(-70%);
  background: radial-gradient(circle, rgba(20, 184, 166, 0.22), transparent 65%);
}

.bg-glow--cyan {
  width: 480px;
  height: 480px;
  top: -160px;
  left: 50%;
  transform: translateX(10%);
  background: radial-gradient(circle, rgba(14, 165, 233, 0.16), transparent 65%);
}

.bg-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(148, 163, 184, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.05) 1px, transparent 1px);
  background-size: 44px 44px;
  mask-image: radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 80%);
  -webkit-mask-image: radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 80%);
}

/* ---- top bar ---- */
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 1.75rem;
  padding: 0.85rem clamp(1rem, 4vw, 2.5rem);
  background: rgba(7, 11, 20, 0.65);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  border-bottom: 1px solid var(--glass-border);
}

.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  text-decoration: none;
  color: #f1f5f9;
}

.brand-mark {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  color: #04211d;
  background: linear-gradient(135deg, #2dd4bf, #0ea5e9);
  box-shadow: 0 4px 16px -4px rgba(20, 184, 166, 0.6);
}

.brand-name {
  font-weight: 700;
  font-size: 1rem;
  letter-spacing: -0.01em;
}

.brand-name em {
  font-style: normal;
  color: #94a3b8;
  font-weight: 500;
}

.topnav {
  display: flex;
  gap: 0.25rem;
  margin-right: auto;
}

.topnav a {
  color: #94a3b8;
  text-decoration: none;
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.35rem 0.8rem;
  border-radius: 8px;
  transition: color 0.2s ease, background-color 0.2s ease;
  white-space: nowrap;
}

.topnav a:hover {
  color: #e2e8f0;
  background: rgba(148, 163, 184, 0.08);
}

.topnav a.active {
  color: #2dd4bf;
  background: rgba(45, 212, 191, 0.1);
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 500;
  color: #cbd5e1;
  padding: 0.35rem 0.6rem 0.35rem 0.85rem;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: rgba(13, 20, 36, 0.6);
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.status-chip:hover {
  border-color: rgba(148, 163, 184, 0.35);
}

/* ---- footer ---- */
.footer {
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem clamp(1rem, 4vw, 2.5rem);
  color: #475569;
  font-size: 0.78rem;
  border-top: 1px solid rgba(148, 163, 184, 0.08);
}

@media (max-width: 620px) {
  .brand-name {
    display: none;
  }

  .topbar {
    gap: 0.75rem;
  }

  .topnav {
    gap: 0;
  }

  .topnav a {
    padding: 0.35rem 0.55rem;
    font-size: 0.8rem;
  }
}
</style>
