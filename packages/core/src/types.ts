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
  waypoints?: LatLng[]
  maneuvers?: boolean
  traffic?: boolean
  shortest?: boolean
}

export interface AlternateRoute {
  durationSeconds: number
  durationText: string
  distanceMeters: number
  distanceText: string
  polyline: LatLng[]
}

export interface RouteResult {
  durationSeconds: number
  durationText: string
  distanceMeters: number
  distanceText: string
  polyline: LatLng[]
  maneuvers?: Maneuver[]
  alternates?: AlternateRoute[]
}

export interface AutocompleteResult {
  lat: number
  lng: number
  displayName: string
  name: string
  city?: string
  state?: string
  country?: string
  street?: string
  postcode?: string
}

export interface NavigatrConfig {
  valhallaUrl?: string
  nominatimUrl?: string
  photonUrl?: string
}

// Map Customization Types
export type MapTheme = 'light' | 'dark' | 'satellite' | 'terrain' | 'custom'

export interface MapColors {
  primary?: string
  secondary?: string
  background?: string
  roads?: string
  water?: string
  parks?: string
  buildings?: string
  labels?: string
}

export interface LayerVisibility {
  roads?: boolean
  labels?: boolean
  buildings?: boolean
  water?: boolean
  parks?: boolean
  terrain?: boolean
  traffic?: boolean
  transit?: boolean
}

export interface MarkerStyle {
  iconUrl?: string
  iconSize?: [number, number]
  iconAnchor?: [number, number]
  color?: string
  scale?: number
}

export interface PolylineStyle {
  color?: string
  weight?: number
  opacity?: number
  dashArray?: string
  lineCap?: 'butt' | 'round' | 'square'
  lineJoin?: 'miter' | 'round' | 'bevel'
}

export interface MapStyle {
  id?: string
  name?: string
  theme?: MapTheme
  colors?: MapColors
  layers?: LayerVisibility
  markers?: MarkerStyle
  polyline?: PolylineStyle
}

export interface MapStylePreset {
  id: string
  name: string
  style: MapStyle
}
