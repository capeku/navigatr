<script setup lang="ts">
import type {
  LatLng,
  NavigatrMap,
  NavigatrMarker,
  Navigatr,
  RouteResult,
  TravelMode,
} from "@navigatr/web";

interface AutocompleteResult {
  lat: number;
  lng: number;
  displayName: string;
  name: string;
  city?: string;
  country?: string;
}

type TabId = "route" | "tracking" | "styling" | "transit";

interface MapStyle {
  theme: string;
  colors: {
    primary: string;
    water: string;
    parks: string;
    roads: string;
    buildings: string;
  };
  layers: {
    roads: boolean;
    labels: boolean;
    buildings: boolean;
    water: boolean;
    parks: boolean;
    traffic: boolean;
  };
  polyline: {
    color: string;
    weight: number;
    opacity: number;
  };
  markers: {
    color: string;
  };
}

const countries = [
  { code: "", name: "All countries", flag: "" },
  { code: "GH", name: "Ghana", flag: "" },
  { code: "NG", name: "Nigeria", flag: "" },
  { code: "KE", name: "Kenya", flag: "" },
  { code: "ZA", name: "South Africa", flag: "" },
  { code: "US", name: "United States", flag: "" },
  { code: "GB", name: "United Kingdom", flag: "" },
  { code: "DE", name: "Germany", flag: "" },
  { code: "FR", name: "France", flag: "" },
];

const travelModeOptions: Array<{ id: TravelMode; label: string }> = [
  { id: "drive", label: "Drive" },
  { id: "walk", label: "Walk" },
  { id: "bike", label: "Bike" },
];

const activeTab = ref<TabId>("route");
const consoleOutput = ref<string[]>([]);
const isRunning = ref(false);
const selectedCountry = ref("");
const travelMode = ref<TravelMode>("drive");
const codeCopied = ref(false);
const bottomPanelTab = ref<"console" | "code">("console");
const showMobileEditor = ref(false);

const stylePresets = [
  { id: "default", name: "Default" },
  { id: "dark", name: "Dark Mode" },
  { id: "satellite", name: "Satellite" },
  { id: "navigation", name: "Navigation" },
  { id: "minimal", name: "Minimal" },
];

const mapStyle = ref<MapStyle>({
  theme: "default",
  colors: {
    primary: "#3b82f6",
    water: "#0ea5e9",
    parks: "#22c55e",
    roads: "#94a3b8",
    buildings: "#cbd5e1",
  },
  layers: {
    roads: true,
    labels: true,
    buildings: true,
    water: true,
    parks: true,
    traffic: false,
  },
  polyline: {
    color: "#3b82f6",
    weight: 5,
    opacity: 0.8,
  },
  markers: {
    color: "#3b82f6",
  },
});

const routeOriginInput = ref("");
const routeDestinationInput = ref("");
const routeResult = ref<any>(null);
const pinDropMode = ref<"origin" | "destination" | null>(null);

let nav: Navigatr | null = null;
let map: NavigatrMap | null = null;
let originMarker: NavigatrMarker | null = null;
let destinationMarker: NavigatrMarker | null = null;
const polyline = ref<LatLng[]>([]);
const originCoords = ref<LatLng | null>(null);
const destinationCoords = ref<LatLng | null>(null);
const selectedTravelMode = computed(
  () =>
    travelModeOptions.find((option) => option.id === travelMode.value) ??
    travelModeOptions[0],
);

const isTracking = ref(false);
const trackingProgress = ref(0);
const currentETA = ref("");
const simulationSpeed = ref(60);
let simulationInterval: ReturnType<typeof setInterval> | null = null;
let floatIndex = 0;

// Transit state
const SAMPLE_ITINERARY = {
  duration: 1440,
  durationText: "24 mins",
  transfers: 1,
  walkDistance: 420,
  legs: [
    {
      mode: "WALK",
      from: { name: "Oxford Circus", lat: 51.5152, lng: -0.1415 },
      to: { name: "Oxford Circus Underground", lat: 51.5154, lng: -0.142 },
      departureTime: "09:00",
      arrivalTime: "09:03",
      duration: 180,
      distance: 210,
      geometry: {
        type: "LineString",
        coordinates: [
          [-0.1415, 51.5152],
          [-0.1418, 51.5153],
          [-0.142, 51.5154],
        ],
      },
    },
    {
      mode: "RAIL",
      from: {
        name: "Oxford Circus",
        lat: 51.5154,
        lng: -0.142,
        stopId: "940GZZLUOXC",
      },
      to: { name: "Bank", lat: 51.5133, lng: -0.0886, stopId: "940GZZLUBNK" },
      departureTime: "09:06",
      arrivalTime: "09:18",
      duration: 720,
      distance: 4800,
      routeId: "central",
      routeName: "Central",
      routeColor: "#DC241F",
      numStops: 5,
      intermediateStops: [
        {
          stopId: "940GZZLUTCR",
          name: "Tottenham Court Road",
          lat: 51.5166,
          lng: -0.1301,
        },
        { stopId: "940GZZLUHLB", name: "Holborn", lat: 51.5174, lng: -0.1209 },
        {
          stopId: "940GZZLUCHL",
          name: "Chancery Lane",
          lat: 51.5173,
          lng: -0.1113,
        },
        {
          stopId: "940GZZLUSPU",
          name: "St Paul's",
          lat: 51.5148,
          lng: -0.0983,
        },
      ],
      geometry: {
        type: "LineString",
        coordinates: [
          [-0.142, 51.5154],
          [-0.1301, 51.5166],
          [-0.1209, 51.5174],
          [-0.1113, 51.5173],
          [-0.0983, 51.5148],
          [-0.0886, 51.5133],
        ],
      },
    },
    {
      mode: "WALK",
      from: { name: "Bank Underground", lat: 51.5133, lng: -0.0886 },
      to: { name: "1 New Change, London", lat: 51.5141, lng: -0.0978 },
      departureTime: "09:19",
      arrivalTime: "09:24",
      duration: 300,
      distance: 210,
      geometry: {
        type: "LineString",
        coordinates: [
          [-0.0886, 51.5133],
          [-0.091, 51.5137],
          [-0.0978, 51.5141],
        ],
      },
    },
  ],
};

const transitInput = ref(JSON.stringify(SAMPLE_ITINERARY, null, 2));
const transitError = ref("");
const transitItinerary = ref<any>(null);
const activeLegIdx = ref(-1);
const transitSimulating = ref(false);
const transitProgress = ref(0);
const transitCurrentLeg = ref("");
const transitSimSpeed = ref(30); // km/h
const showTransitStops = ref(true);
let transitSimInterval: ReturnType<typeof setInterval> | null = null;

function getLegColor(leg: any): string {
  if (leg.routeColor) return leg.routeColor;
  const colors: Record<string, string> = {
    WALK: "#888888",
    BUS: "#2196F3",
    RAIL: "#4CAF50",
    FERRY: "#00BCD4",
    TRAM: "#9C27B0",
  };
  return colors[leg.mode] ?? "#888888";
}

function renderTransit() {
  if (!map) return;
  try {
    const itinerary = JSON.parse(transitInput.value);
    transitItinerary.value = itinerary;
    transitError.value = "";
    map.clearRoute();
    map.clearTransitRoute();
    map.drawTransitRoute(itinerary, { fitBounds: true });
    if (showTransitStops.value) {
      const stops = itinerary.legs.flatMap(
        (l: any) => l.intermediateStops ?? [],
      );
      if (stops.length) map.showStops(stops);
    }
    activeLegIdx.value = -1;
    transitProgress.value = 0;
    transitCurrentLeg.value = "";
    log("Transit itinerary rendered", "success");
    log(`  Legs: ${itinerary.legs.length}`);
    log(`  Duration: ${itinerary.durationText}`);
    log(`  Transfers: ${itinerary.transfers}`);
  } catch {
    transitError.value = "Invalid JSON — check the format";
    log("Failed to parse itinerary JSON", "error");
  }
}

