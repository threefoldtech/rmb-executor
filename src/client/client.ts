import { Client } from "@threefold/rmb_direct_client";

const CHAIN_URL = import.meta.env.VITE_CHAIN_URL || "wss://tfchain.dev.grid.tf/ws";
const RELAY_URL = import.meta.env.VITE_RELAY_URL || "wss://relay.dev.grid.tf/";
const MNEMONIC = import.meta.env.VITE_MNEMONIC || "";

export async function connectClient(): Promise<Client | undefined> {
  // create client
  const client = new Client(
    CHAIN_URL,
    RELAY_URL,
    MNEMONIC,
    "test_client",
    "sr25519",
    10
  );

  try {
    await client.connect();
  } catch (err) {
    console.error(`RMB Client connection failed due to ${err}`);
    return undefined;
  }
  return client;
}

export async function requestRmb(
  rmbClient: Client,
  command: string,
  payload: string,
  destTwinId = 17
): Promise<any> {
  const requestID = await rmbClient.send(
    command,
    payload,
    destTwinId,
    20 / 60,
    5
  );
  const response = await rmbClient.read(requestID);
  return response;
}
