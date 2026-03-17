<script setup lang="ts">
import type { LatLng, NavigatrMap, NavigatrMarker } from '@navigatr/web'

interface AutocompleteResult {
  lat: number
  lng: number
  displayName: string
  name: string
  city?: string
  country?: string
}

type TabId = 'route' | 'tracking'

const activeTab = ref<TabId>('route')
const consoleOutput = ref<string[]>([])
const isRunning = ref(false)

// Route tab state
const routeOriginInput = ref('')
const routeDestinationInput = ref('')
const routeResult = ref<any>(null)

// Map state
let map: NavigatrMap | null = null
let originMarker: NavigatrMarker | null = null
let destinationMarker: NavigatrMarker | null = null
const polyline = ref<LatLng[]>([])
const originCoords = ref<LatLng | null>(null)
const destinationCoords = ref<LatLng | null>(null)

// Tracking state
const isTracking = ref(false)
const trackingProgress = ref(0)
const currentETA = ref('')
let trackingAnimationId: number | null = null

function log(message: string, type: 'info' | 'success' | 'error' = 'info') {
  const prefix = type === 'success' ? '✓' : type === 'error' ? '✗' : '→'
  const timestamp = new Date().toLocaleTimeString('en-US', { hour12: false })
  consoleOutput.value.push(`[${timestamp}] ${prefix} ${message}`)
  if (consoleOutput.value.length > 50) {
    consoleOutput.value = consoleOutput.value.slice(-50)
  }
}

function clearConsole() {
  consoleOutput.value = []
}

function clearMap() {
  if (originMarker) { originMarker.remove(); originMarker = null }
  if (destinationMarker) { destinationMarker.remove(); destinationMarker = null }
  if (map) {
    map.clearRoute()
    map.removeDriverMarker()
  }
  polyline.value = []
  routeResult.value = null
  stopTracking()
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

function handleOriginSelect(result: AutocompleteResult) {
  originCoords.value = { lat: result.lat, lng: result.lng }
  routeOriginInput.value = result.name || result.displayName.split(',')[0]
  log(`Origin selected: ${routeOriginInput.value}`, 'success')
  log(`  Coordinates: { lat: ${result.lat.toFixed(6)}, lng: ${result.lng.toFixed(6)} }`)
  updateMapMarkers()
  if (destinationCoords.value) calculateRoute()
}

function handleDestinationSelect(result: AutocompleteResult) {
  destinationCoords.value = { lat: result.lat, lng: result.lng }
  routeDestinationInput.value = result.name || result.displayName.split(',')[0]
  log(`Destination selected: ${routeDestinationInput.value}`, 'success')
  log(`  Coordinates: { lat: ${result.lat.toFixed(6)}, lng: ${result.lng.toFixed(6)} }`)
  updateMapMarkers()
  if (originCoords.value) calculateRoute()
}

function updateMapMarkers() {
  if (!map) return

  if (originCoords.value) {
    if (originMarker) {
      originMarker.setLatLng(originCoords.value)
    } else {
      originMarker = map.addMarker({ ...originCoords.value, label: 'Origin' })
    }
  }

  if (destinationCoords.value) {
    if (destinationMarker) {
      destinationMarker.setLatLng(destinationCoords.value)
    } else {
      destinationMarker = map.addMarker({ ...destinationCoords.value, label: 'Destination' })
    }
  }
}

async function calculateRoute() {
  if (!originCoords.value || !destinationCoords.value) return
  isRunning.value = true
  stopTracking()

  log(`nav.route({ origin, destination })`)
  try {
    const routeRes = await fetch('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations: [
          { lon: originCoords.value.lng, lat: originCoords.value.lat, type: 'break' },
          { lon: destinationCoords.value.lng, lat: destinationCoords.value.lat, type: 'break' }
        ],
        costing: 'auto',
        directions_options: { units: 'km' }
      })
    })

    if (!routeRes.ok) {
      throw new Error(`Route calculation failed: ${routeRes.status}`)
    }

    const routeData = await routeRes.json()
    const decoded = decodePolyline(routeData.trip.legs[0].shape)
    const durationMins = Math.round(routeData.trip.summary.time / 60)
    const distanceKm = routeData.trip.summary.length.toFixed(1)

    routeResult.value = { durationMins, distanceKm, durationSeconds: routeData.trip.summary.time }
    polyline.value = decoded

    log(`Route calculated:`, 'success')
    log(`  Duration: ${durationMins} min`)
    log(`  Distance: ${distanceKm} km`)
    log(`  Polyline: ${decoded.length} points`)

    if (map) {
      map.clearRoute()
      map.drawRoute(decoded)
      map.fitRoute(decoded)
    }
  } catch (e) {
    log(`Error: ${e}`, 'error')
  }
  isRunning.value = false
}

function calculateHeading(from: LatLng, to: LatLng): number {
  const dLng = (to.lng - from.lng) * Math.PI / 180
  const lat1 = from.lat * Math.PI / 180
  const lat2 = to.lat * Math.PI / 180
  const x = Math.sin(dLng) * Math.cos(lat2)
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return ((Math.atan2(x, y) * 180 / Math.PI) + 360) % 360
}

