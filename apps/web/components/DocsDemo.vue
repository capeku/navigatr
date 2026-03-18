<script setup lang="ts">
import type { LatLng, RouteResult, NavigatrMap, NavigatrMarker, AutocompleteResult } from '@navigatr/web'

const { getNavigatr } = useNavigatr()

interface Step {
  title: string
  description: string
  code: string
}

const steps: Step[] = [
  {
    title: 'Initialize',
    description: 'Create a Navigatr instance and render a map',
    code: `import { Navigatr } from '@navigatr/web'

const nav = new Navigatr()
const map = nav.map({
  container: 'map',
  center: { lat: 5.6037, lng: -0.1870 },
  zoom: 12
})`
  },
  {
    title: 'Autocomplete',
    description: 'Get address suggestions as user types',
    code: `// Fetch suggestions from Photon API
const results = await nav.autocomplete({
  query: 'Accra Mall',
  limit: 5
})

// Returns array of suggestions:
// [{ name: 'Accra Mall', lat: 5.6185, lng: -0.1749, ... }]`
  },
  {
    title: 'Geocode',
    description: 'Convert addresses to coordinates',
    code: `const pickup = await nav.geocode({
  address: 'Accra Mall, Ghana'
})
// { lat: 5.6185, lng: -0.1749 }

const destination = await nav.geocode({
  address: 'Kotoka Airport'
})`
  },
  {
    title: 'Route',
    description: 'Calculate route with ETA and distance',
    code: `const route = await nav.route({
  origin: pickup,
  destination
})

console.log(route.durationText) // "15 min"
console.log(route.distanceText) // "8.2 km"`
  },
  {
    title: 'Render',
    description: 'Draw the route and markers on the map',
    code: `map.addMarker({
  ...pickup,
  label: 'Pickup',
  draggable: true,
  onDragEnd: (pos) => recalculate(pos)
})

map.addMarker({ ...destination, label: 'Destination' })
map.drawRoute(route.polyline)
map.fitRoute(route.polyline)`
  },
  {
    title: 'Live Track',
    description: 'Simulate real-time driver movement',
    code: `// Connect to real-time backend
websocket.on('driver-location', (pos) => {
  map.updateDriverMarker({
    ...pos,
    icon: 'car',
    heading: pos.heading
  })

  // Recalculate ETA from current position
  const updated = await nav.recalculateETA(pos, destination)
  showETA(updated.durationText)
})`
  }
]

const activeStep = ref(0)
const pickupInput = ref('Accra Mall')
const destinationInput = ref('')
const pickup = ref<LatLng | null>(null)
const destination = ref<LatLng | null>(null)
const polyline = ref<LatLng[]>([])
const routeResult = ref<RouteResult | null>(null)
const isAnimating = ref(false)
const ridePhase = ref<'idle' | 'searching' | 'confirmed' | 'arriving' | 'in_trip'>('idle')
const liveETA = ref('')
const driverProgress = ref(0)

let map: NavigatrMap | null = null
let pickupMarker: NavigatrMarker | null = null
let destinationMarker: NavigatrMarker | null = null
let driverAnimationId: number | null = null

async function geocode(address: string): Promise<LatLng> {
  const nav = await getNavigatr()
  const result = await nav.geocode({ address })
  return { lat: result.lat, lng: result.lng }
}

async function calculateRoute(orig: LatLng, dest: LatLng): Promise<RouteResult> {
  const nav = await getNavigatr()
  return nav.route({ origin: orig, destination: dest })
}

function calculateHeading(from: LatLng, to: LatLng): number {
  const dLng = (to.lng - from.lng) * Math.PI / 180
  const lat1 = from.lat * Math.PI / 180
  const lat2 = to.lat * Math.PI / 180
  const x = Math.sin(dLng) * Math.cos(lat2)
  const y = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
  return ((Math.atan2(x, y) * 180 / Math.PI) + 360) % 360
}

function updateMapMarkers() {
  if (!map) return

  map.clearRoute()

  if (pickup.value && ridePhase.value !== 'in_trip') {
    if (pickupMarker) {
      pickupMarker.setLatLng(pickup.value)
    } else {
      pickupMarker = map.addMarker({
        ...pickup.value,
        label: 'Pickup',
        draggable: ridePhase.value === 'idle',
        onDragEnd: async (pos) => {
          pickup.value = pos
          if (destination.value) {
            const result = await calculateRoute(pos, destination.value)
            polyline.value = result.polyline
            routeResult.value = result
            updateMapMarkers()
          }
        }
      })
    }
  }

  if (destination.value) {
    if (destinationMarker) {
      destinationMarker.setLatLng(destination.value)
    } else {
      destinationMarker = map.addMarker({
        ...destination.value,
        label: 'Destination',
        draggable: ridePhase.value === 'idle',
        onDragEnd: async (pos) => {
          destination.value = pos
          if (pickup.value) {
            const result = await calculateRoute(pickup.value, pos)
            polyline.value = result.polyline
            routeResult.value = result
            updateMapMarkers()
          }
        }
      })
    }
  }

  if (polyline.value.length > 0) {
    map.drawRoute(polyline.value)
    map.fitRoute(polyline.value)
  }
}

