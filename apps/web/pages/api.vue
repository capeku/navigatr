<script setup lang="ts">
const activeSection = ref('getting-started')

const sections = [
  { id: 'getting-started', label: 'Getting Started' },
  { id: 'core-api', label: 'Core API' },
  { id: 'map-api', label: 'Map API' },
  { id: 'navigation-api', label: 'Navigation' },
  { id: 'ride-session', label: 'Ride Sessions' },
  { id: 'styling-api', label: 'Map Styling' },
  { id: 'types', label: 'Types Reference' }
]

function scrollToSection(id: string) {
  activeSection.value = id
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

onMounted(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      })
    },
    { rootMargin: '-100px 0px -80% 0px' }
  )

  sections.forEach(({ id }) => {
    const el = document.getElementById(id)
    if (el) observer.observe(el)
  })

  return () => observer.disconnect()
})
</script>

<template>
  <div class="docs-page">
    <header class="docs-header">
      <div class="header-left">
        <NuxtLink to="/" class="logo-link">
          <span class="logo">Navigatr</span>
        </NuxtLink>
        <span class="divider">/</span>
        <span class="page-title">API Documentation</span>
      </div>
      <div class="header-right">
        <NuxtLink to="/docs" class="header-link">Sandbox</NuxtLink>
        <a href="https://github.com/anthropics/navigatr" target="_blank" class="github-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
          GitHub
        </a>
      </div>
    </header>

    <div class="docs-layout">
      <nav class="docs-nav">
        <div class="nav-section">
          <button
            v-for="section in sections"
            :key="section.id"
            class="nav-item"
            :class="{ active: activeSection === section.id }"
            @click="scrollToSection(section.id)"
          >
            {{ section.label }}
          </button>
        </div>
      </nav>

      <main class="docs-content">
        <!-- Getting Started -->
        <section id="getting-started" class="doc-section">
          <h1>Getting Started</h1>
          <p class="section-intro">
            Navigatr is an open-source navigation SDK that provides routing, geocoding, and interactive maps
            without requiring API keys. It's built on top of OpenStreetMap data and free routing services.
          </p>

          <div class="subsection">
            <h2>Installation</h2>
            <div class="code-block">
              <pre><code>npm install @navigatr/web</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>Quick Start</h2>
            <div class="code-block">
              <pre><code>import { Navigatr } from '@navigatr/web'

// Initialize the SDK
const nav = new Navigatr()

// Create a map
const map = nav.map({
  container: 'map',
  center: { lat: 5.6037, lng: -0.1870 },
  zoom: 12
})

// Calculate a route
const route = await nav.route({
  origin: { lat: 5.5600, lng: -0.2050 },
  destination: { lat: 5.6037, lng: -0.1870 }
})

// Draw the route on the map
map.drawRoute(route.polyline)
map.fitRoute(route.polyline)

console.log(`Duration: ${route.durationText}`)
console.log(`Distance: ${route.distanceText}`)</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>Features</h2>
            <ul class="feature-list">
              <li><strong>Routing</strong> - Turn-by-turn directions powered by Valhalla</li>
              <li><strong>Geocoding</strong> - Address search and reverse geocoding via Nominatim</li>
              <li><strong>Autocomplete</strong> - Location search suggestions with Photon</li>
              <li><strong>Interactive Maps</strong> - MapLibre GL JS maps with OpenStreetMap tiles</li>
              <li><strong>Navigation</strong> - Real-time navigation with camera following</li>
              <li><strong>Ride Sessions</strong> - Built-in ride-sharing workflow support</li>
              <li><strong>Map Styling</strong> - Customizable map themes and route styles</li>
            </ul>
          </div>
        </section>

        <!-- Core API -->
        <section id="core-api" class="doc-section">
          <h1>Core API</h1>
          <p class="section-intro">
            The core API provides routing, geocoding, and autocomplete functionality.
          </p>

          <div class="subsection">
            <h2>Constructor</h2>
            <div class="method-signature">
              <code>new Navigatr(config?: NavigatrConfig)</code>
            </div>
            <p>Creates a new Navigatr instance with optional configuration.</p>
            <div class="code-block">
              <pre><code>// Default configuration (uses public services)
