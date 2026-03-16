export interface LatLng {
  lat: number
  lng: number
}

export interface GeocodeResult {
  lat: number
  lng: number
  displayName: string
}

export interface RouteResult {
  durationSeconds: number
  durationText: string
  distanceMeters: number
  distanceText: string
  polyline: LatLng[]
}

export interface NavigatrConfig {
  valhallaUrl?: string
  nominatimUrl?: string
}
