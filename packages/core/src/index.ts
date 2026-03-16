import type { LatLng, GeocodeResult, RouteResult, RouteOptions, Maneuver, NavigatrConfig, AutocompleteResult } from './types'
import { getRoute } from './route'
import { geocode as geocodeAddress, reverseGeocode as reverseGeocodeCoords } from './geocode'
import { autocomplete as autocompleteSearch } from './autocomplete'

export class NavigatrCore {
  private valhallaUrl: string
  private nominatimUrl: string
  private photonUrl: string

  constructor(config?: NavigatrConfig) {
    this.valhallaUrl = config?.valhallaUrl ?? 'https://valhalla1.openstreetmap.de'
    this.nominatimUrl = config?.nominatimUrl ?? 'https://nominatim.openstreetmap.org'
    this.photonUrl = config?.photonUrl ?? 'https://photon.komoot.io'
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
}

export type { LatLng, GeocodeResult, RouteResult, RouteOptions, Maneuver, NavigatrConfig, AutocompleteResult }
