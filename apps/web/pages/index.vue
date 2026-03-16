<script setup lang="ts">
import type { LatLng, RouteResult, GeocodeResult } from '@navigatr/web'

const originInput = ref('Accra Mall, Ghana')
const destinationInput = ref('Kotoka Airport, Ghana')

const origin = ref<GeocodeResult | null>(null)
const destination = ref<GeocodeResult | null>(null)
const routeResult = ref<RouteResult | null>(null)
const polyline = ref<LatLng[]>([])
const loading = ref(false)
const error = ref('')

async function getRoute() {
  loading.value = true
  error.value = ''

  try {
    const { Navigatr } = await import('@navigatr/web')
    const nav = new Navigatr()

    origin.value = await nav.geocode({ address: originInput.value })
    destination.value = await nav.geocode({ address: destinationInput.value })
    routeResult.value = await nav.route({
      origin: origin.value,
      destination: destination.value
    })
    polyline.value = routeResult.value.polyline
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'An error occurred'
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getRoute()
})
</script>

<template>
  <div class="container">
    <div class="panel">
      <div class="header">
        <h1 class="logo">Navigatr</h1>
        <p class="tagline">The open source Google Maps alternative.<br>Zero API keys. Zero cost.</p>
      </div>

      <div class="form">
        <div class="input-group">
          <label for="origin">Origin</label>
          <input
            id="origin"
            v-model="originInput"
            type="text"
            placeholder="Accra Mall, Ghana"
          >
        </div>

        <div class="input-group">
          <label for="destination">Destination</label>
          <input
            id="destination"
            v-model="destinationInput"
            type="text"
            placeholder="Kotoka Airport, Ghana"
          >
        </div>

        <button
          class="route-btn"
          :disabled="loading"
          @click="getRoute"
        >
          {{ loading ? 'Calculating...' : 'Get Route' }}
        </button>

        <p v-if="error" class="error">{{ error }}</p>
      </div>

      <div v-if="routeResult" class="results">
        <div class="result-card">
          <div class="result-row">
            <span class="result-label">Duration</span>
            <span class="result-value accent">{{ routeResult.durationText }}</span>
          </div>
          <div class="result-row">
            <span class="result-label">Distance</span>
            <span class="result-value accent">{{ routeResult.distanceText }}</span>
          </div>
          <div v-if="origin" class="result-row">
            <span class="result-label">Origin</span>
            <span class="result-value">{{ origin.lat.toFixed(4) }}, {{ origin.lng.toFixed(4) }}</span>
          </div>
          <div v-if="destination" class="result-row">
            <span class="result-label">Destination</span>
            <span class="result-value">{{ destination.lat.toFixed(4) }}, {{ destination.lng.toFixed(4) }}</span>
          </div>
        </div>
      </div>

      <div v-if="routeResult" class="code-section">
        <CodeSnippet :origin="originInput" :destination="destinationInput" />
      </div>

      <div class="footer">
        <a href="https://github.com/user/navigatr" target="_blank" class="github-link">
          View on GitHub →
        </a>
      </div>
    </div>

    <div class="map-panel">
      <RouteDemo
        :polyline="polyline"
        :origin="origin"
        :destination="destination"
      />
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  min-height: 100vh;
}

.panel {
  width: 40%;
  min-width: 400px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  border-right: 1px solid var(--border);
}

.map-panel {
  flex: 1;
  min-height: 100vh;
}

.header {
  margin-bottom: 40px;
}

.logo {
  font-size: 48px;
  font-weight: 800;
  color: var(--accent);
  margin-bottom: 16px;
}

.tagline {
  font-size: 18px;
  color: var(--text-muted);
  line-height: 1.6;
}

.form {
  margin-bottom: 32px;
}

.input-group {
  margin-bottom: 16px;
}

.input-group label {
  display: block;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.input-group input {
  width: 100%;
  padding: 14px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-family: inherit;
  font-size: 14px;
  transition: border-color 0.2s;
}

.input-group input:focus {
  outline: none;
  border-color: var(--accent);
}

.route-btn {
  width: 100%;
  padding: 16px;
  background: var(--accent);
  border: none;
  border-radius: 8px;
  color: var(--bg);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
}

.route-btn:hover {
  opacity: 0.9;
}

.route-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error {
  margin-top: 16px;
  color: #ff6b6b;
  font-size: 14px;
}

.results {
  margin-bottom: 32px;
}

.result-card {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 20px;
}

.result-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--border);
}

.result-row:last-child {
  border-bottom: none;
}

.result-label {
  color: var(--text-muted);
  font-size: 13px;
}

.result-value {
  font-size: 13px;
}

.result-value.accent {
  color: var(--accent);
  font-weight: 600;
}

.code-section {
  margin-bottom: 32px;
}

.footer {
  margin-top: auto;
  padding-top: 24px;
}

.github-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.github-link:hover {
  color: var(--accent);
}

@media (max-width: 900px) {
  .container {
    flex-direction: column;
  }

  .panel {
    width: 100%;
    min-width: auto;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .map-panel {
    height: 50vh;
    min-height: 400px;
  }
}
</style>
