<script setup lang="ts">
import type { LatLng, RouteResult, GeocodeResult } from '@navigatr/web'

const originInput = ref('Accra Mall, Ghana')
const destinationInput = ref('Kotoka Airport, Ghana')

const origin = ref<GeocodeResult | null>(null)
const destination = ref<GeocodeResult | null>(null)
const routeResult = ref<RouteResult | null>(null)
const polyline = ref<LatLng[]>([])
const loading = ref(false)
const geocodingOrigin = ref(false)
const geocodingDestination = ref(false)
const error = ref('')

// localStorage cache helpers
const CACHE_KEY = 'navigatr_geocode_cache'
const CACHE_TTL = 1000 * 60 * 60 * 24 // 24 hours

interface CacheEntry {
  data: GeocodeResult
  timestamp: number
}

function getCache(): Record<string, CacheEntry> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

function setCache(key: string, data: GeocodeResult) {
  if (typeof window === 'undefined') return
  const cache = getCache()
  cache[key] = { data, timestamp: Date.now() }
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
}

function getCached(address: string): GeocodeResult | null {
  const cache = getCache()
  const key = address.toLowerCase().trim()
  const entry = cache[key]
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.data
  }
  return null
}

async function geocodeViaProxy(address: string): Promise<GeocodeResult> {
  // Check cache first
  const cached = getCached(address)
  if (cached) return cached

  const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`)
  if (!res.ok) throw new Error('Geocoding failed')
  const data = await res.json()
  if (!data.length) throw new Error(`No results for: ${address}`)

  const result: GeocodeResult = {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name
  }

  // Cache the result
  setCache(address.toLowerCase().trim(), result)
  return result
}

async function routeViaProxy(orig: LatLng, dest: LatLng) {
  const res = await fetch('/api/route', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      locations: [
        { lon: orig.lng, lat: orig.lat, type: 'break' },
        { lon: dest.lng, lat: dest.lat, type: 'break' }
      ],
      costing: 'auto',
      directions_options: { units: 'km' }
    })
  })
  if (!res.ok) throw new Error('Routing failed')
  return res.json()
}

function decodePolyline(encoded: string): LatLng[] {
  const coords: LatLng[] = []
  let index = 0, lat = 0, lng = 0
  while (index < encoded.length) {
    let shift = 0, result = 0, byte: number
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lat += result & 1 ? ~(result >> 1) : result >> 1
    shift = 0; result = 0
    do { byte = encoded.charCodeAt(index++) - 63; result |= (byte & 0x1f) << shift; shift += 5 } while (byte >= 0x20)
    lng += result & 1 ? ~(result >> 1) : result >> 1
    coords.push({ lat: lat / 1e6, lng: lng / 1e6 })
  }
  return coords
}

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''}`
  const hrs = Math.floor(mins / 60), m = mins % 60
  return m ? `${hrs} hr${hrs !== 1 ? 's' : ''} ${m} min${m !== 1 ? 's' : ''}` : `${hrs} hr${hrs !== 1 ? 's' : ''}`
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

// Pre-geocode on blur (hides latency in natural user pauses)
async function geocodeOriginOnBlur() {
  if (!originInput.value.trim()) return
  if (getCached(originInput.value)) {
    origin.value = getCached(originInput.value)
    return
  }

  geocodingOrigin.value = true
  try {
    origin.value = await geocodeViaProxy(originInput.value)
  } catch (e) {
    // Silent fail on blur - will show error on submit
  } finally {
    geocodingOrigin.value = false
  }
}

async function geocodeDestinationOnBlur() {
  if (!destinationInput.value.trim()) return
  if (getCached(destinationInput.value)) {
    destination.value = getCached(destinationInput.value)
    return
  }

  geocodingDestination.value = true
  try {
    destination.value = await geocodeViaProxy(destinationInput.value)
  } catch (e) {
    // Silent fail on blur - will show error on submit
  } finally {
    geocodingDestination.value = false
  }
}

async function getRoute() {
  loading.value = true
  error.value = ''

  try {
    // Use cached values if available, otherwise geocode
    if (!origin.value || origin.value.displayName !== getCached(originInput.value)?.displayName) {
      origin.value = await geocodeViaProxy(originInput.value)
    }

    // Add delay between geocode calls if both need fetching
    if (!destination.value || destination.value.displayName !== getCached(destinationInput.value)?.displayName) {
      if (!getCached(destinationInput.value)) {
        await new Promise(r => setTimeout(r, 1100)) // Respect rate limit
      }
      destination.value = await geocodeViaProxy(destinationInput.value)
    }

    const data = await routeViaProxy(origin.value, destination.value)
    const decodedPolyline = decodePolyline(data.trip.legs[0].shape)
    const durationSeconds = data.trip.summary.time
    const distanceMeters = data.trip.summary.length * 1000

    routeResult.value = {
      durationSeconds,
      durationText: formatDuration(durationSeconds),
      distanceMeters,
      distanceText: formatDistance(distanceMeters),
      polyline: decodedPolyline
    }
    polyline.value = decodedPolyline
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'An error occurred'
  } finally {
    loading.value = false
  }
}

// On mount, geocode sequentially with delay
onMounted(async () => {
  geocodingOrigin.value = true
  try {
    origin.value = await geocodeViaProxy(originInput.value)
  } finally {
    geocodingOrigin.value = false
  }

  await new Promise(r => setTimeout(r, 1100))

  geocodingDestination.value = true
  try {
    destination.value = await geocodeViaProxy(destinationInput.value)
  } finally {
    geocodingDestination.value = false
  }

  if (origin.value && destination.value) {
    await getRoute()
  }
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
          <label for="origin">
            Origin
            <span v-if="geocodingOrigin" class="loading-indicator">looking up...</span>
          </label>
          <input
            id="origin"
            v-model="originInput"
            type="text"
            placeholder="Accra Mall, Ghana"
            @blur="geocodeOriginOnBlur"
          >
        </div>

        <div class="input-group">
          <label for="destination">
            Destination
            <span v-if="geocodingDestination" class="loading-indicator">looking up...</span>
          </label>
          <input
            id="destination"
            v-model="destinationInput"
            type="text"
            placeholder="Kotoka Airport, Ghana"
            @blur="geocodeDestinationOnBlur"
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
        <a href="https://github.com/capeku/navigatr" target="_blank" class="github-link">
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
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-muted);
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.loading-indicator {
  font-size: 10px;
  color: var(--accent);
  text-transform: lowercase;
  letter-spacing: normal;
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
