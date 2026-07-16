<script setup lang="ts">
import RmbExecutor from "../components/RmbExecutor.vue";
</script>

<template>
  <div class="executor-page">
    <section class="hero rise-in">
      <span class="hero-pill">
        <span class="status-dot" style="background: #2dd4bf; color: #2dd4bf"></span>
        ThreeFold Grid · Reliable Message Bus
      </span>
      <h1 class="gradient-text">Talk to any twin on the grid.</h1>
      <p>
        Craft an RMB command, point it at a twin, and inspect the raw response —
        no tooling setup required.
      </p>
    </section>

    <RmbExecutor />
  </div>
</template>

<style scoped>
.executor-page {
  width: min(780px, 100%);
  margin: 0 auto;
  padding: clamp(2.5rem, 7vh, 4.5rem) 1.25rem 4rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.hero {
  text-align: center;
  margin-bottom: 0.5rem;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  font-weight: 500;
  color: #94a3b8;
  padding: 0.35rem 0.9rem;
  border-radius: 999px;
  border: 1px solid var(--glass-border);
  background: rgba(13, 20, 36, 0.6);
  margin-bottom: 1.25rem;
}

.hero h1 {
  font-size: clamp(2rem, 5.5vw, 3.1rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.12;
  margin-bottom: 0.85rem;
}

.hero p {
  color: #94a3b8;
  font-size: 1.02rem;
  max-width: 32rem;
  margin: 0 auto;
  line-height: 1.6;
}
</style>
