import type { LatLng, RouteResult, RouteOptions, Maneuver } from './types'
import { decodePolyline } from './utils/polyline'
import { formatDuration, formatDistance } from './utils/format'

const DEFAULT_VALHALLA_URL = 'https://valhalla1.openstreetmap.de'

interface ValhallaLocation {
  lon: number
  lat: number
  type: 'break'
}

interface ValhallaManeuver {
  instruction: string
  type: number
  length: number
  time: number
  begin_shape_index: number
}

interface ValhallaRequest {
  locations: ValhallaLocation[]
  costing: string
  costing_options?: {
    auto?: {
      use_traffic?: number
    }
  }
  directions_options: {
    units: string
  }
}

interface ValhallaResponse {
  trip: {
    legs: Array<{
      shape: string
      maneuvers: ValhallaManeuver[]
    }>
    summary: {
      time: number
      length: number
    }
  }
}

const MANEUVER_TYPES: Record<number, string> = {
  0: 'none',
  1: 'start',
  2: 'start_right',
  3: 'start_left',
  4: 'destination',
  5: 'destination_right',
  6: 'destination_left',
  7: 'becomes',
  8: 'continue',
  9: 'slight_right',
  10: 'right',
  11: 'sharp_right',
  12: 'u_turn_right',
  13: 'u_turn_left',
  14: 'sharp_left',
  15: 'left',
  16: 'slight_left',
  17: 'ramp_straight',
  18: 'ramp_right',
  19: 'ramp_left',
  20: 'exit_right',
  21: 'exit_left',
  22: 'stay_straight',
  23: 'stay_right',
  24: 'stay_left',
  25: 'merge',
  26: 'roundabout_enter',
  27: 'roundabout_exit',
  28: 'ferry_enter',
  29: 'ferry_exit'
}

export async function getRoute(
  options: RouteOptions,
  valhallaUrl: string = DEFAULT_VALHALLA_URL
): Promise<RouteResult> {
  const { origin, destination, maneuvers: includeManeuvers, traffic } = options

  const requestBody: ValhallaRequest = {
    locations: [
      { lon: origin.lng, lat: origin.lat, type: 'break' },
      { lon: destination.lng, lat: destination.lat, type: 'break' }
    ],
    costing: 'auto',
    directions_options: { units: 'km' }
  }

  if (traffic) {
    requestBody.costing_options = {
      auto: {
        use_traffic: 1
      }
    }
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

  const result: RouteResult = {
    durationSeconds,
    durationText: formatDuration(durationSeconds),
    distanceMeters,
    distanceText: formatDistance(distanceMeters),
    polyline
  }

  if (includeManeuvers && data.trip.legs[0].maneuvers) {
    result.maneuvers = data.trip.legs[0].maneuvers.map((m): Maneuver => ({
      instruction: m.instruction,
      type: MANEUVER_TYPES[m.type] || 'unknown',
      distanceMeters: m.length * 1000,
      distanceText: formatDistance(m.length * 1000),
      durationSeconds: m.time,
      durationText: formatDuration(m.time),
      startPoint: polyline[m.begin_shape_index] || polyline[0]
    }))
  }

  return result
}
