<script setup lang="ts">
import type {
  LatLng,
  RouteResult,
  GeocodeResult,
  AutocompleteResult,
} from "@navigatr/web";

const { getNavigatr } = useNavigatr();

const pickupInput = ref("Accra Mall");
const destinationInput = ref("");

const pickup = ref<GeocodeResult | null>(null);
const destination = ref<GeocodeResult | null>(null);
const routeResult = ref<RouteResult | null>(null);
const polyline = ref<LatLng[]>([]);
const loading = ref(false);
const selectedRouteIndex = ref(-1); // -1 = main route, 0+ = alternate index

// Navigation state
const routeDemoRef = ref<{
  startNavigation: () => void;
  stopNavigation: () => void;
  isNavigating: Ref<boolean>;
} | null>(null);
const isNavigating = ref(false);
const navigationProgress = ref(0);
const hasArrived = ref(false);

// Computed for current route display
const currentRoute = computed(() => {
  if (!routeResult.value) return null;
  if (selectedRouteIndex.value === -1) {
    return {
      durationText: routeResult.value.durationText,
      distanceText: routeResult.value.distanceText,
    };
  }
  const alt = routeResult.value.alternates?.[selectedRouteIndex.value];
  return alt ? { durationText: alt.durationText, distanceText: alt.distanceText } : null;
});

const hasAlternates = computed(() => {
  return routeResult.value?.alternates && routeResult.value.alternates.length > 0;
});

function handlePickupSelect(result: AutocompleteResult) {
  pickup.value = {
    lat: result.lat,
    lng: result.lng,
    displayName: result.displayName,
  };
  pickupInput.value = result.name || result.displayName.split(",")[0];
  if (destination.value) calculateRoute();
}

function handleDestinationSelect(result: AutocompleteResult) {
  destination.value = {
    lat: result.lat,
    lng: result.lng,
    displayName: result.displayName,
  };
  destinationInput.value = result.name || result.displayName.split(",")[0];
  if (pickup.value) calculateRoute();
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const nav = await getNavigatr();
    const result = await nav.reverseGeocode({ lat, lng });
    return result.displayName.split(",")[0] || "Dropped pin";
  } catch {
    return "Dropped pin";
  }
}

async function handlePickupDrag(location: { lat: number; lng: number }) {
  pickup.value = { lat: location.lat, lng: location.lng, displayName: "" };
  pickupInput.value = "Adjusting...";

  const name = await reverseGeocode(location.lat, location.lng);
  pickupInput.value = name;
  pickup.value.displayName = name;

  if (destination.value) calculateRoute();
}

async function handleDestinationDrag(location: { lat: number; lng: number }) {
  destination.value = { lat: location.lat, lng: location.lng, displayName: "" };
  destinationInput.value = "Adjusting...";

  const name = await reverseGeocode(location.lat, location.lng);
  destinationInput.value = name;
  destination.value.displayName = name;

  if (pickup.value) calculateRoute();
}

async function handlePickupSearch() {
  if (!pickupInput.value.trim()) return;
  try {
    const nav = await getNavigatr();
    pickup.value = await nav.geocode({ address: pickupInput.value });
    if (destination.value) calculateRoute();
  } catch (e) {
    console.error(e);
  }
}

async function handleDestinationSearch() {
  if (!destinationInput.value.trim()) return;
  try {
    const nav = await getNavigatr();
    destination.value = await nav.geocode({ address: destinationInput.value });
    if (pickup.value) calculateRoute();
  } catch (e) {
    console.error(e);
  }
}

async function calculateRoute() {
  if (!pickup.value || !destination.value) return;

  loading.value = true;
  selectedRouteIndex.value = -1; // Reset to main route
  try {
    const nav = await getNavigatr();
    const result = await nav.route({
      origin: pickup.value,
      destination: destination.value,
    });

    routeResult.value = result;
    polyline.value = result.polyline;
  } catch (e) {
    console.error(e);
  } finally {
    loading.value = false;
  }
}

