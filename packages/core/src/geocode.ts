import type { GeocodeResult, GeocodeSearchOptions, QueryParamValue, ReverseGeocodeOptions } from './types'

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

function appendQueryParam(params: URLSearchParams, key: string, value: QueryParamValue): void {
  if (value === undefined || value === null) return
  if (Array.isArray(value)) {
    for (const item of value) {
      params.append(key, String(item))
    }
    return
  }
  params.set(key, String(value))
}

function applyNominatimSearchOptions(params: URLSearchParams, options?: GeocodeSearchOptions): void {
  if (!options) return

  if (options.limit !== undefined) params.set('limit', String(options.limit))
  if (options.countryCodes !== undefined) {
    const countryCodes = Array.isArray(options.countryCodes)
      ? options.countryCodes.join(',')
      : options.countryCodes
    params.set('countrycodes', countryCodes)
  }
  if (options.country) params.set('country', options.country)
  if (options.featureType) params.set('featuretype', options.featureType)
  if (options.language) params.set('accept-language', options.language)
  if (options.bounded !== undefined) params.set('bounded', options.bounded ? '1' : '0')
  if (options.viewbox !== undefined) {
    const viewbox = Array.isArray(options.viewbox) ? options.viewbox.join(',') : options.viewbox
    params.set('viewbox', viewbox)
  }
  if (options.addressdetails !== undefined) params.set('addressdetails', options.addressdetails ? '1' : '0')
  if (options.extratags !== undefined) params.set('extratags', options.extratags ? '1' : '0')
  if (options.namedetails !== undefined) params.set('namedetails', options.namedetails ? '1' : '0')
  if (options.dedupe !== undefined) params.set('dedupe', options.dedupe ? '1' : '0')

  if (options.extraParams) {
    for (const [key, value] of Object.entries(options.extraParams)) {
      appendQueryParam(params, key, value)
    }
  }
}

function applyNominatimReverseOptions(params: URLSearchParams, options?: ReverseGeocodeOptions): void {
  if (!options) return

  if (options.language) params.set('accept-language', options.language)
  if (options.zoom !== undefined) params.set('zoom', String(options.zoom))
  if (options.addressdetails !== undefined) params.set('addressdetails', options.addressdetails ? '1' : '0')
  if (options.extratags !== undefined) params.set('extratags', options.extratags ? '1' : '0')
  if (options.namedetails !== undefined) params.set('namedetails', options.namedetails ? '1' : '0')

  if (options.extraParams) {
    for (const [key, value] of Object.entries(options.extraParams)) {
      appendQueryParam(params, key, value)
    }
  }
}

export async function geocode(
  address: string,
  nominatimUrl: string = DEFAULT_NOMINATIM_URL,
  options?: GeocodeSearchOptions
): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1'
  })
  applyNominatimSearchOptions(params, options)

  const response = await fetch(`${nominatimUrl}/search?${params}`, {
    headers: {
      'User-Agent': USER_AGENT
    }
  })

  if (!response.ok) {
    throw new Error(
      `Nominatim geocoding failed: ${response.status} ${response.statusText}`
    )
  }

  const results: NominatimSearchResult[] = await response.json()

  if (results.length === 0) {
    throw new Error(`No results found for address: ${address}`)
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
  options?: ReverseGeocodeOptions
): Promise<GeocodeResult> {
  const params = new URLSearchParams({
    lat: lat.toString(),
    lon: lng.toString(),
    format: 'json'
  })
  applyNominatimReverseOptions(params, options)

  const response = await fetch(`${nominatimUrl}/reverse?${params}`, {
    headers: {
      'User-Agent': USER_AGENT
    }
  })

  if (!response.ok) {
    throw new Error(
      `Nominatim reverse geocoding failed: ${response.status} ${response.statusText}`
    )
  }

  const result: NominatimReverseResult = await response.json()

  if (!result.lat || !result.lon) {
    throw new Error(`No results found for coordinates: ${lat}, ${lng}`)
  }

  return {
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    displayName: result.display_name
  }
}