const nav = new Navigatr()

// Custom service URLs
const nav = new Navigatr({
  valhallaUrl: 'https://your-valhalla-server.com',
  nominatimUrl: 'https://your-nominatim-server.com',
  photonUrl: 'https://your-photon-server.com'
})</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>route()</h2>
            <div class="method-signature">
              <code>nav.route(options: RouteOptions): Promise&lt;RouteResult&gt;</code>
            </div>
            <p>Calculates a route between two points with optional turn-by-turn instructions.</p>
            <div class="params-table">
              <table>
                <thead>
                  <tr>
                    <th>Parameter</th>
                    <th>Type</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>origin</code></td>
                    <td>LatLng</td>
                    <td>Starting point coordinates</td>
                  </tr>
                  <tr>
                    <td><code>destination</code></td>
                    <td>LatLng</td>
                    <td>Ending point coordinates</td>
                  </tr>
                  <tr>
                    <td><code>maneuvers</code></td>
                    <td>boolean</td>
                    <td>Include turn-by-turn instructions (default: false)</td>
                  </tr>
                  <tr>
                    <td><code>traffic</code></td>
                    <td>boolean</td>
                    <td>Consider traffic conditions (default: false)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="code-block">
              <pre><code>const route = await nav.route({
  origin: { lat: 5.5600, lng: -0.2050 },
  destination: { lat: 5.6037, lng: -0.1870 },
  maneuvers: true
})

console.log(route.durationText)  // "15 mins"
console.log(route.distanceText)  // "8.2 km"
console.log(route.polyline)      // Array of LatLng points
console.log(route.maneuvers)     // Turn-by-turn instructions</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>geocode()</h2>
            <div class="method-signature">
              <code>nav.geocode(params: { address: string }): Promise&lt;GeocodeResult&gt;</code>
            </div>
            <p>Converts an address string to geographic coordinates.</p>
            <div class="code-block">
              <pre><code>const result = await nav.geocode({
  address: 'Accra Mall, Ghana'
})

console.log(result.lat)          // 5.6357
console.log(result.lng)          // -0.1764
console.log(result.displayName)  // "Accra Mall, Spintex Road, Accra"</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>reverseGeocode()</h2>
            <div class="method-signature">
              <code>nav.reverseGeocode(params: { lat: number, lng: number }): Promise&lt;GeocodeResult&gt;</code>
            </div>
            <p>Converts coordinates to a human-readable address.</p>
            <div class="code-block">
              <pre><code>const result = await nav.reverseGeocode({
  lat: 5.6037,
  lng: -0.1870
})

console.log(result.displayName)  // "Independence Square, Accra, Ghana"</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>autocomplete()</h2>
            <div class="method-signature">
              <code>nav.autocomplete(params: { query: string, limit?: number }): Promise&lt;AutocompleteResult[]&gt;</code>
            </div>
            <p>Returns location suggestions for a search query.</p>
            <div class="code-block">
              <pre><code>const results = await nav.autocomplete({
  query: 'Accra',
  limit: 5
})

results.forEach(result => {
  console.log(result.name)         // "Accra Mall"
  console.log(result.displayName)  // "Accra Mall, Spintex Road, Accra, Ghana"
  console.log(result.city)         // "Accra"
  console.log(result.country)      // "Ghana"
})</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>recalculateETA()</h2>
            <div class="method-signature">
              <code>nav.recalculateETA(currentLocation: LatLng, destination: LatLng, options?: { traffic?: boolean }): Promise&lt;RouteResult&gt;</code>
            </div>
            <p>Quickly recalculates ETA from current position to destination.</p>
            <div class="code-block">
              <pre><code>const updated = await nav.recalculateETA(
  { lat: 5.5800, lng: -0.1950 },  // Current location
  { lat: 5.6037, lng: -0.1870 }   // Destination
)

