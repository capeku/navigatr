import type { LatLng, GeocodeResult, RouteResult, RouteOptions, Maneuver, NavigatrConfig, AutocompleteResult, MapStyle, MapStylePreset, MapColors, LayerVisibility, MarkerStyle, PolylineStyle, MapTheme, AlternateRoute } from './types'
import { getRoute } from './route'
import { geocode as geocodeAddress, reverseGeocode as reverseGeocodeCoords } from './geocode'
import { autocomplete as autocompleteSearch } from './autocomplete'
import * as mapStyleModule from './mapStyle'

export class NavigatrCore {
  private valhallaUrl: string
  private nominatimUrl: string
  private photonUrl: string
  private currentStyle: MapStyle

  constructor(config?: NavigatrConfig) {
    this.valhallaUrl = config?.valhallaUrl ?? 'https://valhalla1.openstreetmap.de'
    this.nominatimUrl = config?.nominatimUrl ?? 'https://nominatim.openstreetmap.org'
    this.photonUrl = config?.photonUrl ?? 'https://photon.komoot.io'
    this.currentStyle = mapStyleModule.createStyle()
  }

  async route(params: RouteOptions): Promise<RouteResult> {
    return getRoute(params, this.valhallaUrl)
  }

  async geocode(params: { address: string }): Promise<GeocodeResult> {
    return geocodeAddress(params.address, this.nominatimUrl)
  }

  async reverseGeocode(params: { lat: number; lng: number }): Promise<GeocodeResult> {
    return reverseGeocodeCoords(params.lat, params.lng, this.nominatimUrl)
  }

  async autocomplete(params: { query: string; limit?: number }): Promise<AutocompleteResult[]> {
    return autocompleteSearch(params.query, { limit: params.limit, photonUrl: this.photonUrl })
  }

  // Map Customization API
  getStylePresets(): MapStylePreset[] {
    return mapStyleModule.getPresets()
  }

  getStylePreset(presetId: string): MapStylePreset | undefined {
    return mapStyleModule.getPreset(presetId)
  }

  setStyle(style: MapStyle): void {
    const validation = mapStyleModule.validateStyle(style)
    if (!validation.valid) {
      throw new Error(`Invalid style: ${validation.errors.join(', ')}`)
    }
    this.currentStyle = style
  }

  setStyleFromPreset(presetId: string, customizations?: Partial<MapStyle>): void {
    this.currentStyle = mapStyleModule.createFromPreset(presetId, customizations)
  }

  getStyle(): MapStyle {
    return { ...this.currentStyle }
  }

  updateStyle(updates: Partial<MapStyle>): void {
    this.currentStyle = mapStyleModule.mergeStyles(this.currentStyle, updates)
  }

  createCustomStyle(options?: Partial<MapStyle>): MapStyle {
    return mapStyleModule.createStyle(options)
  }

  getStyleDefaults(): { colors: MapColors; layers: LayerVisibility; markers: MarkerStyle; polyline: PolylineStyle } {
    return mapStyleModule.getDefaults()
  }

  getStyleAsCSSVariables(prefix?: string): Record<string, string> {
    return mapStyleModule.toCSSVariables(this.currentStyle, prefix)
  }

  validateStyle(style: MapStyle): { valid: boolean; errors: string[] } {
    return mapStyleModule.validateStyle(style)
  }
}

export type { LatLng, GeocodeResult, RouteResult, RouteOptions, Maneuver, NavigatrConfig, AutocompleteResult, MapStyle, MapStylePreset, MapColors, LayerVisibility, MarkerStyle, PolylineStyle, MapTheme, AlternateRoute }
export { MAP_STYLE_PRESETS } from './mapStyle'
