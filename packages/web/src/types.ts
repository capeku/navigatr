import type { LatLng } from '@navigatr/core'

export interface MapConfig {
  container: string
  center: LatLng
  zoom?: number
}

export interface MarkerOptions {
  lat: number
  lng: number
  label?: string
  draggable?: boolean
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

export interface NavigatrMap {
  addMarker(options: MarkerOptions): NavigatrMarker
  drawRoute(polyline: LatLng[], style?: RouteStyleOptions): void
  fitRoute(polyline: LatLng[]): void
  clearRoute(): void
  updateDriverMarker(options: DriverMarkerOptions): void
  removeDriverMarker(): void
  panTo(location: LatLng): void
  onClick(callback: (location: LatLng) => void): () => void
}
