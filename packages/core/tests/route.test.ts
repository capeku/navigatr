import { describe, expect, it, vi, beforeEach } from 'vitest'
import { getRoute } from '../src/route'

const MAIN_SHAPE = '_p~iF~ps|U_ulLnnqC_mqNvxq`@'
const ALT_SHAPE = 'mfp_Ioibf@_seK_seK_seK'

describe('getRoute', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('parses primary route, maneuvers, and alternates', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        trip: {
          legs: [
            {
              shape: MAIN_SHAPE,
              maneuvers: [
                {
                  instruction: 'Turn right onto Main St',
                  type: 10,
                  length: 0.2,
                  time: 30,
                  begin_shape_index: 1
                },
                {
                  instruction: 'Unknown maneuver',
                  type: 999,
                  length: 0.1,
                  time: 20,
                  begin_shape_index: 0
                }
              ]
            }
          ],
          summary: {
            time: 600,
            length: 3.2
          }
        },
        alternates: [
          {
            trip: {
              legs: [{ shape: ALT_SHAPE, maneuvers: [] }],
              summary: { time: 720, length: 3.8 }
            }
          }
        ]
      })
    })

    vi.stubGlobal('fetch', fetchMock)

    const result = await getRoute(
      {
        origin: { lat: 5.6, lng: -0.2 },
        destination: { lat: 5.5, lng: -0.1 },
        maneuvers: true,
        traffic: true,
        shortest: true
      },
      'https://valhalla.test'
    )

    expect(fetchMock).toHaveBeenCalledTimes(1)

    const [url, request] = fetchMock.mock.calls[0]
    expect(url).toBe('https://valhalla.test/route')
    expect(request.method).toBe('POST')

    const body = JSON.parse(request.body as string)
    expect(body.alternates).toBe(3)
    expect(body.costing_options.auto.use_traffic).toBe(1)
    expect(body.costing_options.auto.shortest).toBe(true)

    expect(result.durationSeconds).toBe(600)
    expect(result.distanceMeters).toBe(3200)
    expect(result.polyline.length).toBeGreaterThan(0)
    expect(result.maneuvers?.[0]?.type).toBe('right')
    expect(result.maneuvers?.[1]?.type).toBe('unknown')
    expect(result.alternates?.length).toBe(1)
    expect(result.alternates?.[0]?.distanceMeters).toBe(3800)
  })

  it('throws useful errors for non-2xx responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        text: async () => 'rate limited'
      })
    )

    await expect(
      getRoute(
        {
          origin: { lat: 5.6, lng: -0.2 },
          destination: { lat: 5.5, lng: -0.1 }
        },
        'https://valhalla.test'
      )
    ).rejects.toThrow('Valhalla routing failed: 429 Too Many Requests - rate limited')
  })
})
