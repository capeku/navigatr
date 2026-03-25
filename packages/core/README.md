# @navigatr/core

Pure TypeScript routing and geocoding SDK using public Valhalla and Nominatim instances. Zero dependencies, zero API keys.

## Installation

```bash
npm install @navigatr/core
```

## Usage

```ts
import { NavigatrCore } from '@navigatr/core'

const nav = new NavigatrCore()

// Geocode an address
const origin = await nav.geocode({ address: 'Accra Mall, Ghana' })
console.log(origin) // { lat: 5.6037, lng: -0.1870, displayName: '...' }

// Reverse geocode coordinates
const location = await nav.reverseGeocode({ lat: 5.6037, lng: -0.1870 })
console.log(location.displayName)

// Get a route
const destination = await nav.geocode({ address: 'Kotoka Airport, Ghana' })
const route = await nav.route({ origin, destination })

console.log(route.durationText) // "12 mins"
console.log(route.distanceText) // "3.2 km"
console.log(route.polyline)     // Array of { lat, lng } coordinates
console.log(route.alternates)   // Optional alternate routes (when available)
```

## Autocomplete

```ts
const results = await nav.autocomplete({
  query: 'Accra Mall',
  limit: 5
})

console.log(results[0]?.displayName)
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

## Turn-by-Turn Directions

```ts
const route = await nav.route({
  origin,
  destination,
  maneuvers: true
})

for (const step of route.maneuvers) {
  console.log(step.instruction)    // "Turn left onto Oak Avenue"
  console.log(step.distanceText)   // "200 m"
  console.log(step.type)           // "left"
}
```

## Traffic-Aware Routing

```ts
const route = await nav.route({
  origin,
  destination,
  traffic: true  // Uses traffic data when available
})
```

## Configuration

```ts
const nav = new NavigatrCore({
  valhallaUrl: 'https://your-valhalla-instance.com',
  nominatimUrl: 'https://your-nominatim-instance.com',
  photonUrl: 'https://your-photon-instance.com'
})
```

## API

### `NavigatrCore`

#### `route(options): Promise<RouteResult>`

Get driving directions between two points.

```ts
interface RouteOptions {
  origin: LatLng
  destination: LatLng
  mode?: 'drive' | 'walk' | 'bike'  // Default: 'drive'
  maneuvers?: boolean  // Include turn-by-turn directions
  traffic?: boolean    // Use traffic-aware routing
  shortest?: boolean   // Prefer shortest path over fastest
}
```

#### `geocode({ address, ...filters }): Promise<GeocodeResult>`

Convert an address string to coordinates.

Example restrictions:

```ts
await nav.geocode({
  address: 'France',
  countryCodes: ['fr'],
  featureType: 'country'
})
```

#### `reverseGeocode({ lat, lng }): Promise<GeocodeResult>`

Convert coordinates to an address.

#### `autocomplete({ query, limit?, ...filters }): Promise<AutocompleteResult[]>`

Search location suggestions for typeahead inputs.

Example restrictions:

```ts
await nav.autocomplete({
  query: 'Nairobi',
  limit: 5,
  language: 'en',
  bbox: [36.6, -1.5, 37.0, -1.1]
})
```

## Types

```ts
interface LatLng {
  lat: number
  lng: number
}

interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
}

interface Maneuver {
  instruction: string
  type: string
  distanceMeters: number
  distanceText: string
  durationSeconds: number
  durationText: string
  startPoint: LatLng
}

interface RouteResult {
  durationSeconds: number
  durationText: string
  distanceMeters: number
  distanceText: string
  polyline: LatLng[]
  maneuvers?: Maneuver[]
  alternates?: AlternateRoute[]
}

interface AlternateRoute {
  durationSeconds: number
  durationText: string
  distanceMeters: number
  distanceText: string
  polyline: LatLng[]
}
```

## License

MIT