console.log(updated.durationText)  // "8 mins"</code></pre>
            </div>
          </div>
        </section>

        <!-- Map API -->
        <section id="map-api" class="doc-section">
          <h1>Map API</h1>
          <p class="section-intro">
            The Map API provides methods for creating interactive maps, adding markers, and visualizing routes.
          </p>

          <div class="subsection">
            <h2>Creating a Map</h2>
            <div class="method-signature">
              <code>nav.map(config: MapConfig): NavigatrMap</code>
            </div>
            <div class="code-block">
              <pre><code>const map = nav.map({
  container: 'map-container',  // DOM element ID
  center: { lat: 5.6037, lng: -0.1870 },
  zoom: 12,
  pitch: 0,      // Camera tilt (0-60)
  bearing: 0     // Camera rotation (0-360)
})</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>addMarker()</h2>
            <div class="method-signature">
              <code>map.addMarker(options: MarkerOptions): NavigatrMarker</code>
            </div>
            <p>Adds a marker to the map. Markers can be draggable with callbacks.</p>
            <div class="code-block">
              <pre><code>// Simple marker
const marker = map.addMarker({
  lat: 5.6037,
  lng: -0.1870,
  label: 'Pickup Location'
})

// Draggable marker with callback
const draggableMarker = map.addMarker({
  lat: 5.6037,
  lng: -0.1870,
  label: 'Drag to adjust',
  draggable: true,
  onDragEnd: (location) => {
    console.log('New position:', location)
  }
})

// Update marker position
marker.setLatLng({ lat: 5.6100, lng: -0.1800 })

// Remove marker
marker.remove()</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>drawRoute()</h2>
            <div class="method-signature">
              <code>map.drawRoute(polyline: LatLng[], style?: RouteStyleOptions): void</code>
            </div>
            <p>Draws a route polyline on the map with optional styling.</p>
            <div class="code-block">
              <pre><code>// Draw with default styling
map.drawRoute(route.polyline)

// Draw with custom styling
map.drawRoute(route.polyline, {
  color: '#3b82f6',   // Blue
  weight: 6,          // Thicker line
  opacity: 0.8
})</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>fitRoute()</h2>
            <div class="method-signature">
              <code>map.fitRoute(polyline: LatLng[]): void</code>
            </div>
            <p>Automatically adjusts the map view to show the entire route.</p>
            <div class="code-block">
              <pre><code>map.fitRoute(route.polyline)</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>clearRoute()</h2>
            <div class="method-signature">
              <code>map.clearRoute(): void</code>
            </div>
            <p>Removes the route from the map.</p>
          </div>

          <div class="subsection">
            <h2>updateDriverMarker()</h2>
            <div class="method-signature">
              <code>map.updateDriverMarker(options: DriverMarkerOptions): void</code>
            </div>
            <p>Creates or updates a driver marker with directional heading.</p>
            <div class="code-block">
              <pre><code>map.updateDriverMarker({
  lat: 5.6037,
  lng: -0.1870,
  heading: 45,           // Rotation in degrees
  icon: 'car'            // 'car' | 'bike' | 'walk' | 'default'
})</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>panTo()</h2>
            <div class="method-signature">
              <code>map.panTo(location: LatLng): void</code>
            </div>
            <p>Smoothly pans the camera to a location.</p>
          </div>

          <div class="subsection">
            <h2>onClick()</h2>
            <div class="method-signature">
              <code>map.onClick(callback: (location: LatLng) =&gt; void): () =&gt; void</code>
            </div>
            <p>Registers a click handler. Returns an unsubscribe function.</p>
            <div class="code-block">
              <pre><code>const unsubscribe = map.onClick((location) => {
  console.log('Clicked at:', location)
  map.addMarker({ ...location, label: 'Selected' })
})

