import maplibregl from 'maplibre-gl'
import nearestPointOnLine from '@turf/nearest-point-on-line'
import bearing from '@turf/bearing'
import distance from '@turf/distance'
import along from '@turf/along'
import { lineString, point } from '@turf/helpers'
import type { LatLng, RouteResult, Maneuver, AlternateRoute } from '@navigatr/core'
import { resolveBaseMapStyle } from './baseMapStyle'
import { injectMapLibreStyles } from './styles'
import type {
  MapConfig,
  MarkerOptions,
  DriverMarkerOptions,
  NavigatrMap,
  NavigatrMarker,
  RouteStyleOptions,
  NavigationEventCallback,
  NavigationEvent
} from './types'

const ROUTE_COLOR = '#00FF94'
const ROUTE_TRAVELED_COLOR = '#888888'
const ROUTE_WEIGHT = 4
const ALTERNATE_ROUTE_COLOR = '#666666'
const ALTERNATE_ROUTE_WEIGHT = 3
const ALTERNATE_ROUTE_OPACITY = 0.6
const OFF_ROUTE_THRESHOLD_METERS = 50
const TURN_ZOOM_THRESHOLD_METERS = 200
const MAX_ALTERNATES = 3

const DRIVER_ICONS: Record<string, string> = {
  car: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#00FF94"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`,
  bike: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#00FF94"><path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/></svg>`,
  walk: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#00FF94"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>`,
  default: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#00FF94"><circle cx="12" cy="12" r="8"/></svg>`
}

interface NavigationState {
  route: RouteResult
  polylineGeoJSON: GeoJSON.Feature<GeoJSON.LineString>
  totalRouteLengthKm: number
  isNavigating: boolean
}

function createDriverIconElement(type: string = 'default', heading: number = 0): HTMLDivElement {
  const svg = DRIVER_ICONS[type] || DRIVER_ICONS.default
  const el = document.createElement('div')
  el.innerHTML = svg
  el.style.transform = `rotate(${heading}deg)`
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.className = 'navigatr-driver-icon'
  return el
}

function toGeoJSONCoords(polyline: LatLng[]): [number, number][] {
  return polyline.map((p) => [p.lng, p.lat])
}

function findDistanceAlongRoute(
  routeLine: GeoJSON.Feature<GeoJSON.LineString>,
  position: LatLng
): number {
  const posPoint = point([position.lng, position.lat])
  const snapped = nearestPointOnLine(routeLine, posPoint)
  return snapped.properties.location ?? 0
}

function findNearestUpcomingManeuver(
  currentDistanceKm: number,
  route: RouteResult,
  polylineGeoJSON: GeoJSON.Feature<GeoJSON.LineString>
): { maneuver: Maneuver; distanceMeters: number } | null {
  if (!route.maneuvers || route.maneuvers.length === 0) return null

  for (const maneuver of route.maneuvers) {
    const maneuverDistanceKm = findDistanceAlongRoute(polylineGeoJSON, maneuver.startPoint)
    const distanceToManeuver = (maneuverDistanceKm - currentDistanceKm) * 1000

    if (distanceToManeuver > 0 && distanceToManeuver < 500) {
      return { maneuver, distanceMeters: distanceToManeuver }
    }
  }

  return null
}

function calculateRouteLength(coords: [number, number][]): number {
  let total = 0
  for (let i = 0; i < coords.length - 1; i++) {
    total += distance(point(coords[i]), point(coords[i + 1]), { units: 'kilometers' })
  }
  return total
}

