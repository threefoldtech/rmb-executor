<template>
  <div class="about rise-in">
    <h1 class="gradient-text">About RMB Executor</h1>
    <p>
      The <strong>Reliable Message Bus</strong> (RMB) is the messaging layer of the
      ThreeFold Grid: every node and user is represented by a <em>twin</em>, and twins
      exchange signed, end-to-end encrypted messages through relays.
    </p>
    <p>
      This tool connects a client twin to the grid and lets you send any RMB command —
      like <code>zos.system.version</code> — to a destination twin, then inspect the raw
      response. It is aimed at developers exploring or debugging grid services.
    </p>

    <div class="cards">
      <div class="card glass-card">
        <h2>1 · Connect</h2>
        <p>
          Set your mnemonic and pick a network (dev, QA, test, main, or custom
          endpoints) right in the Connection panel. Switching networks reconnects in
          place — no page reload.
        </p>
      </div>
      <div class="card glass-card">
        <h2>2 · Compose</h2>
        <p>
          Start from an example like <code>zos.system.version</code>, or type your own
          command, twin ID, payload, and expiration. JSON payloads can be auto-formatted
          before sending.
        </p>
      </div>
      <div class="card glass-card">
        <h2>3 · Inspect</h2>
        <p>
          Responses are pretty-printed and timed. Recent commands stay one click away so
          you can iterate quickly.
        </p>
      </div>
    </div>

    <p class="links">
      Learn more in the
      <a
        href="https://github.com/threefoldtech/rmb-rs"
        target="_blank"
        rel="noopener noreferrer"
        >RMB repository</a
      >
      and the
      <a
        href="https://manual.grid.tf/"
        target="_blank"
        rel="noopener noreferrer"
        >ThreeFold manual</a
      >.
    </p>
  </div>
</template>

<style scoped>
.about {
  width: min(760px, 100%);
  margin: 0 auto;
  padding: clamp(2.5rem, 7vh, 5rem) 1.25rem 4rem;
}

h1 {
  font-size: clamp(1.8rem, 4.5vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  margin-bottom: 1.25rem;
}

.about > p {
  color: #94a3b8;
  line-height: 1.7;
  margin-bottom: 1rem;
  max-width: 40rem;
}

code {
  font-size: 0.85em;
  color: #2dd4bf;
  background: rgba(45, 212, 191, 0.08);
  padding: 0.1em 0.4em;
  border-radius: 6px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin: 1.75rem 0;
}

.card {
  padding: 1.25rem;
}

.card h2 {
  font-size: 0.95rem;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 0.5rem;
}

.card p {
  font-size: 0.85rem;
  color: #94a3b8;
  line-height: 1.6;
}

.links a {
  color: #38bdf8;
  text-decoration: none;
  border-bottom: 1px solid rgba(56, 189, 248, 0.35);
  transition: border-color 0.2s ease;
}

.links a:hover {
  border-color: #38bdf8;
}
</style>