function simulateTransit() {
  if (!map || !transitItinerary.value || transitSimulating.value) return;
  transitSimulating.value = true;
  transitProgress.value = 0;

  // Flatten all leg geometries into one LatLng array, tracking where each leg starts
  const allPoints: LatLng[] = [];
  const legStartIdx: number[] = [];
  for (const leg of transitItinerary.value.legs) {
    legStartIdx.push(allPoints.length);
    for (const [lng, lat] of leg.geometry.coordinates) {
      allPoints.push({ lat, lng });
    }
  }

  if (allPoints.length < 2) {
    transitSimulating.value = false;
    return;
  }

  // Densify: transit geometry is very sparse (a handful of coords per leg).
  // Insert interpolated points every ~15m so speed-based advancement works at
  // the same granularity as a Valhalla polyline.
  const STEP_M = 15;
  const dense: LatLng[] = [];
  const denseLegIdx: number[] = [];
  for (let i = 0; i < allPoints.length - 1; i++) {
    const a = allPoints[i];
    const b = allPoints[i + 1];
    const segDist = haversineDistance(a, b);
    const steps = Math.max(1, Math.round(segDist / STEP_M));
    const legForSeg = legStartIdx.reduce(
      (best, s, li) => (s <= i ? li : best),
      0,
    );
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      dense.push({
        lat: a.lat + (b.lat - a.lat) * t,
        lng: a.lng + (b.lng - a.lng) * t,
      });
      denseLegIdx.push(legForSeg);
    }
  }
  dense.push(allPoints[allPoints.length - 1]);
  denseLegIdx.push(
    legStartIdx.reduce(
      (best, s, li) => (s <= allPoints.length - 1 ? li : best),
      0,
    ),
  );

  const totalPoints = dense.length;
  let totalDistance = 0;
  for (let i = 0; i < dense.length - 1; i++) {
    totalDistance += haversineDistance(dense[i], dense[i + 1]);
  }
  // avgPointDistance is now ~STEP_M metres — gives fine-grained speed control
  const avgPointDistance = totalDistance / (dense.length - 1);

  const syntheticRoute: RouteResult = {
    polyline: dense,
    durationSeconds: transitItinerary.value.duration,
    durationText: transitItinerary.value.durationText,
    distanceMeters: totalDistance,
    distanceText: `${(totalDistance / 1000).toFixed(1)} km`,
  };

  map.startNavigation(syntheticRoute);
  log("Transit simulation started", "success");

  // Highlight first leg immediately
  activeLegIdx.value = 0;
  map.highlightLeg(0);
  const firstLeg = transitItinerary.value.legs[0];
  transitCurrentLeg.value = `${firstLeg.mode}: ${firstLeg.from.name} → ${firstLeg.to.name}`;
  log(
    `Leg 1/${transitItinerary.value.legs.length}: ${firstLeg.mode} — ${firstLeg.from.name} → ${firstLeg.to.name}`,
  );

  const updateIntervalMs = 100;
  let floatIdx = 0;

  transitSimInterval = setInterval(() => {
    const speedMps = (transitSimSpeed.value * 1000) / 3600;
    const distancePerUpdate = speedMps * (updateIntervalMs / 1000);
    // No Math.max floor — dense points mean this is naturally fine-grained
    const pointsPerUpdate = distancePerUpdate / avgPointDistance;

    floatIdx += pointsPerUpdate;

    if (floatIdx >= totalPoints - 1) {
      map!.updatePosition(dense[totalPoints - 1]);
      stopTransitSimulation();
      transitProgress.value = 100;
      log("Journey complete", "success");
      return;
    }

    const baseIdx = Math.floor(floatIdx);
    const fraction = floatIdx - baseIdx;
    const p1 = dense[baseIdx];
    const p2 = dense[Math.min(baseIdx + 1, totalPoints - 1)];
    const interpolatedPos: LatLng = {
      lat: p1.lat + (p2.lat - p1.lat) * fraction,
      lng: p1.lng + (p2.lng - p1.lng) * fraction,
    };

    map!.updatePosition(interpolatedPos);

    const legIdx = denseLegIdx[baseIdx];
    if (legIdx !== activeLegIdx.value) {
      activeLegIdx.value = legIdx;
      map!.highlightLeg(legIdx);
      const leg = transitItinerary.value.legs[legIdx];
      transitCurrentLeg.value = `${leg.mode}: ${leg.from.name} → ${leg.to.name}`;
      log(
        `Leg ${legIdx + 1}/${transitItinerary.value.legs.length}: ${leg.mode} — ${leg.from.name} → ${leg.to.name}`,
      );
    }

    transitProgress.value = Math.round((floatIdx / (totalPoints - 1)) * 100);
  }, updateIntervalMs);
}

function stopTransitSimulation() {
  if (transitSimInterval) {
    clearInterval(transitSimInterval);
    transitSimInterval = null;
  }
  transitSimulating.value = false;
  transitProgress.value = 0;
  transitCurrentLeg.value = "";
  activeLegIdx.value = -1;
  map?.stopNavigation();
  if (transitItinerary.value && map) {
    map.drawTransitRoute(transitItinerary.value, { fitBounds: true });
  }
}

function log(message: string, type: "info" | "success" | "error" = "info") {
  const prefix = type === "success" ? "✓" : type === "error" ? "✗" : "→";
  const timestamp = new Date().toLocaleTimeString("en-US", { hour12: false });
  consoleOutput.value.push(`[${timestamp}] ${prefix} ${message}`);
  if (consoleOutput.value.length > 50) {
    consoleOutput.value = consoleOutput.value.slice(-50);
  }
}

function clearConsole() {
  consoleOutput.value = [];
}

function applyPreset(presetId: string) {
  const presets: Record<string, Partial<MapStyle>> = {
    default: {
      theme: "default",
      colors: {
        primary: "#3b82f6",
        water: "#0ea5e9",
        parks: "#22c55e",
        roads: "#94a3b8",
        buildings: "#cbd5e1",
      },
      polyline: { color: "#3b82f6", weight: 5, opacity: 0.8 },
      markers: { color: "#3b82f6" },
    },
    dark: {
      theme: "dark",
      colors: {
        primary: "#60a5fa",
        water: "#0369a1",
        parks: "#166534",
        roads: "#475569",
        buildings: "#334155",
      },
      polyline: { color: "#60a5fa", weight: 5, opacity: 0.8 },
      markers: { color: "#60a5fa" },
    },
    satellite: {
      theme: "satellite",
      colors: {
        primary: "#fbbf24",
        water: "#0ea5e9",
        parks: "#22c55e",
        roads: "#94a3b8",
        buildings: "#cbd5e1",
      },
      polyline: { color: "#fbbf24", weight: 4, opacity: 0.9 },
      markers: { color: "#fbbf24" },
    },
    navigation: {
      theme: "navigation",
      colors: {
        primary: "#2563eb",
        water: "#38bdf8",
        parks: "#4ade80",
        roads: "#64748b",
        buildings: "#e2e8f0",
      },
      polyline: { color: "#2563eb", weight: 6, opacity: 0.9 },
      markers: { color: "#2563eb" },
    },
    minimal: {
      theme: "minimal",
      colors: {
        primary: "#000000",
        water: "#e0f2fe",
        parks: "#ecfdf5",
        roads: "#d4d4d4",
        buildings: "#f5f5f5",
      },
      polyline: { color: "#000000", weight: 3, opacity: 1 },
      markers: { color: "#000000" },
    },
  };

  const preset = presets[presetId];
  if (preset) {
    mapStyle.value = { ...mapStyle.value, ...preset } as MapStyle;
    log(`Selected "${presetId}" style preset`, "info");
  }
}

