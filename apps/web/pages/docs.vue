<script setup lang="ts">
import type { LatLng, NavigatrMap, NavigatrMarker, Navigatr, RideSession } from '@navigatr/web'

interface AutocompleteResult {
  lat: number
  lng: number
  displayName: string
  name: string
  city?: string
  country?: string
}

type TabId = 'route' | 'tracking' | 'styling'

interface MapStyle {
  theme: string
  colors: {
    primary: string
    water: string
    parks: string
    roads: string
    buildings: string
  }
  layers: {
    roads: boolean
    labels: boolean
    buildings: boolean
    water: boolean
    parks: boolean
    traffic: boolean
  }
  polyline: {
    color: string
    weight: number
    opacity: number
  }
  markers: {
    color: string
  }
}

// Countries with ISO 3166-1 alpha-2 codes
const countries = [
  { code: '', name: 'All countries', flag: '' },
  { code: 'GH', name: 'Ghana', flag: '' },
  { code: 'NG', name: 'Nigeria', flag: '' },
  { code: 'KE', name: 'Kenya', flag: '' },
  { code: 'ZA', name: 'South Africa', flag: '' },
  { code: 'US', name: 'United States', flag: '' },
  { code: 'GB', name: 'United Kingdom', flag: '' },
  { code: 'DE', name: 'Germany', flag: '' },
  { code: 'FR', name: 'France', flag: '' },
]

const activeTab = ref<TabId>('route')
const consoleOutput = ref<string[]>([])
const isRunning = ref(false)
const selectedCountry = ref('')
const codeCopied = ref(false)
const bottomPanelTab = ref<'console' | 'code'>('console')

// Style presets
const stylePresets = [
  { id: 'default', name: 'Default' },
  { id: 'dark', name: 'Dark Mode' },
  { id: 'satellite', name: 'Satellite' },
  { id: 'navigation', name: 'Navigation' },
  { id: 'minimal', name: 'Minimal' }
]

// Map styling state
const mapStyle = ref<MapStyle>({
  theme: 'default',
  colors: {
    primary: '#3b82f6',
    water: '#0ea5e9',
    parks: '#22c55e',
    roads: '#94a3b8',
    buildings: '#cbd5e1'
  },
  layers: {
    roads: true,
    labels: true,
    buildings: true,
    water: true,
    parks: true,
    traffic: false
  },
  polyline: {
    color: '#3b82f6',
    weight: 5,
    opacity: 0.8
  },
  markers: {
    color: '#3b82f6'
  }
})

// Route tab state
const routeOriginInput = ref('')
const routeDestinationInput = ref('')
const routeResult = ref<any>(null)
const pinDropMode = ref<'origin' | 'destination' | null>(null)

// Map state
let nav: Navigatr | null = null
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
const simulationSpeed = ref(60) // km/h
let rideSession: RideSession | null = null
let simulationInterval: ReturnType<typeof setInterval> | null = null
let floatIndex = 0

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

function applyPreset(presetId: string) {
  const presets: Record<string, Partial<MapStyle>> = {
    default: {
      theme: 'default',
      colors: { primary: '#3b82f6', water: '#0ea5e9', parks: '#22c55e', roads: '#94a3b8', buildings: '#cbd5e1' },
      polyline: { color: '#3b82f6', weight: 5, opacity: 0.8 },
      markers: { color: '#3b82f6' }
    },
    dark: {
      theme: 'dark',
      colors: { primary: '#60a5fa', water: '#0369a1', parks: '#166534', roads: '#475569', buildings: '#334155' },
      polyline: { color: '#60a5fa', weight: 5, opacity: 0.8 },
      markers: { color: '#60a5fa' }
    },
    satellite: {
      theme: 'satellite',
      colors: { primary: '#fbbf24', water: '#0ea5e9', parks: '#22c55e', roads: '#94a3b8', buildings: '#cbd5e1' },
      polyline: { color: '#fbbf24', weight: 4, opacity: 0.9 },
      markers: { color: '#fbbf24' }
    },
    navigation: {
      theme: 'navigation',
      colors: { primary: '#2563eb', water: '#38bdf8', parks: '#4ade80', roads: '#64748b', buildings: '#e2e8f0' },
      polyline: { color: '#2563eb', weight: 6, opacity: 0.9 },
      markers: { color: '#2563eb' }
    },
    minimal: {
      theme: 'minimal',
      colors: { primary: '#000000', water: '#e0f2fe', parks: '#ecfdf5', roads: '#d4d4d4', buildings: '#f5f5f5' },
      polyline: { color: '#000000', weight: 3, opacity: 1 },
      markers: { color: '#000000' }
    }
  }

  const preset = presets[presetId]
  if (preset) {
    mapStyle.value = { ...mapStyle.value, ...preset } as MapStyle
    log(`Selected "${presetId}" style preset`, 'info')
  }
}

