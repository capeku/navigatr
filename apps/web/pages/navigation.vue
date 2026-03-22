<script setup lang="ts">
import type {
  RouteResult,
  LatLng,
  BaseMapStylePreset,
  TravelMode,
  AutocompleteResult,
  AlternateRoute
} from '@navigatr/web'

const { getNavigatr } = useNavigatr()

interface StopoverInput {
  id: number
  query: string
  result: AutocompleteResult | null
}

const route = ref<RouteResult | null>(null)
const loading = ref(true)
const error = ref('')
const baseMapStyle = ref<BaseMapStylePreset>('bright')
const travelMode = ref<TravelMode>('drive')
const selectedRouteIndex = ref(-1)
const stopovers = ref<StopoverInput[]>([])
const isPickingStopFromMap = ref(false)
const isResolvingMapStop = ref(false)
const shortest = ref(false)
const avoidTolls = ref(false)
const avoidHighways = ref(false)
const avoidFerries = ref(false)
const draggedStopoverId = ref<number | null>(null)
const dragOverStopoverId = ref<number | null>(null)

const mapStyleOptions: Array<{ id: BaseMapStylePreset; label: string }> = [
  { id: 'liberty', label: 'Liberty' },
  { id: 'bright', label: 'Bright' },
  { id: 'positron', label: 'Positron' },
  { id: 'dark', label: 'Dark' }
]

const travelModeOptions: Array<{ id: TravelMode; label: string }> = [
  { id: 'drive', label: 'Drive' },
  { id: 'walk', label: 'Walk' },
  { id: 'bike', label: 'Bike' }
]

const ORIGIN: LatLng = { lat: 5.6226, lng: -0.1725 } // Accra Mall
const DESTINATION: LatLng = { lat: 5.6052, lng: -0.1668 } // Kotoka Airport

let nextStopoverId = 1

const selectedStopovers = computed(() => stopovers.value.filter((stopover) => stopover.result))
const stopoverWaypoints = computed<LatLng[]>(() => (
  selectedStopovers.value.map((stopover) => ({
    lat: stopover.result!.lat,
    lng: stopover.result!.lng
  }))
))
const hasPendingStopovers = computed(() => stopovers.value.some((stopover) => !stopover.result))
const hasAlternates = computed(() => (route.value?.alternates?.length ?? 0) > 0)
const activeRoute = computed<RouteResult | null>(() => {
  if (!route.value) return null

  if (selectedRouteIndex.value === -1) {
    return route.value
  }

  const alternate = route.value.alternates?.[selectedRouteIndex.value]
  if (!alternate) {
    return route.value
  }

  return {
    durationSeconds: alternate.durationSeconds,
    durationText: alternate.durationText,
    distanceMeters: alternate.distanceMeters,
    distanceText: alternate.distanceText,
    polyline: alternate.polyline
  }
})
const visibleAlternateRoutes = computed<AlternateRoute[]>(() => {
  if (!route.value) return []

  const alternates = route.value.alternates ?? []
  if (selectedRouteIndex.value === -1) {
    return alternates
  }

  const selectedAlternate = alternates[selectedRouteIndex.value]
  if (!selectedAlternate) {
    return alternates
  }

  return [
    {
      durationSeconds: route.value.durationSeconds,
      durationText: route.value.durationText,
      distanceMeters: route.value.distanceMeters,
      distanceText: route.value.distanceText,
      polyline: route.value.polyline
    },
    ...alternates.filter((_, index) => index !== selectedRouteIndex.value)
  ]
})

function createStopover(): StopoverInput {
  return {
    id: nextStopoverId++,
    query: '',
    result: null
  }
}

function stopoverLabel(result: AutocompleteResult): string {
  return result.name || result.displayName
}

function stopoverDetail(result: AutocompleteResult): string {
  const parts = [result.street, result.city, result.country].filter(Boolean)
  return parts.join(', ') || result.displayName
}

function addStopover() {
  stopovers.value.push(createStopover())
}

