# Navigatr — MVP Claude Code Prompt

Build a monorepo called **navigatr** — an open source alternative to the Google Maps SDK. Developers can `npm install navigatr` and get routing, geocoding and a map renderer in minutes with zero API keys and zero cost.

---

## Monorepo Setup

Use **pnpm workspaces** and **Turborepo**.

```
navigatr/
├── packages/
│   ├── core/          # pure TS — routing + geocoding logic
│   └── web/           # browser SDK — wraps core + Leaflet
├── apps/
│   └── web/           # Nuxt 4 — landing page + live demo
├── package.json       # monorepo root
├── pnpm-workspace.yaml
└── turbo.json
```

Root `package.json` scripts:
```json
{
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build"
  }
}
```

---

## Phase 1 — `packages/core`

Pure TypeScript. No DOM, no framework, no platform specific code. Just HTTP calls to public Valhalla and Nominatim instances. This is the foundation everything builds on.

**No external dependencies** — use native `fetch` only.

**Structure:**
```
packages/core/
├── src/
│   ├── index.ts
│   ├── route.ts
│   ├── geocode.ts
│   ├── types.ts
│   └── utils/
│       ├── polyline.ts     # decode Valhalla encoded polyline
│       └── format.ts       # format duration + distance into human readable strings
├── package.json
└── tsconfig.json
```

**Types — `types.ts`:**
```ts
export interface LatLng {
  lat: number
  lng: number
}

export interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
}

export interface RouteResult {
  durationSeconds: number
  durationText: string       // "12 mins" or "1 hr 4 mins"
  distanceMeters: number
  distanceText: string       // "3.2 km"
  polyline: LatLng[]         // decoded array of coordinates to draw on map
}

export interface NavigatrConfig {
  valhallaUrl?: string       // defaults to https://valhalla1.openstreetmap.de
  nominatimUrl?: string      // defaults to https://nominatim.openstreetmap.org
}
```

**`route.ts`** — calls Valhalla public instance:

Endpoint: `POST https://valhalla1.openstreetmap.de/route`

Request shape:
```json
{
  "locations": [
    { "lon": -0.1870, "lat": 5.6037, "type": "break" },
    { "lon": -0.2672, "lat": 5.5913, "type": "break" }
  ],
  "costing": "auto",
  "directions_options": { "units": "km" }
}
```

Response mapping:
- `result.trip.legs[0].shape` → encoded polyline, decode with `polyline.ts`
- `result.trip.summary.time` → duration in seconds
- `result.trip.summary.length` → distance in km, convert to meters

**`geocode.ts`** — calls Nominatim public instance:

Forward geocode:
```
GET https://nominatim.openstreetmap.org/search
params: q=Accra Mall Ghana&format=json&limit=1
Headers: User-Agent: navigatr-sdk/1.0
```
Returns first result: `{ lat, lon, display_name }`

Reverse geocode:
```
GET https://nominatim.openstreetmap.org/reverse
params: lat=5.6037&lon=-0.1870&format=json
Headers: User-Agent: navigatr-sdk/1.0
```

**`utils/polyline.ts`** — Valhalla returns an encoded polyline string in `shape`. Implement a decoder that converts it to `LatLng[]`. Use the Google polyline encoding algorithm — precision 6 for Valhalla.

**`utils/format.ts`:**
```ts
formatDuration(seconds: number): string
// 600 → "10 mins"
// 3900 → "1 hr 5 mins"

formatDistance(meters: number): string
// 3200 → "3.2 km"
// 800 → "800 m"
```

**Export from `index.ts`:**
```ts
export class NavigatrCore {
  constructor(config?: NavigatrConfig)
  async route(params: { origin: LatLng, destination: LatLng }): Promise<RouteResult>
  async geocode(params: { address: string }): Promise<GeocodeResult>
  async reverseGeocode(params: { lat: number, lng: number }): Promise<GeocodeResult>
}

export type { LatLng, GeocodeResult, RouteResult, NavigatrConfig }
```

Complete Phase 1 fully and confirm before moving to Phase 2.

---

## Phase 2 — `packages/web`

Browser SDK. Wraps `packages/core` and adds Leaflet map rendering. This is what web developers install.

**Dependencies:** `leaflet`, `@types/leaflet`, `@navigatr/core` (workspace)

