import { fileURLToPath, URL } from "node:url";

import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import vueDevTools from "vite-plugin-vue-devtools";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import vuetify from "vite-plugin-vuetify";

// https://vite.dev/config/
export default defineConfig(() => ({
  // Served from the custom domain root (https://rmb.grid.tf/) in production
  // and at root during dev, so the base is "/" in both cases.
  base: "/",
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
