# @navigatr/web

Browser SDK for Navigatr with Leaflet map rendering. Zero API keys, zero cost.

## Installation

```bash
npm install @navigatr/web leaflet
```

Include Leaflet CSS in your HTML:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

## Usage

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

## API

### `Navigatr`

Extends `NavigatrCore` with map rendering capabilities.

#### `map({ container, center, zoom? }): NavigatrMap`

Creates a Leaflet map in the specified container element.

- `container` - ID of the DOM element to render the map in
- `center` - Initial center coordinates `{ lat, lng }`
- `zoom` - Initial zoom level (default: 13)

### `NavigatrMap`

#### `addMarker({ lat, lng, label? })`

Adds a marker to the map with an optional popup label.

#### `drawRoute(polyline: LatLng[])`

Draws a route polyline on the map in accent color (#00FF94).

#### `fitRoute(polyline: LatLng[])`

Adjusts the map bounds to show the full route.

#### `clearRoute()`

Removes the current route polyline from the map.

## License

MIT
