<script setup lang="ts">
import type { LatLng, RouteResult, GeocodeResult } from '@navigatr/web'

interface AutocompleteResult {
  lat: number
  lng: number
  displayName: string
  name: string
  city?: string
  country?: string
}

const pickupInput = ref('Accra Mall')
const destinationInput = ref('')

const pickup = ref<GeocodeResult | null>(null)
const destination = ref<GeocodeResult | null>(null)
const routeResult = ref<RouteResult | null>(null)
const polyline = ref<LatLng[]>([])
const loading = ref(false)

function formatDuration(seconds: number): string {
  const mins = Math.round(seconds / 60)
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60), m = mins % 60
  return m ? `${hrs} hr ${m} min` : `${hrs} hr`
}

function formatDistance(meters: number): string {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(1)} km`
}

async function geocode(address: string): Promise<GeocodeResult> {
  const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`)
  if (!res.ok) throw new Error('Geocoding failed')
  const data = await res.json()
  if (!data.length) throw new Error('No results')
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    displayName: data[0].display_name
  }
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

function handlePickupSelect(result: AutocompleteResult) {
  pickup.value = { lat: result.lat, lng: result.lng, displayName: result.displayName }
  pickupInput.value = result.name || result.displayName.split(',')[0]
  if (destination.value) calculateRoute()
}

function handleDestinationSelect(result: AutocompleteResult) {
  destination.value = { lat: result.lat, lng: result.lng, displayName: result.displayName }
  destinationInput.value = result.name || result.displayName.split(',')[0]
  if (pickup.value) calculateRoute()
}

async function handlePickupSearch() {
  if (!pickupInput.value.trim()) return
  try {
    pickup.value = await geocode(pickupInput.value)
    if (destination.value) calculateRoute()
  } catch (e) {
    console.error(e)
  }
}

async function handleDestinationSearch() {
  if (!destinationInput.value.trim()) return
  try {
    destination.value = await geocode(destinationInput.value)
    if (pickup.value) calculateRoute()
  } catch (e) {
    console.error(e)
  }
}

async function calculateRoute() {
  if (!pickup.value || !destination.value) return

  loading.value = true
  try {
    const data = await routeViaProxy(pickup.value, destination.value)
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
    console.error(e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  try {
    pickup.value = await geocode(pickupInput.value)
  } catch (e) {
    console.error(e)
  }
})
</script>

<template>
  <PhoneMockup>
    <div class="app-screen">
      <RouteDemo
        :polyline="polyline"
        :origin="pickup"
        :destination="destination"
      />

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

          <button
            class="request-btn"
            :disabled="loading"
          >
            {{ loading ? 'Calculating...' : 'Request Ride' }}
          </button>
        </div>
      </div>
    </div>
  </PhoneMockup>
</template>

<style scoped>
.app-screen {
  width: 100%;
  height: 100%;
  position: relative;
  background: #1a1a1a;
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
  margin: 52px 16px 16px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 16px;
  padding: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.input-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.input-dot {
  width: 10px;
  height: 10px;
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
  margin: 8px 0 8px 22px;
}

.bottom-sheet {
  margin-top: auto;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 24px 24px 0 0;
  padding: 24px 20px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

.route-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px 0;
  margin-bottom: 16px;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #111;
}

.stat-label {
  font-size: 12px;
  color: #888;
  text-transform: uppercase;
}

.stat-divider {
  width: 1px;
  height: 32px;
  background: #ddd;
}

.request-btn {
  width: 100%;
  padding: 16px;
  background: #111;
  border: none;
  border-radius: 12px;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
}

.request-btn:hover {
  opacity: 0.9;
}

.request-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