function createMapStopoverResult(location: LatLng, displayName: string): AutocompleteResult {
  return {
    lat: location.lat,
    lng: location.lng,
    displayName,
    name: displayName.split(',')[0]?.trim() || `Pinned stop (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
  }
}

function removeStopover(id: number) {
  stopovers.value = stopovers.value.filter((stopover) => stopover.id !== id)
}

function moveStopover(id: number, direction: -1 | 1) {
  const currentIndex = stopovers.value.findIndex((stopover) => stopover.id === id)
  if (currentIndex < 0) return

  const nextIndex = currentIndex + direction
  if (nextIndex < 0 || nextIndex >= stopovers.value.length) return

  const reordered = [...stopovers.value]
  const [stopover] = reordered.splice(currentIndex, 1)
  reordered.splice(nextIndex, 0, stopover)
  stopovers.value = reordered
}

function reorderStopover(sourceId: number, targetId: number) {
  if (sourceId === targetId) return

  const sourceIndex = stopovers.value.findIndex((stopover) => stopover.id === sourceId)
  const targetIndex = stopovers.value.findIndex((stopover) => stopover.id === targetId)
  if (sourceIndex < 0 || targetIndex < 0) return

  const reordered = [...stopovers.value]
  const [movedStopover] = reordered.splice(sourceIndex, 1)
  reordered.splice(targetIndex, 0, movedStopover)
  stopovers.value = reordered
}

function handleStopoverDragStart(id: number, event: DragEvent) {
  draggedStopoverId.value = id
  dragOverStopoverId.value = id

  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(id))
  }
}

function handleStopoverDragOver(id: number, event: DragEvent) {
  if (draggedStopoverId.value === null) return

  event.preventDefault()
  dragOverStopoverId.value = id

  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
}

function handleStopoverDrop(id: number, event: DragEvent) {
  event.preventDefault()
  if (draggedStopoverId.value === null) return

  reorderStopover(draggedStopoverId.value, id)
  draggedStopoverId.value = null
  dragOverStopoverId.value = null
}

function handleStopoverDragEnd() {
  draggedStopoverId.value = null
  dragOverStopoverId.value = null
}

function updateStopoverQuery(id: number, value: string) {
  const stopover = stopovers.value.find((item) => item.id === id)
  if (!stopover) return

  stopover.query = value

  if (stopover.result && value.trim() !== stopoverLabel(stopover.result)) {
    stopover.result = null
  }
}

function selectStopover(id: number, result: AutocompleteResult) {
  const stopover = stopovers.value.find((item) => item.id === id)
  if (!stopover) return

  stopover.query = stopoverLabel(result)
  stopover.result = result
}

function toggleMapStopPicker() {
  isPickingStopFromMap.value = !isPickingStopFromMap.value
}

function selectRoute(index: number) {
  selectedRouteIndex.value = index
}

function handleSwitchRoute(index: number) {
  if (!route.value) return

  if (selectedRouteIndex.value === -1) {
    selectRoute(index)
    return
  }

  if (index === 0) {
    selectRoute(-1)
    return
  }

  const mappedAlternateIndexes = (route.value.alternates ?? [])
    .map((_, alternateIndex) => alternateIndex)
    .filter((alternateIndex) => alternateIndex !== selectedRouteIndex.value)

  const nextAlternateIndex = mappedAlternateIndexes[index - 1]
  if (nextAlternateIndex !== undefined) {
    selectRoute(nextAlternateIndex)
  }
}

function togglePreference(preference: 'shortest' | 'avoidTolls' | 'avoidHighways' | 'avoidFerries') {
  if (preference === 'avoidTolls') {
    avoidTolls.value = !avoidTolls.value
    return
  }

  if (preference === 'avoidHighways') {
    avoidHighways.value = !avoidHighways.value
    return
  }

  avoidFerries.value = !avoidFerries.value
}

async function handleMapClick(location: LatLng) {
  if (!isPickingStopFromMap.value || isResolvingMapStop.value) return

  isPickingStopFromMap.value = false
  isResolvingMapStop.value = true

  try {
    const nav = await getNavigatr()
    const reverseResult = await nav.reverseGeocode(location)
    const result = createMapStopoverResult(location, reverseResult.displayName)

    stopovers.value.push({
      id: nextStopoverId++,
      query: stopoverLabel(result),
      result
    })
  } catch (e) {
    console.error(e)

    const fallbackLabel = `Pinned stop (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
    const result = createMapStopoverResult(location, fallbackLabel)
    stopovers.value.push({
      id: nextStopoverId++,
      query: stopoverLabel(result),
      result
    })
  } finally {
    isResolvingMapStop.value = false
  }
}

async function fetchRoute() {
  loading.value = true
  error.value = ''
  selectedRouteIndex.value = -1

  try {
    const nav = await getNavigatr()
    route.value = await nav.route({
      origin: ORIGIN,
      destination: DESTINATION,
      waypoints: stopoverWaypoints.value,
      mode: travelMode.value,
      shortest: shortest.value,
      avoidTolls: avoidTolls.value,
      avoidHighways: avoidHighways.value,
      avoidFerries: avoidFerries.value,
      maneuvers: true
    })
  } catch (e) {
    error.value = 'Failed to load route'
    console.error(e)
  } finally {
    loading.value = false
  }
}

function handleNavigationEvent(event: any) {
  console.log('Navigation event:', event)
}

onMounted(() => {
  fetchRoute()
})

watch(travelMode, () => {
  fetchRoute()
})

watch([shortest, avoidTolls, avoidHighways, avoidFerries], () => {
  fetchRoute()
})

watch(stopoverWaypoints, () => {
  fetchRoute()
}, { deep: true })
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
          You can build a multi-stop trip by searching for stops or picking them directly from the map.
        </p>

        <div v-if="route" class="route-info">
          <div class="style-picker">
            <span class="style-label">Travel Mode</span>
            <div class="style-options">
              <button
                v-for="option in travelModeOptions"
                :key="option.id"
                class="style-option"
                :class="{ active: travelMode === option.id }"
                @click="travelMode = option.id"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="style-picker">
            <span class="style-label">Base Map</span>
            <div class="style-options">
              <button
                v-for="option in mapStyleOptions"
                :key="option.id"
                class="style-option"
                :class="{ active: baseMapStyle === option.id }"
                @click="baseMapStyle = option.id"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="style-picker">
            <span class="style-label">Route Preferences</span>
            <div class="style-options">
              <button
                class="style-option"
                :class="{ active: !shortest }"
                @click="shortest = false"
              >
                Fastest
              </button>
              <button
                class="style-option"
                :class="{ active: shortest }"
                @click="shortest = true"
              >
                Shortest
              </button>
              <button
                class="style-option"
                :class="{ active: avoidTolls }"
                @click="togglePreference('avoidTolls')"
              >
                Avoid Tolls
              </button>
              <button
                class="style-option"
                :class="{ active: avoidHighways }"
                @click="togglePreference('avoidHighways')"
              >
                Avoid Highways
              </button>
              <button
                class="style-option"
                :class="{ active: avoidFerries }"
                @click="togglePreference('avoidFerries')"
              >
                Avoid Ferries
              </button>
            </div>
            <p class="preference-note">
              Switch between fastest and shortest routes, then filter out roads you do not want to use.
            </p>
          </div>

          <div v-if="hasAlternates" class="style-picker">
            <span class="style-label">Route Options</span>
            <div class="route-options-list">
              <button
                class="route-option-card"
                :class="{ active: selectedRouteIndex === -1 }"
                @click="selectRoute(-1)"
              >
                <span class="route-option-badge">Recommended</span>
                <span class="route-option-time">{{ route.durationText }}</span>
                <span class="route-option-dist">{{ route.distanceText }}</span>
              </button>
              <button
                v-for="(alternate, index) in route.alternates"
                :key="index"
                class="route-option-card"
                :class="{ active: selectedRouteIndex === index }"
                @click="selectRoute(index)"
              >
                <span class="route-option-badge route-option-badge--alternate">Alternate {{ index + 1 }}</span>
                <span class="route-option-time">{{ alternate.durationText }}</span>
                <span class="route-option-dist">{{ alternate.distanceText }}</span>
              </button>
            </div>
            <p class="preference-note">
              The recommended route is picked automatically. You can switch to another option anytime.
            </p>
          </div>

          <div class="style-picker">
            <span class="style-label">Stopovers</span>
            <div class="stopover-list">
              <div class="stopover-toolbar">
                <button
                  class="style-option"
                  :class="{ active: isPickingStopFromMap }"
                  :disabled="isResolvingMapStop"
                  @click="toggleMapStopPicker"
                >
                  {{ isPickingStopFromMap ? 'Cancel Map Pick' : 'Pick Next Stop On Map' }}
                </button>
              </div>

              <div
                v-for="(stopover, index) in stopovers"
                :key="stopover.id"
                class="stopover-row"
                :class="{
                  'stopover-row--dragging': draggedStopoverId === stopover.id,
                  'stopover-row--drag-target': dragOverStopoverId === stopover.id && draggedStopoverId !== stopover.id
                }"
                @dragover="handleStopoverDragOver(stopover.id, $event)"
                @drop="handleStopoverDrop(stopover.id, $event)"
              >
                <div class="stopover-search">
                  <span class="stopover-index">Stop {{ index + 1 }}</span>
                  <AddressSearch
                    :model-value="stopover.query"
                    placeholder="Search for a stop"
                    @update:model-value="updateStopoverQuery(stopover.id, $event)"
                    @select="selectStopover(stopover.id, $event)"
                  />
                </div>
                <div class="stopover-actions">
                  <button
                    class="drag-handle"
                    draggable="true"
                    title="Drag to reorder stop"
                    @dragstart="handleStopoverDragStart(stopover.id, $event)"
                    @dragend="handleStopoverDragEnd"
                  >
                    Drag to Reorder
                  </button>
                  <button
                    class="reorder-stop"
                    :disabled="index === 0"
                    @click="moveStopover(stopover.id, -1)"
                  >
                    Up
                  </button>
                  <button
                    class="reorder-stop"
                    :disabled="index === stopovers.length - 1"
                    @click="moveStopover(stopover.id, 1)"
                  >
                    Down
                  </button>
                  <button class="remove-stop" @click="removeStopover(stopover.id)">
                    Remove
                  </button>
                </div>
              </div>

              <button class="style-option add-stop" @click="addStopover">
                Add Stop
              </button>

              <p class="stopover-note">
                Search for a stop or use the map picker to drop one directly onto the route.
              </p>
              <p v-if="selectedStopovers.length > 1" class="stopover-note">
                Drag the handle or use Up and Down to change the order of stops in the trip.
              </p>
              <p v-if="hasPendingStopovers" class="stopover-note">
                Pick a result from the dropdown before it becomes part of the route.
              </p>
              <p v-if="isResolvingMapStop" class="stopover-note">
                Looking up the address for your clicked stop...
              </p>
            </div>
          </div>

          <div class="route-endpoints">
            <div class="endpoint">
              <span class="dot origin"></span>
              <span>Accra Mall</span>
            </div>
            <div
              v-for="(stopover, index) in selectedStopovers"
              :key="stopover.id"
              class="endpoint"
            >
              <span class="dot stopover"></span>
              <span>Stop {{ index + 1 }}: {{ stopoverLabel(stopover.result!) }}</span>
            </div>
            <div class="endpoint">
              <span class="dot destination"></span>
              <span>Kotoka Airport</span>
            </div>
          </div>

          <div class="route-stats">
            <span>{{ activeRoute?.distanceText }}</span>
            <span class="separator">•</span>
            <span>{{ activeRoute?.durationText }}</span>
            <template v-if="selectedStopovers.length > 0">
              <span class="separator">•</span>
              <span>{{ selectedStopovers.length }} {{ selectedStopovers.length === 1 ? 'stop' : 'stops' }}</span>
            </template>
          </div>

          <div v-if="selectedStopovers.length > 0" class="stopover-summary">
            <div
              v-for="stopover in selectedStopovers"
              :key="stopover.id"
              class="stopover-summary-item"
            >
              <span class="stopover-summary-name">{{ stopoverLabel(stopover.result!) }}</span>
              <span class="stopover-summary-detail">{{ stopoverDetail(stopover.result!) }}</span>
            </div>
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
        :key="`${baseMapStyle}-${selectedStopovers.map((stopover) => stopover.id).join('-')}`"
        :route="activeRoute"
        :alternate-routes="visibleAlternateRoutes"
        :origin="ORIGIN"
        :destination="DESTINATION"
        :waypoints="stopoverWaypoints"
        :base-map-style="baseMapStyle"
        :is-picking-stop-from-map="isPickingStopFromMap"
        @navigation-event="handleNavigationEvent"
        @map-clicked="handleMapClick"
        @switch-route="handleSwitchRoute"
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

