# Navigatr Architecture

## Overview

Navigatr is designed as a **distributed client-side SDK**. API calls are made directly from users' browsers to public infrastructure, eliminating the need for your own backend and avoiding centralized billing.

---

## Current Architecture: Distributed Public Infrastructure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DISTRIBUTED ARCHITECTURE                            │
│                    (No backend required for your app)                       │
└─────────────────────────────────────────────────────────────────────────────┘

    YOUR APP                                    PUBLIC INFRASTRUCTURE
                                             (Community-funded, free to use)

┌──────────────────┐
│   User A         │
│   Browser        │───┐
│ ┌──────────────┐ │   │
│ │ @navigatr/web│ │   │
│ └──────────────┘ │   │
└──────────────────┘   │
                       │
┌──────────────────┐   │      ┌─────────────────────────────────────────────┐
│   User B         │   │      │                                             │
│   Browser        │───┼─────▶│  ┌─────────────┐    Routing                 │
│ ┌──────────────┐ │   │      │  │  Valhalla   │    valhalla1.openstreetmap.de
│ │ @navigatr/web│ │   │      │  └─────────────┘                            │
│ └──────────────┘ │   │      │                                             │
└──────────────────┘   │      │  ┌─────────────┐    Geocoding               │
                       ├─────▶│  │  Nominatim  │    nominatim.openstreetmap.org
┌──────────────────┐   │      │  └─────────────┘                            │
│   User C         │   │      │                                             │
│   Browser        │───┤      │  ┌─────────────┐    Autocomplete            │
│ ┌──────────────┐ │   │      │  │   Photon    │    photon.komoot.io        │
│ │ @navigatr/web│ │   │      │  └─────────────┘                            │
│ └──────────────┘ │   │      │                                             │
└──────────────────┘   │      │  ┌─────────────┐    Map Tiles               │
                       │      │  │ OpenFreeMap │    tiles.openfreemap.org   │
┌──────────────────┐   │      │  └─────────────┘                            │
│   User N         │───┘      │                                             │
│   Browser        │          └─────────────────────────────────────────────┘
│ ┌──────────────┐ │
│ │ @navigatr/web│ │
│ └──────────────┘ │
└──────────────────┘
```

### How It Works

1. **Client-Side SDK**: `@navigatr/web` runs entirely in the browser
2. **Direct Requests**: Each user's browser makes API calls directly to public services
3. **Distributed Load**: 1000 users = 1000 different IPs making requests
4. **No Central Server**: Your app doesn't need a backend for maps functionality
5. **Zero Cost**: No API keys, no billing, no infrastructure to manage

### Why This Works

| Aspect | Benefit |
|--------|---------|
| **IP Distribution** | Requests come from users' IPs, not a single server |
| **Policy Compliance** | Matches intended usage of public OSM infrastructure |
| **No Rate Limiting** | Each user has their own rate limit quota |
| **Zero Infrastructure** | No servers to deploy, scale, or pay for |

---

## Comparison: Traditional vs Navigatr

```
  GOOGLE MAPS (Centralized)              NAVIGATR (Distributed)
  ─────────────────────────              ────────────────────────

  User A ──┐                             User A ────▶ Public APIs
  User B ──┼──▶ Your Server ──▶ Google   User B ────▶ Public APIs
  User C ──┤        │                    User C ────▶ Public APIs
  User N ──┘        ▼                    User N ────▶ Public APIs
                 $$$$ Bill

  • All requests via your API key        • Direct browser requests
  • Billed per request                   • No API key needed
  • Single point of failure              • Distributed load
  • You pay for all users                • Community-funded infra
```

---

## Future Architecture: Self-Hosted Navigatr Server

For production applications with high traffic or specific requirements (privacy, SLA, custom regions), deploy your own Navigatr Server.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      SELF-HOSTED ARCHITECTURE                               │
│                   (Full control, unlimited scale)                           │
└─────────────────────────────────────────────────────────────────────────────┘

    YOUR USERS                              YOUR NAVIGATR SERVER
                                           (Single deployment, all services)

┌──────────────────┐                    ┌─────────────────────────────────────┐
│   User A         │                    │                                     │
│   Browser        │───┐                │  ┌───────────────────────────────┐  │
│ ┌──────────────┐ │   │                │  │      NAVIGATR SERVER          │  │
│ │ @navigatr/web│ │   │                │  │                               │  │
│ └──────────────┘ │   │                │  │  ┌─────────┐  ┌─────────┐     │  │
└──────────────────┘   │                │  │  │Valhalla │  │Nominatim│     │  │
                       │                │  │  │ Routing │  │Geocoding│     │  │
┌──────────────────┐   │                │  │  └─────────┘  └─────────┘     │  │
│   User B         │   │                │  │                               │  │
│   Browser        │───┼───────────────▶│  │  ┌─────────┐  ┌─────────┐     │  │
│ ┌──────────────┐ │   │                │  │  │ Photon  │  │  Tile   │     │  │
│ │ @navigatr/web│ │   │                │  │  │Autocomp.│  │ Server  │     │  │
│ └──────────────┘ │   │                │  │  └─────────┘  └─────────┘     │  │
└──────────────────┘   │                │  │                               │  │
                       │                │  │  ┌─────────────────────────┐  │  │
┌──────────────────┐   │                │  │  │     OSM Data (PBF)      │  │  │
│   User N         │───┘                │  │  │  Regional or Global     │  │  │
│   Browser        │                    │  │  └─────────────────────────┘  │  │
│ ┌──────────────┐ │                    │  │                               │  │
│ │ @navigatr/web│ │                    │  └───────────────────────────────┘  │
│ └──────────────┘ │                    │                                     │
└──────────────────┘                    │  maps.yourcompany.com               │
                                        └─────────────────────────────────────┘
```

