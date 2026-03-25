import type { LatLng, AlternateRoute, RouteResult, Maneuver } from '@navigatr/core'
import { getBoundingRegion, toMapCoordinate, toMapCoordinates } from './coordinates'
import type {
  DriverMarkerOptions,
  FitBoundsOptions,
  MapConfig,
  MarkerOptions,
  MobileMapRenderState,
  NavigationEvent,
  NavigationEventCallback,
  NavigatrMobileMap,
  NavigatrMarker,
  RouteStyleOptions,
  Region
} from './types'

const OFF_ROUTE_THRESHOLD_METERS = 50
const TURN_ZOOM_THRESHOLD_METERS = 200
const ARRIVAL_THRESHOLD_METERS = 20
const NAVIGATION_ZOOM = 17
const NAVIGATION_PITCH = 60
const MAX_HEADING_STEP_DEGREES = 24

type InternalMarker = {
  id: string
  lat: number
  lng: number
  label?: string
  draggable?: boolean
  icon?: string
  onDragEnd?: (location: LatLng) => void
}

type DriverMarkerState = {
  lat: number
  lng: number
  icon: 'car' | 'bike' | 'walk' | 'default'
  heading: number
  rotationOffsetDegrees: number
  image?: DriverMarkerOptions['image']
}

type NavigationState = {
  route: RouteResult
  routePolyline: LatLng[]
  isNavigating: boolean
  lastNearestIndex: number
  lastHeading: number
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

function distanceMeters(a: LatLng, b: LatLng): number {
  const earthRadiusMeters = 6371000
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const deltaLat = toRadians(b.lat - a.lat)
  const deltaLng = toRadians(b.lng - a.lng)

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  return earthRadiusMeters * c
}

function bearingDegrees(from: LatLng, to: LatLng): number {
  const phi1 = toRadians(from.lat)
  const phi2 = toRadians(to.lat)
  const deltaLambda = toRadians(to.lng - from.lng)

  const y = Math.sin(deltaLambda) * Math.cos(phi2)
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)

  const brng = (Math.atan2(y, x) * 180) / Math.PI
  return (brng + 360) % 360
}

function normalizeAngle(angle: number): number {
  const normalized = angle % 360
  return normalized < 0 ? normalized + 360 : normalized
}

function shortestAngleDelta(from: number, to: number): number {
  let delta = normalizeAngle(to) - normalizeAngle(from)
  if (delta > 180) delta -= 360
  if (delta < -180) delta += 360
  return delta
}

function smoothHeading(previous: number, target: number): number {
  const delta = shortestAngleDelta(previous, target)
  const clampedDelta = Math.max(-MAX_HEADING_STEP_DEGREES, Math.min(MAX_HEADING_STEP_DEGREES, delta))
  return normalizeAngle(previous + clampedDelta)
}

function findNearestIndex(position: LatLng, polyline: LatLng[]): { index: number; distanceMeters: number } {
  let nearestIndex = 0
  let nearestDistanceMeters = Number.POSITIVE_INFINITY

  for (let i = 0; i < polyline.length; i++) {
    const candidateDistance = distanceMeters(position, polyline[i])
    if (candidateDistance < nearestDistanceMeters) {
      nearestDistanceMeters = candidateDistance
      nearestIndex = i
    }
  }

  return { index: nearestIndex, distanceMeters: nearestDistanceMeters }
}

function findNearestUpcomingManeuver(
  currentPosition: LatLng,
  maneuvers: Maneuver[] | undefined
): { maneuver: Maneuver; distanceMeters: number } | null {
  if (!maneuvers || maneuvers.length === 0) return null

  let best: { maneuver: Maneuver; distanceMeters: number } | null = null

  for (const maneuver of maneuvers) {
    const dist = distanceMeters(currentPosition, maneuver.startPoint)
    if (dist <= 500 && (!best || dist < best.distanceMeters)) {
      best = { maneuver, distanceMeters: dist }
    }
  }

  return best
}