.style-picker {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
}

.style-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-muted);
  margin-bottom: 10px;
}

.style-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.style-option {
  padding: 8px 10px;
  border-radius: 999px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-muted);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.style-option:hover {
  color: var(--text);
  border-color: rgba(0, 255, 148, 0.35);
}

.style-option.active {
  background: rgba(0, 255, 148, 0.12);
  border-color: rgba(0, 255, 148, 0.45);
  color: var(--accent);
}

.preference-note {
  margin: 10px 0 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-muted);
}

.route-options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.route-option-card {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-muted);
  text-align: left;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.route-option-card:hover {
  border-color: rgba(0, 255, 148, 0.35);
  color: var(--text);
}

.route-option-card.active {
  border-color: rgba(0, 255, 148, 0.45);
  background: rgba(0, 255, 148, 0.08);
  color: var(--text);
}

.route-option-badge {
  flex-shrink: 0;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(0, 255, 148, 0.14);
  color: var(--accent);
  font-size: 11px;
  font-weight: 600;
}

.route-option-badge--alternate {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-muted);
}

.route-option-time {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
}

.route-option-dist {
  margin-left: auto;
  font-size: 12px;
}

.stopover-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stopover-toolbar {
  display: flex;
}

.stopover-row {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.04);
  transition: border-color 0.2s, background 0.2s, opacity 0.2s;
}