function selectRoute(index: number) {
  if (!routeResult.value) return;

  selectedRouteIndex.value = index;

  if (index === -1) {
    // Select main route
    polyline.value = routeResult.value.polyline;
  } else if (routeResult.value.alternates && routeResult.value.alternates[index]) {
    // Select alternate route
    polyline.value = routeResult.value.alternates[index].polyline;
  }
}

function handleSwitchRoute(index: number) {
  // When user clicks on an alternate route on the map
  selectRoute(index);
}

function startRide() {
  if (routeDemoRef.value) {
    isNavigating.value = true;
    hasArrived.value = false;
    navigationProgress.value = 0;
    routeDemoRef.value.startNavigation();
  }
}

function cancelRide() {
  if (routeDemoRef.value) {
    routeDemoRef.value.stopNavigation();
    isNavigating.value = false;
    hasArrived.value = false;
    navigationProgress.value = 0;
  }
}

function handleNavigationProgress(progress: number) {
  navigationProgress.value = progress;
}

function handleNavigationEnd() {
  hasArrived.value = true;
  isNavigating.value = false;
}

function resetRide() {
  hasArrived.value = false;
  navigationProgress.value = 0;
}

onMounted(async () => {
  try {
    const nav = await getNavigatr();
    pickup.value = await nav.geocode({ address: pickupInput.value });
  } catch (e) {
    console.error(e);
  }
});
</script>

<template>
  <PhoneMockup>
    <div class="app-screen">
      <RouteDemo
        ref="routeDemoRef"
        :polyline="polyline"
        :origin="pickup"
        :destination="destination"
        :route-result="routeResult"
        @update:origin="handlePickupDrag"
        @update:destination="handleDestinationDrag"
        @navigation-progress="handleNavigationProgress"
        @navigation-end="handleNavigationEnd"
        @switch-route="handleSwitchRoute"
      />

      <div class="app-ui">
        <!-- Normal search UI -->
        <template v-if="!isNavigating && !hasArrived">
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
            <!-- Route Options -->
            <div v-if="hasAlternates" class="route-options">
              <div class="route-options-label">Choose route</div>
              <div class="route-options-list">
                <button
                  class="route-option"
                  :class="{ active: selectedRouteIndex === -1 }"
                  @click="selectRoute(-1)"
                >
                  <span class="route-option-badge">Fastest</span>
                  <span class="route-option-time">{{ routeResult.durationText }}</span>
                  <span class="route-option-dist">{{ routeResult.distanceText }}</span>
                </button>
                <button
                  v-for="(alt, index) in routeResult.alternates"
                  :key="index"
                  class="route-option"
                  :class="{ active: selectedRouteIndex === index }"
                  @click="selectRoute(index)"
                >
                  <span class="route-option-badge alt">Alt {{ index + 1 }}</span>
                  <span class="route-option-time">{{ alt.durationText }}</span>
                  <span class="route-option-dist">{{ alt.distanceText }}</span>
                </button>
              </div>
            </div>

            <div class="route-stats">
              <div class="stat">
                <span class="stat-value">{{ currentRoute?.durationText }}</span>
                <span class="stat-label">duration</span>
              </div>
              <div class="stat-divider"></div>
              <div class="stat">
                <span class="stat-value">{{ currentRoute?.distanceText }}</span>
                <span class="stat-label">distance</span>
              </div>
            </div>

            <button class="request-btn" :disabled="loading" @click="startRide">
              {{ loading ? "Calculating..." : "Request Ride" }}
            </button>
          </div>
        </template>

        <!-- Navigation UI -->
        <template v-if="isNavigating">
          <div class="nav-hud">
            <div class="nav-status">
              <div class="nav-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
                </svg>
              </div>
              <div class="nav-info">
                <div class="nav-title">En route to destination</div>
                <div class="nav-progress-text">
                  {{ navigationProgress }}% complete
                </div>
              </div>
            </div>
            <div class="nav-progress-bar">
              <div
                class="nav-progress-fill"
                :style="{ width: navigationProgress + '%' }"
              ></div>
            </div>
          </div>

          <div class="bottom-sheet nav-bottom">
            <button class="cancel-btn" @click="cancelRide">Cancel Ride</button>
          </div>
        </template>

        <!-- Arrived UI -->
        <template v-if="hasArrived">
          <div class="arrived-sheet">
            <div class="arrived-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </div>
            <div class="arrived-title">You've arrived!</div>
            <div class="arrived-subtitle">{{ destinationInput }}</div>
            <button class="done-btn" @click="resetRide">Done</button>
          </div>
        </template>
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
  margin: 48px 12px 12px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 12px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}