function startTracking() {
  if (!map || polyline.value.length === 0) {
    log('Select origin and destination first', 'error')
    return
  }

  isTracking.value = true
  trackingProgress.value = 0
  log('Starting driver simulation...', 'info')
  log(`Simulating: map.updateDriverMarker({ lat, lng, icon: 'car', heading })`)

  let progress = 0
  const totalPoints = polyline.value.length
  const speed = 0.5

  function animate() {
    if (progress >= totalPoints - 1) {
      isTracking.value = false
      trackingProgress.value = 100
      currentETA.value = 'Arrived!'
      log('Driver arrived at destination!', 'success')
      return
    }

    const currentIndex = Math.floor(progress)
    const nextIndex = Math.min(currentIndex + 1, totalPoints - 1)
    const currentPos = polyline.value[currentIndex]
    const nextPos = polyline.value[nextIndex]
    const heading = calculateHeading(currentPos, nextPos)

    map!.updateDriverMarker({
      lat: currentPos.lat,
      lng: currentPos.lng,
      heading,
      icon: 'car'
    })

    // Update progress and ETA
    const pct = (totalPoints - currentIndex) / totalPoints
    trackingProgress.value = ((currentIndex / totalPoints) * 100)
    if (routeResult.value) {
      const remainingMins = Math.ceil(routeResult.value.durationSeconds * pct / 60)
      currentETA.value = remainingMins <= 1 ? '< 1 min' : `${remainingMins} min`
    }

    progress += speed
    trackingAnimationId = requestAnimationFrame(animate)
  }

  animate()
}

function stopTracking() {
  if (trackingAnimationId) {
    cancelAnimationFrame(trackingAnimationId)
    trackingAnimationId = null
  }
  isTracking.value = false
  trackingProgress.value = 0
  currentETA.value = ''
  if (map) map.removeDriverMarker()
}

onMounted(async () => {
  const { Navigatr } = await import('@navigatr/web')
  const nav = new Navigatr()

  map = nav.map({
    container: 'sandbox-map',
    center: { lat: 5.6037, lng: -0.1870 },
    zoom: 12
  })

  log('Navigatr SDK initialized', 'success')
  log('Map ready - search for locations above')
})

onUnmounted(() => {
  stopTracking()
})
</script>

<template>
  <div class="sandbox">
    <header class="sandbox-header">
      <div class="header-left">
        <NuxtLink to="/" class="logo-link">
          <span class="logo">Navigatr</span>
        </NuxtLink>
        <span class="divider">/</span>
        <span class="page-title">Sandbox</span>
      </div>
      <div class="header-right">
        <a href="https://github.com/anthropics/navigatr" target="_blank" class="github-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </a>
      </div>
    </header>

    <div class="sandbox-content">
      <div class="editor-panel">
        <div class="tabs">
          <button
            class="tab"
            :class="{ active: activeTab === 'route' }"
            @click="activeTab = 'route'"
          >
            Route
          </button>
          <button
            class="tab"
            :class="{ active: activeTab === 'tracking' }"
            @click="activeTab = 'tracking'"
          >
            Live Tracking
          </button>
        </div>

        <div class="editor-content">
          <!-- Route Tab -->
          <div v-if="activeTab === 'route'" class="tab-content">
            <div class="method-signature">
              <span class="method-name">nav.route</span>
              <span class="method-params">({ origin, destination })</span>
            </div>
            <p class="method-desc">Search for locations using autocomplete, then calculate route.</p>

            <div class="input-group">
              <label>origin</label>
              <AddressSearch
                v-model="routeOriginInput"
                placeholder="Search origin..."
                @select="handleOriginSelect"
              />
            </div>

            <div class="input-group">
              <label>destination</label>
              <AddressSearch
                v-model="routeDestinationInput"
                placeholder="Search destination..."
                @select="handleDestinationSelect"
              />
            </div>

            <div v-if="routeResult" class="result-box">
              <div class="result-label">Route Result</div>
              <div class="route-stats">
                <div class="stat">
                  <span class="stat-value">{{ routeResult.durationMins }} min</span>
                  <span class="stat-label">Duration</span>
                </div>
                <div class="stat">
                  <span class="stat-value">{{ routeResult.distanceKm }} km</span>
                  <span class="stat-label">Distance</span>
                </div>
              </div>
            </div>

            <button v-if="routeResult" class="clear-route-btn" @click="clearMap">
              Clear Route
            </button>
          </div>

          <!-- Tracking Tab -->
          <div v-if="activeTab === 'tracking'" class="tab-content">
            <div class="method-signature">
              <span class="method-name">map.updateDriverMarker</span>
              <span class="method-params">({ lat, lng, heading, icon })</span>
            </div>
            <p class="method-desc">Simulate driver moving along the calculated route.</p>

            <div v-if="!polyline.length" class="info-box">
              Calculate a route first in the "Route" tab to enable tracking simulation.
            </div>

            <template v-else>
              <div class="route-summary">
                <span class="route-label">Route:</span>
                <span class="route-text">{{ routeOriginInput }} → {{ routeDestinationInput }}</span>
              </div>

              <div class="tracking-controls">
                <button v-if="!isTracking" class="run-btn" @click="startTracking">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                  Start Simulation
                </button>
                <button v-else class="stop-btn" @click="stopTracking">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <rect x="6" y="6" width="12" height="12"/>
                  </svg>
                  Stop
                </button>
              </div>

              <div v-if="isTracking || trackingProgress > 0" class="tracking-status">
                <div class="eta-display">
                  <span class="eta-label">ETA</span>
                  <span class="eta-value">{{ currentETA || routeResult?.durationMins + ' min' }}</span>
                </div>
                <div class="tracking-progress">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: trackingProgress + '%' }"></div>
                  </div>
                  <span class="progress-text">{{ Math.round(trackingProgress) }}%</span>
                </div>
              </div>
            </template>
          </div>
        </div>

        <div class="console-panel">
          <div class="console-header">
            <span>Console</span>
            <button class="console-clear" @click="clearConsole">Clear</button>
          </div>
          <div class="console-output">
            <div v-for="(line, index) in consoleOutput" :key="index" class="console-line">
              {{ line }}
            </div>
            <div v-if="consoleOutput.length === 0" class="console-empty">
              Output will appear here...
            </div>
          </div>
        </div>
      </div>

      <div class="preview-panel">
        <div class="preview-header">
          <span>Preview</span>
          <div v-if="isRunning" class="loading-indicator">
            <span class="loading-dot"></span>
            Calculating...
          </div>
        </div>
        <div class="preview-content">
          <PhoneMockup>
            <div class="map-screen">
              <div id="sandbox-map" class="map-container"></div>
            </div>
          </PhoneMockup>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sandbox {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.sandbox-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--card-bg);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-link {
  text-decoration: none;
}

