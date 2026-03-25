import type { AutocompleteOptions, AutocompleteResult, QueryParamValue } from './types'

const DEFAULT_PHOTON_URL = 'https://photon.komoot.io'
const USER_AGENT = 'navigatr-sdk/1.0'

interface PhotonFeature {
  type: 'Feature'
  properties: {
    osm_id: number
    osm_type: string
    countrycode?: string
    name?: string
    city?: string
    state?: string
    country?: string
    street?: string
    postcode?: string
    housenumber?: string
    district?: string
    locality?: string
  }
  geometry: {
    type: 'Point'
    coordinates: [number, number] // [lng, lat]
  }
}

interface PhotonResponse {
  type: 'FeatureCollection'
  features: PhotonFeature[]
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

function applyAutocompleteOptions(params: URLSearchParams, options: AutocompleteOptions): void {
  if (options.language) params.set('lang', options.language)
  if (options.locationBias) {
    params.set('lat', String(options.locationBias.lat))
    params.set('lon', String(options.locationBias.lng))
  }
  if (options.bbox !== undefined) {
    const bbox = Array.isArray(options.bbox) ? options.bbox.join(',') : options.bbox
    params.set('bbox', bbox)
  }
  if (options.osmTag !== undefined) appendQueryParam(params, 'osm_tag', options.osmTag)
  if (options.layer !== undefined) appendQueryParam(params, 'layer', options.layer)

  if (options.extraParams) {
    for (const [key, value] of Object.entries(options.extraParams)) {
      appendQueryParam(params, key, value)
    }
  }
}

function buildDisplayName(props: PhotonFeature['properties']): string {
  const parts: string[] = []

  if (props.name) parts.push(props.name)
  if (props.street) {
    const street = props.housenumber
      ? `${props.street} ${props.housenumber}`
      : props.street
    if (street !== props.name) parts.push(street)
  }
  if (props.district && props.district !== props.name) parts.push(props.district)
  if (props.city && props.city !== props.name) parts.push(props.city)
  if (props.state) parts.push(props.state)
  if (props.country) parts.push(props.country)

  return parts.join(', ')
}

export async function autocomplete(
  query: string,
  options: AutocompleteOptions & { photonUrl?: string } = {}
): Promise<AutocompleteResult[]> {
  const { limit = 5, photonUrl = DEFAULT_PHOTON_URL } = options
  const normalizedCountryCodes = options.countryCodes
    ? (Array.isArray(options.countryCodes) ? options.countryCodes : [options.countryCodes]).map((code) =>
        code.trim().toUpperCase()
      )
    : null

  // Country filtering is performed client-side because Photon doesn't expose a country param.
  // Over-fetch so we still have enough in-country candidates after filtering.
  const fetchLimit = normalizedCountryCodes?.length ? Math.min(Math.max(limit * 10, 25), 100) : limit

  const params = new URLSearchParams({
    q: query,
    limit: fetchLimit.toString()
  })
  applyAutocompleteOptions(params, options)

  const response = await fetch(`${photonUrl}/api/?${params}`, {
    headers: {
      'User-Agent': USER_AGENT
    }
  })

  if (!response.ok) {
    throw new Error(
      `Photon autocomplete failed: ${response.status} ${response.statusText}`
    )
  }

  const data: PhotonResponse = await response.json()

  const features = normalizedCountryCodes?.length
    ? data.features.filter((feature) => {
        const code = feature.properties.countrycode?.toUpperCase()
        return Boolean(code && normalizedCountryCodes.includes(code))
      })
    : data.features

  return features.slice(0, limit).map((feature): AutocompleteResult => {
    const [lng, lat] = feature.geometry.coordinates
    const props = feature.properties

    return {
      lat,
      lng,
      displayName: buildDisplayName(props),
      name: props.name || '',
      city: props.city,
      state: props.state,
      country: props.country,
      street: props.street,
      postcode: props.postcode
    }
  })
}
