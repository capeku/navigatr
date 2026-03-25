import type { LatLng, Maneuver, RouteResult, AlternateRoute } from '@navigatr/core'
import type { Camera, EdgePadding, MapMarkerProps, MapViewProps, MapUrlTileProps, Region } from 'react-native-maps'

export type MapCoordinate = {
  latitude: number
  longitude: number
}

export interface MapConfig {
  center: LatLng
  zoom?: number
  pitch?: number
  bearing?: number
  mapRef?: MobileMapRef
  fitEdgePadding?: EdgePadding
  onStateChange?: (state: MobileMapRenderState) => void
}

export interface MarkerOptions {
  lat: number
  lng: number
  label?: string
  draggable?: boolean
  icon?: string
  onDragEnd?: (location: LatLng) => void
}

export interface DriverMarkerOptions {
  lat: number
  lng: number
  heading?: number
  rotationOffsetDegrees?: number
  icon?: 'car' | 'bike' | 'walk' | 'default'
  image?: MapMarkerProps['image']
}

export interface RouteStyleOptions {
  color?: string
  weight?: number
  opacity?: number
}

export interface OSMTileOptions {
  urlTemplate?: string
  maximumZ?: number
  minimumZ?: number
  tileSize?: number
  flipY?: boolean
  shouldReplaceMapContentOnAndroid?: boolean
}

export interface OSMTileConfig {
  urlTileProps: Pick<MapUrlTileProps, 'urlTemplate' | 'maximumZ' | 'minimumZ' | 'flipY' | 'tileSize'>
  mapViewProps: Pick<MapViewProps, 'mapType'>
}

export interface FitBoundsOptions {
  edgePadding?: EdgePadding
  animated?: boolean
}

export type LocationUpdateCallback = (location: LatLng) => void

export interface NavigatrMarker {
  id: string
  setLatLng(location: LatLng): void
  remove(): void
}

export interface MobileMapRef {
  animateToRegion?: (region: Region, duration?: number) => void
  animateCamera?: (camera: Partial<Camera>, options?: { duration?: number }) => void
  setCamera?: (camera: Partial<Camera>) => void
  fitToCoordinates?: (
    coordinates: MapCoordinate[],
    options?: {
      edgePadding?: EdgePadding
      animated?: boolean
    }
  ) => void
}

// Navigation Events
export type NavigationEvent =
  | { type: 'turn_approaching'; maneuver: Maneuver; distanceMeters: number }
  | { type: 'off_route'; distanceMeters: number }
  | { type: 'arrived' }
  | { type: 'navigation_started' }
  | { type: 'navigation_stopped' }

export type NavigationEventCallback = (event: NavigationEvent) => void

export interface RouteOverlayData {
  primary: MapCoordinate[]
  alternates: MapCoordinate[][]
}

export interface RouteProgress {
  nearestIndex: number
  distanceToRouteMeters: number
}

export interface BoundingRegionOptions {
  latPaddingRatio?: number
  lngPaddingRatio?: number
  minDelta?: number
}

export interface RenderMarker {
  id: string
  coordinate: MapCoordinate
  label?: string
  draggable?: boolean
  icon?: string
  image?: MapMarkerProps['image']
  isDriver?: boolean
  heading?: number
}

export interface RenderRoute {
  primary: MapCoordinate[]
  traveled: MapCoordinate[]
  alternates: MapCoordinate[][]
  style?: RouteStyleOptions
}

export interface MobileMapRenderState {
  markers: RenderMarker[]
  driverMarker: RenderMarker | null
  route: RenderRoute
  selectedAlternateIndex: number | null
}

export interface NavigatrMobileMap {
  addMarker(options: MarkerOptions): NavigatrMarker
  drawRoute(polyline: LatLng[], style?: RouteStyleOptions): void
  fitRoute(polyline: LatLng[], options?: FitBoundsOptions): void
  clearRoute(): void
  updateDriverMarker(options: DriverMarkerOptions): void
  removeDriverMarker(): void
  panTo(location: LatLng, durationMs?: number): void
  onClick(callback: (location: LatLng) => void): () => void
  handleMapPress(location: LatLng): void

  // Navigation methods
  startNavigation(route: RouteResult): void
  updatePosition(position: LatLng): void
  stopNavigation(): void
  onNavigationEvent(callback: NavigationEventCallback): () => void

  // Route progress visualization
  updateTraveledRoute(polyline: LatLng[], currentIndex: number): void

  // Alternate routes
  drawAlternateRoutes(alternates: AlternateRoute[]): void
  switchRoute(index: number): void
  onAlternateRouteClick(callback: (index: number) => void): () => void
  handleAlternateRoutePress(index: number): void

  // Render-state subscription for React UI integration
  getRenderState(): MobileMapRenderState
  subscribe(callback: (state: MobileMapRenderState) => void): () => void
}

export type RidePhase = 'waiting' | 'pickup' | 'in_progress' | 'completed'

export interface RideConfig {
  pickup: LatLng
  destination: LatLng
  map?: NavigatrMobileMap
  driverMarker?: {
    icon?: 'car' | 'bike' | 'walk' | 'default'
    image?: MapMarkerProps['image']
    rotationOffsetDegrees?: number
  }
  onETAUpdate?: (eta: RouteResult, phase: RidePhase) => void
  onPhaseChange?: (phase: RidePhase) => void
  onDriverMove?: (location: LatLng) => void
}

export type { LatLng, RouteResult, AlternateRoute, Region }
