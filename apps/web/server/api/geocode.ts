// Simple in-memory cache and rate limiter
const cache = new Map<string, { data: unknown; timestamp: number }>()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1100 // 1.1 seconds between requests (Nominatim requires 1/sec)

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
  const address = query.q as string

  if (!address) {
    throw createError({ statusCode: 400, message: 'Missing address parameter' })
  }

  // Check cache first
  const cacheKey = address.toLowerCase().trim()
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data
  }

  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1'
  })

  const response = await rateLimitedFetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        'User-Agent': 'navigatr-demo/1.0 (https://github.com/capeku/navigatr; contact@navigatr.dev)'
      }
    }
  )

  if (!response.ok) {
    throw createError({ statusCode: response.status, message: 'Geocoding failed' })
  }

  const data = await response.json()

  // Cache the result
  cache.set(cacheKey, { data, timestamp: Date.now() })

  return data
})
