# API Reference

Complete API documentation for Navigatr.

## @navigatr/web

The browser SDK with map rendering and real-time tracking.

### Navigatr

Main class that extends `NavigatrCore` with map and ride-sharing features.

```ts
import { Navigatr } from '@navigatr/web'

const nav = new Navigatr(config?)
```

#### Constructor

| Parameter | Type | Description |
|-----------|------|-------------|
| `config` | `NavigatrConfig` | Optional configuration |

```ts
interface NavigatrConfig {
  valhallaUrl?: string   // Default: 'https://valhalla1.openstreetmap.de'
  nominatimUrl?: string  // Default: 'https://nominatim.openstreetmap.org'
  photonUrl?: string     // Default: 'https://photon.komoot.io'
}
```

#### Methods

##### `map(params): NavigatrMap`

Create a MapLibre GL map.

```ts
const map = nav.map({
  container: 'map-div-id',
  center: { lat: 5.6, lng: -0.2 },
  zoom: 13  // Optional, default: 13
})
```

##### `geocode(params): Promise<GeocodeResult>`

Convert address to coordinates.

```ts
const result = await nav.geocode({ address: 'Accra Mall, Ghana' })
// { lat: 5.6037, lng: -0.1870, displayName: '...' }
```

##### `reverseGeocode(params): Promise<GeocodeResult>`

Convert coordinates to address.

```ts
const result = await nav.reverseGeocode({ lat: 5.6037, lng: -0.1870 })
// { lat: 5.6037, lng: -0.1870, displayName: 'Accra Mall, ...' }
```

##### `autocomplete(params): Promise<AutocompleteResult[]>`

Search places as the user types.

```ts
const results = await nav.autocomplete({
  query: 'Accra Mall',
  limit: 5 // Optional, default: 5
})
```

##### `route(options): Promise<RouteResult>`

Calculate a route between two points.

```ts
const result = await nav.route({
  origin: { lat: 5.6, lng: -0.2 },
  destination: { lat: 5.5, lng: -0.1 },
  waypoints: [{ lat: 5.58, lng: -0.18 }],
  mode: 'walk',     // Optional: 'drive' | 'walk' | 'bike'
  maneuvers: true,  // Optional: include turn-by-turn
  traffic: true,    // Optional: consider traffic
  shortest: true    // Optional: prioritize shorter distance
})
```

`route()` may also return alternate routes in `result.alternates` when available from the routing provider.

##### `createRide(config): RideSession`

Create a ride session for ride-sharing apps.

```ts
const ride = nav.createRide({
  pickup: { lat: 5.6, lng: -0.2 },
  destination: { lat: 5.5, lng: -0.1 },
  map,  // Optional: auto-render
  onETAUpdate: (eta, phase) => { ... },
  onPhaseChange: (phase) => { ... },
  onDriverMove: (location) => { ... }
})
```

##### `onLocationUpdate(callback): () => void`

Register callback for driver location updates.

```ts
const unsubscribe = nav.onLocationUpdate((location) => {
  console.log('Driver at:', location)
})

// Later: unsubscribe()
```

##### `pushLocationUpdate(location): void`

Push driver location to callbacks.

```ts
nav.pushLocationUpdate({ lat: 5.6, lng: -0.2 })
```

##### `recalculateETA(current, destination, options?): Promise<RouteResult>`

Recalculate route from current position.

```ts
const updated = await nav.recalculateETA(
  driverPosition,
  destination,
  { traffic: true }
)
```

##### `getLastDriverLocation(): LatLng | null`

Get last known driver location.

---

### NavigatrMap

Map instance returned by `nav.map()`.

##### `addMarker(options): void`

```ts
map.addMarker({
  lat: 5.6,
  lng: -0.2,
  label: 'Pickup'  // Optional popup text
})
```

##### `drawRoute(polyline): void`