function stopDriverAnimation() {
  if (driverAnimationId) {
    cancelAnimationFrame(driverAnimationId)
    driverAnimationId = null
  }
  if (map) map.removeDriverMarker()
}

function simulateDriverMovement() {
  if (!map || polyline.value.length === 0) return

  let progress = 0
  const totalPoints = polyline.value.length
  const speed = 0.5 // points per frame

  function animate() {
    if (progress >= totalPoints - 1) {
      // Arrived
      ridePhase.value = 'idle'
      liveETA.value = 'Arrived!'
      stopDriverAnimation()
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

    // Update ETA based on remaining distance
    const remaining = totalPoints - currentIndex
    const pct = remaining / totalPoints
    if (routeResult.value) {
      const remainingMins = Math.ceil((routeResult.value.durationSeconds || 0) * pct / 60)
      liveETA.value = remainingMins <= 1 ? '< 1 min' : `${remainingMins} min`
    }

    driverProgress.value = ((totalPoints - remaining) / totalPoints) * 100

    progress += speed
    driverAnimationId = requestAnimationFrame(animate)
  }

  animate()
}

async function recalculateRoute() {
  if (!pickup.value || !destination.value) return
  activeStep.value = 3
  const result = await calculateRoute(pickup.value, destination.value)
  polyline.value = result.polyline
  routeResult.value = result
  activeStep.value = 4
  updateMapMarkers()
}

function handlePickupSelect(result: AutocompleteResult) {
  pickup.value = { lat: result.lat, lng: result.lng }
  pickupInput.value = result.name || result.displayName.split(',')[0]
  if (pickupMarker) { pickupMarker.remove(); pickupMarker = null }
  activeStep.value = 1
  updateMapMarkers()
  if (destination.value) recalculateRoute()
}

function handleDestinationSelect(result: AutocompleteResult) {
  destination.value = { lat: result.lat, lng: result.lng }
  destinationInput.value = result.name || result.displayName.split(',')[0]
  if (destinationMarker) { destinationMarker.remove(); destinationMarker = null }
  activeStep.value = 1
  updateMapMarkers()
  if (pickup.value) recalculateRoute()
}

async function handlePickupSearch() {
  if (!pickupInput.value.trim()) return
  try {
    pickup.value = await geocode(pickupInput.value)
    if (pickupMarker) { pickupMarker.remove(); pickupMarker = null }
    activeStep.value = 2
    updateMapMarkers()
    if (destination.value) recalculateRoute()
  } catch (e) {
    console.error(e)
  }
}

async function handleDestinationSearch() {
  if (!destinationInput.value.trim()) return
  try {
    destination.value = await geocode(destinationInput.value)
    if (destinationMarker) { destinationMarker.remove(); destinationMarker = null }
    activeStep.value = 2
    updateMapMarkers()
    if (pickup.value) recalculateRoute()
  } catch (e) {
    console.error(e)
  }
}

async function requestRide() {
  if (!pickup.value || !destination.value) return

  ridePhase.value = 'searching'
  await new Promise(r => setTimeout(r, 1500))

  ridePhase.value = 'confirmed'
  await new Promise(r => setTimeout(r, 1000))

  ridePhase.value = 'arriving'
  activeStep.value = 5
  liveETA.value = routeResult.value?.durationText || ''
  driverProgress.value = 0

  // Remove pickup marker during trip
  if (pickupMarker) { pickupMarker.remove(); pickupMarker = null }

  ridePhase.value = 'in_trip'
  simulateDriverMovement()
}

async function runDemo() {
  if (isAnimating.value) return
  isAnimating.value = true
  stopDriverAnimation()

  // Reset
  activeStep.value = 0
  ridePhase.value = 'idle'
  pickupInput.value = ''
  destinationInput.value = ''
  pickup.value = null
  destination.value = null
  polyline.value = []
  routeResult.value = null
  liveETA.value = ''
  driverProgress.value = 0
  if (pickupMarker) { pickupMarker.remove(); pickupMarker = null }
  if (destinationMarker) { destinationMarker.remove(); destinationMarker = null }
  if (map) {
    map.clearRoute()
    map.removeDriverMarker()
  }

  await new Promise(r => setTimeout(r, 800))

  // Step 1: Autocomplete
  activeStep.value = 1
  for (const char of 'Accra Mall') {
    pickupInput.value += char
    await new Promise(r => setTimeout(r, 80))
  }
  await new Promise(r => setTimeout(r, 600))

  // Step 2: Geocode pickup
  activeStep.value = 2
  pickup.value = await geocode('Accra Mall, Ghana')
  updateMapMarkers()
  await new Promise(r => setTimeout(r, 1200))

  // Type destination
  for (const char of 'Kotoka Airport') {
    destinationInput.value += char
    await new Promise(r => setTimeout(r, 60))
  }
  await new Promise(r => setTimeout(r, 600))

  // Geocode destination
  destination.value = await geocode('Kotoka Airport')
  updateMapMarkers()
  await new Promise(r => setTimeout(r, 1200))

  // Step 3: Calculate route
  activeStep.value = 3
  const result = await calculateRoute(pickup.value, destination.value)
  polyline.value = result.polyline
  routeResult.value = result
  await new Promise(r => setTimeout(r, 1000))

  // Step 4: Render
  activeStep.value = 4
  updateMapMarkers()
  await new Promise(r => setTimeout(r, 1500))

  // Step 5: Request ride and simulate
  await requestRide()

  isAnimating.value = false
}

onMounted(async () => {
  const { Navigatr } = await import('@navigatr/web')
  const nav = new Navigatr()

  map = nav.map({
    container: 'docs-map',
    center: { lat: 5.6037, lng: -0.1870 },
    zoom: 12
  })

  // Auto-run demo after mount
  setTimeout(runDemo, 500)
})

onUnmounted(() => {
  stopDriverAnimation()
})
</script>

<template>
  <div class="docs-demo">
    <div class="demo-content">
      <div class="steps">
        <button
          v-for="(step, index) in steps"
          :key="index"
          class="step"
          :class="{ active: activeStep === index }"
          @click="activeStep = index"
        >
          <span class="step-number">{{ index + 1 }}</span>
          <span class="step-title">{{ step.title }}</span>
        </button>
      </div>

      <div class="code-panel">
        <div class="code-header">
          <span class="code-title">{{ steps[activeStep].title }}</span>
          <span class="code-description">{{ steps[activeStep].description }}</span>
        </div>
        <pre class="code-block"><code>{{ steps[activeStep].code }}</code></pre>
      </div>

      <div v-if="routeResult && ridePhase === 'idle'" class="result-panel">
        <div class="result-item">
          <span class="result-label">Duration</span>
          <span class="result-value">{{ routeResult.durationText }}</span>
        </div>
        <div class="result-item">
          <span class="result-label">Distance</span>
          <span class="result-value">{{ routeResult.distanceText }}</span>
        </div>
      </div>

      <div v-if="ridePhase === 'in_trip'" class="live-panel">
        <div class="live-header">
          <span class="live-dot"></span>
          <span>Live Tracking</span>
        </div>
        <div class="live-eta">
          <span class="eta-label">ETA</span>
          <span class="eta-value">{{ liveETA }}</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: driverProgress + '%' }"></div>
        </div>
      </div>

      <button class="replay-btn" :disabled="isAnimating" @click="runDemo">
        {{ isAnimating ? 'Running...' : 'Replay Demo' }}
      </button>
    </div>

    <div class="mockup-panel">
      <PhoneMockup>
        <div class="app-screen">
          <div id="docs-map" class="map-container"></div>

          <div class="app-ui">
            <div class="search-card">
              <div class="input-row">
                <span class="input-dot pickup"></span>
                <AddressSearch
                  v-model="pickupInput"
                  placeholder="Pickup location"
                  @select="handlePickupSelect"
                  @search="handlePickupSearch"
                />
              </div>
              <div class="input-divider"></div>
              <div class="input-row">
                <span class="input-dot destination"></span>
                <AddressSearch
                  v-model="destinationInput"
                  placeholder="Where to?"
                  @select="handleDestinationSelect"
                  @search="handleDestinationSearch"
                />
              </div>
            </div>

            <div v-if="routeResult" class="bottom-sheet">
              <template v-if="ridePhase === 'idle'">
                <div class="route-stats">
                  <div class="stat">
                    <span class="stat-value">{{ routeResult.durationText }}</span>
                    <span class="stat-label">duration</span>
                  </div>
                  <div class="stat-divider"></div>
                  <div class="stat">
                    <span class="stat-value">{{ routeResult.distanceText }}</span>
                    <span class="stat-label">distance</span>
                  </div>
                </div>
                <button class="request-btn" @click="requestRide">
                  Request Ride
                </button>
              </template>

              <template v-else-if="ridePhase === 'searching'">
                <div class="ride-status">
                  <span class="status-spinner"></span>
                  <span>Finding your driver...</span>
                </div>
              </template>

              <template v-else-if="ridePhase === 'confirmed'">
                <div class="ride-status confirmed">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                  <span>Driver found!</span>
                </div>
              </template>

              <template v-else-if="ridePhase === 'arriving' || ridePhase === 'in_trip'">
                <div class="trip-info">
                  <div class="driver-info">
                    <div class="driver-avatar">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                    <div class="driver-details">
                      <span class="driver-name">Kwame A.</span>
                      <span class="driver-car">Toyota Corolla</span>
                    </div>
                  </div>
                  <div class="trip-eta">
                    <span class="eta-time">{{ liveETA }}</span>
                    <span class="eta-label">{{ ridePhase === 'in_trip' ? 'to destination' : 'arriving' }}</span>
                  </div>
                </div>
                <div class="trip-progress">
                  <div class="trip-progress-fill" :style="{ width: driverProgress + '%' }"></div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </PhoneMockup>
    </div>
  </div>
