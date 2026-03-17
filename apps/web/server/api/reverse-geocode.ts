const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1100 // 1.1 seconds between requests

async function rateLimitedFetch(url: string, options: RequestInit): Promise<Response> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime

  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }

  lastRequestTime = Date.now()
  return fetch(url, options)
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const lat = query.lat as string
  const lng = query.lng as string

  if (!lat || !lng) {
    throw createError({ statusCode: 400, message: 'Missing lat/lng parameters' })
  }

  const cacheKey = `${lat},${lng}`
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const params = new URLSearchParams({
    lat,
    lon: lng,
    format: 'json'
  })

  const response = await rateLimitedFetch(
    `https://nominatim.openstreetmap.org/reverse?${params}`,
    {
      headers: {
        'User-Agent': 'navigatr-demo/1.0 (https://github.com/capeku/navigatr; contact@navigatr.dev)'
      }
    }
  )

  if (!response.ok) {
    throw createError({ statusCode: response.status, message: 'Reverse geocoding failed' })
  }

  const data = await response.json()
  cache.set(cacheKey, { data, timestamp: Date.now() })

  return data
})
