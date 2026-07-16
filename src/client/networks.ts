export interface NetworkDef {
  key: string;
  label: string;
  chainUrl: string;
  relayUrl: string;
}

export const NETWORKS: NetworkDef[] = [
  {
    key: "dev",
    label: "Dev net",
    chainUrl: "wss://tfchain.dev.grid.tf/ws",
    relayUrl: "wss://relay.dev.grid.tf/",
  },
  {
    key: "qa",
    label: "QA net",
    chainUrl: "wss://tfchain.qa.grid.tf/ws",
    relayUrl: "wss://relay.qa.grid.tf/",
  },
  {
    key: "test",
    label: "Test net",
    chainUrl: "wss://tfchain.test.grid.tf/ws",
    relayUrl: "wss://relay.test.grid.tf/",
  },
  {
    key: "main",
    label: "Main net",
    chainUrl: "wss://tfchain.grid.tf/ws",
    relayUrl: "wss://relay.grid.tf/",
  },
];

export const CUSTOM_NETWORK = "custom";

/** Example RMB commands surfaced as one-click presets in the composer. */
export interface CommandExample {
  label: string;
  command: string;
  payload: string;
  icon: string;
}

export const COMMAND_EXAMPLES: CommandExample[] = [
  { label: "Version", command: "zos.system.version", payload: "", icon: "mdi-tag-outline" },
  { label: "Diagnostics", command: "zos.system.diagnostics", payload: "", icon: "mdi-stethoscope" },
  { label: "Statistics", command: "zos.statistics.get", payload: "", icon: "mdi-chart-box-outline" },
  { label: "System info (DMI)", command: "zos.system.dmi", payload: "", icon: "mdi-chip" },
  { label: "Hypervisor", command: "zos.system.hypervisor", payload: "", icon: "mdi-server" },
  { label: "Storage pools", command: "zos.storage.pools", payload: "", icon: "mdi-database-outline" },
  { label: "GPU list", command: "zos.gpu.list", payload: "", icon: "mdi-expansion-card" },
];