</template>

<style scoped>
.docs-demo {
  display: flex;
  gap: 32px;
  min-height: 700px;
  align-items: center;
}

.demo-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-width: 600px;
}

.steps {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}

.step:hover {
  border-color: var(--accent);
}

.step.active {
  background: rgba(0, 255, 148, 0.1);
  border-color: var(--accent);
}

.step-number {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--border);
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  color: var(--text);
}

.step.active .step-number {
  background: var(--accent);
  color: #000;
}

.step-title {
  font-size: 12px;
  color: var(--text-muted);
}

.step.active .step-title {
  color: var(--text);
}

.code-panel {
  flex: 1;
  min-height: 280px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.code-header {
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid var(--border);
}

.code-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  display: block;
  margin-bottom: 4px;
}

.code-description {
  font-size: 12px;
  color: var(--text-muted);
}

.code-block {
  flex: 1;
  padding: 16px;
  overflow: auto;
  font-size: 12px;
  line-height: 1.6;
  margin: 0;
}

.code-block code {
  font-family: 'IBM Plex Mono', monospace;
  color: var(--text);
}

.result-panel {
  display: flex;
  gap: 24px;
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.result-label {
  font-size: 11px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.result-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--accent);
}

.live-panel {
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid var(--accent);
  border-radius: 8px;
}

