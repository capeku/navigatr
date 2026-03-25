# @navigatr/mobile

React Native package for Navigatr using `react-native-maps` for rendering and OSM-based APIs for routing/geocoding.

## Install

```bash
npm install @navigatr/mobile react-native-maps
```

## What You Get

- `NavigatrMobile` with core APIs (`route`, `geocode`, `reverseGeocode`, `autocomplete`)
- `map(config)` controller with taxi-app map behaviors (markers, route draw/fit, driver marker, alternates, navigation events)
- `RideSession` for pickup/in-progress/completed lifecycle
- Custom driver marker images with heading-based rotation
- `createOSMTileConfig()` for OSM tile overlays on `react-native-maps`

## End-to-End Example (Taxi Flow)

```tsx
import React from 'react'
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps'
import { NavigatrMobile, createInitialRegion, createOSMTileConfig } from '@navigatr/mobile'

const nav = new NavigatrMobile()
const tile = createOSMTileConfig()
const driverCarImage = require('./assets/car.png')

export function TaxiMapScreen() {
  const mapRef = React.useRef<MapView>(null)
  const [state, setState] = React.useState<any>(null)

  const map = React.useMemo(() => {
    return nav.map({
      center: { lat: 5.6037, lng: -0.1870 },
      mapRef: mapRef.current ?? undefined,
      onStateChange: setState
    })
  }, [])

  React.useEffect(() => {
    const unsubscribe = map.subscribe(setState)

    async function bootstrapRide() {
      const pickup = { lat: 5.6037, lng: -0.1870 }
      const destination = await nav.geocode({ address: 'Kotoka Airport, Ghana' })

      const ride = nav.createRide({
        pickup,
        destination,
        map,
        driverMarker: {
          image: driverCarImage,
          // 0 for north-facing top-down car images.
          rotationOffsetDegrees: 0
        },
        onETAUpdate: (eta) => console.log('ETA:', eta.durationText)
      })

      await ride.startPickup({ lat: 5.6101, lng: -0.2002 })
    }

    void bootstrapRide()
    return unsubscribe
  }, [map])

  const initialRegion = createInitialRegion({ center: { lat: 5.6037, lng: -0.1870 } })

  return (
    <MapView
      ref={mapRef}
      style={{ flex: 1 }}
      mapType={tile.mapViewProps.mapType}
      initialRegion={initialRegion}
      onPress={(e) => {
        const c = e.nativeEvent.coordinate
        map.handleMapPress({ lat: c.latitude, lng: c.longitude })
      }}
    >
      <UrlTile {...tile.urlTileProps} />

      {state?.markers?.map((m: any) => (
        <Marker
          key={m.id}
          coordinate={m.coordinate}
          title={m.label}
          draggable={Boolean(m.draggable)}
        />
      ))}

      {state?.driverMarker && (
        <Marker
          key={state.driverMarker.id}
          coordinate={state.driverMarker.coordinate}
          image={state.driverMarker.image}
          rotation={state.driverMarker.heading ?? 0}
          flat
          anchor={{ x: 0.5, y: 0.5 }}
        />
      )}

      <Polyline coordinates={state?.route?.primary ?? []} strokeColor="#00FF94" strokeWidth={4} />
      <Polyline coordinates={state?.route?.traveled ?? []} strokeColor="#888888" strokeWidth={4} />

      {(state?.route?.alternates ?? []).map((alt: any, idx: number) => (
        <Polyline
          key={`alt-${idx}`}
          coordinates={alt}
          strokeColor="#666666"
          strokeWidth={3}
          tappable
          onPress={() => map.handleAlternateRoutePress(idx)}
        />
      ))}
    </MapView>
  )
}
```

## Driver Marker Image Guidelines

Use these guidelines for smooth visual rotation and direction accuracy:

1. Orientation:
- Design the car icon pointing **north/up** in the source file.
- If your icon points another direction, set `rotationOffsetDegrees` in `driverMarker`.

2. File format:
- Use transparent PNG (`RGBA`) to avoid background blocks on map.
- Keep dimensions square (for example `64x64`, `96x96`, `128x128`).

3. Visual center:
- Keep the vehicle centered in the image canvas.
- Leave similar padding on all sides so rotation does not wobble.

4. Scale/readability:
- Avoid tiny details that vanish at map zoom levels.
- Prefer bold silhouette and high contrast edges.

5. Anchor/rotation:
- Render with `anchor={{ x: 0.5, y: 0.5 }}` and `flat` on `Marker`.
- Keep rotation driven by `state.driverMarker.heading`.

6. Performance:
- Prefer local bundled assets (`require('./assets/car.png')`) over remote URLs.
- Keep file size small (< 20KB where possible) for faster first render.

Example:

```tsx
const ride = nav.createRide({
  pickup,
  destination,
  map,
  driverMarker: {
    image: require('./assets/car.png'),
    rotationOffsetDegrees: 0
  }
})
```

## Why `mapType="none"` on Android?

`createOSMTileConfig()` defaults to `mapType: 'none'` so custom tiles fully replace the base map on Android. If you want the default provider map below your tile layer, set:

```ts
createOSMTileConfig({ shouldReplaceMapContentOnAndroid: false })
```

## API Highlights

- `NavigatrMobile#map(config)`
- `NavigatrMobile#createRide(config)`
- `RideSession#startPickup(driverLocation)`
- `RideSession#startTrip()`
- `RideSession#updateDriverLocation(position)`
- `RideSession#complete()`
- `map.onNavigationEvent(callback)`
- `map.handleMapPress(location)`
- `map.handleAlternateRoutePress(index)`
- `map.subscribe(callback)`
