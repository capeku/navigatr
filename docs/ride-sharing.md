# Building Ride-Sharing Apps

This guide covers how to build ride-sharing applications (like Uber, Lyft, Bolt) with Navigatr, including real-time tracking, ETA updates, and multi-party views.

## Architecture Overview

A typical ride-sharing flow:

```
┌─────────────────────────────────────────────────────────────────┐
│                        RIDE REQUEST                              │
├─────────────────────────────────────────────────────────────────┤
│  Rider opens app                                                 │
│       ↓                                                          │
│  GPS provides rider location (no geocoding)                      │
│       ↓                                                          │
│  Rider types destination                                         │
│       ↓                                                          │
│  Geocode destination ONCE ← Only geocoding in entire flow       │
│       ↓                                                          │
│  Store coordinates in database                                   │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     DRIVER EN ROUTE TO PICKUP                    │
├─────────────────────────────────────────────────────────────────┤
│  Driver accepts ride                                             │
│       ↓                                                          │
│  Route: driver GPS → pickup location (from DB)                   │
│       ↓                                                          │
│  Real-time updates as driver moves (GPS only, no geocoding)      │
│       ↓                                                          │
│  Both parties see: driver location, ETA to pickup                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                        TRIP IN PROGRESS                          │
├─────────────────────────────────────────────────────────────────┤
│  Driver picks up rider                                           │
│       ↓                                                          │
│  Route: current location → destination (from DB)                 │
│       ↓                                                          │
│  Real-time updates as they travel (GPS only, no geocoding)       │
│       ↓                                                          │
│  Both parties see: current location, ETA to destination          │
└─────────────────────────────────────────────────────────────────┘
```

**Key Insight:** Geocoding happens exactly ONCE per ride (the destination). Everything else uses GPS coordinates.

## Using RideSession

Navigatr provides a `RideSession` helper that manages the entire ride lifecycle:

```ts
import { Navigatr } from '@navigatr/web'

const nav = new Navigatr()
const map = nav.map({ container: 'map', center: riderLocation })

// Step 1: Rider requests ride (geocode destination once)
const destination = await nav.geocode({ address: 'Kotoka Airport' })

// Step 2: Create ride session
const ride = nav.createRide({
  pickup: riderGPSLocation,    // From device GPS
  destination,                  // Geocoded above
  map,                          // Auto-render to map
  onETAUpdate: (eta, phase) => {
    document.getElementById('eta').textContent = eta.durationText
    document.getElementById('phase').textContent = phase
  },
  onPhaseChange: (phase) => {
    console.log('Ride phase:', phase) // 'waiting' | 'pickup' | 'in_progress' | 'completed'
  }
})

// Step 3: Driver accepts - start pickup phase
await ride.startPickup(driverInitialLocation)

// Step 4: Connect real-time updates (from your backend)
yourRealtimeBackend.on('driver-location', async (position) => {
  await ride.updateDriverLocation(position)
  // This automatically:
  // - Updates driver marker on map
  // - Recalculates route and ETA
  // - Calls onETAUpdate callback
})

// Step 5: Driver arrives at pickup - start trip
await ride.startTrip()

// Step 6: Arrived at destination
ride.complete()
```

## Without RideSession (Manual Approach)

For more control, use the lower-level APIs:

```ts
import { Navigatr } from '@navigatr/web'

const nav = new Navigatr()
const map = nav.map({ container: 'map', center: riderLocation })

// Geocode once
const destination = await nav.geocode({ address: 'Airport' })

// Track driver with callbacks
nav.onLocationUpdate(async (driverPos) => {
  // Update marker
  map.updateDriverMarker({ ...driverPos, icon: 'car' })

  // Recalculate ETA
  const updated = await nav.recalculateETA(driverPos, destination)

  // Update UI
  document.getElementById('eta').textContent = updated.durationText

  // Redraw route
  map.clearRoute()
  map.drawRoute(updated.polyline)
})

// Connect to your real-time backend
firebase.database()
  .ref(`rides/${rideId}/driverLocation`)
  .on('value', (snap) => {
    nav.pushLocationUpdate(snap.val())
  })
```

## Driver App vs Rider App

### Rider App

Shows: Driver approaching → Trip progress → Arrival

```ts
// Rider sees the driver coming to pick them up
const ride = nav.createRide({
  pickup: myLocation,           // Where I am (GPS)
  destination: whereImGoing,    // Where I want to go
  map,
  onETAUpdate: (eta, phase) => {
    if (phase === 'pickup') {
      showMessage(`Driver arrives in ${eta.durationText}`)
    } else if (phase === 'in_progress') {
      showMessage(`Arriving in ${eta.durationText}`)
    }
  }
})
```

### Driver App

Shows: Route to pickup → Route to destination

```ts
// Driver sees where to pick up the rider
const ride = nav.createRide({
  pickup: riderLocation,        // Where the rider is
  destination: riderDestination, // Where they want to go
  map,
  onETAUpdate: (eta, phase) => {
    if (phase === 'pickup') {
      showMessage(`Pickup in ${eta.durationText}`)
    } else if (phase === 'in_progress') {
      showMessage(`Dropoff in ${eta.durationText}`)
    }
  }
})

// Update with my GPS location
navigator.geolocation.watchPosition((pos) => {
  ride.updateDriverLocation({
    lat: pos.coords.latitude,
    lng: pos.coords.longitude
  })
})
```