// Later: stop listening
unsubscribe()</code></pre>
            </div>
          </div>
        </section>

        <!-- Navigation API -->
        <section id="navigation-api" class="doc-section">
          <h1>Navigation API</h1>
          <p class="section-intro">
            The Navigation API provides turn-by-turn navigation with automatic camera following,
            route snapping, and navigation events.
          </p>

          <div class="subsection">
            <h2>startNavigation()</h2>
            <div class="method-signature">
              <code>map.startNavigation(route: RouteResult): void</code>
            </div>
            <p>
              Starts navigation mode. The camera enters a 3D perspective view and follows
              the driver marker along the route.
            </p>
            <div class="code-block">
              <pre><code>const route = await nav.route({
  origin: { lat: 5.5600, lng: -0.2050 },
  destination: { lat: 5.6037, lng: -0.1870 },
  maneuvers: true
})

map.startNavigation(route)</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>updatePosition()</h2>
            <div class="method-signature">
              <code>map.updatePosition(position: LatLng): void</code>
            </div>
            <p>
              Updates the current position during navigation. This method automatically:
            </p>
            <ul class="feature-list">
              <li>Snaps to the nearest point on the route</li>
              <li>Updates the driver marker with correct heading</li>
              <li>Animates the camera to follow</li>
              <li>Greys out the traveled portion of the route</li>
              <li>Emits navigation events (turn approaching, off-route, arrived)</li>
              <li>Adjusts zoom when approaching turns</li>
            </ul>
            <div class="code-block">
              <pre><code>// Simulate GPS updates
setInterval(() => {
  const currentPos = getCurrentGPSPosition()
  map.updatePosition(currentPos)
}, 1000)</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>stopNavigation()</h2>
            <div class="method-signature">
              <code>map.stopNavigation(): void</code>
            </div>
            <p>Stops navigation mode and resets the camera to a top-down view.</p>
          </div>

          <div class="subsection">
            <h2>onNavigationEvent()</h2>
            <div class="method-signature">
              <code>map.onNavigationEvent(callback: NavigationEventCallback): () =&gt; void</code>
            </div>
            <p>Listens for navigation events. Returns an unsubscribe function.</p>
            <div class="code-block">
              <pre><code>const unsubscribe = map.onNavigationEvent((event) => {
  switch (event.type) {
    case 'navigation_started':
      console.log('Navigation started')
      break

    case 'turn_approaching':
      console.log(`In ${event.distanceMeters}m: ${event.maneuver.instruction}`)
      // e.g., "In 200m: Turn right onto Main Street"
      break

    case 'off_route':
      console.log(`Off route by ${event.distanceMeters}m`)
      // Trigger route recalculation
      break

    case 'arrived':
      console.log('You have arrived!')
      break

    case 'navigation_stopped':
      console.log('Navigation ended')
      break
  }
})</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>updateTraveledRoute()</h2>
            <div class="method-signature">
              <code>map.updateTraveledRoute(polyline: LatLng[], currentIndex: number): void</code>
            </div>
            <p>Manually update the traveled portion of the route (greys out passed sections).</p>
            <div class="code-block">
              <pre><code>// Grey out the first 50 points of the route
map.updateTraveledRoute(route.polyline, 50)</code></pre>
            </div>
          </div>
        </section>

        <!-- Ride Session -->
        <section id="ride-session" class="doc-section">
          <h1>Ride Sessions</h1>
          <p class="section-intro">
            Ride Sessions provide a high-level API for ride-sharing workflows, managing
            the pickup and destination phases with automatic ETA updates.
          </p>

          <div class="subsection">
            <h2>Creating a Ride Session</h2>
            <div class="method-signature">
              <code>nav.createRide(config: RideConfig): RideSession</code>
            </div>
            <div class="code-block">
              <pre><code>const ride = nav.createRide({
  pickup: { lat: 5.5600, lng: -0.2050 },
  destination: { lat: 5.6037, lng: -0.1870 },
  map: map,  // Optional: auto-updates map

  onETAUpdate: (route, phase) => {
    console.log(`ETA to ${phase}: ${route.durationText}`)
  },

  onPhaseChange: (phase) => {
    console.log(`Phase changed to: ${phase}`)
    // 'waiting' | 'pickup' | 'in_progress' | 'completed'
  },

  onDriverMove: (location) => {
    console.log('Driver at:', location)
  }
})</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>Ride Lifecycle</h2>
            <div class="code-block">
              <pre><code>// 1. Start pickup phase (driver heading to pickup)
