<script setup lang="ts">
import type { LatLng, RouteResult, NavigatrMap, NavigatrMarker } from '@navigatr/web'

const props = defineProps<{
  polyline: LatLng[]
  origin: LatLng | null
  destination: LatLng | null
}>()

const emit = defineEmits<{
  'update:origin': [location: LatLng]
  'update:destination': [location: LatLng]
}>()

let map: NavigatrMap | null = null
let originMarker: NavigatrMarker | null = null
let destinationMarker: NavigatrMarker | null = null

onMounted(async () => {
  const { Navigatr } = await import('@navigatr/web')
  const nav = new Navigatr()

  map = nav.map({
    container: 'map',
    center: { lat: 5.6037, lng: -0.1870 },
    zoom: 12
  })
})

watch(() => [props.polyline, props.origin, props.destination], () => {
  if (!map) return

  map.clearRoute()

  if (props.polyline.length > 0) {
    map.drawRoute(props.polyline)
    map.fitRoute(props.polyline)
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
