<script setup lang="ts">
import type { RouteResult, LatLng } from '@navigatr/web'

const route = ref<RouteResult | null>(null)
const loading = ref(true)
const error = ref('')

// Hardcoded route: Accra Mall to Kotoka Airport
const ORIGIN: LatLng = { lat: 5.6226, lng: -0.1725 } // Accra Mall
const DESTINATION: LatLng = { lat: 5.6052, lng: -0.1668 } // Kotoka Airport

async function fetchRoute() {
  loading.value = true
  error.value = ''

  try {
    const res = await fetch('/api/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        locations: [
          { lon: ORIGIN.lng, lat: ORIGIN.lat, type: 'break' },
          { lon: DESTINATION.lng, lat: DESTINATION.lat, type: 'break' }
        ],
        costing: 'auto',
        directions_options: { units: 'km' }
      })
    })

    if (!res.ok) throw new Error('Routing failed')

    const data = await res.json()
    const polyline = decodePolyline(data.trip.legs[0].shape)

    route.value = {
      durationSeconds: data.trip.summary.time,
      durationText: formatDuration(data.trip.summary.time),
      distanceMeters: data.trip.summary.length * 1000,
      distanceText: formatDistance(data.trip.summary.length * 1000),
      polyline,
      maneuvers: data.trip.legs[0].maneuvers?.map((m: any) => ({
        instruction: m.instruction,
        type: m.type,
        distanceMeters: m.length * 1000,
        distanceText: formatDistance(m.length * 1000),
        durationSeconds: m.time,
        durationText: formatDuration(m.time),
        startPoint: polyline[m.begin_shape_index] || polyline[0]
      }))
    }
  } catch (e) {
    error.value = 'Failed to load route'
    console.error(e)
  } finally {
    loading.value = false
  }
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
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60), m = mins % 60
  return m ? `${hrs} hr ${m} min` : `${hrs} hr`
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

function handleNavigationEvent(event: any) {
  console.log('Navigation event:', event)
}

onMounted(() => {
  fetchRoute()
})
</script>

<template>
  <div class="page">
    <div class="sidebar">
      <div class="header">
        <NuxtLink to="/" class="back-link">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </NuxtLink>
        <h1>Navigation Demo</h1>
      </div>

      <div class="content">
        <p class="description">
          This demo shows turn-by-turn navigation using the Navigatr SDK.
          The simulation generates fake GPS updates that feed into the real
          <code>startNavigation()</code> and <code>updatePosition()</code> APIs.
        </p>

        <div class="route-info" v-if="route">
          <div class="route-endpoints">
            <div class="endpoint">
              <span class="dot origin"></span>
              <span>Accra Mall</span>
            </div>
            <div class="endpoint">
              <span class="dot destination"></span>
              <span>Kotoka Airport</span>
            </div>
          </div>
          <div class="route-stats">
            <span>{{ route.distanceText }}</span>
            <span class="separator">•</span>
            <span>{{ route.durationText }}</span>
          </div>
        </div>

        <div v-if="error" class="error">{{ error }}</div>

        <div class="code-example">
          <h3>SDK Usage</h3>
          <pre><code>// Start navigation
map.startNavigation(route)

// Feed GPS updates
navigator.geolocation.watchPosition((pos) => {
  map.updatePosition({
    lat: pos.coords.latitude,
    lng: pos.coords.longitude
  })
})

// Listen for events
map.onNavigationEvent((event) => {
  if (event.type === 'turn_approaching') {
    showInstruction(event.maneuver)
  }
  if (event.type === 'arrived') {
    celebrateArrival()
  }
})</code></pre>
        </div>
      </div>
    </div>

    <div class="map-area">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <span>Loading route...</span>
      </div>
      <NavigationDemo
        v-else
        :route="route"
        @navigation-event="handleNavigationEvent"
      />
    </div>
  </div>
</template>

<style scoped>
.page {
  display: flex;
  height: 100vh;
  background: var(--bg);
}

.sidebar {
  width: 400px;
  min-width: 400px;
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid var(--border);
}

.back-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-muted);
  transition: all 0.2s;
}

.back-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--accent);
}

h1 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.content {
  padding: 24px;
  flex: 1;
}

.description {
  color: var(--text-muted);
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 24px;
}

.description code {
  background: rgba(0, 255, 148, 0.1);
  color: var(--accent);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

.route-info {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
}

.route-endpoints {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.endpoint {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: var(--text);
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.dot.origin {
  background: var(--accent);
}

.dot.destination {
  background: #888;
}

.route-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-muted);
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.separator {
  color: var(--border);
}

.error {
  background: rgba(255, 68, 68, 0.1);
  border: 1px solid rgba(255, 68, 68, 0.3);
  color: #ff6b6b;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-bottom: 24px;
}

.code-example {
  background: rgba(0, 0, 0, 0.3);
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
}

.code-example h3 {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid var(--border);
}

.code-example pre {
  padding: 16px;
  margin: 0;
  overflow-x: auto;
}

.code-example code {
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-muted);
}

.map-area {
  flex: 1;
  position: relative;
  background: #1a1a1a;
}

.loading {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-muted);
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid var(--border);
  border-top-color: var(--accent);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

@media (max-width: 900px) {
  .page {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    min-width: auto;
    max-height: 40vh;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .map-area {
    min-height: 60vh;
  }
}
</style>
