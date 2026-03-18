<script setup lang="ts">
const activeSection = ref("getting-started");

const sections = [
  { id: "getting-started", label: "Getting Started" },
  { id: "core-api", label: "Core API" },
  { id: "map-api", label: "Map API" },
  { id: "navigation-api", label: "Navigation" },
  { id: "ride-session", label: "Ride Sessions" },
  { id: "styling-api", label: "Map Styling" },
  { id: "types", label: "Types Reference" },
];

function scrollToSection(id: string) {
  activeSection.value = id;
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id;
        }
      });
    },
    { rootMargin: "-100px 0px -80% 0px" },
  );

  sections.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  });

  return () => observer.disconnect();
});
</script>

<template>
  <div class="flex bg-background">
    <!-- Sidebar Navigation -->
    <nav
      class="hidden md:block w-56 p-6 border-r border-gray-200 sticky top-[88px] h-[calc(100vh-88px)] overflow-y-auto shrink-0"
    >
      <div class="flex flex-col gap-1">
        <button
          v-for="section in sections"
          :key="section.id"
          class="px-3 py-2.5 rounded-lg text-sm text-left transition-all"
          :class="
            activeSection === section.id
              ? 'bg-accent/50 text-accent'
              : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
          "
          @click="scrollToSection(section.id)"
        >
          {{ section.label }}
        </button>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="flex-1 p-12 max-w-4xl">
      <!-- Getting Started -->
      <section id="getting-started" class="mb-20">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Getting Started</h1>
        <p class="text-base text-gray-500 leading-relaxed mb-8">
          Navigatr is an open-source navigation SDK that provides routing,
          geocoding, and interactive maps without requiring API keys. It's built
          on top of OpenStreetMap data and free routing services.
        </p>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">Installation</h2>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-green-400">npm install</span> @navigatr/web</code></pre>
          </div>
        </div>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">Quick Start</h2>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-purple-400">import</span> { <span class="text-cyan-400">Navigatr</span> } <span class="text-purple-400">from</span> <span class="text-yellow-300">'@navigatr/web'</span>

<span class="text-gray-500">// Initialize the SDK</span>
<span class="text-purple-400">const</span> nav = <span class="text-purple-400">new</span> <span class="text-cyan-400">Navigatr</span>()

<span class="text-gray-500">// Create a map</span>
<span class="text-purple-400">const</span> map = nav.<span class="text-blue-400">map</span>({
  <span class="text-cyan-300">container</span>: <span class="text-yellow-300">'map'</span>,
  <span class="text-cyan-300">center</span>: { <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.6037</span>, <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.1870</span> },
  <span class="text-cyan-300">zoom</span>: <span class="text-orange-400">12</span>
})

<span class="text-gray-500">// Calculate a route</span>
<span class="text-purple-400">const</span> route = <span class="text-purple-400">await</span> nav.<span class="text-blue-400">route</span>({
  <span class="text-cyan-300">origin</span>: { <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.5600</span>, <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.2050</span> },
  <span class="text-cyan-300">destination</span>: { <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.6037</span>, <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.1870</span> }
})

<span class="text-gray-500">// Draw the route on the map</span>
map.<span class="text-blue-400">drawRoute</span>(route.polyline)
map.<span class="text-blue-400">fitRoute</span>(route.polyline)

