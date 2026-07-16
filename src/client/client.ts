import { Client } from "@threefold/rmb_direct_client";

export interface RmbConfig {
  chainUrl: string;
  relayUrl: string;
  mnemonic: string;
  session?: string;
  keypairType?: "sr25519" | "ed25519";
  retries?: number;
}

export interface ConnectResult {
  client?: Client;
  error?: string;
}

export async function connectClient(config: RmbConfig): Promise<ConnectResult> {
  const client = new Client(
    config.chainUrl,
    config.relayUrl,
    config.mnemonic,
    config.session ?? "rmb_executor",
    config.keypairType ?? "sr25519",
    config.retries ?? 10
  );

  try {
    await client.connect();
  } catch (err) {
    console.error(`RMB Client connection failed due to ${err}`);
    return { error: String(err) };
  }
  return { client };
}

export async function requestRmb(
  rmbClient: Client,
  command: string,
  payload: string,
  destTwinId = 17,
  expirationMinutes = 1,
  retries = 5
): Promise<unknown> {
  const requestID = await rmbClient.send(
    command,
    payload,
    destTwinId,
    expirationMinutes,
    retries
  );
  return rmbClient.read(requestID);
}