// CSS filter presets for map themes
const mapFilters: Record<string, string> = {
  default: 'none',
  dark: 'invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)',
  satellite: 'saturate(120%) contrast(110%)',
  navigation: 'saturate(110%) brightness(105%)',
  minimal: 'grayscale(100%) brightness(110%) contrast(90%)'
}

const currentMapFilter = ref('none')

function applyStyleToMap() {
  log(`nav.setStyleFromPreset('${mapStyle.value.theme}', { ... })`)
  log(`Style configuration applied:`, 'success')
  log(`  Theme: ${mapStyle.value.theme}`)
  log(`  Primary: ${mapStyle.value.colors.primary}`)
  log(`  Polyline: ${mapStyle.value.polyline.color}, ${mapStyle.value.polyline.weight}px, ${mapStyle.value.polyline.opacity} opacity`)

  // Apply CSS filter to map based on theme
  currentMapFilter.value = mapFilters[mapStyle.value.theme] || 'none'
  log(`  Map filter applied: ${mapStyle.value.theme}`)

  if (map && polyline.value.length > 0) {
    map.clearRoute()
    map.drawRoute(polyline.value, {
      color: mapStyle.value.polyline.color,
      weight: mapStyle.value.polyline.weight,
      opacity: mapStyle.value.polyline.opacity
    })
    log(`  Route redrawn with new style`)
  }

  log(`CSS variables generated for your app`)
}

const generatedCode = computed(() => {
  const style = mapStyle.value
  return `import { NavigatrCore } from '@navigatr/core'

const nav = new NavigatrCore()

// Apply style preset
nav.setStyleFromPreset('${style.theme}', {
  colors: {
    primary: '${style.colors.primary}',
    water: '${style.colors.water}',
    parks: '${style.colors.parks}',
    roads: '${style.colors.roads}',
    buildings: '${style.colors.buildings}'
  },
  polyline: {
    color: '${style.polyline.color}',
    weight: ${style.polyline.weight},
    opacity: ${style.polyline.opacity}
  },
  markers: {
    color: '${style.markers.color}'
  },
  layers: {
    roads: ${style.layers.roads},
    labels: ${style.layers.labels},
    buildings: ${style.layers.buildings},
    traffic: ${style.layers.traffic}
  }
})

// Get current style
const currentStyle = nav.getStyle()

// Get as CSS variables
const cssVars = nav.getStyleAsCSSVariables('map')
// { '--map-primary': '${style.colors.primary}', ... }`
})

async function copyCode() {
  try {
    await navigator.clipboard.writeText(generatedCode.value)
    codeCopied.value = true
    log('Code copied to clipboard', 'success')
    setTimeout(() => { codeCopied.value = false }, 2000)
  } catch {
    log('Failed to copy code', 'error')
  }
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
  log(`  Drag the pin to adjust location`)
  updateMapMarkers()
  // Pan to the selected location
  map?.panTo(originCoords.value)
  if (destinationCoords.value) calculateRoute()
}