**Structure:**
```
packages/web/
├── src/
│   ├── index.ts
│   ├── map.ts
│   └── types.ts
├── package.json
└── tsconfig.json
```

**`map.ts`** — Leaflet wrapper:
- Initialises a Leaflet map inside a given container div id
- Uses OSM tiles: `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- Attribution: `© OpenStreetMap contributors`
- Methods:
  - `addMarker({ lat, lng, label? })` — drops a pin with optional popup label
  - `drawRoute(polyline: LatLng[])` — draws the route polyline, color `#00FF94`, weight 4
  - `fitRoute(polyline: LatLng[])` — fits map bounds to show the full route
  - `clearRoute()` — removes the current route polyline from the map

**Export from `index.ts`:**
```ts
export class Navigatr extends NavigatrCore {
  map(params: { container: string, center: LatLng, zoom?: number }): NavigatrMap
}

export type { NavigatrMap }
```

**Usage should look exactly like this:**
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

Complete Phase 2 fully and confirm before moving to Phase 3.

---

## Phase 3 — `apps/web` (Nuxt 4)

The landing page and live demo. This is navigatr.dev — where developers discover the product, see it working and copy the code.

**Dependencies:** `@navigatr/web` (workspace), `leaflet`

**Structure:**
```
apps/web/
├── pages/
│   └── index.vue        # landing page + live demo
├── components/
│   ├── RouteDemo.vue    # interactive map demo component
│   └── CodeSnippet.vue  # syntax highlighted code block
├── public/
├── nuxt.config.ts
└── package.json
```

**Design — dark, minimal, developer focused:**
- Background: `#0A0A0F`
- Accent: `#00FF94`
- Font: IBM Plex Mono for code and UI, Syne for headings (via Google Fonts in `nuxt.config.ts`)
- No UI component library — raw CSS only

**`pages/index.vue` layout:**

Split screen on desktop, stacked on mobile:
- **Left panel** (40% width):
  - Navigatr logo + tagline: *"The open source Google Maps alternative. Zero API keys. Zero cost."*
  - Origin address input (placeholder: "Accra Mall, Ghana")
  - Destination address input (placeholder: "Kotoka Airport, Ghana")
  - "Get Route" button — accent color, full width
  - Results card (hidden until route loads):
    - Duration: "12 mins"
    - Distance: "3.2 km"
    - Origin coords
    - Destination coords
  - Code snippet showing the exact code that produced the result
  - GitHub link at the bottom

- **Right panel** (60% width):
  - Full height Leaflet map via `RouteDemo.vue`
  - Route drawn in `#00FF94`
  - Origin and destination markers
  - Map fits to show full route after calculation

**`components/RouteDemo.vue`:**
- Accepts `polyline`, `origin`, `destination` as props
- Renders the Leaflet map using `@navigatr/web`
- Handles map init on `onMounted`
- Redraws route reactively when props change

**`components/CodeSnippet.vue`:**
- Displays a static code block showing the 8 lines of code that produced the result
- Syntax highlight manually with `<span>` colored elements — no external library needed
- Include a "Copy" button that copies to clipboard

**On page load:**
- Pre-fill both inputs with the default Accra addresses
- Automatically run the route so the map is already showing when the page loads
- The demo works without any user interaction

**`nuxt.config.ts`:**
```ts
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Navigatr — Open Source Maps SDK',
      link: [
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600&family=Syne:wght@700;800&display=swap' },
        { rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' }
      ]
    }
  }
})
```

Complete Phase 3 fully and confirm before finishing.

---

## General Requirements

- TypeScript strict mode everywhere
- All packages must have a `build` script using `tsc`
- All packages must export proper TypeScript types
- `packages/core` must have zero dependencies — native fetch only
- Error handling on all API calls — throw descriptive errors with endpoint and status code
- Each package must have its own `README.md` with install and usage example
- Monorepo root `README.md` explaining the full project and how to run it locally
- Package names: `@navigatr/core`, `@navigatr/web`

---

## How to run locally

After scaffolding, the dev experience should be:

```bash
git clone https://github.com/user/navigatr
cd navigatr
pnpm install
pnpm dev        # starts Nuxt demo at localhost:3000
```

No other setup. No Docker. No environment variables. It just works.

---

Complete each phase fully and confirm before starting the next. Do not skip ahead.
