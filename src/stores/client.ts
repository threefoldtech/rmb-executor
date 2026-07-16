import type { Client } from "@threefold/rmb_direct_client";
import { defineStore } from "pinia";
import { markRaw } from "vue";
import { connectClient } from "../client/client";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

export interface IClient {
  // Typed as `unknown` so the huge Client class type doesn't leak into the
  // store's inferred type (it exceeds what the compiler can serialize).
  // Read it through the typed `rmbClient` getter instead.
  client: unknown;
  status: ConnectionStatus;
}

const useRmb = defineStore("rmb-client", {
  state: (): IClient => {
    return { client: undefined, status: "idle" };
  },

  getters: {
    rmbClient: (state): Client | undefined =>
      state.client as Client | undefined,
  },

  actions: {
    async set() {
      this.status = "connecting";
      const client = await connectClient();
      // markRaw: the client holds a live WebSocket; Vue's reactive proxy
      // must not wrap it.
      this.client = client ? markRaw(client) : undefined;
      this.status = client ? "connected" : "error";
    },
  },
});

export { useRmb };
