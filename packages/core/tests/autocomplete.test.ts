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
})
