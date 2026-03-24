# Basic Usage

This guide covers the fundamentals of using Navigatr for routing and geocoding.

## Installation

```bash
npm install @navigatr/web leaflet
```

Add Leaflet CSS to your HTML:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

## Creating a Map

```ts
import { Navigatr } from '@navigatr/web'

const nav = new Navigatr()

// Create a map centered on a location
const map = nav.map({
  container: 'map',           // ID of your div element
  center: { lat: 5.6037, lng: -0.1870 },
  zoom: 13                    // Optional, defaults to 13
})
```

## Geocoding

Convert addresses to coordinates:

```ts
// Forward geocoding (address → coordinates)
const location = await nav.geocode({ address: 'Accra Mall, Ghana' })
console.log(location)
// { lat: 5.6037, lng: -0.1870, displayName: 'Accra Mall, ...' }

// Reverse geocoding (coordinates → address)
const address = await nav.reverseGeocode({ lat: 5.6037, lng: -0.1870 })
console.log(address.displayName)
// "Accra Mall, Spintex Road, ..."
```

## Routing

Get directions between two points:

```ts
const route = await nav.route({
  origin: { lat: 5.6037, lng: -0.1870 },
  destination: { lat: 5.5913, lng: -0.1870 }
})

console.log(route.durationText)   // "12 mins"
console.log(route.distanceText)   // "3.2 km"
console.log(route.durationSeconds) // 720
console.log(route.distanceMeters)  // 3200
console.log(route.polyline)        // Array of {lat, lng} for drawing
```

## Multi-Stop Routing

Add stopovers between the start and end points:

```ts
const route = await nav.route({
  origin,
  destination,
  waypoints: [
    { lat: 5.6111, lng: -0.1815 } // 37 Military Hospital
  ]
})
```

## Drawing Routes

```ts
// Draw the route on the map
map.drawRoute(route.polyline)

// Fit the map to show the entire route
map.fitRoute(route.polyline)

// Add markers for origin and destination
map.addMarker({ lat: 5.6037, lng: -0.1870, label: 'Start' })
map.addMarker({ lat: 5.5913, lng: -0.1870, label: 'End' })

// Clear the route
map.clearRoute()
```

## Turn-by-Turn Directions

Get step-by-step navigation instructions:

```ts
const route = await nav.route({
  origin,
  destination,
  maneuvers: true  // Enable turn-by-turn
})

route.maneuvers.forEach(step => {
  console.log(step.instruction)   // "Turn left onto Main Street"
  console.log(step.type)          // "left", "right", "continue", etc.
  console.log(step.distanceText)  // "200 m"
  console.log(step.durationText)  // "1 min"
})
```

### Maneuver Types

| Type | Description |
|------|-------------|
| `start` | Begin route |
| `destination` | Arrive at destination |
| `continue` | Continue straight |
| `slight_right` | Bear right |
| `right` | Turn right |
| `sharp_right` | Sharp right turn |
| `slight_left` | Bear left |
| `left` | Turn left |
| `sharp_left` | Sharp left turn |
| `u_turn_right` | U-turn (right) |
| `u_turn_left` | U-turn (left) |
| `roundabout_enter` | Enter roundabout |
| `roundabout_exit` | Exit roundabout |
| `merge` | Merge onto road |
| `ramp_right` | Take ramp right |
| `ramp_left` | Take ramp left |

## Traffic-Aware Routing

Enable traffic consideration (when available):

```ts
const route = await nav.route({
  origin,
  destination,
  traffic: true
})
```

Note: Traffic data availability depends on the Valhalla instance. The public instance has limited traffic data.

## Error Handling

```ts
try {
  const location = await nav.geocode({ address: 'Invalid Address XYZ' })
} catch (error) {
  console.error('Geocoding failed:', error.message)
  // "No results found for address: Invalid Address XYZ"
}

try {
  const route = await nav.route({ origin, destination })
} catch (error) {
  console.error('Routing failed:', error.message)
  // "Valhalla routing failed: 400 Bad Request - ..."
}
```

## Core Package (No Maps)

If you only need routing/geocoding without map rendering:

```bash
npm install @navigatr/core
```

```ts
import { NavigatrCore } from '@navigatr/core'

const nav = new NavigatrCore()

const origin = await nav.geocode({ address: 'Accra Mall' })
const destination = await nav.geocode({ address: 'Airport' })
const route = await nav.route({ origin, destination })

// Use route.polyline with your own map library
```

## Custom API Endpoints

Use your own Valhalla/Nominatim instances:

```ts
const nav = new Navigatr({
  valhallaUrl: 'https://your-valhalla.example.com',
  nominatimUrl: 'https://your-nominatim.example.com'
})
```

## Next Steps

- [Building Ride-Sharing Apps](./ride-sharing.md) - Real-time tracking and ETA updates
- [API Reference](./api-reference.md) - Complete API documentation