await ride.startPickup({ lat: 5.5500, lng: -0.2100 })

// 2. Update driver location as they move
await ride.updateDriverLocation({ lat: 5.5550, lng: -0.2080 })
// This recalculates ETA and triggers onETAUpdate

// 3. Start trip phase (driver heading to destination)
await ride.startTrip()

// 4. Continue updating driver location
await ride.updateDriverLocation({ lat: 5.5800, lng: -0.1950 })

// 5. Complete the ride
ride.complete()</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>RideSession Methods</h2>
            <div class="params-table">
              <table>
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><code>getPhase()</code></td>
                    <td>Returns current phase: 'waiting' | 'pickup' | 'in_progress' | 'completed'</td>
                  </tr>
                  <tr>
                    <td><code>getCurrentDestination()</code></td>
                    <td>Returns current target (pickup or final destination)</td>
                  </tr>
                  <tr>
                    <td><code>getCurrentRoute()</code></td>
                    <td>Returns the last calculated route</td>
                  </tr>
                  <tr>
                    <td><code>getDriverLocation()</code></td>
                    <td>Returns last known driver position</td>
                  </tr>
                  <tr>
                    <td><code>startPickup(driverLocation)</code></td>
                    <td>Begin pickup phase with driver's starting location</td>
                  </tr>
                  <tr>
                    <td><code>startTrip()</code></td>
                    <td>Transition to destination phase</td>
                  </tr>
                  <tr>
                    <td><code>updateDriverLocation(location)</code></td>
                    <td>Update position and recalculate ETA</td>
                  </tr>
                  <tr>
                    <td><code>complete()</code></td>
                    <td>Mark ride as completed</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <!-- Styling API -->
        <section id="styling-api" class="doc-section">
          <h1>Map Styling</h1>
          <p class="section-intro">
            Customize the appearance of your maps with built-in presets or custom styles.
          </p>

          <div class="subsection">
            <h2>Style Presets</h2>
            <p>Navigatr includes five built-in style presets:</p>
            <div class="preset-list">
              <div class="preset-item">
                <span class="preset-name">default</span>
                <span class="preset-desc">Standard light mode</span>
              </div>
              <div class="preset-item">
                <span class="preset-name">dark</span>
                <span class="preset-desc">Dark mode theme</span>
              </div>
              <div class="preset-item">
                <span class="preset-name">satellite</span>
                <span class="preset-desc">Satellite imagery</span>
              </div>
              <div class="preset-item">
                <span class="preset-name">navigation</span>
                <span class="preset-desc">Optimized for turn-by-turn</span>
              </div>
              <div class="preset-item">
                <span class="preset-name">minimal</span>
                <span class="preset-desc">Clean, minimalist design</span>
              </div>
            </div>
            <div class="code-block">
              <pre><code>// Get all presets
const presets = nav.getStylePresets()

// Apply a preset with customizations
nav.setStyleFromPreset('dark', {
  polyline: {
    color: '#60a5fa',
    weight: 6
  }
})</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>Custom Styles</h2>
            <div class="code-block">
              <pre><code>nav.setStyle({
  theme: 'custom',
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
})</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>CSS Variables Export</h2>
            <p>Export your style as CSS custom properties for web integration:</p>
            <div class="code-block">
              <pre><code>const cssVars = nav.getStyleAsCSSVariables('map')