.live-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--accent);
  margin-bottom: 12px;
}

.live-dot {
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.live-eta {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
}

.eta-label {
  font-size: 12px;
  color: var(--text-muted);
}

.eta-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--accent);
}

.progress-bar {
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s;
}

.replay-btn {
  padding: 12px 24px;
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

.replay-btn:hover:not(:disabled) {
  opacity: 0.9;
}

.replay-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mockup-panel {
  flex-shrink: 0;
}

.app-screen {
  width: 100%;
  height: 100%;
  position: relative;
  background: #1a1a1a;
}

.map-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
}

.app-ui {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  z-index: 10;
}

.app-ui > * {
  pointer-events: auto;
}

.search-card {
  margin: 48px 12px 12px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  padding: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.input-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.input-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.input-dot.pickup {
  background: var(--accent);
}

.input-dot.destination {
  background: #333;
}

.input-divider {
  height: 1px;
  background: #eee;
  margin: 6px 0 6px 18px;
}

.bottom-sheet {
  margin-top: auto;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px 20px 0 0;
  padding: 20px 16px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

.route-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 12px 0;
  margin-bottom: 12px;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #111;
}

.stat-label {
  font-size: 11px;
  color: #888;
  text-transform: uppercase;
}

.stat-divider {
  width: 1px;
  height: 28px;
  background: #ddd;
}

.request-btn {
  width: 100%;
  padding: 14px;
  background: #111;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
}

.ride-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 20px;
  font-size: 14px;
  color: #666;
}

.ride-status.confirmed {
  color: var(--accent);
}

.status-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #ddd;
  border-top-color: #111;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.trip-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.driver-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.driver-avatar {
  width: 40px;
  height: 40px;
  background: #eee;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
}

.driver-details {
  display: flex;
  flex-direction: column;
}

.driver-name {
  font-size: 14px;
  font-weight: 600;
  color: #111;
}

.driver-car {
  font-size: 12px;
  color: #888;
}

.trip-eta {
  text-align: right;
}

.trip-eta .eta-time {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #111;
}

.trip-eta .eta-label {
  font-size: 11px;
  color: #888;
}

.trip-progress {
  height: 4px;
  background: #eee;
  border-radius: 2px;
  overflow: hidden;
}

.trip-progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.3s;
}
</style>
