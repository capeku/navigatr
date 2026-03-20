<script setup lang="ts">
import type { LatLng, RouteResult, NavigatrMap, NavigatrMarker, AlternateRoute } from '@navigatr/web'

const props = defineProps<{
  polyline: LatLng[]
  origin: LatLng | null
  destination: LatLng | null
  routeResult: RouteResult | null
}>()

const emit = defineEmits<{
  'update:origin': [location: LatLng]
  'update:destination': [location: LatLng]
  'navigation-progress': [progress: number]
  'navigation-end': []
  'switch-route': [index: number]
}>()

let map: NavigatrMap | null = null
let originMarker: NavigatrMarker | null = null
let destinationMarker: NavigatrMarker | null = null
let simulationInterval: ReturnType<typeof setInterval> | null = null
let floatIndex = 0

const isNavigating = ref(false)
const simulationSpeed = 60 // km/h

function haversineDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371000
  const lat1 = p1.lat * Math.PI / 180
  const lat2 = p2.lat * Math.PI / 180
  const dLat = (p2.lat - p1.lat) * Math.PI / 180
  const dLng = (p2.lng - p1.lng) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function startNavigation() {
  if (!map || props.polyline.length === 0 || !props.routeResult) return

  isNavigating.value = true
  floatIndex = 0

  // Hide markers during navigation
  if (originMarker) originMarker.remove()
  if (destinationMarker) destinationMarker.remove()
  originMarker = null
  destinationMarker = null

  // Start navigation mode
  map.startNavigation(props.routeResult)

  // Calculate simulation parameters
  const poly = props.polyline
  const totalPoints = poly.length
  const updateIntervalMs = 100
  const speedMps = (simulationSpeed * 1000) / 3600
  const distancePerUpdate = speedMps * (updateIntervalMs / 1000)

  let totalDistance = 0
  for (let i = 0; i < poly.length - 1; i++) {
    totalDistance += haversineDistance(poly[i], poly[i + 1])
  }
  const avgPointDistance = totalDistance / (poly.length - 1)
  const pointsPerUpdate = Math.max(1, distancePerUpdate / avgPointDistance)

  simulationInterval = setInterval(() => {
    floatIndex += pointsPerUpdate

    if (floatIndex >= totalPoints - 1) {
      map!.updatePosition(poly[totalPoints - 1])
      stopNavigation()
      emit('navigation-progress', 100)
      emit('navigation-end')
      return
    }

    const baseIndex = Math.floor(floatIndex)
    const fraction = floatIndex - baseIndex
    const p1 = poly[baseIndex]
    const p2 = poly[Math.min(baseIndex + 1, totalPoints - 1)]

    const interpolatedPos: LatLng = {
      lat: p1.lat + (p2.lat - p1.lat) * fraction,
      lng: p1.lng + (p2.lng - p1.lng) * fraction
    }

    map!.updatePosition(interpolatedPos)
    emit('navigation-progress', Math.round((floatIndex / (totalPoints - 1)) * 100))
  }, updateIntervalMs)
}

function stopNavigation() {
  if (simulationInterval) {
    clearInterval(simulationInterval)
    simulationInterval = null
  }
  isNavigating.value = false
  floatIndex = 0

  if (map) {
    map.stopNavigation()
    // Restore markers
    if (props.origin) {
      originMarker = map.addMarker({
        ...props.origin,
        label: 'Pickup',
        draggable: true,
        onDragEnd: (location) => emit('update:origin', location)
      })
    }
    if (props.destination) {
      destinationMarker = map.addMarker({
        ...props.destination,
        label: 'Destination',
        draggable: true,
        onDragEnd: (location) => emit('update:destination', location)
      })
    }
    // Redraw route
    if (props.polyline.length > 0) {
      map.drawRoute(props.polyline)
      map.fitRoute(props.polyline)
    }
  }
}

onMounted(async () => {
  const { Navigatr } = await import('@navigatr/web')
  const nav = new Navigatr()

  map = nav.map({
    container: 'map',
    center: { lat: 5.6037, lng: -0.1870 },
    zoom: 12
  })

  // Handle clicks on alternate routes
  map.onAlternateRouteClick((index) => {
    emit('switch-route', index)
  })
})

onUnmounted(() => {
  stopNavigation()
})

defineExpose({
  startNavigation,
  stopNavigation,
  isNavigating
})

watch(() => [props.polyline, props.origin, props.destination, props.routeResult], () => {
  if (!map || isNavigating.value) return

  map.clearRoute()

  if (props.polyline.length > 0) {
    map.drawRoute(props.polyline)
    map.fitRoute(props.polyline)

    // Draw alternate routes if available
    if (props.routeResult?.alternates && props.routeResult.alternates.length > 0) {
      map.drawAlternateRoutes(props.routeResult.alternates)
    }
  }

  if (props.origin) {
    if (originMarker) {
      originMarker.setLatLng(props.origin)
    } else {
      originMarker = map.addMarker({
        ...props.origin,
        label: 'Pickup',
        draggable: true,
        onDragEnd: (location) => emit('update:origin', location)
      })
    }
  } else if (originMarker) {
    originMarker.remove()
    originMarker = null
  }

  if (props.destination) {
    if (destinationMarker) {
      destinationMarker.setLatLng(props.destination)
    } else {
      destinationMarker = map.addMarker({
        ...props.destination,
        label: 'Destination',
        draggable: true,
        onDragEnd: (location) => emit('update:destination', location)
      })
    }
  } else if (destinationMarker) {
    destinationMarker.remove()
    destinationMarker = null
  }
}, { deep: true })
</script>

<template>
  <div id="map" class="map-container"></div>
</template>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
}
</style>
