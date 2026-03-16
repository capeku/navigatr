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
}

export interface DriverMarkerOptions {
  lat: number
  lng: number
  heading?: number
  icon?: 'car' | 'bike' | 'walk' | 'default'
}

export type LocationUpdateCallback = (location: LatLng) => void

export interface NavigatrMap {
  addMarker(options: MarkerOptions): void
  drawRoute(polyline: LatLng[]): void
  fitRoute(polyline: LatLng[]): void
  clearRoute(): void
  updateDriverMarker(options: DriverMarkerOptions): void
  removeDriverMarker(): void
  panTo(location: LatLng): void
}
