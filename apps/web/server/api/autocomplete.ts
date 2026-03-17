// Country bounding boxes [minLon, minLat, maxLon, maxLat]
const countryBboxes: Record<string, string> = {
  GH: '-3.25,4.74,1.2,11.17',      // Ghana
  NG: '2.69,4.24,14.68,13.89',     // Nigeria
  KE: '33.91,-4.68,41.91,5.51',    // Kenya
  ZA: '16.34,-34.84,32.89,-22.13', // South Africa
  US: '-125.0,24.4,-66.9,49.4',    // United States (continental)
  GB: '-8.65,49.86,1.77,60.86',    // United Kingdom
  DE: '5.87,47.27,15.04,55.06',    // Germany
  FR: '-5.14,41.33,9.56,51.09',    // France
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = query.q as string
  const limit = parseInt(query.limit as string) || 5
  const countrycode = query.countrycode as string | undefined

  if (!q || q.length < 2) {
    return []
  }

  const params = new URLSearchParams({
    q,
    limit: limit.toString()
  })

  // Add bounding box filter when country code is provided
  if (countrycode && countryBboxes[countrycode]) {
    params.set('bbox', countryBboxes[countrycode])
  }

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