// Returns:
// {
//   '--map-primary': '#3b82f6',
//   '--map-water': '#0ea5e9',
//   '--map-polyline-color': '#3b82f6',
//   ...
// }</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>Style Validation</h2>
            <div class="code-block">
              <pre><code>const result = nav.validateStyle({
  polyline: { weight: 100 }  // Invalid: max is 50
})

if (!result.valid) {
  console.log(result.errors)
  // ["polyline.weight must be between 0 and 50"]
}</code></pre>
            </div>
          </div>
        </section>

        <!-- Types Reference -->
        <section id="types" class="doc-section">
          <h1>Types Reference</h1>
          <p class="section-intro">
            Complete TypeScript type definitions for the Navigatr SDK.
          </p>

          <div class="subsection">
            <h2>Core Types</h2>
            <div class="code-block">
              <pre><code>interface LatLng {
  lat: number
  lng: number
}

interface RouteOptions {
  origin: LatLng
  destination: LatLng
  maneuvers?: boolean
  traffic?: boolean
}

interface RouteResult {
  durationSeconds: number
  durationText: string        // "10 mins" or "1 hr 5 mins"
  distanceMeters: number
  distanceText: string        // "3.2 km" or "800 m"
  polyline: LatLng[]
  maneuvers?: Maneuver[]
}

interface Maneuver {
  instruction: string
  type: string                // "right", "left", "straight", etc.
  distanceMeters: number
  distanceText: string
  durationSeconds: number
  durationText: string
  startPoint: LatLng
}

interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
}

interface AutocompleteResult {
  lat: number
  lng: number
  displayName: string
  name: string
  city?: string
  state?: string
  country?: string
  street?: string
  postcode?: string
}</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>Map Types</h2>
            <div class="code-block">
              <pre><code>interface MapConfig {
  container: string
  center: LatLng
  zoom?: number               // Default: 13
  pitch?: number              // Default: 0 (0-60)
  bearing?: number            // Default: 0 (0-360)
}

interface MarkerOptions {
  lat: number
  lng: number
  label?: string
  draggable?: boolean
  onDragEnd?: (location: LatLng) => void
}

interface DriverMarkerOptions {
  lat: number
  lng: number
  heading?: number
  icon?: 'car' | 'bike' | 'walk' | 'default'
}

interface RouteStyleOptions {
  color?: string
  weight?: number
  opacity?: number
}

interface NavigatrMarker {
  setLatLng(location: LatLng): void
  remove(): void
}</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>Navigation Types</h2>
            <div class="code-block">
              <pre><code>type NavigationEvent =
  | { type: 'turn_approaching'; maneuver: Maneuver; distanceMeters: number }
  | { type: 'off_route'; distanceMeters: number }
  | { type: 'arrived' }
  | { type: 'navigation_started' }
  | { type: 'navigation_stopped' }

type NavigationEventCallback = (event: NavigationEvent) => void</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>Ride Session Types</h2>
            <div class="code-block">
              <pre><code>type RidePhase = 'waiting' | 'pickup' | 'in_progress' | 'completed'

interface RideConfig {
  pickup: LatLng
  destination: LatLng
  map?: NavigatrMap
  onETAUpdate?: (eta: RouteResult, phase: RidePhase) => void
  onPhaseChange?: (phase: RidePhase) => void
  onDriverMove?: (location: LatLng) => void
}</code></pre>
            </div>
          </div>

          <div class="subsection">
            <h2>Style Types</h2>
            <div class="code-block">
              <pre><code>type MapTheme = 'light' | 'dark' | 'satellite' | 'terrain' | 'custom'

