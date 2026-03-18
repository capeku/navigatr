<script setup lang="ts">
import type { LatLng, RouteResult, NavigatrMap, NavigationEvent } from '@navigatr/web'

const props = defineProps<{
  route: RouteResult | null
}>()

const emit = defineEmits<{
  'navigation-event': [event: NavigationEvent]
}>()

let map: NavigatrMap | null = null
let simulationInterval: ReturnType<typeof setInterval> | null = null
let currentPointIndex = 0

const isNavigating = ref(false)
const isPaused = ref(false)
const progress = ref(0)
const currentInstruction = ref('')
const distanceRemaining = ref('')
const speed = ref(30) // km/h

onMounted(async () => {
  const { Navigatr } = await import('@navigatr/web')
  const nav = new Navigatr()

  map = nav.map({
    container: 'nav-map',
    center: { lat: 5.6037, lng: -0.1870 },
    zoom: 12,
    pitch: 0,
    bearing: 0
  })

  // Listen for navigation events
  map.onNavigationEvent((event) => {
    emit('navigation-event', event)

    if (event.type === 'turn_approaching') {
      currentInstruction.value = event.maneuver.instruction
      distanceRemaining.value = `${Math.round(event.distanceMeters)}m`
    } else if (event.type === 'arrived') {
      stopSimulation()
      currentInstruction.value = 'You have arrived!'
    } else if (event.type === 'navigation_stopped') {
      isNavigating.value = false
    }
  })

  // Draw route if already available
  if (props.route) {
    map.drawRoute(props.route.polyline)
    map.fitRoute(props.route.polyline)
    if (props.route.maneuvers?.length) {
      currentInstruction.value = props.route.maneuvers[0].instruction
    }
  }
})

watch(() => props.route, (newRoute) => {
  if (!map || !newRoute) return

  map.drawRoute(newRoute.polyline)
  map.fitRoute(newRoute.polyline)

  // Reset state
  currentPointIndex = 0
  progress.value = 0
  currentInstruction.value = ''

  if (newRoute.maneuvers?.length) {
    currentInstruction.value = newRoute.maneuvers[0].instruction
  }
})

function simulateRoute() {
  if (!map || !props.route) return

  isNavigating.value = true
  isPaused.value = false
  currentPointIndex = 0

  // Start navigation
  map.startNavigation(props.route)

  // Calculate interval based on speed and point density
  // Average distance between points, then time = distance / speed
  const polyline = props.route.polyline
  const totalPoints = polyline.length

  // Simulate GPS updates at ~1 second intervals
  // Adjust point step based on speed to maintain realistic movement
  const updateIntervalMs = 100 // Update every 100ms for smooth movement
  const speedMps = (speed.value * 1000) / 3600 // Convert km/h to m/s
  const distancePerUpdate = speedMps * (updateIntervalMs / 1000) // meters per update

  // Calculate average distance between polyline points
  let totalDistance = 0
  for (let i = 0; i < polyline.length - 1; i++) {
    totalDistance += haversineDistance(polyline[i], polyline[i + 1])
  }
  const avgPointDistance = totalDistance / (polyline.length - 1)

  // How many points to advance per update
  const pointsPerUpdate = Math.max(1, distancePerUpdate / avgPointDistance)

  let floatIndex = 0

  simulationInterval = setInterval(() => {
    if (isPaused.value) return

    floatIndex += pointsPerUpdate

    if (floatIndex >= totalPoints - 1) {
      // Reached end
      map!.updatePosition(polyline[totalPoints - 1])
      stopSimulation()
      return
    }

    // Interpolate between points for smoother movement
    const baseIndex = Math.floor(floatIndex)
    const fraction = floatIndex - baseIndex
    const p1 = polyline[baseIndex]
    const p2 = polyline[Math.min(baseIndex + 1, totalPoints - 1)]

    const interpolatedPos: LatLng = {
      lat: p1.lat + (p2.lat - p1.lat) * fraction,
      lng: p1.lng + (p2.lng - p1.lng) * fraction
    }

    map!.updatePosition(interpolatedPos)
    progress.value = Math.round((floatIndex / (totalPoints - 1)) * 100)
    currentPointIndex = baseIndex
  }, updateIntervalMs)
}

function pauseSimulation() {
  isPaused.value = true
}

function resumeSimulation() {
  isPaused.value = false
}

function stopSimulation() {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }
  isNavigating.value = false
  isPaused.value = false

  if (map) {
    map.stopNavigation()
  }
}

function haversineDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371000 // Earth radius in meters
  const lat1 = p1.lat * Math.PI / 180
  const lat2 = p2.lat * Math.PI / 180
  const dLat = (p2.lat - p1.lat) * Math.PI / 180
  const dLng = (p2.lng - p1.lng) * Math.PI / 180

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

onUnmounted(() => {
  stopSimulation()
})

defineExpose({
  simulateRoute,
  pauseSimulation,
  resumeSimulation,
  stopSimulation
})
</script>

<template>
  <div class="navigation-demo">
    <div id="nav-map" class="map-container"></div>

    <!-- Navigation HUD -->
    <div v-if="isNavigating" class="nav-hud">
      <div class="instruction-card">
        <div class="instruction-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/>
          </svg>
        </div>
        <div class="instruction-text">
          <div class="instruction-main">{{ currentInstruction || 'Continue on route' }}</div>
          <div v-if="distanceRemaining" class="instruction-distance">{{ distanceRemaining }}</div>
        </div>
      </div>

      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: progress + '%' }"></div>
      </div>
    </div>

    <!-- Controls -->
    <div class="controls">
      <div class="speed-control">
        <label>Speed: {{ speed }} km/h</label>
        <input type="range" v-model.number="speed" min="10" max="120" step="5" :disabled="isNavigating" />
      </div>

      <div class="buttons">
        <button v-if="!isNavigating" class="btn btn-primary" @click="simulateRoute" :disabled="!route">
          Start Navigation
        </button>
        <template v-else>
          <button v-if="!isPaused" class="btn btn-secondary" @click="pauseSimulation">
            Pause
          </button>
          <button v-else class="btn btn-secondary" @click="resumeSimulation">
            Resume
          </button>
          <button class="btn btn-danger" @click="stopSimulation">
            Stop
          </button>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.navigation-demo {
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

.nav-hud {
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  z-index: 10;
}

.instruction-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px 20px;
  color: white;
}

.instruction-icon {
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #00FF94;
  border-radius: 12px;
  color: black;
}

.instruction-text {
  flex: 1;
}

.instruction-main {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
}

.instruction-distance {
  font-size: 14px;
  color: #00FF94;
  font-weight: 500;
}

.progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  margin-top: 12px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #00FF94;
  transition: width 0.1s linear;
}

.controls {
  position: absolute;
  bottom: 16px;
  left: 16px;
  right: 16px;
  z-index: 10;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 16px;
}

.speed-control {
  margin-bottom: 16px;
}

.speed-control label {
  display: block;
  color: white;
  font-size: 14px;
  margin-bottom: 8px;
}

.speed-control input[type="range"] {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  outline: none;
}

.speed-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 16px;
  height: 16px;
  background: #00FF94;
  border-radius: 50%;
  cursor: pointer;
}

.buttons {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 14px 20px;
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.2s;
  font-family: inherit;
}

.btn:hover {
  opacity: 0.9;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #00FF94;
  color: black;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.1);
  color: white;
}

.btn-danger {
  background: #ff4444;
  color: white;
}
</style>
