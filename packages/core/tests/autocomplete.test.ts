import { beforeEach, describe, expect, it, vi } from 'vitest'
import { autocomplete } from '../src/autocomplete'

describe('autocomplete', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns normalized autocomplete entries', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [-0.187, 5.6037]
              },
              properties: {
                osm_id: 1,
                osm_type: 'W',
                name: 'Accra Mall',
                city: 'Accra',
                state: 'Greater Accra',
                country: 'Ghana',
                street: 'Spintex Road',
                postcode: '00233'
              }
            }
          ]
        })
      })
    )

    const result = await autocomplete('Accra Mall', {
      limit: 3,
      photonUrl: 'https://photon.test'
    })

    expect(result).toHaveLength(1)
    expect(result[0].lat).toBe(5.6037)
    expect(result[0].lng).toBe(-0.187)
    expect(result[0].displayName).toContain('Accra Mall')
    expect(result[0].city).toBe('Accra')
  })

  it('throws for non-2xx responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests'
      })
    )

    await expect(
      autocomplete('Accra', {
        photonUrl: 'https://photon.test'
      })
    ).rejects.toThrow('Photon autocomplete failed: 429 Too Many Requests')
  })

  it('forwards autocomplete restriction options to photon', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [36.8, -1.3] },
            properties: {
              osm_id: 1,
              osm_type: 'R',
              countrycode: 'KE',
              name: 'Nairobi',
              country: 'Kenya'
            }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [18.4, -33.9] },
            properties: {
              osm_id: 2,
              osm_type: 'R',
              countrycode: 'ZA',
              name: 'Cape Town',
              country: 'South Africa'
            }
          }
        ]
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    await autocomplete('Nairobi', {
      photonUrl: 'https://photon.test',
      language: 'en',
      countryCodes: ['ke'],
      locationBias: { lat: -1.286389, lng: 36.817223 },
      bbox: [36.6, -1.5, 37.0, -1.1],
      osmTag: ['place:city'],
      layer: ['city']
    })

    const requestUrl = String(fetchMock.mock.calls[0][0])
    expect(requestUrl).toContain('lang=en')
    expect(requestUrl).toContain('lat=-1.286389')
    expect(requestUrl).toContain('lon=36.817223')
    expect(requestUrl).toContain('bbox=36.6%2C-1.5%2C37%2C-1.1')
    expect(requestUrl).toContain('osm_tag=place%3Acity')
    expect(requestUrl).toContain('layer=city')
  })

  it('filters autocomplete results by country code client-side', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [36.8, -1.3] },
              properties: {
                osm_id: 1,
                osm_type: 'R',
                countrycode: 'KE',
                name: 'Nairobi',
                country: 'Kenya'
              }
            },
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [18.4, -33.9] },
              properties: {
                osm_id: 2,
                osm_type: 'R',
                countrycode: 'ZA',
                name: 'Cape Town',
                country: 'South Africa'
              }
            }
          ]
        })
      })
    )

    const result = await autocomplete('city', {
      photonUrl: 'https://photon.test',
      countryCodes: ['ke']
    })

    expect(result).toHaveLength(1)
    expect(result[0].country).toBe('Kenya')
  })

  it('over-fetches when country filtering is enabled and trims to requested limit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [36.8, -1.3] },
            properties: { osm_id: 1, osm_type: 'R', countrycode: 'KE', name: 'Nairobi', country: 'Kenya' }
          },
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [36.9, -1.2] },
            properties: { osm_id: 2, osm_type: 'R', countrycode: 'KE', name: 'Kiambu', country: 'Kenya' }
          }
        ]
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    const result = await autocomplete('nai', {
      photonUrl: 'https://photon.test',
      limit: 1,
      countryCodes: 'ke'
    })

    const requestUrl = String(fetchMock.mock.calls[0][0])
    expect(requestUrl).toContain('limit=25')
    expect(result).toHaveLength(1)
    expect(result[0].country).toBe('Kenya')
  })
})