const mapFilters: Record<string, string> = {
  default: "none",
  dark: "invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%)",
  satellite: "saturate(120%) contrast(110%)",
  navigation: "saturate(110%) brightness(105%)",
  minimal: "grayscale(100%) brightness(110%) contrast(90%)",
};

const currentMapFilter = ref("none");

function applyStyleToMap() {
  log(`nav.setStyleFromPreset('${mapStyle.value.theme}', { ... })`);
  log(`Style configuration applied:`, "success");
  log(`  Theme: ${mapStyle.value.theme}`);
  log(`  Primary: ${mapStyle.value.colors.primary}`);
  log(
    `  Polyline: ${mapStyle.value.polyline.color}, ${mapStyle.value.polyline.weight}px, ${mapStyle.value.polyline.opacity} opacity`,
  );

  currentMapFilter.value = mapFilters[mapStyle.value.theme] || "none";
  log(`  Map filter applied: ${mapStyle.value.theme}`);

  if (map && polyline.value.length > 0) {
    map.clearRoute();
    map.drawRoute(polyline.value, {
      color: mapStyle.value.polyline.color,
      weight: mapStyle.value.polyline.weight,
      opacity: mapStyle.value.polyline.opacity,
    });
    log(`  Route redrawn with new style`);
  }

  log(`CSS variables generated for your app`);
}

const generatedCode = computed(() => {
  if (activeTab.value === "transit") {
    return `import { itineraryToGeoJSON } from '@navigatr/core'

// Pure data transform — works without a map
const { legs, stops } = itineraryToGeoJSON(itinerary)

// Render on the map
map.drawTransitRoute(itinerary, {
  fitBounds: true,
  activeLegIndex: 1  // highlight leg 1
})

// Show stop markers
map.showStops(itinerary.legs[1].intermediateStops, {
  showLabels: true
})

// Step through legs (e.g. on user interaction)
map.highlightLeg(2)

// Tear down
map.clearTransitRoute()`;
  }

  if (activeTab.value === "route") {
    return `const route = await nav.route({
  origin: ${JSON.stringify(originCoords.value ?? { lat: 5.6037, lng: -0.187 }, null, 2)},
  destination: ${JSON.stringify(destinationCoords.value ?? { lat: 5.6226, lng: -0.1725 }, null, 2)},
  mode: '${travelMode.value}'
})`;
  }

  const style = mapStyle.value;
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
// { '--map-primary': '${style.colors.primary}', ... }`;
});

const highlightedCode = computed(() => {
  if (activeTab.value === "transit") {
    return `<span class="text-purple-400">import</span> { <span class="text-cyan-400">itineraryToGeoJSON</span> } <span class="text-purple-400">from</span> <span class="text-yellow-300">'@navigatr/core'</span>

<span class="text-gray-500">// Pure data transform — works without a map</span>
<span class="text-purple-400">const</span> { legs, stops } = <span class="text-blue-400">itineraryToGeoJSON</span>(itinerary)

<span class="text-gray-500">// Render on the map</span>
map.<span class="text-blue-400">drawTransitRoute</span>(itinerary, {
  <span class="text-cyan-300">fitBounds</span>: <span class="text-orange-400">true</span>,
  <span class="text-cyan-300">activeLegIndex</span>: <span class="text-orange-400">1</span>
})

<span class="text-gray-500">// Show stop markers</span>
map.<span class="text-blue-400">showStops</span>(itinerary.legs[<span class="text-orange-400">1</span>].intermediateStops, {
  <span class="text-cyan-300">showLabels</span>: <span class="text-orange-400">true</span>
})

<span class="text-gray-500">// Step through legs</span>
map.<span class="text-blue-400">highlightLeg</span>(<span class="text-orange-400">2</span>)

<span class="text-gray-500">// Tear down</span>
map.<span class="text-blue-400">clearTransitRoute</span>()`;
  }

  if (activeTab.value === "route") {
    const origin = originCoords.value ?? { lat: 5.6037, lng: -0.187 };
    const destination = destinationCoords.value ?? {
      lat: 5.6226,
      lng: -0.1725,
    };

    return `<span class="text-purple-400">const</span> route = <span class="text-purple-400">await</span> nav.<span class="text-blue-400">route</span>({
  <span class="text-cyan-300">origin</span>: {
    <span class="text-cyan-300">lat</span>: <span class="text-orange-400">${origin.lat}</span>,
    <span class="text-cyan-300">lng</span>: <span class="text-orange-400">${origin.lng}</span>
  },
  <span class="text-cyan-300">destination</span>: {
    <span class="text-cyan-300">lat</span>: <span class="text-orange-400">${destination.lat}</span>,
    <span class="text-cyan-300">lng</span>: <span class="text-orange-400">${destination.lng}</span>
  },
  <span class="text-cyan-300">mode</span>: <span class="text-yellow-300">'${travelMode.value}'</span>
})`;
  }

  const style = mapStyle.value;
  return `<span class="text-purple-400">import</span> { <span class="text-cyan-400">NavigatrCore</span> } <span class="text-purple-400">from</span> <span class="text-yellow-300">'@navigatr/core'</span>

<span class="text-purple-400">const</span> nav = <span class="text-purple-400">new</span> <span class="text-cyan-400">NavigatrCore</span>()

<span class="text-gray-500">// Apply style preset</span>
nav.<span class="text-blue-400">setStyleFromPreset</span>(<span class="text-yellow-300">'${style.theme}'</span>, {
  <span class="text-cyan-300">colors</span>: {
    <span class="text-cyan-300">primary</span>: <span class="text-yellow-300">'${style.colors.primary}'</span>,
    <span class="text-cyan-300">water</span>: <span class="text-yellow-300">'${style.colors.water}'</span>,
    <span class="text-cyan-300">parks</span>: <span class="text-yellow-300">'${style.colors.parks}'</span>,
    <span class="text-cyan-300">roads</span>: <span class="text-yellow-300">'${style.colors.roads}'</span>,
    <span class="text-cyan-300">buildings</span>: <span class="text-yellow-300">'${style.colors.buildings}'</span>
  },
  <span class="text-cyan-300">polyline</span>: {
    <span class="text-cyan-300">color</span>: <span class="text-yellow-300">'${style.polyline.color}'</span>,
    <span class="text-cyan-300">weight</span>: <span class="text-orange-400">${style.polyline.weight}</span>,
    <span class="text-cyan-300">opacity</span>: <span class="text-orange-400">${style.polyline.opacity}</span>
  },
  <span class="text-cyan-300">markers</span>: {
    <span class="text-cyan-300">color</span>: <span class="text-yellow-300">'${style.markers.color}'</span>
  },
  <span class="text-cyan-300">layers</span>: {
    <span class="text-cyan-300">roads</span>: <span class="text-orange-400">${style.layers.roads}</span>,
    <span class="text-cyan-300">labels</span>: <span class="text-orange-400">${style.layers.labels}</span>,
    <span class="text-cyan-300">buildings</span>: <span class="text-orange-400">${style.layers.buildings}</span>,
    <span class="text-cyan-300">traffic</span>: <span class="text-orange-400">${style.layers.traffic}</span>
  }
})

<span class="text-gray-500">// Get current style</span>
<span class="text-purple-400">const</span> currentStyle = nav.<span class="text-blue-400">getStyle</span>()

<span class="text-gray-500">// Get as CSS variables</span>
<span class="text-purple-400">const</span> cssVars = nav.<span class="text-blue-400">getStyleAsCSSVariables</span>(<span class="text-yellow-300">'map'</span>)
<span class="text-gray-500">// { '--map-primary': '${style.colors.primary}', ... }</span>`;
});

async function copyCode() {
  try {
    await navigator.clipboard.writeText(generatedCode.value);
    codeCopied.value = true;
    log("Code copied to clipboard", "success");
    setTimeout(() => {
      codeCopied.value = false;
    }, 2000);
  } catch {
    log("Failed to copy code", "error");
  }
}

