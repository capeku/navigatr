<script setup lang="ts">
import type { LatLng, RouteResult, NavigatrMap } from '@navigatr/web'

const props = defineProps<{
  polyline: LatLng[]
  origin: LatLng | null
  destination: LatLng | null
}>()

let map: NavigatrMap | null = null

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
    map.addMarker({ ...props.origin, label: 'Origin' })
  }

  if (props.destination) {
    map.addMarker({ ...props.destination, label: 'Destination' })
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
  min-height: 400px;
}
</style>
