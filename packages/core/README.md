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
```

## Configuration

```ts
const nav = new NavigatrCore({
  valhallaUrl: 'https://your-valhalla-instance.com',
  nominatimUrl: 'https://your-nominatim-instance.com'
})
```

## API

### `NavigatrCore`

#### `route({ origin, destination }): Promise<RouteResult>`

Get driving directions between two points.

#### `geocode({ address }): Promise<GeocodeResult>`

Convert an address string to coordinates.

#### `reverseGeocode({ lat, lng }): Promise<GeocodeResult>`

Convert coordinates to an address.

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

interface RouteResult {
  durationSeconds: number
  durationText: string
  distanceMeters: number
  distanceText: string
  polyline: LatLng[]
}
```

## License

MIT
