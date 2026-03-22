import type { LatLng, GeocodeResult, RouteResult, RouteOptions, Maneuver, NavigatrConfig, AutocompleteResult, MapStyle, MapStylePreset, MapColors, LayerVisibility, MarkerStyle, PolylineStyle, MapTheme, AlternateRoute, BaseMapStylePreset, TravelMode, RequestCacheConfig } from './types'
import { getRoute } from './route'
import { geocode as geocodeAddress, reverseGeocode as reverseGeocodeCoords } from './geocode'
import { autocomplete as autocompleteSearch } from './autocomplete'
import { runWithFallback } from './utils/fallback'
import { InMemoryCache } from './utils/cache'
import * as mapStyleModule from './mapStyle'

const DEFAULT_CACHE_CONFIG: Required<RequestCacheConfig> = {
  enabled: true,
  ttlMs: 5 * 60 * 1000,
  maxEntries: 200
}

export class NavigatrCore {
  private valhallaUrl: string
  private nominatimUrl: string
  private nominatimFallbackUrls: string[]
  private photonUrl: string
  private photonFallbackUrls: string[]
  private cache: InMemoryCache
  private currentStyle: MapStyle

  constructor(config?: NavigatrConfig) {
    const cacheConfig = {
      ...DEFAULT_CACHE_CONFIG,
      ...config?.cache
    }

    this.valhallaUrl = config?.valhallaUrl ?? 'https://valhalla1.openstreetmap.de'
    this.nominatimUrl = config?.nominatimUrl ?? 'https://nominatim.openstreetmap.org'
    this.nominatimFallbackUrls = config?.nominatimFallbackUrls ?? []
    this.photonUrl = config?.photonUrl ?? 'https://photon.komoot.io'
    this.photonFallbackUrls = config?.photonFallbackUrls ?? []
    this.cache = new InMemoryCache(cacheConfig)
    this.currentStyle = mapStyleModule.createStyle()
  }

  async route(params: RouteOptions): Promise<RouteResult> {
    return getRoute(params, this.valhallaUrl)
  }

  async geocode(params: { address: string }): Promise<GeocodeResult> {
    const cacheKey = `geocode:${this.normalizeText(params.address)}`
    const cached = this.cache.get<GeocodeResult>(cacheKey)
    if (cached) {
      return cached
    }

    const result = await runWithFallback(
      'geocoding',
      [this.nominatimUrl, ...this.nominatimFallbackUrls],
      (url) => geocodeAddress(params.address, url)
    )

    this.cache.set(cacheKey, result)
    return result
  }

  async reverseGeocode(params: { lat: number; lng: number }): Promise<GeocodeResult> {
    const cacheKey = `reverse:${this.normalizeCoordinate(params.lat)}:${this.normalizeCoordinate(params.lng)}`
    const cached = this.cache.get<GeocodeResult>(cacheKey)
    if (cached) {
      return cached
    }

    const result = await runWithFallback(
      'reverse geocoding',
      [this.nominatimUrl, ...this.nominatimFallbackUrls],
      (url) => reverseGeocodeCoords(params.lat, params.lng, url)
    )

    this.cache.set(cacheKey, result)
    return result
  }

  async autocomplete(params: { query: string; limit?: number }): Promise<AutocompleteResult[]> {
    const cacheKey = `autocomplete:${this.normalizeText(params.query)}:${params.limit ?? 5}`
    const cached = this.cache.get<AutocompleteResult[]>(cacheKey)
    if (cached) {
      return cached
    }

    const result = await runWithFallback(
      'autocomplete',
      [this.photonUrl, ...this.photonFallbackUrls],
      (url) => autocompleteSearch(params.query, { limit: params.limit, photonUrl: url })
    )

    this.cache.set(cacheKey, result)
    return result
  }

  clearCache(): void {
    this.cache.clear()
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

  private normalizeText(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase()
  }

  private normalizeCoordinate(value: number): string {
    return value.toFixed(6)
  }
}

export type { LatLng, GeocodeResult, RouteResult, RouteOptions, Maneuver, NavigatrConfig, AutocompleteResult, MapStyle, MapStylePreset, MapColors, LayerVisibility, MarkerStyle, PolylineStyle, MapTheme, AlternateRoute, BaseMapStylePreset, TravelMode, RequestCacheConfig }
export { MAP_STYLE_PRESETS } from './mapStyle'
