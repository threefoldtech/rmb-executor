import type { Client } from "@threefold/rmb_direct_client";
import { defineStore } from "pinia";
import { markRaw } from "vue";
import { connectClient } from "../client/client";
import { NETWORKS } from "../client/networks";

export type ConnectionStatus = "idle" | "connecting" | "connected" | "error";

export interface RmbSettings {
  network: string;
  chainUrl: string;
  relayUrl: string;
  gridProxyUrl: string;
  mnemonic: string;
}

export interface IClient {
  // Typed as `unknown` so the huge Client class type doesn't leak into the
  // store's inferred type (it exceeds what the compiler can serialize).
  // Read it through the typed `rmbClient` getter instead.
  client: unknown;
  status: ConnectionStatus;
  error: string;
  settings: RmbSettings;
}

const LS_NETWORK = "rmb.network";
const LS_CHAIN = "rmb.chainUrl";
const LS_RELAY = "rmb.relayUrl";
const LS_PROXY = "rmb.gridProxyUrl";

function initialSettings(): RmbSettings {
  const savedNetwork = localStorage.getItem(LS_NETWORK) ?? "dev";
  const net = NETWORKS.find((n) => n.key === savedNetwork);
  return {
    network: savedNetwork,
    chainUrl:
      localStorage.getItem(LS_CHAIN) ??
      net?.chainUrl ??
      import.meta.env.VITE_CHAIN_URL ??
      NETWORKS[0].chainUrl,
    relayUrl:
      localStorage.getItem(LS_RELAY) ??
      net?.relayUrl ??
      import.meta.env.VITE_RELAY_URL ??
      NETWORKS[0].relayUrl,
    gridProxyUrl:
      localStorage.getItem(LS_PROXY) ??
      net?.gridProxyUrl ??
      import.meta.env.VITE_GRIDPROXY_URL ??
      NETWORKS[0].gridProxyUrl,
    // Kept in memory only (prefilled from the env) — never persisted to disk.
    mnemonic: import.meta.env.VITE_MNEMONIC ?? "",
  };
}

const useRmb = defineStore("rmb-client", {
  state: (): IClient => ({
    client: undefined,
    status: "idle",
    error: "",
    settings: initialSettings(),
  }),

  getters: {
    rmbClient: (state): Client | undefined =>
      state.client as Client | undefined,
  },

  actions: {
    persist() {
      localStorage.setItem(LS_NETWORK, this.settings.network);
      localStorage.setItem(LS_CHAIN, this.settings.chainUrl);
      localStorage.setItem(LS_RELAY, this.settings.relayUrl);
      localStorage.setItem(LS_PROXY, this.settings.gridProxyUrl);
    },

    selectNetwork(key: string) {
      this.settings.network = key;
      const net = NETWORKS.find((n) => n.key === key);
      if (net) {
        this.settings.chainUrl = net.chainUrl;
        this.settings.relayUrl = net.relayUrl;
        this.settings.gridProxyUrl = net.gridProxyUrl;
      }
      this.persist();
    },

    async connect() {
      // Tear down any existing connection so switching networks is clean.
      const existing = this.client as Client | undefined;
      if (existing) {
        try {
          await existing.disconnect();
        } catch {
          /* ignore teardown errors */
        }
      }
      this.client = undefined;
      this.error = "";

      if (!this.settings.mnemonic.trim()) {
        this.status = "error";
        this.error = "A mnemonic is required to connect.";
        return;
      }

      this.status = "connecting";
      this.persist();

      const { client, error } = await connectClient({
        chainUrl: this.settings.chainUrl,
        relayUrl: this.settings.relayUrl,
        mnemonic: this.settings.mnemonic.trim(),
      });

      // markRaw: the client holds a live WebSocket; Vue's reactive proxy
      // must not wrap it.
      this.client = client ? markRaw(client) : undefined;
      this.status = client ? "connected" : "error";
      this.error = client ? "" : error ?? "Connection failed.";
    },
  },
});

export { useRmb };