console.<span class="text-blue-400">log</span>(<span class="text-yellow-300">`Duration: <span class="text-cyan-300">${route.durationText}</span>`</span>)
console.<span class="text-blue-400">log</span>(<span class="text-yellow-300">`Distance: <span class="text-cyan-300">${route.distanceText}</span>`</span>)</code></pre>
          </div>
        </div>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">Features</h2>
          <ul class="space-y-2">
            <li class="flex items-start gap-3 text-gray-500">
              <span class="w-2 h-2 bg-accent rounded-full mt-2 shrink-0"></span
              ><span
                ><strong class="text-gray-900">Routing</strong> - Turn-by-turn
                directions powered by Valhalla</span
              >
            </li>
            <li class="flex items-start gap-3 text-gray-500">
              <span class="w-2 h-2 bg-accent rounded-full mt-2 shrink-0"></span
              ><span
                ><strong class="text-gray-900">Geocoding</strong> - Address
                search and reverse geocoding via Nominatim</span
              >
            </li>
            <li class="flex items-start gap-3 text-gray-500">
              <span class="w-2 h-2 bg-accent rounded-full mt-2 shrink-0"></span
              ><span
                ><strong class="text-gray-900">Autocomplete</strong> - Location
                search suggestions with Photon</span
              >
            </li>
            <li class="flex items-start gap-3 text-gray-500">
              <span class="w-2 h-2 bg-accent rounded-full mt-2 shrink-0"></span
              ><span
                ><strong class="text-gray-900">Interactive Maps</strong> -
                MapLibre GL JS maps with OpenStreetMap tiles</span
              >
            </li>
            <li class="flex items-start gap-3 text-gray-500">
              <span class="w-2 h-2 bg-accent rounded-full mt-2 shrink-0"></span
              ><span
                ><strong class="text-gray-900">Navigation</strong> - Real-time
                navigation with camera following</span
              >
            </li>
            <li class="flex items-start gap-3 text-gray-500">
              <span class="w-2 h-2 bg-accent rounded-full mt-2 shrink-0"></span
              ><span
                ><strong class="text-gray-900">Ride Sessions</strong> - Built-in
                ride-sharing workflow support</span
              >
            </li>
            <li class="flex items-start gap-3 text-gray-500">
              <span class="w-2 h-2 bg-accent rounded-full mt-2 shrink-0"></span
              ><span
                ><strong class="text-gray-900">Map Styling</strong> -
                Customizable map themes and route styles</span
              >
            </li>
          </ul>
        </div>
      </section>

      <!-- Core API -->
      <section id="core-api" class="mb-20">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Core API</h1>
        <p class="text-base text-gray-500 leading-relaxed mb-8">
          The core API provides routing, geocoding, and autocomplete
          functionality.
        </p>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">Constructor</h2>
          <div class="mb-3">
            <code
              class="font-mono text-sm text-black bg-accent/50 px-3 py-2 rounded-md inline-block"
              >new Navigatr(config?: NavigatrConfig)</code
            >
          </div>
          <p class="text-gray-500 text-sm mb-4">
            Creates a new Navigatr instance with optional configuration.
          </p>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-gray-500">// Default configuration (uses public services)</span>
<span class="text-purple-400">const</span> nav = <span class="text-purple-400">new</span> <span class="text-cyan-400">Navigatr</span>()

<span class="text-gray-500">// Custom service URLs</span>
<span class="text-purple-400">const</span> nav = <span class="text-purple-400">new</span> <span class="text-cyan-400">Navigatr</span>({
  <span class="text-cyan-300">valhallaUrl</span>: <span class="text-yellow-300">'https://your-valhalla-server.com'</span>,
  <span class="text-cyan-300">nominatimUrl</span>: <span class="text-yellow-300">'https://your-nominatim-server.com'</span>,
  <span class="text-cyan-300">photonUrl</span>: <span class="text-yellow-300">'https://your-photon-server.com'</span>
})</code></pre>
          </div>
        </div>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">route()</h2>
          <div class="mb-3">
            <code
              class="font-mono text-sm text-black bg-accent/50 px-3 py-2 rounded-md inline-block"
              >nav.route(options: RouteOptions):
              Promise&lt;RouteResult&gt;</code
            >
          </div>
          <p class="text-gray-500 text-sm mb-4">
            Calculates a route between two points with optional turn-by-turn
            instructions.
          </p>
          <div class="overflow-x-auto mb-4">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200">
                  <th
                    class="text-left py-3 px-4 text-xs uppercase text-gray-500 font-semibold bg-gray-50"
                  >
                    Parameter
                  </th>
                  <th
                    class="text-left py-3 px-4 text-xs uppercase text-gray-500 font-semibold bg-gray-50"
                  >
                    Type
                  </th>
                  <th
                    class="text-left py-3 px-4 text-xs uppercase text-gray-500 font-semibold bg-gray-50"
                  >
                    Description
                  </th>
                </tr>
              </thead>
              <tbody class="text-gray-900">
                <tr class="border-b border-gray-100">
                  <td class="py-3 px-4">
                    <code
                      class="text-black bg-accent/50 px-1.5 py-0.5 rounded text-xs"
                      >origin</code
                    >
                  </td>
                  <td class="py-3 px-4">LatLng</td>
                  <td class="py-3 px-4 text-gray-500">
                    Starting point coordinates
                  </td>
                </tr>
                <tr class="border-b border-gray-100">
                  <td class="py-3 px-4">
                    <code
                      class="text-black bg-accent/50 px-1.5 py-0.5 rounded text-xs"
                      >destination</code
                    >
                  </td>
                  <td class="py-3 px-4">LatLng</td>
                  <td class="py-3 px-4 text-gray-500">
                    Ending point coordinates
                  </td>
                </tr>
                <tr class="border-b border-gray-100">
                  <td class="py-3 px-4">
                    <code
                      class="text-black bg-accent/50 px-1.5 py-0.5 rounded text-xs"
                      >maneuvers</code
                    >
                  </td>
                  <td class="py-3 px-4">boolean</td>
                  <td class="py-3 px-4 text-gray-500">
                    Include turn-by-turn instructions (default: false)
                  </td>
                </tr>
                <tr>
                  <td class="py-3 px-4">
                    <code
                      class="text-black bg-accent/50 px-1.5 py-0.5 rounded text-xs"
                      >traffic</code
                    >
                  </td>
                  <td class="py-3 px-4">boolean</td>
                  <td class="py-3 px-4 text-gray-500">
                    Consider traffic conditions (default: false)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-purple-400">const</span> route = <span class="text-purple-400">await</span> nav.<span class="text-blue-400">route</span>({
  <span class="text-cyan-300">origin</span>: { <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.5600</span>, <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.2050</span> },
  <span class="text-cyan-300">destination</span>: { <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.6037</span>, <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.1870</span> },
  <span class="text-cyan-300">maneuvers</span>: <span class="text-orange-400">true</span>
})

