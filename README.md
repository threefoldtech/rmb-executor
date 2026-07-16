# RMB Executor

A web UI for the ThreeFold Grid's **Reliable Message Bus** (RMB). Connect a client
twin, send any RMB command (e.g. `zos.system.version`) to a destination twin, and
inspect the raw response — with request history, JSON formatting, and live
connection status.

Built with Vue 3, Vuetify 3, Pinia, and Vite.

## Setup

```sh
yarn
cp .env.example .env   # then fill in your mnemonic
```

| Variable         | Description                              | Default                       |
| ---------------- | ---------------------------------------- | ----------------------------- |
| `VITE_MNEMONIC`  | Mnemonic of the twin used to sign        | *(required)*                  |
| `VITE_CHAIN_URL` | TFChain websocket endpoint               | `wss://tfchain.dev.grid.tf/ws`|
| `VITE_RELAY_URL` | RMB relay websocket endpoint             | `wss://relay.dev.grid.tf/`    |

> Never commit a real mnemonic — `.env` files are git-ignored.

## Development

```sh
yarn dev
```

## Type-Check, Compile and Minify for Production

```sh
yarn build
yarn preview
```
