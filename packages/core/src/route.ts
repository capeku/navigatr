import type { LatLng, RouteResult } from './types'
import { decodePolyline } from './utils/polyline'
import { formatDuration, formatDistance } from './utils/format'

const DEFAULT_VALHALLA_URL = 'https://valhalla1.openstreetmap.de'

interface ValhallaLocation {
  lon: number
  lat: number
  type: 'break'
}

interface ValhallaRequest {
  locations: ValhallaLocation[]
  costing: string
  directions_options: {
    units: string
  }
}

interface ValhallaResponse {
  trip: {
    legs: Array<{
      shape: string
    }>
    summary: {
      time: number
      length: number
    }
  }
}

export async function getRoute(
  origin: LatLng,
  destination: LatLng,
  valhallaUrl: string = DEFAULT_VALHALLA_URL
): Promise<RouteResult> {
  const requestBody: ValhallaRequest = {
    locations: [
      { lon: origin.lng, lat: origin.lat, type: 'break' },
      { lon: destination.lng, lat: destination.lat, type: 'break' }
    ],
    costing: 'auto',
    directions_options: { units: 'km' }
  }

  const response = await fetch(`${valhallaUrl}/route`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    throw new Error(
      `Valhalla routing failed: ${response.status} ${response.statusText} - ${errorText}`
    )
  }

  const data: ValhallaResponse = await response.json()

  const encodedPolyline = data.trip.legs[0].shape
  const polyline = decodePolyline(encodedPolyline)

  const durationSeconds = data.trip.summary.time
  const distanceMeters = data.trip.summary.length * 1000

  return {
    durationSeconds,
    durationText: formatDuration(durationSeconds),
    distanceMeters,
    distanceText: formatDistance(distanceMeters),
    polyline
  }
}