console.<span class="text-blue-400">log</span>(route.durationText)  <span class="text-gray-500">// "15 mins"</span>
console.<span class="text-blue-400">log</span>(route.distanceText)  <span class="text-gray-500">// "8.2 km"</span>
console.<span class="text-blue-400">log</span>(route.polyline)      <span class="text-gray-500">// Array of LatLng points</span>
console.<span class="text-blue-400">log</span>(route.maneuvers)     <span class="text-gray-500">// Turn-by-turn instructions</span></code></pre>
          </div>
        </div>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">geocode()</h2>
          <div class="mb-3">
            <code
              class="font-mono text-sm text-black bg-accent/50 px-3 py-2 rounded-md inline-block"
              >nav.geocode(params: { address: string }):
              Promise&lt;GeocodeResult&gt;</code
            >
          </div>
          <p class="text-gray-500 text-sm mb-4">
            Converts an address string to geographic coordinates.
          </p>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-purple-400">const</span> result = <span class="text-purple-400">await</span> nav.<span class="text-blue-400">geocode</span>({
  <span class="text-cyan-300">address</span>: <span class="text-yellow-300">'Accra Mall, Ghana'</span>
})

console.<span class="text-blue-400">log</span>(result.lat)          <span class="text-gray-500">// 5.6357</span>
console.<span class="text-blue-400">log</span>(result.lng)          <span class="text-gray-500">// -0.1764</span>
console.<span class="text-blue-400">log</span>(result.displayName)  <span class="text-gray-500">// "Accra Mall, Spintex Road, Accra"</span></code></pre>
          </div>
        </div>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">
            reverseGeocode()
          </h2>
          <div class="mb-3">
            <code
              class="font-mono text-sm text-black bg-accent/50 px-3 py-2 rounded-md inline-block"
              >nav.reverseGeocode(params: { lat: number, lng: number }):
              Promise&lt;GeocodeResult&gt;</code
            >
          </div>
          <p class="text-gray-500 text-sm mb-4">
            Converts coordinates to a human-readable address.
          </p>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-purple-400">const</span> result = <span class="text-purple-400">await</span> nav.<span class="text-blue-400">reverseGeocode</span>({
  <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.6037</span>,
  <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.1870</span>
})

