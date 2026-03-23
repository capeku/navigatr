# Navigatr

[![npm version](https://img.shields.io/npm/v/@navigatr/web.svg)](https://www.npmjs.com/package/@navigatr/web)
[![npm downloads](https://img.shields.io/npm/dm/@navigatr/web.svg)](https://www.npmjs.com/package/@navigatr/web)
[![license](https://img.shields.io/npm/l/@navigatr/web.svg)](https://github.com/capeku/navigatr/blob/main/LICENSE)

The open source Google Maps alternative. No API keys. No billing surprises.

Navigatr is a maps SDK that provides routing, geocoding, and map rendering using free, public APIs. Build ride-sharing apps, delivery trackers, or any location-based service without paying for Google Maps.

## Features

- **Routing** - Turn-by-turn directions with ETA and distance
- **Geocoding** - Convert addresses to coordinates and vice versa
- **Map Rendering** - MapLibre GL maps with route visualization
- **Real-Time Tracking** - Built-in helpers for ride-sharing apps
- **Zero Cost** - Uses public OpenStreetMap infrastructure

## Packages

| Package | Description |
|---------|-------------|
| [@navigatr/core](./packages/core) | Pure TypeScript SDK for routing and geocoding |
| [@navigatr/web](./packages/web) | Browser SDK with MapLibre GL map rendering |

## Quick Start

```bash
npm install @navigatr/web
```

```html
<div id="map" style="height: 400px"></div>
```

```ts
import { Navigatr } from '@navigatr/web'

const nav = new Navigatr()
const map = nav.map({ container: 'map', center: { lat: 5.6037, lng: -0.1870 } })

// Geocode addresses
const origin = await nav.geocode({ address: 'Accra Mall, Ghana' })
const destination = await nav.geocode({ address: 'Kotoka Airport, Ghana' })

// Get route and display
const route = await nav.route({ origin, destination })
map.drawRoute(route.polyline)
map.fitRoute(route.polyline)

console.log(route.durationText) // "12 mins"
console.log(route.distanceText) // "3.2 km"
```

## Documentation

- [Architecture](./ARCHITECTURE.md) - How the distributed SDK works, self-hosting guide
- [Basic Usage](./docs/basic-usage.md) - Getting started with routing and geocoding
- [Building Ride-Sharing Apps](./docs/ride-sharing.md) - Real-time tracking, ETA updates, driver/rider views
- [API Reference](./docs/api-reference.md) - Complete API documentation

## For Ride-Sharing Apps

Navigatr includes built-in helpers for ride-sharing applications:

```ts
import { Navigatr } from '@navigatr/web'

const nav = new Navigatr()
const map = nav.map({ container: 'map', center: riderLocation })

// 1. Geocode destination once when ride is requested
const destination = await nav.geocode({ address: 'Airport' })

// 2. Create a ride session
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

// 4. Connect to your real-time backend
websocket.on('driver-location', (pos) => {
  ride.updateDriverLocation(pos)
})

// 5. Transition phases
await ride.startTrip()  // Driver picked up rider
ride.complete()          // Arrived at destination
```

See the [Ride-Sharing Guide](./docs/ride-sharing.md) for complete examples.

## Rate Limits

Navigatr uses public APIs with usage limits:

| Service | Limit | Notes |
|---------|-------|-------|
| Nominatim (geocoding) | 1 req/sec | Cache results, geocode once per ride |
| Valhalla (routing) | Generous | No issues with real-time updates |

**Best Practice:** Geocode addresses once (when ride is requested), then use coordinates for all subsequent route calculations.

## Built On

- **Routing**: [Valhalla](https://valhalla.github.io/valhalla/) at `valhalla1.openstreetmap.de`
- **Geocoding**: [Nominatim](https://nominatim.org/) at `nominatim.openstreetmap.org`
- **Autocomplete**: [Photon](https://photon.komoot.io/) at `photon.komoot.io`
- **Map Rendering**: [MapLibre GL JS](https://maplibre.org/)
- **Map Tiles**: [OpenFreeMap](https://openfreemap.org/)

## Self-Hosting

For production apps with high traffic, consider self-hosting:

- [Valhalla Docker](https://github.com/gis-ops/docker-valhalla)
- [Nominatim Docker](https://github.com/mediagis/nominatim-docker)

Then configure Navigatr to use your instances:

```ts
const nav = new Navigatr({
  valhallaUrl: 'https://your-valhalla.example.com',
  nominatimUrl: 'https://your-nominatim.example.com',
  photonUrl: 'https://your-photon.example.com',
  requestTimeoutMs: 10000
})
```

## Development

```bash
git clone https://github.com/capeku/navigatr
cd navigatr
pnpm install
pnpm dev        # starts demo at localhost:3000
pnpm build      # build all packages
```

## License

MIT
