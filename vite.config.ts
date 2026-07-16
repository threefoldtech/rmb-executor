import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import vuetify from "vite-plugin-vuetify";

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Served from a GitHub Pages project subpath in production
  // (https://threefoldtech.github.io/rmb-executor/); root during dev.
  base: command === "build" ? "/rmb-executor/" : "/",
  plugins: [
    vue(),
    nodePolyfills(),
    vueDevTools(),
    vuetify({ autoImport: true }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
}));
