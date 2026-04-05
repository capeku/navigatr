import type { LatLng, Maneuver, RouteResult, AlternateRoute, TransitItinerary, StopInfo } from '@navigatr/core'

export interface MapConfig {
  container: string
  center: LatLng
  zoom?: number
  pitch?: number
  bearing?: number
}

export interface MarkerOptions {
  lat: number
  lng: number
  label?: string
  draggable?: boolean
  iconHtml?: string
  onDragEnd?: (location: LatLng) => void
}

export interface DriverMarkerOptions {
  lat: number
  lng: number
  heading?: number
  icon?: 'car' | 'bike' | 'walk' | 'default'
}

export interface RouteStyleOptions {
  color?: string
  weight?: number
  opacity?: number
}

export type LocationUpdateCallback = (location: LatLng) => void

export interface NavigatrMarker {
  setLatLng(location: LatLng): void
  remove(): void
}

// Navigation Events
export type NavigationEvent =
  | { type: 'turn_approaching'; maneuver: Maneuver; distanceMeters: number }
  | { type: 'off_route'; distanceMeters: number }
  | { type: 'arrived' }
  | { type: 'navigation_started' }
  | { type: 'navigation_stopped' }

export type NavigationEventCallback = (event: NavigationEvent) => void

export interface NavigatrMap {
  addMarker(options: MarkerOptions): NavigatrMarker
  drawRoute(polyline: LatLng[], style?: RouteStyleOptions): void
  fitRoute(polyline: LatLng[]): void
  clearRoute(): void
  updateDriverMarker(options: DriverMarkerOptions): void
  removeDriverMarker(): void
  panTo(location: LatLng): void
  onClick(callback: (location: LatLng) => void): () => void

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

  // Transit rendering
  drawTransitRoute(itinerary: TransitItinerary, options?: {
    fitBounds?: boolean
    fitPadding?: number
    activeLegIndex?: number
  }): void
  showStops(stops: StopInfo[] | GeoJSON.FeatureCollection, options?: {
    icon?: string
    iconSize?: number
    color?: string
    showLabels?: boolean
  }): void
  clearTransitRoute(): void
  highlightLeg(index: number): void
}