console.<span class="text-blue-400">log</span>(result.displayName)  <span class="text-gray-500">// "Independence Square, Accra, Ghana"</span></code></pre>
          </div>
        </div>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">
            autocomplete()
          </h2>
          <div class="mb-3">
            <code
              class="font-mono text-sm text-black bg-accent/50 px-3 py-2 rounded-md inline-block"
              >nav.autocomplete(params: { query: string, limit?: number }):
              Promise&lt;AutocompleteResult[]&gt;</code
            >
          </div>
          <p class="text-gray-500 text-sm mb-4">
            Returns location suggestions for a search query.
          </p>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-purple-400">const</span> results = <span class="text-purple-400">await</span> nav.<span class="text-blue-400">autocomplete</span>({
  <span class="text-cyan-300">query</span>: <span class="text-yellow-300">'Accra'</span>,
  <span class="text-cyan-300">limit</span>: <span class="text-orange-400">5</span>
})

results.<span class="text-blue-400">forEach</span>(result => {
  console.<span class="text-blue-400">log</span>(result.name)         <span class="text-gray-500">// "Accra Mall"</span>
  console.<span class="text-blue-400">log</span>(result.displayName)  <span class="text-gray-500">// "Accra Mall, Spintex Road, Accra, Ghana"</span>
  console.<span class="text-blue-400">log</span>(result.city)         <span class="text-gray-500">// "Accra"</span>
  console.<span class="text-blue-400">log</span>(result.country)      <span class="text-gray-500">// "Ghana"</span>
})</code></pre>
          </div>
        </div>
      </section>

      <!-- Map API -->
      <section id="map-api" class="mb-20">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Map API</h1>
        <p class="text-base text-gray-500 leading-relaxed mb-8">
          The Map API provides methods for creating interactive maps, adding
          markers, and visualizing routes.
        </p>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">
            Creating a Map
          </h2>
          <div class="mb-3">
            <code
              class="font-mono text-sm text-black bg-accent/50 px-3 py-2 rounded-md inline-block"
              >nav.map(config: MapConfig): NavigatrMap</code
            >
          </div>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-purple-400">const</span> map = nav.<span class="text-blue-400">map</span>({
  <span class="text-cyan-300">container</span>: <span class="text-yellow-300">'map-container'</span>,  <span class="text-gray-500">// DOM element ID</span>
  <span class="text-cyan-300">center</span>: { <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.6037</span>, <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.1870</span> },
  <span class="text-cyan-300">zoom</span>: <span class="text-orange-400">12</span>,
  <span class="text-cyan-300">pitch</span>: <span class="text-orange-400">0</span>,      <span class="text-gray-500">// Camera tilt (0-60)</span>
  <span class="text-cyan-300">bearing</span>: <span class="text-orange-400">0</span>     <span class="text-gray-500">// Camera rotation (0-360)</span>
})</code></pre>
          </div>
        </div>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">addMarker()</h2>
          <div class="mb-3">
            <code
              class="font-mono text-sm text-black bg-accent/50 px-3 py-2 rounded-md inline-block"
              >map.addMarker(options: MarkerOptions): NavigatrMarker</code
            >
          </div>
          <p class="text-gray-500 text-sm mb-4">
            Adds a marker to the map. Markers can be draggable with callbacks.
          </p>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-gray-500">// Simple marker</span>
<span class="text-purple-400">const</span> marker = map.<span class="text-blue-400">addMarker</span>({
  <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.6037</span>,
  <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.1870</span>,
  <span class="text-cyan-300">label</span>: <span class="text-yellow-300">'Pickup Location'</span>
})

<span class="text-gray-500">// Draggable marker with callback</span>
<span class="text-purple-400">const</span> draggableMarker = map.<span class="text-blue-400">addMarker</span>({
  <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.6037</span>,
  <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.1870</span>,
  <span class="text-cyan-300">label</span>: <span class="text-yellow-300">'Drag to adjust'</span>,
  <span class="text-cyan-300">draggable</span>: <span class="text-orange-400">true</span>,
  <span class="text-cyan-300">onDragEnd</span>: (location) => {
    console.<span class="text-blue-400">log</span>(<span class="text-yellow-300">'New position:'</span>, location)
  }
})

<span class="text-gray-500">// Update marker position</span>
marker.<span class="text-blue-400">setLatLng</span>({ <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.6100</span>, <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.1800</span> })

<span class="text-gray-500">// Remove marker</span>
marker.<span class="text-blue-400">remove</span>()</code></pre>
          </div>
        </div>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">drawRoute()</h2>
          <div class="mb-3">
            <code
              class="font-mono text-sm text-black bg-accent/50 px-3 py-2 rounded-md inline-block"
              >map.drawRoute(polyline: LatLng[], style?: RouteStyleOptions):
              void</code
            >
          </div>
          <p class="text-gray-500 text-sm mb-4">
            Draws a route polyline on the map with optional styling.
          </p>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-gray-500">// Draw with default styling</span>
