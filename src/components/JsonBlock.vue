<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{ content: string }>();

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Token regex: strings (optionally a key when followed by ':'), booleans,
// null, and numbers. Run over already HTML-escaped text.
const TOKEN =
  /("(?:\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(?:\s*:)?|\b(?:true|false)\b|\bnull\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

function highlight(json: string): string {
  return escapeHtml(json).replace(TOKEN, (match) => {
    let cls = "j-num";
    if (/^"/.test(match)) {
      cls = /:$/.test(match) ? "j-key" : "j-str";
    } else if (/^(true|false)$/.test(match)) {
      cls = "j-bool";
    } else if (match === "null") {
      cls = "j-null";
    }
    return `<span class="${cls}">${match}</span>`;
  });
}

// Highlight only when the content actually parses as JSON; otherwise show it
// verbatim (e.g. plain error strings) so nothing is mangled.
const html = computed(() => {
  const raw = props.content ?? "";
  const trimmed = raw.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return highlight(JSON.stringify(JSON.parse(trimmed), null, 2));
    } catch {
      /* fall through to plain */
    }
  }
  return escapeHtml(raw);
});
</script>

<template>
  <pre class="json-block"><code v-html="html"></code></pre>
</template>

<style scoped>
.json-block {
  margin: 0;
  font-family: var(--font-mono);
  white-space: pre-wrap;
  word-break: break-word;
}

.json-block :deep(.j-key) {
  color: #7dd3fc;
}

.json-block :deep(.j-str) {
  color: #86efac;
}

.json-block :deep(.j-num) {
  color: #fca5a5;
}

.json-block :deep(.j-bool) {
  color: #c4b5fd;
  font-weight: 600;
}

.json-block :deep(.j-null) {
  color: #64748b;
  font-style: italic;
}
</style>