export function createMap(config: MapConfig): NavigatrMobileMap {
  const markers = new Map<string, InternalMarker>()
  const clickListeners: Set<(location: LatLng) => void> = new Set()
  const navigationListeners: Set<NavigationEventCallback> = new Set()
  const alternateRouteClickListeners: Set<(index: number) => void> = new Set()
  const stateListeners: Set<(state: MobileMapRenderState) => void> = new Set()

  let markerIdCounter = 0
  let activeRoutePolyline: LatLng[] = []
  let alternates: AlternateRoute[] = []
  let selectedAlternateIndex: number | null = null
  let routeStyle: RouteStyleOptions | undefined
  let driverMarker: DriverMarkerState | null = null
  let traveledPolyline: LatLng[] = []
  let navigationState: NavigationState | null = null

  function getRenderState(): MobileMapRenderState {
    return {
      markers: Array.from(markers.values()).map((marker) => ({
        id: marker.id,
        coordinate: toMapCoordinate({ lat: marker.lat, lng: marker.lng }),
        label: marker.label,
        draggable: marker.draggable,
        icon: marker.icon,
        isDriver: false
      })),
      driverMarker: driverMarker
        ? {
            id: 'driver-marker',
            coordinate: toMapCoordinate({ lat: driverMarker.lat, lng: driverMarker.lng }),
            icon: driverMarker.icon,
            image: driverMarker.image,
            isDriver: true,
            heading: normalizeAngle(driverMarker.heading + driverMarker.rotationOffsetDegrees)
          }
        : null,
      route: {
        primary: toMapCoordinates(activeRoutePolyline),
        traveled: toMapCoordinates(traveledPolyline),
        alternates: alternates.map((alt) => toMapCoordinates(alt.polyline)),
        style: routeStyle
      },
      selectedAlternateIndex
    }
  }

  function notifyStateChange(): void {
    const snapshot = getRenderState()
    config.onStateChange?.(snapshot)
    stateListeners.forEach((cb) => cb(snapshot))
  }

  function emitEvent(event: NavigationEvent): void {
    navigationListeners.forEach((cb) => cb(event))
  }

  function fitCoordinates(polyline: LatLng[], options?: FitBoundsOptions): void {
    if (polyline.length === 0) return

    const coordinates = toMapCoordinates(polyline)
    config.mapRef?.fitToCoordinates?.(coordinates, {
      edgePadding: options?.edgePadding ?? config.fitEdgePadding,
      animated: options?.animated ?? true
    })
  }

  return {
    addMarker(options: MarkerOptions): NavigatrMarker {
      const id = `marker-${markerIdCounter++}`
      const marker: InternalMarker = {
        id,
        lat: options.lat,
        lng: options.lng,
        label: options.label,
        draggable: options.draggable,
        icon: options.icon,
        onDragEnd: options.onDragEnd
      }
      markers.set(id, marker)
      notifyStateChange()

      return {
        id,
        setLatLng(location: LatLng): void {
          const current = markers.get(id)
          if (!current) return
          current.lat = location.lat
          current.lng = location.lng
          notifyStateChange()
        },
        remove(): void {
          markers.delete(id)
          notifyStateChange()
        }
      }
    },

    drawRoute(polyline: LatLng[], style?: RouteStyleOptions): void {
      activeRoutePolyline = [...polyline]
      routeStyle = style
      traveledPolyline = []
      notifyStateChange()
    },

    fitRoute(polyline: LatLng[], options?: FitBoundsOptions): void {
      fitCoordinates(polyline, options)
    },

    clearRoute(): void {
      activeRoutePolyline = []
      alternates = []
      selectedAlternateIndex = null
      traveledPolyline = []
      routeStyle = undefined
      notifyStateChange()
    },

    updateDriverMarker(options: DriverMarkerOptions): void {
      driverMarker = {
        lat: options.lat,
        lng: options.lng,
        heading: options.heading ?? 0,
        rotationOffsetDegrees: options.rotationOffsetDegrees ?? driverMarker?.rotationOffsetDegrees ?? 0,
        icon: options.icon ?? 'default',
        image: options.image
      }
      notifyStateChange()
    },

    removeDriverMarker(): void {
      driverMarker = null
      notifyStateChange()
    },

    panTo(location: LatLng, durationMs?: number): void {
      const camera = {
        center: toMapCoordinate(location),
        zoom: config.zoom,
        pitch: config.pitch ?? 0,
        heading: config.bearing ?? 0
      }
      config.mapRef?.animateCamera?.(camera, { duration: durationMs ?? 300 })
    },

    onClick(callback: (location: LatLng) => void): () => void {
      clickListeners.add(callback)
      return () => clickListeners.delete(callback)
    },

    handleMapPress(location: LatLng): void {
      clickListeners.forEach((cb) => cb(location))
    },

    startNavigation(route: RouteResult): void {
      if (route.polyline.length < 2) {
        throw new Error('Route must have at least 2 points')
      }

      const start = route.polyline[0]
      const next = route.polyline[1]
      const heading = bearingDegrees(start, next)

      activeRoutePolyline = [...route.polyline]
      traveledPolyline = []
      navigationState = {
        route,
        routePolyline: [...route.polyline],
        isNavigating: true,
        lastNearestIndex: 0,
        lastHeading: heading
      }

      driverMarker = {
        lat: start.lat,
        lng: start.lng,
        heading,
        rotationOffsetDegrees: driverMarker?.rotationOffsetDegrees ?? 0,
        icon: driverMarker?.icon ?? 'car',
        image: driverMarker?.image
      }

      config.mapRef?.animateCamera?.(
        {
          center: toMapCoordinate(start),
          zoom: NAVIGATION_ZOOM,
          altitude: 700,
          pitch: NAVIGATION_PITCH,
          heading
        },
        { duration: 500 }
      )

      emitEvent({ type: 'navigation_started' })
      notifyStateChange()
    },

    updatePosition(position: LatLng): void {
      if (!navigationState || !navigationState.isNavigating) return

      const polyline = navigationState.routePolyline
      const nearest = findNearestIndex(position, polyline)
      const nearestIndex = Math.max(nearest.index, navigationState.lastNearestIndex)

      if (nearest.distanceMeters > OFF_ROUTE_THRESHOLD_METERS) {
        emitEvent({ type: 'off_route', distanceMeters: nearest.distanceMeters })
      }

      traveledPolyline = polyline.slice(0, nearestIndex + 1)
      const nearestPoint = polyline[nearestIndex]

      const isArrived =
        nearestIndex >= polyline.length - 1 ||
        distanceMeters(position, polyline[polyline.length - 1]) < ARRIVAL_THRESHOLD_METERS

      if (isArrived) {
        emitEvent({ type: 'arrived' })
        this.stopNavigation()
        return
      }

      const lookAheadIndex = Math.min(nearestIndex + 1, polyline.length - 1)
      const rawHeading = bearingDegrees(nearestPoint, polyline[lookAheadIndex])
      const heading = smoothHeading(navigationState.lastHeading, rawHeading)
      navigationState.lastHeading = heading
      navigationState.lastNearestIndex = nearestIndex

      const nearestTurn = findNearestUpcomingManeuver(nearestPoint, navigationState.route.maneuvers)
      if (nearestTurn && nearestTurn.distanceMeters < TURN_ZOOM_THRESHOLD_METERS) {
        emitEvent({
          type: 'turn_approaching',
          maneuver: nearestTurn.maneuver,
          distanceMeters: nearestTurn.distanceMeters
        })
      }

      driverMarker = {
        lat: nearestPoint.lat,
        lng: nearestPoint.lng,
        heading,
        rotationOffsetDegrees: driverMarker?.rotationOffsetDegrees ?? 0,
        icon: driverMarker?.icon ?? 'car',
        image: driverMarker?.image
      }

      config.mapRef?.animateCamera?.(
        {
          center: toMapCoordinate(nearestPoint),
          altitude: 700,
          heading,
          pitch: NAVIGATION_PITCH
        },
        { duration: 300 }
      )

      notifyStateChange()
    },

    stopNavigation(): void {
      if (navigationState) {
        navigationState.isNavigating = false
        navigationState = null
      }

      traveledPolyline = []
      config.mapRef?.animateCamera?.(
        {
          altitude: 1500,
          pitch: 0,
          heading: 0,
          zoom: 15
        },
        { duration: 400 }
      )

      emitEvent({ type: 'navigation_stopped' })
      notifyStateChange()
    },

    onNavigationEvent(callback: NavigationEventCallback): () => void {
      navigationListeners.add(callback)
      return () => navigationListeners.delete(callback)
    },

    updateTraveledRoute(polyline: LatLng[], currentIndex: number): void {
      if (polyline.length === 0) {
        traveledPolyline = []
      } else {
        const safeIndex = Math.max(0, Math.min(currentIndex, polyline.length - 1))
        traveledPolyline = polyline.slice(0, safeIndex + 1)
      }
      notifyStateChange()
    },

    drawAlternateRoutes(nextAlternates: AlternateRoute[]): void {
      alternates = [...nextAlternates]
      notifyStateChange()
    },

    switchRoute(index: number): void {
      if (index < 0 || index >= alternates.length) return

      const newActive = alternates[index]
      const oldActive = activeRoutePolyline

      activeRoutePolyline = [...newActive.polyline]
      selectedAlternateIndex = index

      const updatedAlternates = [...alternates]
      updatedAlternates.splice(index, 1)

      if (oldActive.length > 0) {
        updatedAlternates.push({
          durationSeconds: 0,
          durationText: '',
          distanceMeters: 0,
          distanceText: '',
          polyline: oldActive
        })
      }

      alternates = updatedAlternates
      fitCoordinates(activeRoutePolyline)
      notifyStateChange()
    },

    onAlternateRouteClick(callback: (index: number) => void): () => void {
      alternateRouteClickListeners.add(callback)
      return () => alternateRouteClickListeners.delete(callback)
    },

    handleAlternateRoutePress(index: number): void {
      alternateRouteClickListeners.forEach((cb) => cb(index))
      this.switchRoute(index)
    },

    getRenderState(): MobileMapRenderState {
      return getRenderState()
    },

    subscribe(callback: (state: MobileMapRenderState) => void): () => void {
      stateListeners.add(callback)
      callback(getRenderState())
      return () => stateListeners.delete(callback)
    }
  }
}

export function createInitialRegion(config: MapConfig): Region {
  const center = config.center
  const approx = getBoundingRegion([center], { minDelta: 0.02 })
  return {
    latitude: center.lat,
    longitude: center.lng,
    latitudeDelta: approx.latitudeDelta,
    longitudeDelta: approx.longitudeDelta
  }
}