map.<span class="text-blue-400">drawRoute</span>(route.polyline)

<span class="text-gray-500">// Draw with custom styling</span>
map.<span class="text-blue-400">drawRoute</span>(route.polyline, {
  <span class="text-cyan-300">color</span>: <span class="text-yellow-300">'#3b82f6'</span>,   <span class="text-gray-500">// Blue</span>
  <span class="text-cyan-300">weight</span>: <span class="text-orange-400">6</span>,          <span class="text-gray-500">// Thicker line</span>
  <span class="text-cyan-300">opacity</span>: <span class="text-orange-400">0.8</span>
})</code></pre>
          </div>
        </div>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">onClick()</h2>
          <div class="mb-3">
            <code
              class="font-mono text-sm text-black bg-accent/50 px-3 py-2 rounded-md inline-block"
              >map.onClick(callback: (location: LatLng) =&gt; void): () =&gt;
              void</code
            >
          </div>
          <p class="text-gray-500 text-sm mb-4">
            Registers a click handler. Returns an unsubscribe function.
          </p>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-purple-400">const</span> unsubscribe = map.<span class="text-blue-400">onClick</span>((location) => {
  console.<span class="text-blue-400">log</span>(<span class="text-yellow-300">'Clicked at:'</span>, location)
  map.<span class="text-blue-400">addMarker</span>({ ...location, <span class="text-cyan-300">label</span>: <span class="text-yellow-300">'Selected'</span> })
})

<span class="text-gray-500">// Later: stop listening</span>
<span class="text-blue-400">unsubscribe</span>()</code></pre>
          </div>
        </div>
      </section>

      <!-- Navigation API -->
      <section id="navigation-api" class="mb-20">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Navigation API</h1>
        <p class="text-base text-gray-500 leading-relaxed mb-8">
          The Navigation API provides turn-by-turn navigation with automatic
          camera following, route snapping, and navigation events.
        </p>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">
            startNavigation()
          </h2>
          <div class="mb-3">
            <code
              class="font-mono text-sm text-black bg-accent/50 px-3 py-2 rounded-md inline-block"
              >map.startNavigation(route: RouteResult): void</code
            >
          </div>
          <p class="text-gray-500 text-sm mb-4">
            Starts navigation mode. The camera enters a 3D perspective view and
            follows the driver marker along the route.
          </p>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-purple-400">const</span> route = <span class="text-purple-400">await</span> nav.<span class="text-blue-400">route</span>({
  <span class="text-cyan-300">origin</span>: { <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.5600</span>, <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.2050</span> },
  <span class="text-cyan-300">destination</span>: { <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.6037</span>, <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.1870</span> },
  <span class="text-cyan-300">maneuvers</span>: <span class="text-orange-400">true</span>
})