interface MapStyle {
  id?: string
  name?: string
  theme?: MapTheme
  colors?: {
    primary?: string
    secondary?: string
    background?: string
    roads?: string
    water?: string
    parks?: string
    buildings?: string
    labels?: string
  }
  layers?: {
    roads?: boolean
    labels?: boolean
    buildings?: boolean
    water?: boolean
    parks?: boolean
    terrain?: boolean
    traffic?: boolean
    transit?: boolean
  }
  markers?: {
    iconUrl?: string
    iconSize?: [number, number]
    iconAnchor?: [number, number]
    color?: string
    scale?: number
  }
  polyline?: {
    color?: string
    weight?: number
    opacity?: number
    dashArray?: string
    lineCap?: 'butt' | 'round' | 'square'
    lineJoin?: 'miter' | 'round' | 'bevel'
  }
}

interface NavigatrConfig {
  valhallaUrl?: string
  nominatimUrl?: string
  photonUrl?: string
}</code></pre>
            </div>
          </div>
        </section>
      </main>
    </div>
  </div>
</template>

<style scoped>
.docs-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg);
}

.docs-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--card-bg);
  position: sticky;
  top: 0;
  z-index: 100;
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

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-link {
  color: var(--text-muted);
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.header-link:hover {
  color: var(--accent);
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

.docs-layout {
  display: flex;
  flex: 1;
}

.docs-nav {
  width: 220px;
  padding: 24px;
  border-right: 1px solid var(--border);
  position: sticky;
  top: 57px;
  height: calc(100vh - 57px);
  overflow-y: auto;
}

.nav-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  padding: 10px 14px;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: var(--text-muted);
  font-size: 14px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
}

.nav-item.active {
  background: rgba(0, 255, 148, 0.1);
  color: var(--accent);
}

.docs-content {
  flex: 1;
  padding: 48px;
  max-width: 900px;
}

.doc-section {
  margin-bottom: 80px;
}

.doc-section h1 {
  font-size: 32px;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 16px;
}

.section-intro {
  font-size: 16px;
  color: var(--text-muted);
  line-height: 1.7;
  margin-bottom: 32px;
}

.subsection {
  margin-bottom: 40px;
}

.subsection h2 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 12px;
}

.subsection p {
  font-size: 15px;
  color: var(--text-muted);
  line-height: 1.6;
  margin-bottom: 16px;
}

.method-signature {
  margin-bottom: 12px;
}

.method-signature code {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 15px;
  color: var(--accent);
  background: rgba(0, 255, 148, 0.1);
  padding: 8px 14px;
  border-radius: 6px;
  display: inline-block;
}

.code-block {
  background: #0a0a0f;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.code-block pre {
  margin: 0;
  padding: 16px 20px;
  overflow-x: auto;
}

.code-block code {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: var(--text);
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.feature-list li {
  position: relative;
  padding: 8px 0 8px 24px;
  font-size: 15px;
  color: var(--text-muted);
  line-height: 1.5;
}

.feature-list li::before {
  content: '';
  position: absolute;
  left: 0;
  top: 14px;
  width: 8px;
  height: 8px;
  background: var(--accent);
  border-radius: 50%;
}

.feature-list li strong {
  color: var(--text);
}

.params-table {
  margin: 16px 0;
  overflow-x: auto;
}

.params-table table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.params-table th,
.params-table td {
  padding: 12px 16px;
  text-align: left;
  border-bottom: 1px solid var(--border);
}

.params-table th {
  background: var(--card-bg);
  color: var(--text-muted);
  font-weight: 600;
  font-size: 12px;
  text-transform: uppercase;
}

.params-table td {
  color: var(--text);
}

.params-table td code {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 13px;
  color: var(--accent);
  background: rgba(0, 255, 148, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

.preset-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 16px 0;
}

.preset-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
}

.preset-name {
  font-family: 'IBM Plex Mono', monospace;
  font-size: 14px;
  color: var(--accent);
  min-width: 100px;
}

.preset-desc {
  font-size: 14px;
  color: var(--text-muted);
}

@media (max-width: 900px) {
  .docs-nav {
    display: none;
  }

  .docs-content {
    padding: 32px 24px;
  }
}
</style>