function handleDestinationSelect(result: AutocompleteResult) {
  destinationCoords.value = { lat: result.lat, lng: result.lng }
  routeDestinationInput.value = result.name || result.displayName.split(',')[0]
  log(`Destination selected: ${routeDestinationInput.value}`, 'success')
  log(`  Coordinates: { lat: ${result.lat.toFixed(6)}, lng: ${result.lng.toFixed(6)} }`)
  log(`  Drag the pin to adjust location`)
  updateMapMarkers()
  // Pan to the selected location
  map?.panTo(destinationCoords.value)
  if (originCoords.value) calculateRoute()
}

function handleOriginDrag(location: LatLng) {
  originCoords.value = location
  log(`Origin adjusted: { lat: ${location.lat.toFixed(6)}, lng: ${location.lng.toFixed(6)} }`)
  if (destinationCoords.value) calculateRoute()
}

function handleDestinationDrag(location: LatLng) {
  destinationCoords.value = location
  log(`Destination adjusted: { lat: ${location.lat.toFixed(6)}, lng: ${location.lng.toFixed(6)} }`)
  if (originCoords.value) calculateRoute()
}

function updateMapMarkers() {
  if (!map) return

  if (originCoords.value) {
    if (originMarker) {
      originMarker.setLatLng(originCoords.value)
    } else {
      originMarker = map.addMarker({
        ...originCoords.value,
        label: 'Origin',
        draggable: true,
        onDragEnd: handleOriginDrag
      })
    }
  }

  if (destinationCoords.value) {
    if (destinationMarker) {
      destinationMarker.setLatLng(destinationCoords.value)
    } else {
      destinationMarker = map.addMarker({
        ...destinationCoords.value,
        label: 'Destination',
        draggable: true,
        onDragEnd: handleDestinationDrag
      })
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
      map.drawRoute(decoded, {
        color: mapStyle.value.polyline.color,
        weight: mapStyle.value.polyline.weight,
        opacity: mapStyle.value.polyline.opacity
      })
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

function haversineDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371000 // Earth radius in meters
  const lat1 = p1.lat * Math.PI / 180
  const lat2 = p2.lat * Math.PI / 180
  const dLat = (p2.lat - p1.lat) * Math.PI / 180
  const dLng = (p2.lng - p1.lng) * Math.PI / 180

  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

async function startTracking() {
  if (!nav || !map || polyline.value.length === 0 || !originCoords.value || !destinationCoords.value) {
    log('Select origin and destination first', 'error')
    return
  }

  isTracking.value = true
  trackingProgress.value = 0
  floatIndex = 0

  log('Starting driver simulation with RideSession...', 'info')
  log(`Creating ride: nav.createRide({ pickup, destination })`)

  // Create a RideSession that integrates with the core product
  rideSession = nav.createRide({
    pickup: originCoords.value,
    destination: destinationCoords.value,
    map,
    onETAUpdate: (route, _phase) => {
      // ETA is now calculated from actual route recalculation
      const mins = Math.ceil(route.durationSeconds / 60)
      currentETA.value = mins <= 1 ? '< 1 min' : `${mins} min`
      log(`Route recalculated: ${route.durationText} (${route.distanceText})`)
    },
    onPhaseChange: (phase) => {
      log(`Ride phase changed: ${phase}`, 'success')
    },
    onDriverMove: (_location) => {
      // Progress is updated in the simulation interval
    }
  })

  // Start the pickup phase with driver at origin
  const startPos = polyline.value[0]
  await rideSession.startPickup(startPos)
  log(`Driver started at: { lat: ${startPos.lat.toFixed(6)}, lng: ${startPos.lng.toFixed(6)} }`)

  // Calculate simulation parameters based on speed (matching NavigationDemo.vue)
  const poly = polyline.value
  const totalPoints = poly.length
  const updateIntervalMs = 100 // Update every 100ms for smooth movement
  const speedMps = (simulationSpeed.value * 1000) / 3600 // Convert km/h to m/s
  const distancePerUpdate = speedMps * (updateIntervalMs / 1000) // meters per update

  // Calculate average distance between polyline points
  let totalDistance = 0
  for (let i = 0; i < poly.length - 1; i++) {
    totalDistance += haversineDistance(poly[i], poly[i + 1])
  }
  const avgPointDistance = totalDistance / (poly.length - 1)

  // How many points to advance per update
  const pointsPerUpdate = Math.max(1, distancePerUpdate / avgPointDistance)

  simulationInterval = setInterval(async () => {
    floatIndex += pointsPerUpdate

    if (floatIndex >= totalPoints - 1) {
      // Arrived at destination
      floatIndex = totalPoints - 1
      const finalPos = poly[totalPoints - 1]
      map?.updateDriverMarker({ ...finalPos, heading: 0, icon: 'car' })
      map?.updateTraveledRoute(poly, totalPoints - 1)
      stopTracking()
      trackingProgress.value = 100
      currentETA.value = 'Arrived!'
      log('Driver arrived at destination!', 'success')
      rideSession?.complete()
      return
    }

    // Interpolate between points for smoother movement
    const baseIndex = Math.floor(floatIndex)
    const fraction = floatIndex - baseIndex
    const p1 = poly[baseIndex]
    const p2 = poly[Math.min(baseIndex + 1, totalPoints - 1)]

    const interpolatedPos: LatLng = {
      lat: p1.lat + (p2.lat - p1.lat) * fraction,
      lng: p1.lng + (p2.lng - p1.lng) * fraction
    }

    const heading = calculateHeading(p1, p2)
    trackingProgress.value = Math.round((floatIndex / (totalPoints - 1)) * 100)

    // Update driver location through RideSession
    if (rideSession) {
      await rideSession.updateDriverLocation(interpolatedPos)
      // Also update heading for smooth car rotation
      map?.updateDriverMarker({ ...interpolatedPos, heading, icon: 'car' })
      // Grey out the traveled portion of the route
      map?.updateTraveledRoute(poly, baseIndex)
    }
  }, updateIntervalMs)
}

function stopTracking() {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }
  isTracking.value = false
  trackingProgress.value = 0
  currentETA.value = ''
  floatIndex = 0
  if (rideSession) {
    rideSession.complete()
    rideSession = null
  }
  if (map) {
    map.removeDriverMarker()
    // Clear the traveled route overlay
    map.updateTraveledRoute([], 0)
  }
}

async function handlePinDrop(location: LatLng) {
  if (!pinDropMode.value || !map) return

  const mode = pinDropMode.value
  pinDropMode.value = null // Exit pin drop mode after placing

  log(`Pin dropped at: { lat: ${location.lat.toFixed(6)}, lng: ${location.lng.toFixed(6)} }`, 'success')

  // Reverse geocode to get address
  try {
    const res = await fetch(`/api/reverse-geocode?lat=${location.lat}&lon=${location.lng}`)
    const data = await res.json()
    const displayName = data.displayName || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`

    if (mode === 'origin') {
      originCoords.value = location
      routeOriginInput.value = displayName.split(',')[0]
      if (originMarker) originMarker.setLatLng(location)
      else originMarker = map.addMarker({ ...location, label: 'Origin' })
      log(`Origin set: ${routeOriginInput.value}`)
      if (destinationCoords.value) calculateRoute()
    } else {
      destinationCoords.value = location
      routeDestinationInput.value = displayName.split(',')[0]
      if (destinationMarker) destinationMarker.setLatLng(location)
      else destinationMarker = map.addMarker({ ...location, label: 'Destination' })
      log(`Destination set: ${routeDestinationInput.value}`)
      if (originCoords.value) calculateRoute()
    }
  } catch {
    // Fallback to coords if reverse geocode fails
    const displayName = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
    if (mode === 'origin') {
      originCoords.value = location
      routeOriginInput.value = displayName
      if (originMarker) originMarker.setLatLng(location)
      else originMarker = map.addMarker({ ...location, label: 'Origin' })
      if (destinationCoords.value) calculateRoute()
    } else {
      destinationCoords.value = location
      routeDestinationInput.value = displayName
      if (destinationMarker) destinationMarker.setLatLng(location)
      else destinationMarker = map.addMarker({ ...location, label: 'Destination' })
      if (originCoords.value) calculateRoute()
    }
  }
}

onMounted(async () => {
  const { Navigatr } = await import('@navigatr/web')
  nav = new Navigatr()

  map = nav.map({
    container: 'sandbox-map',
    center: { lat: 5.6037, lng: -0.1870 },
    zoom: 12
  })

  // Handle map clicks for pin drop
  map.onClick(handlePinDrop)

  log('Navigatr SDK initialized', 'success')
  log('Map ready - search for locations or drop pins')
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
          <button
            class="tab"
            :class="{ active: activeTab === 'styling' }"
            @click="activeTab = 'styling'"
          >
            Styling
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
              <label>country</label>
              <select v-model="selectedCountry" class="country-select">
                <option v-for="country in countries" :key="country.code" :value="country.code">
                  {{ country.name }}
                </option>
              </select>
            </div>

            <div class="input-group">
              <div class="label-row">
                <label>origin</label>
                <button
                  class="pin-drop-btn"
                  :class="{ active: pinDropMode === 'origin' }"
                  @click="pinDropMode = pinDropMode === 'origin' ? null : 'origin'"
                  title="Drop pin on map"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </button>
              </div>
              <AddressSearch
                v-model="routeOriginInput"
                placeholder="Search or drop pin..."
                :country-code="selectedCountry"
                @select="handleOriginSelect"
              />
            </div>

            <div class="input-group">
              <div class="label-row">
                <label>destination</label>
                <button
                  class="pin-drop-btn"
                  :class="{ active: pinDropMode === 'destination' }"
                  @click="pinDropMode = pinDropMode === 'destination' ? null : 'destination'"
                  title="Drop pin on map"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                </button>
              </div>
              <AddressSearch
                v-model="routeDestinationInput"
                placeholder="Search or drop pin..."
                :country-code="selectedCountry"
                @select="handleDestinationSelect"
              />
            </div>

            <div v-if="pinDropMode" class="pin-drop-hint">
              Click on the map to set {{ pinDropMode }}
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

          <!-- Styling Tab -->
          <div v-if="activeTab === 'styling'" class="tab-content">
            <div class="method-signature">
              <span class="method-name">nav.setStyleFromPreset</span>
              <span class="method-params">(presetId, options?)</span>
            </div>
            <p class="method-desc">Customize map appearance with presets, colors, and layer visibility.</p>

            <!-- Preset Selection -->
            <div class="input-group">
              <label>preset</label>
              <div class="preset-grid">
                <button
                  v-for="preset in stylePresets"
                  :key="preset.id"
                  class="preset-btn"
                  :class="{ active: mapStyle.theme === preset.id }"
                  @click="applyPreset(preset.id)"
                >
                  {{ preset.name }}
                </button>
              </div>
            </div>

            <!-- Colors Section -->
            <div class="style-section">
              <div class="section-header">
                <span class="section-title">Colors</span>
              </div>
              <div class="color-grid">
                <div class="color-input">
                  <label>primary</label>
                  <div class="color-picker-wrapper">
                    <input type="color" v-model="mapStyle.colors.primary" />
                    <span class="color-value">{{ mapStyle.colors.primary }}</span>
                  </div>
                </div>
                <div class="color-input">
                  <label>water</label>
                  <div class="color-picker-wrapper">
                    <input type="color" v-model="mapStyle.colors.water" />
                    <span class="color-value">{{ mapStyle.colors.water }}</span>
                  </div>
                </div>
                <div class="color-input">
                  <label>parks</label>
                  <div class="color-picker-wrapper">
                    <input type="color" v-model="mapStyle.colors.parks" />
                    <span class="color-value">{{ mapStyle.colors.parks }}</span>
                  </div>
                </div>
                <div class="color-input">
                  <label>roads</label>
                  <div class="color-picker-wrapper">
                    <input type="color" v-model="mapStyle.colors.roads" />
                    <span class="color-value">{{ mapStyle.colors.roads }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Polyline Style -->
            <div class="style-section">
              <div class="section-header">
                <span class="section-title">Route Polyline</span>
              </div>
              <!-- Live Preview -->
              <div class="polyline-preview">
                <div
                  class="polyline-preview-line"
                  :style="{
                    backgroundColor: mapStyle.polyline.color,
                    height: mapStyle.polyline.weight + 'px',
                    opacity: mapStyle.polyline.opacity
                  }"
                ></div>
                <span class="preview-label">Preview</span>
              </div>
              <div class="polyline-controls">
                <div class="color-input">
                  <label>color</label>
                  <div class="color-picker-wrapper">
                    <input type="color" v-model="mapStyle.polyline.color" />
                    <span class="color-value">{{ mapStyle.polyline.color }}</span>
                  </div>
                </div>
                <div class="slider-input">
                  <label>weight: {{ mapStyle.polyline.weight }}px</label>
                  <input type="range" v-model.number="mapStyle.polyline.weight" min="1" max="12" step="1" />
                </div>
                <div class="slider-input">
                  <label>opacity: {{ mapStyle.polyline.opacity }}</label>
                  <input type="range" v-model.number="mapStyle.polyline.opacity" min="0.1" max="1" step="0.1" />
                </div>
              </div>
            </div>

            <!-- Layer Visibility -->
            <div class="style-section">
              <div class="section-header">
                <span class="section-title">Layer Visibility</span>
              </div>
              <div class="layer-toggles">
                <label class="toggle-row">
                  <input type="checkbox" v-model="mapStyle.layers.roads" />
                  <span>Roads</span>
                </label>
                <label class="toggle-row">
                  <input type="checkbox" v-model="mapStyle.layers.labels" />
                  <span>Labels</span>
                </label>
                <label class="toggle-row">
                  <input type="checkbox" v-model="mapStyle.layers.buildings" />
                  <span>Buildings</span>
                </label>
                <label class="toggle-row">
                  <input type="checkbox" v-model="mapStyle.layers.traffic" />
                  <span>Traffic</span>
                </label>
              </div>
            </div>

            <!-- Apply Style Button -->
            <button class="apply-style-btn" @click="applyStyleToMap">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Apply Style
            </button>
          </div>
        </div>

        <div class="console-panel">
          <div class="console-header">
            <div class="console-tabs">
              <button
                class="console-tab"
                :class="{ active: bottomPanelTab === 'console' }"
                @click="bottomPanelTab = 'console'"
              >
                Console
              </button>
              <button
                class="console-tab"
                :class="{ active: bottomPanelTab === 'code' }"
                @click="bottomPanelTab = 'code'"
              >
                Code
              </button>
            </div>
            <div class="console-actions">
              <button v-if="bottomPanelTab === 'console'" class="console-clear" @click="clearConsole">Clear</button>
              <button v-if="bottomPanelTab === 'code'" class="console-clear" @click="copyCode">
                {{ codeCopied ? 'Copied!' : 'Copy' }}
              </button>
            </div>
          </div>
          <!-- Console Output -->
          <div v-if="bottomPanelTab === 'console'" class="console-output">
            <div v-for="(line, index) in consoleOutput" :key="index" class="console-line">
              {{ line }}
            </div>
            <div v-if="consoleOutput.length === 0" class="console-empty">
              Output will appear here...
            </div>
          </div>
          <!-- Code Preview -->
          <div v-if="bottomPanelTab === 'code'" class="console-output code-output">
            <pre class="code-preview"><code>{{ generatedCode }}</code></pre>
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
              <div id="sandbox-map" class="map-container" :style="{ filter: currentMapFilter }"></div>
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

.label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pin-drop-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
}

.pin-drop-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.pin-drop-btn.active {
  background: rgba(0, 255, 148, 0.15);
  border-color: var(--accent);
  color: var(--accent);
}

.pin-drop-hint {
  padding: 10px 14px;
  background: rgba(0, 255, 148, 0.1);
  border: 1px dashed var(--accent);
  border-radius: 8px;
  font-size: 13px;
  color: var(--accent);
  text-align: center;
}

.input-group label {
  font-size: 12px;
  color: var(--text-muted);
  font-family: 'IBM Plex Mono', monospace;
}

.country-select {
  width: 100%;
  padding: 12px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}

.country-select:hover {
  border-color: var(--accent);
}

.country-select:focus {
  outline: none;
  border-color: var(--accent);
}

.country-select option {
  background: var(--card-bg);
  color: var(--text);
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
  transition: filter 0.3s ease;
}

/* Styling Tab */
.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.preset-btn {
  padding: 10px 12px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: var(--accent);
  color: var(--text);
}

.preset-btn.active {
  background: rgba(0, 255, 148, 0.1);
  border-color: var(--accent);
  color: var(--accent);
}

.style-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--text-muted);
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.color-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.color-input label {
  font-size: 11px;
  color: var(--text-muted);
  font-family: 'IBM Plex Mono', monospace;
}

.color-picker-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-picker-wrapper input[type="color"] {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  background: transparent;
}

.color-picker-wrapper input[type="color"]::-webkit-color-swatch-wrapper {
  padding: 0;
}

.color-picker-wrapper input[type="color"]::-webkit-color-swatch {
  border-radius: 4px;
  border: 1px solid var(--border);
}

.color-value {
  font-size: 11px;
  font-family: 'IBM Plex Mono', monospace;
  color: var(--text-muted);
}

.polyline-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg);
  border-radius: 6px;
}

.polyline-preview-line {
  flex: 1;
  border-radius: 4px;
  transition: all 0.2s;
}

.preview-label {
  font-size: 10px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.polyline-controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.slider-input {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.slider-input label {
  font-size: 11px;
  color: var(--text-muted);
  font-family: 'IBM Plex Mono', monospace;
}

.slider-input input[type="range"] {
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: var(--border);
  appearance: none;
  cursor: pointer;
}

.slider-input input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
}

.layer-toggles {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.toggle-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg);
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  color: var(--text);
  transition: background 0.2s;
}

.toggle-row:hover {
  background: rgba(0, 255, 148, 0.05);
}

.toggle-row input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: var(--accent);
  cursor: pointer;
}

.apply-style-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 14px 20px;
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

.apply-style-btn:hover {
  opacity: 0.9;
}

.console-tabs {
  display: flex;
  gap: 4px;
}

.console-tab {
  padding: 4px 12px;
  background: transparent;
  border: none;
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.console-tab:hover {
  color: var(--text);
}

.console-tab.active {
  background: rgba(0, 255, 148, 0.15);
  color: var(--accent);
}

.console-actions {
  display: flex;
  gap: 8px;
}

.code-output {
  padding: 0;
}

.code-output .code-preview {
  margin: 0;
  padding: 12px 16px;
  background: transparent;
  max-height: none;
  height: 100%;
}

.code-section {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.code-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border);
}

.code-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
}

.copy-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 4px;
  color: var(--text-muted);
  font-size: 11px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  border-color: var(--accent);
  color: var(--accent);
}

.code-preview {
  margin: 0;
  padding: 16px;
  background: #0a0a0f;
  font-family: 'IBM Plex Mono', monospace;
  font-size: 11px;
  line-height: 1.6;
  color: var(--text-muted);
  overflow-x: auto;
  max-height: 280px;
  overflow-y: auto;
}

.code-preview code {
  color: var(--text);
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

  .preset-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .color-grid {
    grid-template-columns: 1fr;
  }

  .layer-toggles {
    grid-template-columns: 1fr;
  }
}
</style>