### Self-Hosted Benefits

| Benefit | Description |
|---------|-------------|
| **Unlimited Requests** | No rate limits, scale as needed |
| **Privacy** | User queries never leave your infrastructure |
| **Custom Regions** | Load only the map data you need (country, continent) |
| **SLA Control** | Your uptime, your guarantees |
| **Offline Support** | Works without internet for internal apps |
| **Custom Data** | Add proprietary POIs, custom routing rules |

### Navigatr Server Components

```
navigatr-server/
├── docker-compose.yml       # Single command deployment
├── valhalla/                # Routing engine
│   └── tiles/               # Pre-built routing tiles
├── nominatim/               # Geocoding service
│   └── data/                # Address database
├── photon/                  # Autocomplete service
│   └── elasticsearch/       # Search index
├── tileserver/              # Vector tile server
│   └── mbtiles/             # Map tile data
└── nginx/                   # Reverse proxy
    └── nginx.conf           # Unified API endpoint
```

### Deployment Options

| Option | Best For | Resources |
|--------|----------|-----------|
| **Single Region** | Country-level apps | 8GB RAM, 50GB disk |
| **Continental** | Multi-country apps | 32GB RAM, 200GB disk |
| **Global** | Worldwide coverage | 64GB+ RAM, 500GB+ disk |

### Client Configuration

```ts
// Point to your self-hosted server
const nav = new Navigatr({
  serverUrl: 'https://maps.yourcompany.com'
})

// Or configure individual services
const nav = new Navigatr({
  valhallaUrl: 'https://maps.yourcompany.com/valhalla',
  nominatimUrl: 'https://maps.yourcompany.com/nominatim',
  photonUrl: 'https://maps.yourcompany.com/photon',
  tileUrl: 'https://maps.yourcompany.com/tiles'
})
```

---

## Migration Path

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│                 │      │                 │      │                 │
│   Development   │ ───▶ │   Production    │ ───▶ │    Scale        │
│                 │      │                 │      │                 │
│  Public APIs    │      │  Self-Hosted    │      │  Multi-Region   │
│  Free, instant  │      │  Single server  │      │  Load balanced  │
│                 │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘

    npm install              docker compose up       Kubernetes/
    @navigatr/web                                    Terraform
```

### When to Self-Host

| Scenario | Recommendation |
|----------|----------------|
| Prototyping, MVPs | Use public infrastructure |
| < 10,000 daily users | Use public infrastructure |
| > 10,000 daily users | Consider self-hosting |
| Privacy requirements | Self-host required |
| Offline/air-gapped | Self-host required |
| Custom map data | Self-host required |

---

## Data Flow

### Route Request Flow

```
User types destination
        │
        ▼
┌─────────────────┐
│  @navigatr/web  │
│                 │
│  1. Autocomplete│──────▶ Photon (suggestions)
│                 │
│  2. Geocode     │──────▶ Nominatim (coordinates)
│                 │
│  3. Route       │──────▶ Valhalla (directions)
│                 │
│  4. Render      │──────▶ Tile Server (map tiles)
│                 │
└─────────────────┘
        │
        ▼
   Map displayed
   with route
```

### Real-Time Tracking Flow

```
Driver location update
        │
        ▼
┌─────────────────┐
│  Your Backend   │  (WebSocket/Firebase/Supabase)
│                 │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  @navigatr/web  │
│                 │
│  1. Update pos  │──────▶ Move driver marker
│                 │
│  2. Recalc ETA  │──────▶ Valhalla (new route)
│                 │
│  3. Re-render   │──────▶ Update route line
│                 │
└─────────────────┘
```

---

## License

MIT
