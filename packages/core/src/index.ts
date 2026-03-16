import type { LatLng, GeocodeResult, RouteResult, NavigatrConfig } from './types'
import { getRoute } from './route'
import { geocode as geocodeAddress, reverseGeocode as reverseGeocodeCoords } from './geocode'

export class NavigatrCore {
  private valhallaUrl: string
  private nominatimUrl: string

  constructor(config?: NavigatrConfig) {
    this.valhallaUrl = config?.valhallaUrl ?? 'https://valhalla1.openstreetmap.de'
    this.nominatimUrl = config?.nominatimUrl ?? 'https://nominatim.openstreetmap.org'
  }

  async route(params: { origin: LatLng; destination: LatLng }): Promise<RouteResult> {
    return getRoute(params.origin, params.destination, this.valhallaUrl)
  }

  async geocode(params: { address: string }): Promise<GeocodeResult> {
    return geocodeAddress(params.address, this.nominatimUrl)
  }

  async reverseGeocode(params: { lat: number; lng: number }): Promise<GeocodeResult> {
    return reverseGeocodeCoords(params.lat, params.lng, this.nominatimUrl)
  }
}

export type { LatLng, GeocodeResult, RouteResult, NavigatrConfig }