map.<span class="text-blue-400">startNavigation</span>(route)</code></pre>
          </div>
        </div>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">
            onNavigationEvent()
          </h2>
          <div class="mb-3">
            <code
              class="font-mono text-sm text-black bg-accent/50 px-3 py-2 rounded-md inline-block"
              >map.onNavigationEvent(callback: NavigationEventCallback): ()
              =&gt; void</code
            >
          </div>
          <p class="text-gray-500 text-sm mb-4">
            Listens for navigation events. Returns an unsubscribe function.
          </p>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-purple-400">const</span> unsubscribe = map.<span class="text-blue-400">onNavigationEvent</span>((event) => {
  <span class="text-purple-400">switch</span> (event.type) {
    <span class="text-purple-400">case</span> <span class="text-yellow-300">'navigation_started'</span>:
      console.<span class="text-blue-400">log</span>(<span class="text-yellow-300">'Navigation started'</span>)
      <span class="text-purple-400">break</span>

    <span class="text-purple-400">case</span> <span class="text-yellow-300">'turn_approaching'</span>:
      console.<span class="text-blue-400">log</span>(<span class="text-yellow-300">`In <span class="text-cyan-300">${event.distanceMeters}</span>m: <span class="text-cyan-300">${event.maneuver.instruction}</span>`</span>)
      <span class="text-purple-400">break</span>

    <span class="text-purple-400">case</span> <span class="text-yellow-300">'off_route'</span>:
      console.<span class="text-blue-400">log</span>(<span class="text-yellow-300">`Off route by <span class="text-cyan-300">${event.distanceMeters}</span>m`</span>)
      <span class="text-purple-400">break</span>

    <span class="text-purple-400">case</span> <span class="text-yellow-300">'arrived'</span>:
      console.<span class="text-blue-400">log</span>(<span class="text-yellow-300">'You have arrived!'</span>)
      <span class="text-purple-400">break</span>
  }
})</code></pre>
          </div>
        </div>
      </section>

      <!-- Ride Session -->
      <section id="ride-session" class="mb-20">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Ride Sessions</h1>
        <p class="text-base text-gray-500 leading-relaxed mb-8">
          Ride Sessions provide a high-level API for ride-sharing workflows,
          managing the pickup and destination phases with automatic ETA updates.
        </p>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">
            Creating a Ride Session
          </h2>
          <div class="mb-3">
            <code
              class="font-mono text-sm text-black bg-accent/50 px-3 py-2 rounded-md inline-block"
              >nav.createRide(config: RideConfig): RideSession</code
            >
          </div>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-purple-400">const</span> ride = nav.<span class="text-blue-400">createRide</span>({
  <span class="text-cyan-300">pickup</span>: { <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.5600</span>, <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.2050</span> },
  <span class="text-cyan-300">destination</span>: { <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.6037</span>, <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.1870</span> },
  <span class="text-cyan-300">map</span>: map,

  <span class="text-cyan-300">onETAUpdate</span>: (route, phase) => {
    console.<span class="text-blue-400">log</span>(<span class="text-yellow-300">`ETA to <span class="text-cyan-300">${phase}</span>: <span class="text-cyan-300">${route.durationText}</span>`</span>)
  },

  <span class="text-cyan-300">onPhaseChange</span>: (phase) => {
    console.<span class="text-blue-400">log</span>(<span class="text-yellow-300">`Phase changed to: <span class="text-cyan-300">${phase}</span>`</span>)
  }
})</code></pre>
          </div>
        </div>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">
            Ride Lifecycle
          </h2>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-gray-500">// 1. Start pickup phase</span>
<span class="text-purple-400">await</span> ride.<span class="text-blue-400">startPickup</span>({ <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.5500</span>, <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.2100</span> })

<span class="text-gray-500">// 2. Update driver location as they move</span>
<span class="text-purple-400">await</span> ride.<span class="text-blue-400">updateDriverLocation</span>({ <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.5550</span>, <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.2080</span> })

<span class="text-gray-500">// 3. Start trip phase</span>
<span class="text-purple-400">await</span> ride.<span class="text-blue-400">startTrip</span>()

<span class="text-gray-500">// 4. Continue updating driver location</span>
<span class="text-purple-400">await</span> ride.<span class="text-blue-400">updateDriverLocation</span>({ <span class="text-cyan-300">lat</span>: <span class="text-orange-400">5.5800</span>, <span class="text-cyan-300">lng</span>: <span class="text-orange-400">-0.1950</span> })

<span class="text-gray-500">// 5. Complete the ride</span>
ride.<span class="text-blue-400">complete</span>()</code></pre>
          </div>
        </div>
      </section>

      <!-- Styling API -->
      <section id="styling-api" class="mb-20">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Map Styling</h1>
        <p class="text-base text-gray-500 leading-relaxed mb-8">
          Customize the appearance of your maps with built-in presets or custom
          styles.
        </p>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">
            Style Presets
          </h2>
          <p class="text-gray-500 text-sm mb-4">
            Navigatr includes five built-in style presets:
          </p>
          <div class="space-y-2 mb-4">
            <div
              class="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg"
            >
              <span class="font-mono text-sm text-accent min-w-24"
                >default</span
              >
              <span class="text-sm text-gray-500">Standard light mode</span>
            </div>
            <div
              class="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg"
            >
              <span class="font-mono text-sm text-accent min-w-24">dark</span>
              <span class="text-sm text-gray-500">Dark mode theme</span>
            </div>
            <div
              class="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg"
            >
              <span class="font-mono text-sm text-accent min-w-24"
                >satellite</span
              >
              <span class="text-sm text-gray-500">Satellite imagery</span>
            </div>
            <div
              class="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg"
            >
              <span class="font-mono text-sm text-accent min-w-24"
                >navigation</span
              >
              <span class="text-sm text-gray-500"
                >Optimized for turn-by-turn</span
              >
            </div>
            <div
              class="flex items-center gap-4 p-3 bg-white border border-gray-200 rounded-lg"
            >
              <span class="font-mono text-sm text-accent min-w-24"
                >minimal</span
              >
              <span class="text-sm text-gray-500"
                >Clean, minimalist design</span
              >
            </div>
          </div>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-gray-500">// Apply a preset with customizations</span>