.input-row {
  display: flex;
  align-items: center;
  gap: 8px;
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
  margin: 6px 0 6px 16px;
}

.bottom-sheet {
  margin-top: auto;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px 20px 0 0;
  padding: 16px 14px;
  box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.15);
}

.route-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 10px 0;
  margin-bottom: 10px;
  border-top: 1px solid #eee;
  border-bottom: 1px solid #eee;
}

.stat {
  text-align: center;
}

.stat-value {
  display: block;
  font-size: 16px;
  font-weight: 700;
  color: #111;
}

.stat-label {
  font-size: 10px;
  color: #888;
  text-transform: uppercase;
}

.stat-divider {
  width: 1px;
  height: 24px;
  background: #ddd;
}

.request-btn {
  width: 100%;
  padding: 12px;
  background: #111;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
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

/* Navigation UI */
.nav-hud {
  margin: 48px 12px 12px;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 12px;
}

.nav-status {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.nav-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  border-radius: 8px;
  color: #000;
}

.nav-info {
  flex: 1;
}

.nav-title {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  margin-bottom: 2px;
}

.nav-progress-text {
  font-size: 11px;
  color: var(--accent);
}

.nav-progress-bar {
  height: 4px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
  overflow: hidden;
}

.nav-progress-fill {
  height: 100%;
  background: var(--accent);
  transition: width 0.1s linear;
}

.nav-bottom {
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(10px);
}

.cancel-btn {
  width: 100%;
  padding: 12px;
  background: #ff4444;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
}

.cancel-btn:hover {
  opacity: 0.9;
}

/* Arrived UI */
.arrived-sheet {
  margin-top: auto;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px 20px 0 0;
  padding: 24px 16px;
  text-align: center;
}

.arrived-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--accent);
  border-radius: 50%;
  color: #000;
}

.arrived-title {
  font-size: 18px;
  font-weight: 700;
  color: #111;
  margin-bottom: 6px;
}

.arrived-subtitle {
  font-size: 12px;
  color: #666;
  margin-bottom: 16px;
}

.done-btn {
  width: 100%;
  padding: 12px;
  background: #111;
  border: none;
  border-radius: 10px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: opacity 0.2s;
}

.done-btn:hover {
  opacity: 0.9;
}

/* Route Options */
.route-options {
  margin-bottom: 10px;
}

.route-options-label {
  font-size: 10px;
  font-weight: 600;
  color: #888;
  text-transform: uppercase;
  margin-bottom: 6px;
}

.route-options-list {
  display: flex;
  gap: 6px;
  overflow-x: auto;
  padding-bottom: 4px;
}

.route-option {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 3px;
  padding: 8px 10px;
  background: #f5f5f5;
  border: 2px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  min-width: 75px;
  font-family: inherit;
}

.route-option:hover {
  background: #eee;
}

.route-option.active {
  background: rgba(0, 255, 148, 0.1);
  border-color: var(--accent);
}

.route-option-badge {
  font-size: 8px;
  font-weight: 700;
  color: #fff;
  background: var(--accent);
  padding: 2px 5px;
  border-radius: 3px;
  text-transform: uppercase;
}

.route-option-badge.alt {
  background: #666;
}

.route-option.active .route-option-badge.alt {
  background: var(--accent);
}

.route-option-time {
  font-size: 12px;
  font-weight: 700;
  color: #111;
}

.route-option-dist {
  font-size: 10px;
  color: #666;
}
</style>
