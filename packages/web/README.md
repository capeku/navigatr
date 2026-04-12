# @navigatr/web

Browser SDK for maps, routing, and navigation with MapLibre GL JS - the open source alternative to Google Maps. No API keys required.

## Installation

```bash
npm install @navigatr/web
```

CSS is automatically injected - no external stylesheet needed.

## Basic Usage

```ts
import { Navigatr } from '@navigatr/web'

const nav = new Navigatr()

// Render map
const map = nav.map({ container: 'map', center: { lat: 5.6037, lng: -0.1870 } })

// Geocode addresses
const origin = await nav.geocode({ address: 'Accra Mall, Ghana' })
const destination = await nav.geocode({ address: 'Kotoka Airport, Ghana' })

// Get route and draw it
const result = await nav.route({ origin, destination, mode: 'drive' })
map.addMarker({ ...origin, label: 'Origin' })
map.addMarker({ ...destination, label: 'Destination' })
map.drawRoute(result.polyline)
map.fitRoute(result.polyline)

console.log(result.durationText) // "12 mins"
console.log(result.distanceText) // "3.2 km"
```

## Travel Modes

```ts
const walkRoute = await nav.route({
  origin,
  destination,
  mode: 'walk'
})

const bikeRoute = await nav.route({
  origin,
  destination,
  mode: 'bike'
})
```

## Fallback URLs

```ts
const nav = new Navigatr({
  nominatimUrl: 'https://primary-nominatim.example.com',
  nominatimFallbackUrls: ['https://backup-nominatim.example.com'],
  photonUrl: 'https://primary-photon.example.com',
  photonFallbackUrls: ['https://backup-photon.example.com']
})
```

Geocoding, reverse geocoding, and autocomplete will try the primary service first, then each fallback in order.

## Ride-Sharing Apps

Use `RideSession` for complete ride lifecycle management:

```ts
import { Navigatr } from '@navigatr/web'

const nav = new Navigatr()
const map = nav.map({ container: 'map', center: riderLocation })

// 1. Geocode destination once when ride is requested
const destination = await nav.geocode({ address: 'Airport' })

// 2. Create ride session
const ride = nav.createRide({
  pickup: riderGPSLocation,
  destination,
  map,
  onETAUpdate: (eta, phase) => {
    showETA(eta.durationText)
  }
})

// 3. Start tracking when driver accepts
await ride.startPickup(driverLocation)

// 4. Connect real-time updates (your backend)
websocket.on('driver-location', (pos) => {
  ride.updateDriverLocation(pos)
})

// 5. Phase transitions
await ride.startTrip()  // Driver picked up rider
ride.complete()          // Arrived
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
  console.log(step.type)        // "left"
})
```

## Real-Time Tracking (Manual)

For custom real-time implementations:

```ts
// Register callback for location updates
nav.onLocationUpdate(async (driverPos) => {
  map.updateDriverMarker({ ...driverPos, icon: 'car' })

  const updated = await nav.recalculateETA(driverPos, destination)
  etaDisplay.textContent = updated.durationText

  map.clearRoute()
  map.drawRoute(updated.polyline)
})

// Connect to your backend
firebase.database().ref(`rides/${rideId}/driverLocation`).on('value', (snap) => {
  nav.pushLocationUpdate(snap.val())
})
```

## API

### Navigatr

| Method | Description |
|--------|-------------|
| `map(config)` | Create a MapLibre GL map |
| `geocode({ address })` | Convert address to coordinates |
| `reverseGeocode({ lat, lng })` | Convert coordinates to address |
| `route(options)` | Calculate route between points |
| `createRide(config)` | Create ride session for ride-sharing |
| `onLocationUpdate(callback)` | Register location update callback |
| `pushLocationUpdate(location)` | Push driver location to callbacks |
| `recalculateETA(current, dest)` | Recalculate route from position |

### NavigatrMap

| Method | Description |
|--------|-------------|
| `addMarker({ lat, lng, label? })` | Add marker with optional popup |
| `drawRoute(polyline)` | Draw route line (#00FF94) |
| `fitRoute(polyline)` | Fit map to show route |
| `clearRoute()` | Remove route from map |
| `updateDriverMarker(options)` | Add/update driver marker |
| `removeDriverMarker()` | Remove driver marker |
| `panTo(location)` | Pan map to location |

### RideSession

| Method | Description |
|--------|-------------|
| `startPickup(driverLocation)` | Start pickup phase |
| `startTrip()` | Start trip phase |
| `complete()` | Mark ride complete |
| `updateDriverLocation(pos)` | Update driver position |
| `getPhase()` | Get current phase |
| `getCurrentRoute()` | Get last calculated route |

## Documentation

- [Basic Usage](../../docs/basic-usage.md)
- [Ride-Sharing Guide](../../docs/ride-sharing.md)
- [API Reference](../../docs/api-reference.md)

## License

MIT