nav.<span class="text-blue-400">setStyleFromPreset</span>(<span class="text-yellow-300">'dark'</span>, {
  <span class="text-cyan-300">polyline</span>: {
    <span class="text-cyan-300">color</span>: <span class="text-yellow-300">'#60a5fa'</span>,
    <span class="text-cyan-300">weight</span>: <span class="text-orange-400">6</span>
  }
})</code></pre>
          </div>
        </div>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">
            Custom Styles
          </h2>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100">nav.<span class="text-blue-400">setStyle</span>({
  <span class="text-cyan-300">theme</span>: <span class="text-yellow-300">'custom'</span>,
  <span class="text-cyan-300">colors</span>: {
    <span class="text-cyan-300">primary</span>: <span class="text-yellow-300">'#3b82f6'</span>,
    <span class="text-cyan-300">water</span>: <span class="text-yellow-300">'#0ea5e9'</span>,
    <span class="text-cyan-300">parks</span>: <span class="text-yellow-300">'#22c55e'</span>,
    <span class="text-cyan-300">roads</span>: <span class="text-yellow-300">'#94a3b8'</span>,
    <span class="text-cyan-300">buildings</span>: <span class="text-yellow-300">'#cbd5e1'</span>
  },
  <span class="text-cyan-300">polyline</span>: {
    <span class="text-cyan-300">color</span>: <span class="text-yellow-300">'#3b82f6'</span>,
    <span class="text-cyan-300">weight</span>: <span class="text-orange-400">5</span>,
    <span class="text-cyan-300">opacity</span>: <span class="text-orange-400">0.8</span>
  }
})</code></pre>
          </div>
        </div>
      </section>

      <!-- Types Reference -->
      <section id="types" class="mb-20">
        <h1 class="text-3xl font-bold text-gray-900 mb-4">Types Reference</h1>
        <p class="text-base text-gray-500 leading-relaxed mb-8">
          Complete TypeScript type definitions for the Navigatr SDK.
        </p>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">Core Types</h2>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-purple-400">interface</span> <span class="text-cyan-400">LatLng</span> {
  <span class="text-cyan-300">lat</span>: <span class="text-green-400">number</span>
  <span class="text-cyan-300">lng</span>: <span class="text-green-400">number</span>
}

<span class="text-purple-400">interface</span> <span class="text-cyan-400">RouteResult</span> {
  <span class="text-cyan-300">durationSeconds</span>: <span class="text-green-400">number</span>
  <span class="text-cyan-300">durationText</span>: <span class="text-green-400">string</span>
  <span class="text-cyan-300">distanceMeters</span>: <span class="text-green-400">number</span>
  <span class="text-cyan-300">distanceText</span>: <span class="text-green-400">string</span>
  <span class="text-cyan-300">polyline</span>: <span class="text-cyan-400">LatLng</span>[]
  <span class="text-cyan-300">maneuvers</span>?: <span class="text-cyan-400">Maneuver</span>[]
}

<span class="text-purple-400">interface</span> <span class="text-cyan-400">GeocodeResult</span> {
  <span class="text-cyan-300">lat</span>: <span class="text-green-400">number</span>
  <span class="text-cyan-300">lng</span>: <span class="text-green-400">number</span>
  <span class="text-cyan-300">displayName</span>: <span class="text-green-400">string</span>
}