export function createMap(config: MapConfig): NavigatrMap {
  injectMapLibreStyles()

  const map = new maplibregl.Map({
    container: config.container,
    style: resolveBaseMapStyle(config),
    center: [config.center.lng, config.center.lat],
    zoom: config.zoom ?? 13,
    pitch: config.pitch ?? 0,
    bearing: config.bearing ?? 0,
    attributionControl: false
  })

  const markers: Map<string, maplibregl.Marker> = new Map()
  let markerIdCounter = 0
  let driverMarker: maplibregl.Marker | null = null
  let driverIconType: string = 'default'
  let navigationState: NavigationState | null = null
  const eventListeners: Set<NavigationEventCallback> = new Set()
  let pendingRouteData: { coordinates: [number, number][]; style?: RouteStyleOptions } | null = null
  let pendingFitBounds: maplibregl.LngLatBounds | null = null
  let isMapLoaded = false

  // Alternate routes state
  let activeRoutePolyline: LatLng[] = []
  let alternateRoutes: AlternateRoute[] = []
  const alternateRouteClickListeners: Set<(index: number) => void> = new Set()

  function emitEvent(event: NavigationEvent): void {
    eventListeners.forEach((cb) => cb(event))
  }

  function addRouteLayer(): void {
    if (map.getSource('route')) return

    // Add alternate route layers FIRST (so they render behind main route)
    for (let i = 0; i < MAX_ALTERNATES; i++) {
      map.addSource(`alternate-route-${i}`, {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] }
        }
      })

      map.addLayer({
        id: `alternate-route-line-${i}`,
        type: 'line',
        source: `alternate-route-${i}`,
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': ALTERNATE_ROUTE_COLOR,
          'line-width': ALTERNATE_ROUTE_WEIGHT,
          'line-opacity': ALTERNATE_ROUTE_OPACITY
        }
      })

      // Add click handler for alternate routes
      map.on('click', `alternate-route-line-${i}`, (e) => {
        e.preventDefault()
        alternateRouteClickListeners.forEach((cb) => cb(i))
      })

      // Change cursor on hover
      map.on('mouseenter', `alternate-route-line-${i}`, () => {
        map.getCanvas().style.cursor = 'pointer'
      })
      map.on('mouseleave', `alternate-route-line-${i}`, () => {
        map.getCanvas().style.cursor = ''
      })
    }

    // Add main route source and layer
    map.addSource('route', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] }
      }
    })

    map.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': ROUTE_COLOR,
        'line-width': ROUTE_WEIGHT
      }
    })

    // Add traveled route layer (grey overlay for passed sections)
    map.addSource('route-traveled', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: [] }
      }
    })

    map.addLayer({
      id: 'route-traveled-line',
      type: 'line',
      source: 'route-traveled',
      layout: {
        'line-join': 'round',
        'line-cap': 'round'
      },
      paint: {
        'line-color': ROUTE_TRAVELED_COLOR,
        'line-width': ROUTE_WEIGHT
      }
    })

    // Apply pending route data
    if (pendingRouteData) {
      const source = map.getSource('route') as maplibregl.GeoJSONSource
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: pendingRouteData.coordinates }
      })
      updateRouteStyle(pendingRouteData.style)
      pendingRouteData = null
    }

    // Apply pending fit bounds
    if (pendingFitBounds) {
      map.fitBounds(pendingFitBounds, {
        padding: 50,
        pitch: 0,
        bearing: 0
      })
      pendingFitBounds = null
    }

    isMapLoaded = true
  }

  function updateRouteStyle(style?: RouteStyleOptions): void {
    if (!map.getLayer('route-line')) return

    if (style?.color) {
      map.setPaintProperty('route-line', 'line-color', style.color)
    }
    if (style?.weight) {
      map.setPaintProperty('route-line', 'line-width', style.weight)
    }
    if (style?.opacity !== undefined) {
      map.setPaintProperty('route-line', 'line-opacity', style.opacity)
    }
  }

  map.on('load', addRouteLayer)

  return {
    addMarker(options: MarkerOptions): NavigatrMarker {
      const id = `marker-${markerIdCounter++}`

      let markerConfig: maplibregl.MarkerOptions = {
        draggable: options.draggable ?? false
      }

      if (options.iconHtml) {
        const el = document.createElement('div')
        el.innerHTML = options.iconHtml
        el.style.cursor = 'pointer'
        markerConfig.element = el
      }

      const marker = new maplibregl.Marker(markerConfig)
        .setLngLat([options.lng, options.lat])
        .addTo(map)

      if (options.label) {
        marker.setPopup(new maplibregl.Popup().setText(options.label))
      }

      if (options.draggable && options.onDragEnd) {
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat()
          options.onDragEnd!({ lat: lngLat.lat, lng: lngLat.lng })
        })
      }

      markers.set(id, marker)

      return {
        setLatLng(location: LatLng): void {
          marker.setLngLat([location.lng, location.lat])
        },
        remove(): void {
          marker.remove()
          markers.delete(id)
        }
      }
    },

    drawRoute(polyline: LatLng[], style?: RouteStyleOptions): void {
      activeRoutePolyline = polyline
      const coordinates = toGeoJSONCoords(polyline)

      const source = map.getSource('route') as maplibregl.GeoJSONSource | undefined
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates }
        })
        updateRouteStyle(style)
      } else {
        pendingRouteData = { coordinates, style }
      }
    },

    fitRoute(polyline: LatLng[]): void {
      if (polyline.length === 0) return

      const bounds = new maplibregl.LngLatBounds()
      polyline.forEach((p) => bounds.extend([p.lng, p.lat]))

      // If map not loaded yet, store for later
      if (!isMapLoaded) {
        pendingFitBounds = bounds
        return
      }

      map.fitBounds(bounds, {
        padding: 50,
        pitch: 0,
        bearing: 0
      })
    },

    clearRoute(): void {
      pendingRouteData = null
      activeRoutePolyline = []
      alternateRoutes = []

      const source = map.getSource('route') as maplibregl.GeoJSONSource
      if (source) {
        source.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] }
        })
      }
      const traveledSource = map.getSource('route-traveled') as maplibregl.GeoJSONSource
      if (traveledSource) {
        traveledSource.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] }
        })
      }

      // Clear all alternate routes
      for (let i = 0; i < MAX_ALTERNATES; i++) {
        const altSource = map.getSource(`alternate-route-${i}`) as maplibregl.GeoJSONSource | undefined
        if (altSource) {
          altSource.setData({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [] }
          })
        }
      }
    },

    updateDriverMarker(options: DriverMarkerOptions): void {
      const heading = options.heading ?? 0
      driverIconType = options.icon ?? 'default'

      if (driverMarker) {
        driverMarker.setLngLat([options.lng, options.lat])
        const el = driverMarker.getElement()
        el.innerHTML = ''
        el.appendChild(createDriverIconElement(driverIconType, heading))
      } else {
        const el = createDriverIconElement(driverIconType, heading)
        driverMarker = new maplibregl.Marker({ element: el })
          .setLngLat([options.lng, options.lat])
          .addTo(map)
      }
    },

    removeDriverMarker(): void {
      if (driverMarker) {
        driverMarker.remove()
        driverMarker = null
      }
    },

    panTo(location: LatLng): void {
      map.panTo([location.lng, location.lat])
    },

    onClick(callback: (location: LatLng) => void): () => void {
      const handler = (e: maplibregl.MapMouseEvent) => {
        callback({ lat: e.lngLat.lat, lng: e.lngLat.lng })
      }
      map.on('click', handler)
      return () => map.off('click', handler)
    },

    startNavigation(route: RouteResult): void {
      if (route.polyline.length < 2) {
        throw new Error('Route must have at least 2 points')
      }

      const coords = toGeoJSONCoords(route.polyline)
      const polylineGeoJSON = lineString(coords)
      const totalRouteLengthKm = calculateRouteLength(coords)

      const initialBearing = bearing(point(coords[0]), point(coords[1]))

      navigationState = {
        route,
        polylineGeoJSON,
        totalRouteLengthKm,
        isNavigating: true
      }

      // Place driver marker at start
      const startPoint = route.polyline[0]
      this.updateDriverMarker({
        lat: startPoint.lat,
        lng: startPoint.lng,
        heading: initialBearing,
        icon: driverIconType as 'car' | 'bike' | 'walk' | 'default'
      })

      // Animate camera to navigation view
      map.easeTo({
        center: [startPoint.lng, startPoint.lat],
        zoom: 17,
        pitch: 60,
        bearing: initialBearing,
        duration: 1000
      })

      emitEvent({ type: 'navigation_started' })
    },

    updatePosition(position: LatLng): void {
      if (!navigationState || !navigationState.isNavigating) return

      const posPoint = point([position.lng, position.lat])

      // Snap to route
      const snapped = nearestPointOnLine(navigationState.polylineGeoJSON, posPoint)
      const [snappedLng, snappedLat] = snapped.geometry.coordinates
      const distanceFromRoute = distance(posPoint, snapped, { units: 'meters' })

      // Off route check
      if (distanceFromRoute > OFF_ROUTE_THRESHOLD_METERS) {
        emitEvent({ type: 'off_route', distanceMeters: distanceFromRoute })
      }

      // Current progress along route
      const currentDistanceKm = snapped.properties.location ?? 0
      const remainingKm = navigationState.totalRouteLengthKm - currentDistanceKm

      // Update traveled portion of route (grey out passed sections)
      const segmentIndex = snapped.properties.index ?? 0
      const routeCoords = navigationState.polylineGeoJSON.geometry.coordinates
      const traveledCoords = routeCoords.slice(0, segmentIndex + 1)
      // Add the current snapped position as the end of traveled path
      traveledCoords.push([snappedLng, snappedLat])

      const traveledSource = map.getSource('route-traveled') as maplibregl.GeoJSONSource | undefined
      if (traveledSource) {
        traveledSource.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: traveledCoords }
        })
      }

      // Arrival check
      if (remainingKm * 1000 < 20) {
        emitEvent({ type: 'arrived' })
        this.stopNavigation()
        return
      }

      // Calculate bearing (look 50m ahead)
      const lookAheadKm = Math.min(currentDistanceKm + 0.05, navigationState.totalRouteLengthKm)
      const currentPoint = along(navigationState.polylineGeoJSON, currentDistanceKm, { units: 'kilometers' })
      const lookAheadPoint = along(navigationState.polylineGeoJSON, lookAheadKm, { units: 'kilometers' })
      const currentBearing = bearing(currentPoint, lookAheadPoint)

      // Update marker
      this.updateDriverMarker({
        lat: snappedLat,
        lng: snappedLng,
        heading: currentBearing,
        icon: driverIconType as 'car' | 'bike' | 'walk' | 'default'
      })

      // Turn anticipation zoom
      let targetZoom = 17
      const nearestTurn = findNearestUpcomingManeuver(
        currentDistanceKm,
        navigationState.route,
        navigationState.polylineGeoJSON
      )
      if (nearestTurn) {
        if (nearestTurn.distanceMeters < TURN_ZOOM_THRESHOLD_METERS) {
          targetZoom = 18
          emitEvent({
            type: 'turn_approaching',
            maneuver: nearestTurn.maneuver,
            distanceMeters: nearestTurn.distanceMeters
          })
        } else {
          targetZoom = 16
        }
      }

      // Animate camera
      map.easeTo({
        center: [snappedLng, snappedLat],
        bearing: currentBearing,
        pitch: 60,
        zoom: targetZoom,
        duration: 300
      })
    },

    stopNavigation(): void {
      if (navigationState) {
        navigationState.isNavigating = false
        navigationState = null
      }

      // Clear traveled route
      const traveledSource = map.getSource('route-traveled') as maplibregl.GeoJSONSource | undefined
      if (traveledSource) {
        traveledSource.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: [] }
        })
      }

      map.easeTo({
        pitch: 0,
        bearing: 0,
        zoom: 15,
        duration: 500
      })

      emitEvent({ type: 'navigation_stopped' })
    },

    onNavigationEvent(callback: NavigationEventCallback): () => void {
      eventListeners.add(callback)
      return () => eventListeners.delete(callback)
    },

    updateTraveledRoute(polyline: LatLng[], currentIndex: number): void {
      const traveledSource = map.getSource('route-traveled') as maplibregl.GeoJSONSource | undefined
      if (!traveledSource || polyline.length === 0) return

      // Get coordinates from start to current position
      const traveledCoords = polyline.slice(0, currentIndex + 1).map((p) => [p.lng, p.lat] as [number, number])

      if (traveledCoords.length > 0) {
        traveledSource.setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: traveledCoords }
        })
      }
    },

    drawAlternateRoutes(alternates: AlternateRoute[]): void {
      alternateRoutes = alternates.slice(0, MAX_ALTERNATES)

      // Clear all alternate route layers first
      for (let i = 0; i < MAX_ALTERNATES; i++) {
        const source = map.getSource(`alternate-route-${i}`) as maplibregl.GeoJSONSource | undefined
        if (source) {
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates: [] }
          })
        }
      }

      // Draw each alternate route
      alternateRoutes.forEach((alt, index) => {
        const source = map.getSource(`alternate-route-${index}`) as maplibregl.GeoJSONSource | undefined
        if (source && alt.polyline.length > 0) {
          const coordinates = toGeoJSONCoords(alt.polyline)
          source.setData({
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates }
          })
        }
      })
    },

    switchRoute(index: number): void {
      if (index < 0 || index >= alternateRoutes.length) return

      const newActive = alternateRoutes[index]
      const oldActivePolyline = activeRoutePolyline

      // Get current active route data
      const routeSource = map.getSource('route') as maplibregl.GeoJSONSource | undefined
      if (!routeSource) return

      // Swap: new active becomes main route
      activeRoutePolyline = newActive.polyline
      routeSource.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: toGeoJSONCoords(newActive.polyline) }
      })

      // Update alternates array: remove the promoted one, add the old active
      const newAlternates = [...alternateRoutes]
      newAlternates.splice(index, 1)

      // Add old active route as alternate (if it had data)
      if (oldActivePolyline.length > 0) {
        newAlternates.push({
          polyline: oldActivePolyline,
          durationSeconds: 0,
          durationText: '',
          distanceMeters: 0,
          distanceText: ''
        })
      }

      // Redraw alternates
      this.drawAlternateRoutes(newAlternates)
    },

    onAlternateRouteClick(callback: (index: number) => void): () => void {
      alternateRouteClickListeners.add(callback)
      return () => alternateRouteClickListeners.delete(callback)
    }
  }
}
