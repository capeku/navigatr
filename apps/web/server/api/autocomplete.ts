export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = query.q as string
  const limit = parseInt(query.limit as string) || 5

  if (!q || q.length < 2) {
    return []
  }

  const params = new URLSearchParams({
    q,
    limit: limit.toString()
  })

  const response = await fetch(`https://photon.komoot.io/api/?${params}`, {
    headers: {
      'User-Agent': 'navigatr-demo/1.0'
    }
  })

  if (!response.ok) {
    throw createError({
      statusCode: response.status,
      message: 'Autocomplete failed'
    })
  }

  const data = await response.json()

  return data.features.map((feature: any) => {
    const [lng, lat] = feature.geometry.coordinates
    const props = feature.properties

    const parts: string[] = []
    if (props.name) parts.push(props.name)
    if (props.street && props.street !== props.name) {
      parts.push(props.housenumber ? `${props.street} ${props.housenumber}` : props.street)
    }
    if (props.city && props.city !== props.name) parts.push(props.city)
    if (props.state) parts.push(props.state)
    if (props.country) parts.push(props.country)

    return {
      lat,
      lng,
      displayName: parts.join(', '),
      name: props.name || '',
      city: props.city,
      country: props.country
    }
  })
})
