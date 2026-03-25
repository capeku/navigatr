import { beforeEach, describe, expect, it, vi } from 'vitest'
import { geocode, reverseGeocode } from '../src/geocode'

describe('geocode', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns parsed coordinates for successful geocoding', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [
          {
            lat: '5.6037',
            lon: '-0.1870',
            display_name: 'Accra Mall, Ghana'
          }
        ]
      })
    )

    const result = await geocode('Accra Mall, Ghana', 'https://nominatim.test')
    expect(result).toEqual({
      lat: 5.6037,
      lng: -0.187,
      displayName: 'Accra Mall, Ghana'
    })
  })

  it('throws when no results are returned', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => []
      })
    )

    await expect(geocode('Unknown Place', 'https://nominatim.test')).rejects.toThrow(
      'No results found for address: Unknown Place'
    )
  })

  it('throws for non-2xx geocoding responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error'
      })
    )

    await expect(geocode('Accra', 'https://nominatim.test')).rejects.toThrow(
      'Nominatim geocoding failed: 500 Server Error'
    )
  })

  it('forwards country and feature filters to nominatim', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => [
        {
          lat: '46.2276',
          lon: '2.2137',
          display_name: 'France'
        }
      ]
    })
    vi.stubGlobal('fetch', fetchMock)

    await geocode('France', 'https://nominatim.test', {
      countryCodes: ['fr'],
      featureType: 'country',
      extraParams: { polygon_geojson: 1 }
    })

    const requestUrl = String(fetchMock.mock.calls[0][0])
    expect(requestUrl).toContain('countrycodes=fr')
    expect(requestUrl).toContain('featuretype=country')
    expect(requestUrl).toContain('polygon_geojson=1')
  })
})

describe('reverseGeocode', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('returns parsed reverse geocoding result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          lat: '5.6037',
          lon: '-0.1870',
          display_name: 'Accra Mall, Ghana'
        })
      })
    )

    const result = await reverseGeocode(5.6037, -0.187, 'https://nominatim.test')
    expect(result).toEqual({
      lat: 5.6037,
      lng: -0.187,
      displayName: 'Accra Mall, Ghana'
    })
  })

  it('throws when reverse geocoding returns invalid payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ display_name: 'No coordinates' })
      })
    )

    await expect(reverseGeocode(5.6, -0.2, 'https://nominatim.test')).rejects.toThrow(
      'No results found for coordinates: 5.6, -0.2'
    )
  })
})