.stopover-row--dragging {
  opacity: 0.45;
}

.stopover-row--drag-target {
  border-color: rgba(0, 255, 148, 0.45);
  background: rgba(0, 255, 148, 0.08);
}

.stopover-search {
  flex: 1;
}

.stopover-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stopover-index {
  display: block;
  margin-bottom: 6px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
}

.drag-handle {
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px dashed var(--border);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-muted);
  font-size: 11px;
  line-height: 1;
  font-family: inherit;
  cursor: grab;
}

.drag-handle:active {
  cursor: grabbing;
}

.add-stop {
  align-self: flex-start;
}

.reorder-stop,
.remove-stop {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text-muted);
  font-size: 12px;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;
}

.reorder-stop:hover:not(:disabled) {
  color: var(--text);
  border-color: rgba(0, 255, 148, 0.35);
}

.reorder-stop:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.remove-stop:hover {
  color: #ff9a9a;
  border-color: rgba(255, 107, 107, 0.35);
}

.stopover-note {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-muted);
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

.dot.stopover {
  background: #fbbf24;
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

.stopover-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.stopover-summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stopover-summary-name {
  font-size: 13px;
  color: var(--text);
}

.stopover-summary-detail {
  font-size: 12px;
  color: var(--text-muted);
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

  .stopover-row {
    flex-direction: column;
    align-items: stretch;
  }

  .stopover-actions {
    justify-content: flex-start;
  }
}
</style>