## Real-Time Backend Integration

Navigatr doesn't include a real-time backend - you bring your own. Here are examples:

### Firebase Realtime Database

```ts
import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set } from 'firebase/database'

const db = getDatabase(app)

// Driver sends location
navigator.geolocation.watchPosition((pos) => {
  set(ref(db, `rides/${rideId}/driverLocation`), {
    lat: pos.coords.latitude,
    lng: pos.coords.longitude
  })
})

// Rider receives location
onValue(ref(db, `rides/${rideId}/driverLocation`), (snap) => {
  ride.updateDriverLocation(snap.val())
})
```

### Supabase Realtime

```ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(url, key)

// Subscribe to location updates
supabase
  .channel('ride-' + rideId)
  .on('broadcast', { event: 'driver-location' }, ({ payload }) => {
    ride.updateDriverLocation(payload)
  })
  .subscribe()

// Driver broadcasts location
navigator.geolocation.watchPosition((pos) => {
  supabase.channel('ride-' + rideId).send({
    type: 'broadcast',
    event: 'driver-location',
    payload: { lat: pos.coords.latitude, lng: pos.coords.longitude }
  })
})
```

### Socket.io

```ts
import { io } from 'socket.io-client'

const socket = io('https://your-server.com')

// Join ride room
socket.emit('join-ride', rideId)

// Receive driver location
socket.on('driver-location', (location) => {
  ride.updateDriverLocation(location)
})

// Driver sends location
navigator.geolocation.watchPosition((pos) => {
  socket.emit('driver-location', {
    rideId,
    lat: pos.coords.latitude,
    lng: pos.coords.longitude
  })
})
```

## Rate Limits & Best Practices

### Geocoding (Nominatim)

- **Limit:** 1 request per second
- **Best Practice:** Geocode ONCE when ride is requested, store coordinates

```ts
// DO THIS: Geocode once, store result
const destination = await nav.geocode({ address: userInput })
await db.createRide({
  pickup: riderGPS,
  destination: { lat: destination.lat, lng: destination.lng }
})

// DON'T DO THIS: Geocode repeatedly
setInterval(async () => {
  const dest = await nav.geocode({ address: userInput }) // BAD!
}, 1000)
```

### Routing (Valhalla)

- **Limit:** Much more generous
- **Best Practice:** Recalculate every 5-30 seconds, not on every GPS update

```ts
// Throttle route recalculations
let lastRecalc = 0
const RECALC_INTERVAL = 10000 // 10 seconds

nav.onLocationUpdate(async (pos) => {
  // Always update marker immediately
  map.updateDriverMarker(pos)

  // Throttle route recalculation
  if (Date.now() - lastRecalc > RECALC_INTERVAL) {
    lastRecalc = Date.now()
    await ride.updateDriverLocation(pos)
  }
})
```

## Complete Example

```ts
import { Navigatr } from '@navigatr/web'

// Initialize
const nav = new Navigatr()
const map = nav.map({ container: 'map', center: { lat: 5.6, lng: -0.2 } })

// State
let currentRide = null

// Rider requests a ride
async function requestRide(destinationAddress: string) {
  // Get rider's current location
  const riderPos = await getCurrentPosition()

  // Geocode destination (only geocoding in the flow!)
  const destination = await nav.geocode({ address: destinationAddress })

  // Save to your backend
  const rideId = await api.createRide({
    riderId: currentUser.id,
    pickup: riderPos,
    destination
  })

  // Create local ride session
  currentRide = nav.createRide({
    pickup: riderPos,
    destination,
    map,
    onETAUpdate: updateETADisplay,
    onPhaseChange: updatePhaseUI
  })

  // Subscribe to driver updates
  subscribeToDriverUpdates(rideId)

  return rideId
}

// When a driver accepts
function onDriverAccepted(driverLocation) {
  currentRide.startPickup(driverLocation)
}

// Real-time driver location updates
function subscribeToDriverUpdates(rideId) {
  websocket.on(`ride:${rideId}:driver-location`, (pos) => {
    currentRide.updateDriverLocation(pos)
  })

  websocket.on(`ride:${rideId}:pickup-complete`, () => {
    currentRide.startTrip()
  })

  websocket.on(`ride:${rideId}:completed`, () => {
    currentRide.complete()
  })
}

// UI updates
function updateETADisplay(eta, phase) {
  const messages = {
    pickup: `Driver arrives in ${eta.durationText}`,
    in_progress: `Arriving in ${eta.durationText}`,
    completed: 'You have arrived!'
  }
  document.getElementById('status').textContent = messages[phase]
}

function updatePhaseUI(phase) {
  document.body.dataset.ridePhase = phase
}

// Helper
function getCurrentPosition(): Promise<{ lat: number, lng: number }> {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      reject
    )
  })
}
```

## Next Steps

- [API Reference](./api-reference.md) - Complete API documentation
- [Basic Usage](./basic-usage.md) - Routing and geocoding fundamentals
