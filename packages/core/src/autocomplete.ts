import { NavigatrError, type AutocompleteResult } from './types'
import { fetchWithTimeout } from './utils/request'

const DEFAULT_PHOTON_URL = 'https://photon.komoot.io'
const USER_AGENT = 'navigatr-sdk/1.0'

interface PhotonFeature {
  type: 'Feature'
  properties: {
    osm_id: number
    osm_type: string
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
  options: { limit?: number; photonUrl?: string; timeoutMs?: number } = {}
): Promise<AutocompleteResult[]> {
  const { limit = 5, photonUrl = DEFAULT_PHOTON_URL, timeoutMs } = options

  const params = new URLSearchParams({
    q: query,
    limit: limit.toString()
  })

  const response = await fetchWithTimeout(`${photonUrl}/api/?${params}`, {
    headers: {
      'User-Agent': USER_AGENT
    }
  }, { timeoutMs })

  if (!response.ok) {
    throw new NavigatrError(
      'HTTP_ERROR',
      `Photon autocomplete failed: ${response.status} ${response.statusText}`,
      { status: response.status }
    )
  }

  const data: PhotonResponse = await response.json()

  return data.features.map((feature): AutocompleteResult => {
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
