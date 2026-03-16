# @navigatr/web

Browser SDK for Navigatr with Leaflet map rendering and real-time tracking helpers. Zero API keys, zero cost.

## Installation

```bash
npm install @navigatr/web leaflet
```

Include Leaflet CSS in your HTML:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

## Basic Usage

```ts
import { Navigatr } from '@navigatr/web'

const nav = new Navigatr()

// Render map
const map = nav.map({ container: 'map', center: { lat: 5.6037, lng: -0.1870 } })

// Geocode both addresses
const origin = await nav.geocode({ address: 'Accra Mall, Ghana' })
const destination = await nav.geocode({ address: 'Kotoka Airport, Ghana' })

// Get route and draw it
const result = await nav.route({ origin, destination })
map.addMarker({ ...origin, label: 'Origin' })
map.addMarker({ ...destination, label: 'Destination' })
map.drawRoute(result.polyline)
map.fitRoute(result.polyline)

console.log(result.durationText) // "12 mins"
console.log(result.distanceText) // "3.2 km"
```

## Turn-by-Turn Directions

```ts
const route = await nav.route({
  origin,
  destination,
  maneuvers: true
})

route.maneuvers.forEach(step => {
  console.log(step.instruction) // "Turn left onto Main Street"
})
```

## Real-Time Driver Tracking

For ride-sharing apps, use the real-time helpers with your own backend (Firebase, Supabase, Socket.io, etc.):

```ts
import { Navigatr } from '@navigatr/web'

const nav = new Navigatr()
const map = nav.map({ container: 'map', center: riderLocation })

// Register callback for location updates
nav.onLocationUpdate((driverPos) => {
  // Update driver marker on map
  map.updateDriverMarker({ ...driverPos, icon: 'car' })
})

// Connect to your real-time backend
firebase.database().ref(`rides/${rideId}/driverLocation`).on('value', (snap) => {
  nav.pushLocationUpdate(snap.val())
})

// Recalculate ETA when driver moves
nav.onLocationUpdate(async (driverPos) => {
  const updated = await nav.recalculateETA(driverPos, destination)
  etaDisplay.textContent = updated.durationText

  // Update route line
  map.clearRoute()
  map.drawRoute(updated.polyline)
})
```

### Driver Icons

```ts
// Built-in icons: 'car', 'bike', 'walk', 'default'
map.updateDriverMarker({ lat, lng, icon: 'car', heading: 45 })
```

## API

### `Navigatr`

Extends `NavigatrCore` with map rendering and real-time capabilities.

#### `map({ container, center, zoom? }): NavigatrMap`

Creates a Leaflet map in the specified container element.

#### `onLocationUpdate(callback): () => void`

Register a callback for driver location updates. Returns an unsubscribe function.

#### `pushLocationUpdate(location: LatLng): void`

Push a new driver location (call this from your real-time backend listener).

#### `recalculateETA(currentLocation, destination, options?): Promise<RouteResult>`

Recalculate route and ETA from current position.

#### `getLastDriverLocation(): LatLng | null`

Get the last known driver location.

### `NavigatrMap`

#### `addMarker({ lat, lng, label? })`

Adds a marker with optional popup label.

#### `drawRoute(polyline: LatLng[])`

Draws a route polyline (#00FF94).

#### `fitRoute(polyline: LatLng[])`

Adjusts bounds to show the full route.

#### `clearRoute()`

Removes the current route.

#### `updateDriverMarker({ lat, lng, icon?, heading? })`

Add or update the driver marker position.

#### `removeDriverMarker()`

Remove the driver marker.

#### `panTo(location: LatLng)`

Pan the map to a location.

## License

MIT
