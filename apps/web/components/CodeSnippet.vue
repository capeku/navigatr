<script setup lang="ts">
const props = defineProps<{
  origin: string
  destination: string
}>()

const copied = ref(false)

const code = computed(() => `import { Navigatr } from '@navigatr/web'

const nav = new Navigatr()
const map = nav.map({ container: 'map', center: { lat: 5.6037, lng: -0.1870 } })

const origin = await nav.geocode({ address: '${props.origin}' })
const destination = await nav.geocode({ address: '${props.destination}' })
const result = await nav.route({ origin, destination })

map.addMarker({ ...origin, label: 'Origin' })
map.addMarker({ ...destination, label: 'Destination' })
map.drawRoute(result.polyline)
map.fitRoute(result.polyline)`)

async function copyCode() {
  await navigator.clipboard.writeText(code.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<template>
  <div class="code-snippet">
    <div class="code-header">
      <span class="code-title">example.ts</span>
      <button class="copy-btn" @click="copyCode">
        {{ copied ? 'Copied!' : 'Copy' }}
      </button>
    </div>
    <pre class="code-block"><code><span class="keyword">import</span> <span class="brace">{</span> <span class="type">Navigatr</span> <span class="brace">}</span> <span class="keyword">from</span> <span class="string">'@navigatr/web'</span>

<span class="keyword">const</span> <span class="variable">nav</span> <span class="operator">=</span> <span class="keyword">new</span> <span class="type">Navigatr</span><span class="brace">()</span>
<span class="keyword">const</span> <span class="variable">map</span> <span class="operator">=</span> <span class="variable">nav</span>.<span class="function">map</span><span class="brace">({</span> <span class="property">container</span>: <span class="string">'map'</span>, <span class="property">center</span>: <span class="brace">{</span> <span class="property">lat</span>: <span class="number">5.6037</span>, <span class="property">lng</span>: <span class="number">-0.1870</span> <span class="brace">}</span> <span class="brace">})</span>

<span class="keyword">const</span> <span class="variable">origin</span> <span class="operator">=</span> <span class="keyword">await</span> <span class="variable">nav</span>.<span class="function">geocode</span><span class="brace">({</span> <span class="property">address</span>: <span class="string">'{{ origin }}'</span> <span class="brace">})</span>
<span class="keyword">const</span> <span class="variable">destination</span> <span class="operator">=</span> <span class="keyword">await</span> <span class="variable">nav</span>.<span class="function">geocode</span><span class="brace">({</span> <span class="property">address</span>: <span class="string">'{{ destination }}'</span> <span class="brace">})</span>
<span class="keyword">const</span> <span class="variable">result</span> <span class="operator">=</span> <span class="keyword">await</span> <span class="variable">nav</span>.<span class="function">route</span><span class="brace">({</span> <span class="variable">origin</span>, <span class="variable">destination</span> <span class="brace">})</span>

<span class="variable">map</span>.<span class="function">addMarker</span><span class="brace">({</span> ...<span class="variable">origin</span>, <span class="property">label</span>: <span class="string">'Origin'</span> <span class="brace">})</span>
<span class="variable">map</span>.<span class="function">addMarker</span><span class="brace">({</span> ...<span class="variable">destination</span>, <span class="property">label</span>: <span class="string">'Destination'</span> <span class="brace">})</span>
<span class="variable">map</span>.<span class="function">drawRoute</span><span class="brace">(</span><span class="variable">result</span>.<span class="property">polyline</span><span class="brace">)</span>
<span class="variable">map</span>.<span class="function">fitRoute</span><span class="brace">(</span><span class="variable">result</span>.<span class="property">polyline</span><span class="brace">)</span></code></pre>
  </div>
</template>

<style scoped>
.code-snippet {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--border);
}

.code-title {
  font-size: 12px;
  color: var(--text-muted);
}

.copy-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 4px 12px;
  border-radius: 4px;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.code-block {
  padding: 16px;
  overflow-x: auto;
  font-size: 13px;
  line-height: 1.6;
}

code {
  font-family: 'IBM Plex Mono', monospace;
}

.keyword { color: #c678dd; }
.string { color: #98c379; }
.number { color: #d19a66; }
.type { color: #e5c07b; }
.variable { color: #e06c75; }
.function { color: #61afef; }
.property { color: #abb2bf; }
.operator { color: #56b6c2; }
.brace { color: #abb2bf; }
</style>