function clearMap() {
  if (originMarker) {
    originMarker.remove();
    originMarker = null;
  }
  if (destinationMarker) {
    destinationMarker.remove();
    destinationMarker = null;
  }
  if (map) {
    map.clearRoute();
    map.removeDriverMarker();
  }
  polyline.value = [];
  routeResult.value = null;
  stopTracking();
}

function handleOriginSelect(result: AutocompleteResult) {
  originCoords.value = { lat: result.lat, lng: result.lng };
  routeOriginInput.value = result.name || result.displayName.split(",")[0];
  log(`Origin selected: ${routeOriginInput.value}`, "success");
  log(
    `  Coordinates: { lat: ${result.lat.toFixed(6)}, lng: ${result.lng.toFixed(6)} }`,
  );
  log(`  Drag the pin to adjust location`);
  updateMapMarkers();
  map?.panTo(originCoords.value);
  if (destinationCoords.value) calculateRoute();
}

function handleDestinationSelect(result: AutocompleteResult) {
  destinationCoords.value = { lat: result.lat, lng: result.lng };
  routeDestinationInput.value = result.name || result.displayName.split(",")[0];
  log(`Destination selected: ${routeDestinationInput.value}`, "success");
  log(
    `  Coordinates: { lat: ${result.lat.toFixed(6)}, lng: ${result.lng.toFixed(6)} }`,
  );
  log(`  Drag the pin to adjust location`);
  updateMapMarkers();
  map?.panTo(destinationCoords.value);
  if (originCoords.value) calculateRoute();
}

function handleOriginDrag(location: LatLng) {
  originCoords.value = location;
  log(
    `Origin adjusted: { lat: ${location.lat.toFixed(6)}, lng: ${location.lng.toFixed(6)} }`,
  );
  if (destinationCoords.value) calculateRoute();
}

function handleDestinationDrag(location: LatLng) {
  destinationCoords.value = location;
  log(
    `Destination adjusted: { lat: ${location.lat.toFixed(6)}, lng: ${location.lng.toFixed(6)} }`,
  );
  if (originCoords.value) calculateRoute();
}

function updateMapMarkers() {
  if (!map) return;

  if (originCoords.value) {
    if (originMarker) {
      originMarker.setLatLng(originCoords.value);
    } else {
      originMarker = map.addMarker({
        ...originCoords.value,
        label: "Origin",
        draggable: true,
        onDragEnd: handleOriginDrag,
      });
    }
  }

  if (destinationCoords.value) {
    if (destinationMarker) {
      destinationMarker.setLatLng(destinationCoords.value);
    } else {
      destinationMarker = map.addMarker({
        ...destinationCoords.value,
        label: "Destination",
        draggable: true,
        onDragEnd: handleDestinationDrag,
      });
    }
  }
}

async function calculateRoute() {
  if (!originCoords.value || !destinationCoords.value || !nav) return;
  isRunning.value = true;
  stopTracking();

  log(`nav.route({ origin, destination, mode: '${travelMode.value}' })`);
  try {
    const result = await nav.route({
      origin: originCoords.value,
      destination: destinationCoords.value,
      mode: travelMode.value,
    });

    const durationMins = Math.round(result.durationSeconds / 60);
    const distanceKm = (result.distanceMeters / 1000).toFixed(1);

    routeResult.value = {
      mode: travelMode.value,
      modeLabel: selectedTravelMode.value.label,
      durationMins,
      distanceKm,
      durationSeconds: result.durationSeconds,
    };
    polyline.value = result.polyline;

    log(`Route calculated:`, "success");
    log(`  Mode: ${selectedTravelMode.value.label}`);
    log(`  Duration: ${durationMins} min`);
    log(`  Distance: ${distanceKm} km`);
    log(`  Polyline: ${result.polyline.length} points`);

    if (map) {
      map.clearRoute();
      map.drawRoute(result.polyline, {
        color: mapStyle.value.polyline.color,
        weight: mapStyle.value.polyline.weight,
        opacity: mapStyle.value.polyline.opacity,
      });
      map.fitRoute(result.polyline);
    }
  } catch (e) {
    log(`Error: ${e}`, "error");
  }
  isRunning.value = false;
}

function haversineDistance(p1: LatLng, p2: LatLng): number {
  const R = 6371000;
  const lat1 = (p1.lat * Math.PI) / 180;
  const lat2 = (p2.lat * Math.PI) / 180;
  const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
  const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function startTracking() {
  if (!map || polyline.value.length === 0 || !routeResult.value) {
    log("Calculate a route first", "error");
    return;
  }

  isTracking.value = true;
  floatIndex = 0;

  const route: RouteResult = {
    polyline: polyline.value,
    durationSeconds: routeResult.value.durationSeconds,
    durationText: `${routeResult.value.durationMins} min`,
    distanceMeters: parseFloat(routeResult.value.distanceKm) * 1000,
    distanceText: `${routeResult.value.distanceKm} km`,
  };

  map.startNavigation(route);
  log("Navigation started", "success");

  const poly = polyline.value;
  const totalPoints = poly.length;
  const updateIntervalMs = 100;
  const speedMps = (simulationSpeed.value * 1000) / 3600;
  const distancePerUpdate = speedMps * (updateIntervalMs / 1000);

  let totalDistance = 0;
  for (let i = 0; i < poly.length - 1; i++) {
    totalDistance += haversineDistance(poly[i], poly[i + 1]);
  }
  const avgPointDistance = totalDistance / (poly.length - 1);
  const pointsPerUpdate = Math.max(1, distancePerUpdate / avgPointDistance);

  simulationInterval = setInterval(() => {
    floatIndex += pointsPerUpdate;

    if (floatIndex >= totalPoints - 1) {
      map!.updatePosition(poly[totalPoints - 1]);
      stopTracking();
      trackingProgress.value = 100;
      currentETA.value = "Arrived!";
      log("Arrived at destination!", "success");
      return;
    }

    const baseIndex = Math.floor(floatIndex);
    const fraction = floatIndex - baseIndex;
    const p1 = poly[baseIndex];
    const p2 = poly[Math.min(baseIndex + 1, totalPoints - 1)];

    const interpolatedPos: LatLng = {
      lat: p1.lat + (p2.lat - p1.lat) * fraction,
      lng: p1.lng + (p2.lng - p1.lng) * fraction,
    };

    map!.updatePosition(interpolatedPos);
    trackingProgress.value = Math.round((floatIndex / (totalPoints - 1)) * 100);
  }, updateIntervalMs);
}

function stopTracking() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  isTracking.value = false;
  trackingProgress.value = 0;
  currentETA.value = "";
  floatIndex = 0;

  if (map) {
    map.stopNavigation();
  }
}

async function handlePinDrop(location: LatLng) {
  if (!pinDropMode.value || !map || !nav) return;

  const mode = pinDropMode.value;
  pinDropMode.value = null;

  log(
    `Pin dropped at: { lat: ${location.lat.toFixed(6)}, lng: ${location.lng.toFixed(6)} }`,
    "success",
  );

  let displayName = `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`;
  try {
    const result = await nav.reverseGeocode({
      lat: location.lat,
      lng: location.lng,
    });
    displayName = result.displayName.split(",")[0] || displayName;
  } catch {
    // Keep fallback displayName
  }

  if (mode === "origin") {
    originCoords.value = location;
    routeOriginInput.value = displayName;
    if (originMarker) originMarker.setLatLng(location);
    else originMarker = map.addMarker({ ...location, label: "Origin" });
    log(`Origin set: ${routeOriginInput.value}`);
    if (destinationCoords.value) calculateRoute();
  } else {
    destinationCoords.value = location;
    routeDestinationInput.value = displayName;
    if (destinationMarker) destinationMarker.setLatLng(location);
    else
      destinationMarker = map.addMarker({ ...location, label: "Destination" });
    log(`Destination set: ${routeDestinationInput.value}`);
    if (originCoords.value) calculateRoute();
  }
}