<span class="text-purple-400">interface</span> <span class="text-cyan-400">AutocompleteResult</span> {
  <span class="text-cyan-300">lat</span>: <span class="text-green-400">number</span>
  <span class="text-cyan-300">lng</span>: <span class="text-green-400">number</span>
  <span class="text-cyan-300">displayName</span>: <span class="text-green-400">string</span>
  <span class="text-cyan-300">name</span>: <span class="text-green-400">string</span>
  <span class="text-cyan-300">city</span>?: <span class="text-green-400">string</span>
  <span class="text-cyan-300">country</span>?: <span class="text-green-400">string</span>
}</code></pre>
          </div>
        </div>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">Map Types</h2>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-purple-400">interface</span> <span class="text-cyan-400">MapConfig</span> {
  <span class="text-cyan-300">container</span>: <span class="text-green-400">string</span>
  <span class="text-cyan-300">center</span>: <span class="text-cyan-400">LatLng</span>
  <span class="text-cyan-300">zoom</span>?: <span class="text-green-400">number</span>
  <span class="text-cyan-300">pitch</span>?: <span class="text-green-400">number</span>
  <span class="text-cyan-300">bearing</span>?: <span class="text-green-400">number</span>
}

<span class="text-purple-400">interface</span> <span class="text-cyan-400">MarkerOptions</span> {
  <span class="text-cyan-300">lat</span>: <span class="text-green-400">number</span>
  <span class="text-cyan-300">lng</span>: <span class="text-green-400">number</span>
  <span class="text-cyan-300">label</span>?: <span class="text-green-400">string</span>
  <span class="text-cyan-300">draggable</span>?: <span class="text-green-400">boolean</span>
  <span class="text-cyan-300">onDragEnd</span>?: (location: <span class="text-cyan-400">LatLng</span>) => <span class="text-green-400">void</span>
}

<span class="text-purple-400">interface</span> <span class="text-cyan-400">RouteStyleOptions</span> {
  <span class="text-cyan-300">color</span>?: <span class="text-green-400">string</span>
  <span class="text-cyan-300">weight</span>?: <span class="text-green-400">number</span>
  <span class="text-cyan-300">opacity</span>?: <span class="text-green-400">number</span>
}</code></pre>
          </div>
        </div>

        <div class="mb-10">
          <h2 class="text-xl font-semibold text-gray-900 mb-3">
            Navigation Types
          </h2>
          <div
            class="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden"
          >
            <pre
              class="p-4 overflow-x-auto"
            ><code class="font-mono text-sm text-gray-100"><span class="text-purple-400">type</span> <span class="text-cyan-400">NavigationEvent</span> =
  | { <span class="text-cyan-300">type</span>: <span class="text-yellow-300">'turn_approaching'</span>; <span class="text-cyan-300">maneuver</span>: <span class="text-cyan-400">Maneuver</span>; <span class="text-cyan-300">distanceMeters</span>: <span class="text-green-400">number</span> }
  | { <span class="text-cyan-300">type</span>: <span class="text-yellow-300">'off_route'</span>; <span class="text-cyan-300">distanceMeters</span>: <span class="text-green-400">number</span> }
  | { <span class="text-cyan-300">type</span>: <span class="text-yellow-300">'arrived'</span> }
  | { <span class="text-cyan-300">type</span>: <span class="text-yellow-300">'navigation_started'</span> }
  | { <span class="text-cyan-300">type</span>: <span class="text-yellow-300">'navigation_stopped'</span> }

<span class="text-purple-400">type</span> <span class="text-cyan-400">RidePhase</span> = <span class="text-yellow-300">'waiting'</span> | <span class="text-yellow-300">'pickup'</span> | <span class="text-yellow-300">'in_progress'</span> | <span class="text-yellow-300">'completed'</span>

<span class="text-purple-400">interface</span> <span class="text-cyan-400">RideConfig</span> {
  <span class="text-cyan-300">pickup</span>: <span class="text-cyan-400">LatLng</span>
  <span class="text-cyan-300">destination</span>: <span class="text-cyan-400">LatLng</span>
  <span class="text-cyan-300">map</span>?: <span class="text-cyan-400">NavigatrMap</span>
  <span class="text-cyan-300">onETAUpdate</span>?: (eta: <span class="text-cyan-400">RouteResult</span>, phase: <span class="text-cyan-400">RidePhase</span>) => <span class="text-green-400">void</span>
  <span class="text-cyan-300">onPhaseChange</span>?: (phase: <span class="text-cyan-400">RidePhase</span>) => <span class="text-green-400">void</span>
}</code></pre>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>
