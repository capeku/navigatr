# Navigatr

The open source Google Maps alternative. Zero API keys. Zero cost.

Navigatr is a monorepo containing a maps SDK and demo application that provides routing, geocoding, and map rendering using free, public APIs (Valhalla and Nominatim).

## Packages

| Package | Description |
|---------|-------------|
| [@navigatr/core](./packages/core) | Pure TypeScript SDK for routing and geocoding |
| [@navigatr/web](./packages/web) | Browser SDK with Leaflet map rendering |
| [@navigatr/demo](./apps/web) | Nuxt landing page and live demo |

## Quick Start

```bash
git clone https://github.com/user/navigatr
cd navigatr
pnpm install
pnpm dev        # starts Nuxt demo at localhost:3000
```

## Usage

Install the web SDK in your project:

```bash
npm install @navigatr/web leaflet
```

Add Leaflet CSS to your HTML:

```html
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
```

Use it in your code:

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

console.log(result.durationText)   // "12 mins"
console.log(result.distanceText)   // "3.2 km"
```

## Core SDK Only

If you don't need map rendering, use the core package:

```bash
npm install @navigatr/core
```

```ts
import { NavigatrCore } from '@navigatr/core'

const nav = new NavigatrCore()

const origin = await nav.geocode({ address: 'Accra Mall, Ghana' })
const destination = await nav.geocode({ address: 'Kotoka Airport, Ghana' })
const route = await nav.route({ origin, destination })

console.log(route.durationText) // "12 mins"
console.log(route.distanceText) // "3.2 km"
```

## APIs Used

- **Routing**: [Valhalla](https://valhalla.github.io/valhalla/) public instance at `valhalla1.openstreetmap.de`
- **Geocoding**: [Nominatim](https://nominatim.org/) at `nominatim.openstreetmap.org`
- **Map Tiles**: [OpenStreetMap](https://www.openstreetmap.org/)

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Start the demo app
pnpm dev
```

## License

MIT