onMounted(async () => {
  const { Navigatr } = await import("@navigatr/web");
  nav = new Navigatr();

  map = nav.map({
    container: "sandbox-map",
    center: { lat: 5.6037, lng: -0.187 },
    zoom: 12,
  });

  map.onClick(handlePinDrop);

  log("Navigatr SDK initialized", "success");
  log("Map ready - search for locations or drop pins");
});

onUnmounted(() => {
  stopTracking();
});

watch(travelMode, () => {
  if (originCoords.value && destinationCoords.value) {
    calculateRoute();
  }
});

watch(activeTab, (newTab, oldTab) => {
  if (oldTab === "transit" && map) {
    stopTransitSimulation();
    map.clearTransitRoute();
    transitItinerary.value = null;
    activeLegIdx.value = -1;
  }
});
</script>

<template>
  <div class="h-[calc(100vh-88px)] flex bg-background overflow-hidden">
    <!-- Mobile Editor Toggle Button -->
    <button
      class="lg:hidden fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 bg-accent text-black rounded-full shadow-lg font-semibold text-sm"
      @click="showMobileEditor = true"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 20h9M16.5 3.5a2.12 2.12 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
      </svg>
      Edit
    </button>

    <!-- Mobile Editor Modal -->
    <div
      v-if="showMobileEditor"
      class="lg:hidden fixed inset-0 z-50 bg-black/50"
      @click.self="showMobileEditor = false"
    >
      <div
        class="absolute bottom-0 left-0 right-0 h-[85vh] bg-background rounded-t-3xl flex flex-col overflow-hidden animate-slide-up"
      >
        <!-- Modal Header -->
        <div
          class="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white shrink-0"
        >
          <div class="flex gap-1">
            <button
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="
                activeTab === 'route'
                  ? 'bg-accent/10 text-accent'
                  : 'text-gray-500'
              "
              @click="activeTab = 'route'"
            >
              Route
            </button>
            <button
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="
                activeTab === 'tracking'
                  ? 'bg-accent/10 text-accent'
                  : 'text-gray-500'
              "
              @click="activeTab = 'tracking'"
            >
              Tracking
            </button>
            <button
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="
                activeTab === 'styling'
                  ? 'bg-accent/10 text-accent'
                  : 'text-gray-500'
              "
              @click="activeTab = 'styling'"
            >
              Styling
            </button>
            <button
              class="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              :class="
                activeTab === 'transit'
                  ? 'bg-accent/10 text-accent'
                  : 'text-gray-500'
              "
              @click="activeTab = 'transit'"
            >
              Transit
            </button>
          </div>
          <button
            class="p-2 text-gray-500 hover:text-gray-900"
            @click="showMobileEditor = false"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <!-- Modal Content - Same as desktop but scrollable -->
        <div class="flex-1 overflow-y-auto p-4">
          <!-- Content is duplicated below, using same tab content -->
          <div v-if="activeTab === 'route'" class="flex flex-col gap-4">
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-gray-500 font-mono">country</label>
              <select
                v-model="selectedCountry"
                class="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm"
              >
                <option
                  v-for="country in countries"
                  :key="country.code"
                  :value="country.code"
                >
                  {{ country.name }}
                </option>
              </select>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-gray-500 font-mono">mode</label>
              <div class="grid grid-cols-3 gap-2">
                <button
                  v-for="option in travelModeOptions"
                  :key="option.id"
                  class="px-3 py-2.5 rounded-md text-xs font-medium transition-all"
                  :class="
                    travelMode === option.id
                      ? 'bg-accent/10 border border-accent text-accent'
                      : 'bg-white border border-gray-200 text-gray-500'
                  "
                  @click="travelMode = option.id"
                >
                  {{ option.label }}
                </button>
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-gray-500 font-mono">origin</label>
              <AddressSearch
                v-model="routeOriginInput"
                placeholder="Search..."
                :country-code="selectedCountry"
                @select="handleOriginSelect"
              />
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-gray-500 font-mono">destination</label>
              <AddressSearch
                v-model="routeDestinationInput"
                placeholder="Search..."
                :country-code="selectedCountry"
                @select="handleDestinationSelect"
              />
            </div>
            <div
              v-if="routeResult"
              class="p-4 bg-white border border-gray-200 rounded-lg"
            >
              <div class="flex gap-8">
                <div class="flex flex-col gap-1">
                  <span class="text-2xl font-bold text-accent"
                    >{{ routeResult.durationMins }} min</span
                  >
                  <span class="text-xs uppercase text-gray-500">Duration</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-2xl font-bold text-accent"
                    >{{ routeResult.distanceKm }} km</span
                  >
                  <span class="text-xs uppercase text-gray-500">Distance</span>
                </div>
                <div class="flex flex-col gap-1">
                  <span class="text-2xl font-bold text-accent">{{
                    routeResult.modeLabel
                  }}</span>
                  <span class="text-xs uppercase text-gray-500">Mode</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="activeTab === 'tracking'" class="flex flex-col gap-4">
            <div
              v-if="!polyline.length"
              class="p-4 bg-accent/10 border border-accent rounded-lg text-sm"
            >
              Calculate a route first to enable tracking.
            </div>
            <template v-else>
              <button
                v-if="!isTracking"
                class="flex items-center justify-center gap-2 px-5 py-3 bg-accent rounded-lg text-black text-sm font-semibold"
                @click="startTracking"
              >
                Start Simulation
              </button>
              <button
                v-else
                class="flex items-center justify-center gap-2 px-5 py-3 bg-red-500 rounded-lg text-white text-sm font-semibold"
                @click="stopTracking"
              >
                Stop
              </button>
            </template>
          </div>
          <div v-if="activeTab === 'transit'" class="flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <label class="text-xs text-gray-500 font-mono"
                >itinerary JSON</label
              >
              <button
                class="text-xs text-gray-400"
                @click="
                  transitInput = JSON.stringify(SAMPLE_ITINERARY, null, 2);
                  transitError = '';
                "
              >
                Reset
              </button>
            </div>
            <textarea
              v-model="transitInput"
              class="w-full h-40 px-3 py-2.5 bg-gray-900 border border-gray-200 rounded-lg text-gray-300 text-xs font-mono resize-none focus:outline-none focus:border-accent"
              spellcheck="false"
              @input="transitError = ''"
            ></textarea>
            <p v-if="transitError" class="text-xs text-red-500">
              {{ transitError }}
            </p>
            <label
              class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer"
            >
              <input
                type="checkbox"
                v-model="showTransitStops"
                class="w-4 h-4 accent-accent"
              />
              Show stop markers
            </label>
            <button
              class="flex items-center justify-center gap-2 w-full px-5 py-3 bg-accent rounded-lg text-black text-sm font-semibold"
              @click="
                renderTransit;
                showMobileEditor = false;
              "
            >
              Render on Map
            </button>
            <template v-if="transitItinerary">
              <div
                v-for="(leg, i) in transitItinerary.legs"
                :key="i"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer"
                :class="
                  activeLegIdx === i
                    ? 'border-accent bg-accent/5'
                    : 'border-gray-200 bg-white'
                "
                @click="
                  map?.highlightLeg(i);
                  activeLegIdx = i;
                  showMobileEditor = false;
                "
              >
                <span
                  class="w-3 h-3 rounded-full shrink-0"
                  :style="{ backgroundColor: getLegColor(leg) }"
                ></span>
                <span class="text-xs font-mono text-gray-500 w-10 shrink-0">{{
                  leg.mode
                }}</span>
                <span class="text-xs text-gray-700 truncate flex-1"
                  >{{ leg.from.name }} → {{ leg.to.name }}</span
                >
                <span class="text-xs text-gray-400 shrink-0"
                  >{{ Math.round(leg.duration / 60) }}m</span
                >
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-500 font-mono"
                  >speed: {{ transitSimSpeed }} km/h</label
                >
                <input
                  type="range"
                  v-model.number="transitSimSpeed"
                  min="5"
                  max="120"
                  step="5"
                  :disabled="transitSimulating"
                  class="w-full h-1.5 rounded bg-gray-200 appearance-none cursor-pointer accent-accent"
                />
              </div>
              <button
                v-if="!transitSimulating"
                class="flex items-center justify-center gap-2 w-full px-5 py-3 bg-accent rounded-lg text-black text-sm font-semibold"
                @click="
                  simulateTransit();
                  showMobileEditor = false;
                "
              >
                Simulate Journey
              </button>
              <button
                v-else
                class="flex items-center justify-center gap-2 w-full px-5 py-3 bg-red-500 rounded-lg text-white text-sm font-semibold"
                @click="stopTransitSimulation"
              >
                Stop
              </button>
              <div
                v-if="transitSimulating || transitProgress > 0"
                class="flex items-center gap-3 p-3 bg-white border border-accent rounded-lg"
              >
                <div
                  class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"
                >
                  <div
                    class="h-full bg-accent transition-all duration-100"
                    :style="{ width: transitProgress + '%' }"
                  ></div>
                </div>
                <span class="text-sm font-semibold text-accent min-w-[40px]"
                  >{{ transitProgress }}%</span
                >
              </div>
            </template>
          </div>

          <div v-if="activeTab === 'styling'" class="flex flex-col gap-4">
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="preset in stylePresets"
                :key="preset.id"
                class="px-3 py-2.5 rounded-md text-xs"
                :class="
                  mapStyle.theme === preset.id
                    ? 'bg-accent/10 border border-accent text-accent'
                    : 'bg-white border border-gray-200 text-gray-500'
                "
                @click="applyPreset(preset.id)"
              >
                {{ preset.name }}
              </button>
            </div>
            <button
              class="w-full px-5 py-3.5 bg-accent rounded-lg text-black text-sm font-semibold"
              @click="applyStyleToMap"
            >
              Apply Style
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Editor Panel - Desktop -->
    <div class="hidden lg:flex w-1/2 flex-col border-r border-gray-200 h-full">
      <!-- Tabs -->
      <div class="flex gap-1 p-3 border-b border-gray-200 bg-white shrink-0">
        <button
          class="px-4 py-2 rounded-md text-sm font-medium transition-all"
          :class="
            activeTab === 'route'
              ? 'bg-accent/10 border border-accent text-accent'
              : 'text-gray-500 hover:text-gray-900'
          "
          @click="activeTab = 'route'"
        >
          Route
        </button>
        <button
          class="px-4 py-2 rounded-md text-sm font-medium transition-all"
          :class="
            activeTab === 'tracking'
              ? 'bg-accent/10 border border-accent text-accent'
              : 'text-gray-500 hover:text-gray-900'
          "
          @click="activeTab = 'tracking'"
        >
          Live Tracking
        </button>
        <button
          class="px-4 py-2 rounded-md text-sm font-medium transition-all"
          :class="
            activeTab === 'styling'
              ? 'bg-accent/10 border border-accent text-accent'
              : 'text-gray-500 hover:text-gray-900'
          "
          @click="activeTab = 'styling'"
        >
          Styling
        </button>
        <button
          class="px-4 py-2 rounded-md text-sm font-medium transition-all"
          :class="
            activeTab === 'transit'
              ? 'bg-accent/10 border border-accent text-accent'
              : 'text-gray-500 hover:text-gray-900'
          "
          @click="activeTab = 'transit'"
        >
          Transit
        </button>
      </div>

      <!-- Editor Content - 2/3 height -->
      <div class="h-2/3 overflow-y-auto p-6">
        <!-- Route Tab -->
        <div v-if="activeTab === 'route'" class="flex flex-col gap-4">
          <div class="font-mono text-base">
            <span class="text-accent">nav.route</span>
            <span class="text-gray-500">({ origin, destination, mode })</span>
          </div>
          <p class="text-gray-500 text-sm leading-relaxed">
            Search for locations using autocomplete, then calculate route.
          </p>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-500 font-mono">country</label>
            <select
              v-model="selectedCountry"
              class="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 text-sm cursor-pointer hover:border-accent focus:border-accent focus:outline-none"
            >
              <option
                v-for="country in countries"
                :key="country.code"
                :value="country.code"
              >
                {{ country.name }}
              </option>
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-500 font-mono">mode</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="option in travelModeOptions"
                :key="option.id"
                class="px-3 py-2.5 rounded-md text-sm font-medium transition-all"
                :class="
                  travelMode === option.id
                    ? 'bg-accent/10 border border-accent text-accent'
                    : 'bg-white border border-gray-200 text-gray-500 hover:text-gray-900'
                "
                @click="travelMode = option.id"
              >
                {{ option.label }}
              </button>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs text-gray-500 font-mono">origin</label>
              <button
                class="flex items-center justify-center w-7 h-7 rounded-md border transition-all"
                :class="
                  pinDropMode === 'origin'
                    ? 'bg-accent/15 border-accent text-accent'
                    : 'border-gray-200 text-gray-500 hover:border-accent hover:text-accent'
                "
                @click="
                  pinDropMode = pinDropMode === 'origin' ? null : 'origin'
                "
                title="Drop pin on map"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
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

          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs text-gray-500 font-mono">destination</label>
              <button
                class="flex items-center justify-center w-7 h-7 rounded-md border transition-all"
                :class="
                  pinDropMode === 'destination'
                    ? 'bg-accent/15 border-accent text-accent'
                    : 'border-gray-200 text-gray-500 hover:border-accent hover:text-accent'
                "
                @click="
                  pinDropMode =
                    pinDropMode === 'destination' ? null : 'destination'
                "
                title="Drop pin on map"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="2"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
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

          <div
            v-if="pinDropMode"
            class="px-3.5 py-2.5 bg-accent/10 border border-dashed border-accent rounded-lg text-sm text-accent text-center"
          >
            Click on the map to set {{ pinDropMode }}
          </div>

          <div
            v-if="routeResult"
            class="p-4 bg-white border border-gray-200 rounded-lg"
          >
            <div class="text-xs uppercase text-gray-500 mb-3">Route Result</div>
            <div class="flex gap-8">
              <div class="flex flex-col gap-1">
                <span class="text-2xl font-bold text-accent"
                  >{{ routeResult.durationMins }} min</span
                >
                <span class="text-xs uppercase text-gray-500">Duration</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-2xl font-bold text-accent"
                  >{{ routeResult.distanceKm }} km</span
                >
                <span class="text-xs uppercase text-gray-500">Distance</span>
              </div>
              <div class="flex flex-col gap-1">
                <span class="text-2xl font-bold text-accent">{{
                  routeResult.modeLabel
                }}</span>
                <span class="text-xs uppercase text-gray-500">Mode</span>
              </div>
            </div>
          </div>

          <button
            v-if="routeResult"
            class="px-4 py-2.5 bg-transparent border border-gray-200 rounded-md text-gray-500 text-sm hover:border-red-500 hover:text-red-500 transition-all"
            @click="clearMap"
          >
            Clear Route
          </button>
        </div>

        <!-- Tracking Tab -->
        <div v-if="activeTab === 'tracking'" class="flex flex-col gap-4">
          <div class="font-mono text-base">
            <span class="text-accent">map.updateDriverMarker</span>
            <span class="text-gray-500">({ lat, lng, heading, icon })</span>
          </div>
          <p class="text-gray-500 text-sm leading-relaxed">
            Simulate driver moving along the calculated route.
          </p>

          <div
            v-if="!polyline.length"
            class="p-4 bg-accent/10 border border-accent rounded-lg text-sm text-gray-900"
          >
            Calculate a route first in the "Route" tab to enable tracking
            simulation.
          </div>

          <template v-else>
            <div class="px-4 py-3 bg-white border border-gray-200 rounded-lg">
              <span class="text-xs uppercase text-gray-500 mr-2">Route:</span>
              <span class="text-sm text-gray-900"
                >{{ routeOriginInput }} → {{ routeDestinationInput }}</span
              >
            </div>

            <div class="flex gap-3">
              <button
                v-if="!isTracking"
                class="flex items-center justify-center gap-2 px-5 py-3 bg-accent rounded-lg text-black text-sm font-semibold hover:opacity-90 transition-opacity"
                @click="startTracking"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Start Simulation
              </button>
              <button
                v-else
                class="flex items-center justify-center gap-2 px-5 py-3 bg-red-500 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                @click="stopTracking"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
                Stop
              </button>
            </div>

            <div
              v-if="isTracking || trackingProgress > 0"
              class="flex flex-col gap-4 p-4 bg-white border border-accent rounded-lg"
            >
              <div class="flex items-baseline gap-3">
                <span class="text-xs uppercase text-gray-500">ETA</span>
                <span class="text-3xl font-bold text-accent">{{
                  currentETA || routeResult?.durationMins + " min"
                }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div
                  class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"
                >
                  <div
                    class="h-full bg-accent transition-all duration-100"
                    :style="{ width: trackingProgress + '%' }"
                  ></div>
                </div>
                <span class="text-sm font-semibold text-accent min-w-[40px]"
                  >{{ Math.round(trackingProgress) }}%</span
                >
              </div>
            </div>
          </template>
        </div>

        <!-- Styling Tab -->
        <div v-if="activeTab === 'styling'" class="flex flex-col gap-4">
          <div class="font-mono text-base">
            <span class="text-accent">nav.setStyleFromPreset</span>
            <span class="text-gray-500">(presetId, options?)</span>
          </div>
          <p class="text-gray-500 text-sm leading-relaxed">
            Customize map appearance with presets, colors, and layer visibility.
          </p>

          <div class="flex flex-col gap-1.5">
            <label class="text-xs text-gray-500 font-mono">preset</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                v-for="preset in stylePresets"
                :key="preset.id"
                class="px-3 py-2.5 rounded-md text-xs transition-all"
                :class="
                  mapStyle.theme === preset.id
                    ? 'bg-accent/10 border border-accent text-accent'
                    : 'bg-white border border-gray-200 text-gray-500 hover:border-accent hover:text-gray-900'
                "
                @click="applyPreset(preset.id)"
              >
                {{ preset.name }}
              </button>
            </div>
          </div>

          <div
            class="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg"
          >
            <div class="text-xs font-semibold uppercase text-gray-500">
              Colors
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-500 font-mono">primary</label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    v-model="mapStyle.colors.primary"
                    class="w-8 h-8 rounded-md cursor-pointer border-0"
                  />
                  <span class="text-xs text-gray-500 font-mono">{{
                    mapStyle.colors.primary
                  }}</span>
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-500 font-mono">water</label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    v-model="mapStyle.colors.water"
                    class="w-8 h-8 rounded-md cursor-pointer border-0"
                  />
                  <span class="text-xs text-gray-500 font-mono">{{
                    mapStyle.colors.water
                  }}</span>
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-500 font-mono">parks</label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    v-model="mapStyle.colors.parks"
                    class="w-8 h-8 rounded-md cursor-pointer border-0"
                  />
                  <span class="text-xs text-gray-500 font-mono">{{
                    mapStyle.colors.parks
                  }}</span>
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-500 font-mono">roads</label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    v-model="mapStyle.colors.roads"
                    class="w-8 h-8 rounded-md cursor-pointer border-0"
                  />
                  <span class="text-xs text-gray-500 font-mono">{{
                    mapStyle.colors.roads
                  }}</span>
                </div>
              </div>
            </div>
          </div>

          <div
            class="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg"
          >
            <div class="text-xs font-semibold uppercase text-gray-500">
              Route Polyline
            </div>
            <div class="flex items-center gap-3 p-3 bg-background rounded-md">
              <div
                class="flex-1 rounded transition-all"
                :style="{
                  backgroundColor: mapStyle.polyline.color,
                  height: mapStyle.polyline.weight + 'px',
                  opacity: mapStyle.polyline.opacity,
                }"
              ></div>
              <span class="text-xs uppercase text-gray-500">Preview</span>
            </div>
            <div class="flex flex-col gap-3">
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-500 font-mono">color</label>
                <div class="flex items-center gap-2">
                  <input
                    type="color"
                    v-model="mapStyle.polyline.color"
                    class="w-8 h-8 rounded-md cursor-pointer border-0"
                  />
                  <span class="text-xs text-gray-500 font-mono">{{
                    mapStyle.polyline.color
                  }}</span>
                </div>
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-500 font-mono"
                  >weight: {{ mapStyle.polyline.weight }}px</label
                >
                <input
                  type="range"
                  v-model.number="mapStyle.polyline.weight"
                  min="1"
                  max="12"
                  step="1"
                  class="w-full h-1.5 rounded bg-gray-200 appearance-none cursor-pointer accent-accent"
                />
              </div>
              <div class="flex flex-col gap-1.5">
                <label class="text-xs text-gray-500 font-mono"
                  >opacity: {{ mapStyle.polyline.opacity }}</label
                >
                <input
                  type="range"
                  v-model.number="mapStyle.polyline.opacity"
                  min="0.1"
                  max="1"
                  step="0.1"
                  class="w-full h-1.5 rounded bg-gray-200 appearance-none cursor-pointer accent-accent"
                />
              </div>
            </div>
          </div>

          <div
            class="flex flex-col gap-3 p-4 bg-white border border-gray-200 rounded-lg"
          >
            <div class="text-xs font-semibold uppercase text-gray-500">
              Layer Visibility
            </div>
            <div class="grid grid-cols-2 gap-2">
              <label
                class="flex items-center gap-2 px-3 py-2 bg-background rounded-md cursor-pointer text-sm text-gray-900 hover:bg-accent/5 transition-colors"
              >
                <input
                  type="checkbox"
                  v-model="mapStyle.layers.roads"
                  class="w-4 h-4 accent-accent cursor-pointer"
                />
                <span>Roads</span>
              </label>
              <label
                class="flex items-center gap-2 px-3 py-2 bg-background rounded-md cursor-pointer text-sm text-gray-900 hover:bg-accent/5 transition-colors"
              >
                <input
                  type="checkbox"
                  v-model="mapStyle.layers.labels"
                  class="w-4 h-4 accent-accent cursor-pointer"
                />
                <span>Labels</span>
              </label>
              <label
                class="flex items-center gap-2 px-3 py-2 bg-background rounded-md cursor-pointer text-sm text-gray-900 hover:bg-accent/5 transition-colors"
              >
                <input
                  type="checkbox"
                  v-model="mapStyle.layers.buildings"
                  class="w-4 h-4 accent-accent cursor-pointer"
                />
                <span>Buildings</span>
              </label>
              <label
                class="flex items-center gap-2 px-3 py-2 bg-background rounded-md cursor-pointer text-sm text-gray-900 hover:bg-accent/5 transition-colors"
              >
                <input
                  type="checkbox"
                  v-model="mapStyle.layers.traffic"
                  class="w-4 h-4 accent-accent cursor-pointer"
                />
                <span>Traffic</span>
              </label>
            </div>
          </div>

          <button
            class="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-accent rounded-lg text-black text-sm font-semibold hover:opacity-90 transition-opacity"
            @click="applyStyleToMap"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path
                d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"
              />
            </svg>
            Apply Style
          </button>
        </div>

        <!-- Transit Tab -->
        <div v-if="activeTab === 'transit'" class="flex flex-col gap-4">
          <div class="font-mono text-base">
            <span class="text-accent">map.drawTransitRoute</span>
            <span class="text-gray-500">(itinerary, options?)</span>
          </div>
          <p class="text-gray-500 text-sm leading-relaxed">
            Paste any
            <code class="bg-accent/10 text-accent px-1 rounded"
              >TransitItinerary</code
            >
            JSON below and render it as colour-coded legs with stop markers. The
            sample shows a walk → Central Line → walk journey across London.
          </p>

          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <label class="text-xs text-gray-500 font-mono"
                >itinerary JSON</label
              >
              <button
                class="text-xs text-gray-400 hover:text-accent transition-colors"
                @click="
                  transitInput = JSON.stringify(SAMPLE_ITINERARY, null, 2);
                  transitError = '';
                "
              >
                Reset sample
              </button>
            </div>
            <textarea
              v-model="transitInput"
              class="w-full h-48 px-3 py-2.5 bg-gray-900 border border-gray-200 rounded-lg text-gray-300 text-xs font-mono leading-relaxed resize-none focus:outline-none focus:border-accent"
              spellcheck="false"
              @input="transitError = ''"
            ></textarea>
            <p v-if="transitError" class="text-xs text-red-500">
              {{ transitError }}
            </p>
          </div>

          <label
            class="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none"
          >
            <input
              type="checkbox"
              v-model="showTransitStops"
              class="w-4 h-4 accent-accent cursor-pointer"
            />
            Show intermediate stop markers
          </label>

          <button
            class="flex items-center justify-center gap-2 w-full px-5 py-3.5 bg-accent rounded-lg text-black text-sm font-semibold hover:opacity-90 transition-opacity"
            @click="renderTransit"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z" />
              <path d="M8 2v16M16 6v16" />
            </svg>
            Render on Map
          </button>

          <!-- Leg list — shown after render -->
          <template v-if="transitItinerary">
            <div class="flex flex-col gap-1.5">
              <div class="text-xs uppercase text-gray-500 font-semibold">
                Legs
              </div>
              <div
                v-for="(leg, i) in transitItinerary.legs"
                :key="i"
                class="flex items-center gap-3 px-3 py-2.5 rounded-lg border cursor-pointer transition-all"
                :class="
                  activeLegIdx === i
                    ? 'border-accent bg-accent/5'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                "
                @click="
                  map?.highlightLeg(i);
                  activeLegIdx = i;
                  log(`Highlighted leg ${i}: ${leg.mode}`);
                "
              >
                <span
                  class="w-3 h-3 rounded-full shrink-0"
                  :style="{ backgroundColor: getLegColor(leg) }"
                ></span>
                <span class="text-xs font-mono text-gray-500 w-10 shrink-0">{{
                  leg.mode
                }}</span>
                <span class="text-xs text-gray-700 truncate flex-1"
                  >{{ leg.from.name }} → {{ leg.to.name }}</span
                >
                <span class="text-xs text-gray-400 shrink-0"
                  >{{ Math.round(leg.duration / 60) }}m</span
                >
              </div>
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="text-xs text-gray-500 font-mono"
                >speed: {{ transitSimSpeed }} km/h</label
              >
              <input
                type="range"
                v-model.number="transitSimSpeed"
                min="5"
                max="120"
                step="5"
                :disabled="transitSimulating"
                class="w-full h-1.5 rounded bg-gray-200 appearance-none cursor-pointer accent-accent disabled:opacity-50"
              />
            </div>

            <div class="flex gap-3">
              <button
                v-if="!transitSimulating"
                class="flex items-center justify-center gap-2 flex-1 px-5 py-3 bg-accent rounded-lg text-black text-sm font-semibold hover:opacity-90 transition-opacity"
                @click="simulateTransit"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
                Simulate Journey
              </button>
              <button
                v-else
                class="flex items-center justify-center gap-2 flex-1 px-5 py-3 bg-red-500 rounded-lg text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                @click="stopTransitSimulation"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <rect x="6" y="6" width="12" height="12" />
                </svg>
                Stop
              </button>
            </div>

            <div
              v-if="transitSimulating || transitProgress > 0"
              class="flex flex-col gap-4 p-4 bg-white border border-accent rounded-lg"
            >
              <div class="flex items-baseline gap-3">
                <span class="text-xs uppercase text-gray-500">Active leg</span>
                <span class="text-sm font-semibold text-accent truncate">{{
                  transitCurrentLeg || "…"
                }}</span>
              </div>
              <div class="flex items-center gap-3">
                <div
                  class="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden"
                >
                  <div
                    class="h-full bg-accent transition-all duration-100"
                    :style="{ width: transitProgress + '%' }"
                  ></div>
                </div>
                <span class="text-sm font-semibold text-accent min-w-[40px]"
                  >{{ transitProgress }}%</span
                >
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- Console Panel - 1/3 height -->
      <div class="h-1/3 border-t border-gray-200 flex flex-col shrink-0">
        <div
          class="flex justify-between items-center px-4 py-2 bg-white border-b border-gray-200 text-xs text-gray-500"
        >
          <div class="flex gap-1">
            <button
              class="px-3 py-1 rounded transition-all"
              :class="
                bottomPanelTab === 'console'
                  ? 'bg-accent/15 text-accent'
                  : 'text-gray-500 hover:text-gray-900'
              "
              @click="bottomPanelTab = 'console'"
            >
              Console
            </button>
            <button
              class="px-3 py-1 rounded transition-all"
              :class="
                bottomPanelTab === 'code'
                  ? 'bg-accent/15 text-accent'
                  : 'text-gray-500 hover:text-gray-900'
              "
              @click="bottomPanelTab = 'code'"
            >
              Code
            </button>
          </div>
          <div class="flex gap-2">
            <button
              v-if="bottomPanelTab === 'console'"
              class="px-2 py-1 border border-gray-200 rounded text-xs text-gray-500 hover:border-accent hover:text-accent transition-all"
              @click="clearConsole"
            >
              Clear
            </button>
            <button
              v-if="bottomPanelTab === 'code'"
              class="px-2 py-1 border border-gray-200 rounded text-xs text-gray-500 hover:border-accent hover:text-accent transition-all"
              @click="copyCode"
            >
              {{ codeCopied ? "Copied!" : "Copy" }}
            </button>
          </div>
        </div>
        <div
          v-if="bottomPanelTab === 'console'"
          class="flex-1 overflow-y-auto p-3 bg-gray-900 font-mono text-xs leading-relaxed"
        >
          <div
            v-for="(line, index) in consoleOutput"
            :key="index"
            class="text-gray-400"
          >
            {{ line }}
          </div>
          <div
            v-if="consoleOutput.length === 0"
            class="text-gray-500 opacity-50"
          >
            Output will appear here...
          </div>
        </div>
        <div
          v-if="bottomPanelTab === 'code'"
          class="flex-1 overflow-y-auto bg-gray-900"
        >
          <pre
            class="m-0 p-3 font-mono text-xs leading-relaxed text-gray-300"
          ><code v-html="highlightedCode"></code></pre>
        </div>
      </div>
    </div>

    <!-- Preview Panel - Sticky -->
    <div class="flex-1 flex flex-col sticky top-0 h-full">
      <div
        class="flex justify-between items-center px-6 py-3 border-b border-gray-200 text-xs text-gray-500 bg-background shrink-0"
      >
        <span>Preview</span>
        <div v-if="isRunning" class="flex items-center gap-2 text-accent">
          <span class="w-2 h-2 bg-accent rounded-full animate-pulse"></span>
          Calculating...
        </div>
      </div>
      <div
        class="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-900 to-gray-800"
      >
        <PhoneMockup>
          <div
            id="sandbox-map"
            class="!w-full !h-full transition-all duration-300"
            :style="{ filter: currentMapFilter }"
          ></div>
        </PhoneMockup>
      </div>
    </div>
  </div>
</template>

<style scoped>
#sandbox-map {
  width: 100% !important;
  height: 100% !important;
}

@keyframes slide-up {
  from {
    transform: translateY(100%);
  }
  to {
    transform: translateY(0);
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
</style>
