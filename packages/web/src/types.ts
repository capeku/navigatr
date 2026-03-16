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

export interface NavigatrMap {
  addMarker(options: MarkerOptions): void
  drawRoute(polyline: LatLng[]): void
  fitRoute(polyline: LatLng[]): void
  clearRoute(): void
}