.logo {
  font-size: 20px;
  font-weight: 800;
  color: var(--accent);
}

.divider {
  color: var(--border);
}

.page-title {
  font-size: 14px;
  color: var(--text-muted);
}

.github-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 13px;
  transition: all 0.2s;
}

.github-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.sandbox-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.editor-panel {
  width: 50%;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
}

.tabs {
  display: flex;
  gap: 4px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--card-bg);
}

.tab {
  padding: 8px 16px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.tab:hover {
  color: var(--text);
}

.tab.active {
  background: rgba(0, 255, 148, 0.1);
  border-color: var(--accent);
  color: var(--accent);
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.method-signature {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 16px;
}

.method-name {
  color: var(--accent);
}

.method-params {
  color: var(--text-muted);
}

.method-desc {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.5;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-group label {
  font-size: 12px;
  color: var(--text-muted);
  font-family: 'IBM Plex Mono', monospace;
}

.result-box {
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.result-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 12px;
}

.route-stats {
  display: flex;
  gap: 32px;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
}

.stat-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.clear-route-btn {
  padding: 10px 16px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.clear-route-btn:hover {
  border-color: #ff4444;
  color: #ff4444;
}

.info-box {
  padding: 16px;
  background: rgba(0, 255, 148, 0.1);
  border: 1px solid var(--accent);
  border-radius: 8px;
  font-size: 14px;
  color: var(--text);
}

.route-summary {
  padding: 12px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.route-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-right: 8px;
}

.route-text {
  font-size: 14px;
  color: var(--text);
}

.tracking-controls {
  display: flex;
  gap: 12px;
}

.run-btn, .stop-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 20px;
  background: var(--accent);
  border: none;
  border-radius: 8px;
  color: #000;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
}

.run-btn:hover {
  opacity: 0.9;
}

.stop-btn {
  background: #ff4444;
  color: #fff;
}

.tracking-status {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid var(--accent);
  border-radius: 8px;
}

.eta-display {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.eta-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.eta-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--accent);
}

.tracking-progress {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--border);
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.1s;
}

.progress-text {
  font-size: 14px;
  font-weight: 600;
  color: var(--accent);
  min-width: 40px;
}

.console-panel {
  height: 180px;
  border-top: 1px solid var(--border);
  display: flex;
  flex-direction: column;
}

.console-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 16px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-muted);
}

.console-clear {
  padding: 4px 8px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
}

.console-clear:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.console-output {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  background: #0a0a0f;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 12px;
  line-height: 1.6;
}

.console-line {
  color: var(--text-muted);
}

.console-empty {
  color: var(--text-muted);
  opacity: 0.5;
}

.preview-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-muted);
}

.loading-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--accent);
}

.loading-dot {
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.preview-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 32px;
  background: linear-gradient(135deg, #0a0a0f 0%, #111118 100%);
}

.map-screen {
  width: 100%;
  height: 100%;
  position: relative;
}

.map-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
}

@media (max-width: 1000px) {
  .sandbox-content {
    flex-direction: column;
  }

  .editor-panel {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .preview-panel {
    height: 500px;
  }
}
</style>