Draw route polyline (color: #00FF94).

```ts
map.drawRoute(route.polyline)
```

##### `fitRoute(polyline): void`

Fit map bounds to show entire route.

```ts
map.fitRoute(route.polyline)
```

##### `clearRoute(): void`

Remove current route from map.

##### `updateDriverMarker(options): void`

Add or update driver marker.

```ts
map.updateDriverMarker({
  lat: 5.6,
  lng: -0.2,
  icon: 'car',     // 'car' | 'bike' | 'walk' | 'default'
  heading: 45      // Optional rotation in degrees
})
```

##### `removeDriverMarker(): void`

Remove driver marker from map.

##### `panTo(location): void`

Pan map to location.

```ts
map.panTo({ lat: 5.6, lng: -0.2 })
```

---

### RideSession

Manages ride-sharing lifecycle. Created via `nav.createRide()`.

##### `getPhase(): RidePhase`

Get current phase: `'waiting'` | `'pickup'` | `'in_progress'` | `'completed'`

##### `getCurrentDestination(): LatLng`

Get current target (pickup location or final destination).

##### `getCurrentRoute(): RouteResult | null`

Get last calculated route.

##### `getDriverLocation(): LatLng | null`

Get last known driver position.

##### `updateDriverLocation(location): Promise<RouteResult | null>`

Update driver position and recalculate route.

```ts
await ride.updateDriverLocation({ lat: 5.6, lng: -0.2 })
```

##### `startPickup(driverLocation): Promise<RouteResult>`

Start pickup phase (driver en route to rider).

```ts
await ride.startPickup(driverInitialLocation)
```

##### `startTrip(): Promise<RouteResult>`

Start trip phase (rider picked up, en route to destination).

```ts
await ride.startTrip()
```

##### `complete(): void`

Mark ride as completed.

---

## @navigatr/core

Pure TypeScript SDK without map rendering.

### NavigatrCore

```ts
import { NavigatrCore } from '@navigatr/core'

const nav = new NavigatrCore(config?)
```

Same methods as `Navigatr` except `map()`, `createRide()`, and real-time helpers.

---

## Types

### LatLng

```ts
interface LatLng {
  lat: number
  lng: number
}
```

### GeocodeResult

```ts
interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
}
```

### RouteResult

```ts
interface RouteResult {
  durationSeconds: number
  durationText: string      // "12 mins"
  distanceMeters: number
  distanceText: string      // "3.2 km"
  polyline: LatLng[]
  maneuvers?: Maneuver[]    // If requested
  alternates?: AlternateRoute[]
}
```

### RouteOptions

```ts
interface RouteOptions {
  origin: LatLng
  destination: LatLng
  waypoints?: LatLng[]
  mode?: 'drive' | 'walk' | 'bike'
  maneuvers?: boolean
  traffic?: boolean
  shortest?: boolean
}
```

### AlternateRoute

```ts
interface AlternateRoute {
  durationSeconds: number
  durationText: string
  distanceMeters: number
  distanceText: string
  polyline: LatLng[]
}
```

### Maneuver

```ts
interface Maneuver {
  instruction: string       // "Turn left onto Main St"
  type: string              // "left", "right", etc.
  distanceMeters: number
  distanceText: string
  durationSeconds: number
  durationText: string
  startPoint: LatLng
}
```

### RideConfig

```ts
interface RideConfig {
  pickup: LatLng
  destination: LatLng
  map?: NavigatrMap
  onETAUpdate?: (eta: RouteResult, phase: RidePhase) => void
  onPhaseChange?: (phase: RidePhase) => void
  onDriverMove?: (location: LatLng) => void
}
```

### RidePhase

```ts
type RidePhase = 'waiting' | 'pickup' | 'in_progress' | 'completed'
```

### MapConfig

```ts
interface MapConfig {
  container: string    // DOM element ID
  center: LatLng
  zoom?: number        // Default: 13
  pitch?: number       // Optional initial tilt
  bearing?: number     // Optional initial rotation
}
```

### DriverMarkerOptions

```ts
interface DriverMarkerOptions {
  lat: number
  lng: number
  heading?: number                              // Rotation in degrees
  icon?: 'car' | 'bike' | 'walk' | 'default'
}
```
