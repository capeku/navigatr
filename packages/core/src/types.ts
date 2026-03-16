export interface LatLng {
  lat: number
  lng: number
}

export interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
}

export interface Maneuver {
  instruction: string
  type: string
  distanceMeters: number
  distanceText: string
  durationSeconds: number
  durationText: string
  startPoint: LatLng
}

export interface RouteOptions {
  origin: LatLng
  destination: LatLng
  maneuvers?: boolean
  traffic?: boolean
}

export interface RouteResult {
  durationSeconds: number
  durationText: string
  distanceMeters: number
  distanceText: string
  polyline: LatLng[]
  maneuvers?: Maneuver[]
}

export interface NavigatrConfig {
  valhallaUrl?: string
  nominatimUrl?: string
}
