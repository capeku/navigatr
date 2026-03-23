import { NavigatrError, type GeocodeResult } from './types'
import { fetchWithTimeout, type RequestOptions } from './utils/request'

const DEFAULT_NOMINATIM_URL = 'https://nominatim.openstreetmap.org'
const USER_AGENT = 'navigatr-sdk/1.0'

interface NominatimSearchResult {
  lat: string
  lon: string
  display_name: string
}

interface NominatimReverseResult {
  lat: string
  lon: string
  display_name: string
}

export async function geocode(
  address: string,
  nominatimUrl: string = DEFAULT_NOMINATIM_URL,
  requestOptions: RequestOptions = {}
): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1'
  })

  const response = await fetchWithTimeout(`${nominatimUrl}/search?${params}`, {
    headers: {
      'User-Agent': USER_AGENT
    }
  }, requestOptions)

  if (!response.ok) {
    throw new NavigatrError(
      'HTTP_ERROR',
      `Nominatim geocoding failed: ${response.status} ${response.statusText}`,
      { status: response.status }
    )
  }

  const results: NominatimSearchResult[] = await response.json()

  if (results.length === 0) {
    throw new NavigatrError('NO_RESULTS', `No results found for address: ${address}`)
  }

  const result = results[0]
  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    displayName: result.display_name
  }
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  nominatimUrl: string = DEFAULT_NOMINATIM_URL,
  requestOptions: RequestOptions = {}
): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: 'json'
  })

  const response = await fetchWithTimeout(`${nominatimUrl}/reverse?${params}`, {
    headers: {
      'User-Agent': USER_AGENT
    }
  }, requestOptions)

  if (!response.ok) {
    throw new NavigatrError(
      'HTTP_ERROR',
      `Nominatim reverse geocoding failed: ${response.status} ${response.statusText}`,
      { status: response.status }
    )
  }

  const result: NominatimReverseResult = await response.json()

  if (!result.lat || !result.lon) {
    throw new NavigatrError('NO_RESULTS', `No results found for coordinates: ${lat}, ${lng}`)
  }

  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    displayName: result.display_name
  }
}
