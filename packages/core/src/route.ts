import type { LatLng, RouteResult, RouteOptions, Maneuver, AlternateRoute, TravelMode } from './types'
import { decodePolyline } from './utils/polyline'
import { formatDuration, formatDistance } from './utils/format'

const DEFAULT_VALHALLA_URL = 'https://valhalla1.openstreetmap.de'
const MODE_TO_COSTING: Record<TravelMode, 'auto' | 'pedestrian' | 'bicycle'> = {
  drive: 'auto',
  walk: 'pedestrian',
  bike: 'bicycle'
}

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
  costing_options?: Record<string, {
    use_traffic?: number
    shortest?: boolean
    use_tolls?: number
    use_highways?: number
    use_ferry?: number
    exclude_tolls?: boolean
    exclude_highways?: boolean
    exclude_ferries?: boolean
  }>
  directions_options: {
    units: string
  }
  alternates?: number
}

interface ValhallaTrip {
  legs: Array<{
    shape: string
    maneuvers: ValhallaManeuver[]
  }>
  summary: {
    time: number
    length: number
  }
}

interface ValhallaResponse {
  trip: ValhallaTrip
  alternates?: Array<{
    trip: ValhallaTrip
  }>
}

function resolveAlternatesOption(
  alternates: RouteOptions['alternates'],
  waypointCount: number
): number | undefined {
  if (typeof alternates === 'number') {
    return Math.max(0, Math.floor(alternates))
  }

  if (alternates === true) {
    return 3
  }

  if (alternates === false) {
    return undefined
  }

  // Multi-stop routes are much heavier on public Valhalla instances,
  // so keep alternates off by default there and preserve them for direct routes.
  return waypointCount > 0 ? undefined : 3
}

async function requestRoute(
  valhallaUrl: string,
  requestBody: ValhallaRequest
): Promise<ValhallaResponse> {
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

  return response.json()
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

const INTERMEDIATE_DESTINATION_TYPES = new Set([4, 5, 6])

function pointsEqual(a: LatLng, b: LatLng): boolean {
  return a.lat === b.lat && a.lng === b.lng
}

function buildRoutePolyline(legs: ValhallaTrip['legs']): {
  polyline: LatLng[]
  legStartIndices: number[]
} {
  const polyline: LatLng[] = []
  const legStartIndices: number[] = []

  legs.forEach((leg, index) => {
    const decodedLeg = decodePolyline(leg.shape)

    if (decodedLeg.length === 0) {
      legStartIndices.push(Math.max(polyline.length - 1, 0))
      return
    }

    const sharesBoundaryPoint =
      index > 0 &&
      polyline.length > 0 &&
      pointsEqual(polyline[polyline.length - 1], decodedLeg[0])

    const legStartIndex = sharesBoundaryPoint
      ? polyline.length - 1
      : polyline.length

    legStartIndices.push(legStartIndex)
    polyline.push(...(sharesBoundaryPoint ? decodedLeg.slice(1) : decodedLeg))
  })

  return { polyline, legStartIndices }
}

function buildManeuvers(
  legs: ValhallaTrip['legs'],
  polyline: LatLng[],
  legStartIndices: number[]
): Maneuver[] {
  return legs.flatMap((leg, legIndex) =>
    leg.maneuvers.flatMap((m): Maneuver[] => {
      if (
        legIndex < legs.length - 1 &&
        INTERMEDIATE_DESTINATION_TYPES.has(m.type)
      ) {
        return []
      }

      const startPointIndex = legStartIndices[legIndex] + m.begin_shape_index

      return [{
        instruction: m.instruction,
        type: MANEUVER_TYPES[m.type] || 'unknown',
        distanceMeters: m.length * 1000,
        distanceText: formatDistance(m.length * 1000),
        durationSeconds: m.time,
        durationText: formatDuration(m.time),
        startPoint: polyline[startPointIndex] || polyline[polyline.length - 1] || polyline[0]
      }]
    })
  )
}

function buildAlternateRoute(altTrip: ValhallaTrip): AlternateRoute {
  const { polyline } = buildRoutePolyline(altTrip.legs)
  const durationSeconds = altTrip.summary.time
  const distanceMeters = altTrip.summary.length * 1000

  return {
    durationSeconds,
    durationText: formatDuration(durationSeconds),
    distanceMeters,
    distanceText: formatDistance(distanceMeters),
    polyline
  }
}

export async function getRoute(
  options: RouteOptions,
  valhallaUrl: string = DEFAULT_VALHALLA_URL
): Promise<RouteResult> {
  const {
    origin,
    destination,
    waypoints = [],
    mode = 'drive',
    alternates,
    maneuvers: includeManeuvers,
    traffic,
    shortest,
    avoidTolls,
    avoidHighways,
    avoidFerries
  } = options
  const costing = MODE_TO_COSTING[mode]
  const resolvedAlternates = resolveAlternatesOption(alternates, waypoints.length)

  const requestBody: ValhallaRequest = {
    locations: [origin, ...waypoints, destination].map((location) => ({
      lon: location.lng,
      lat: location.lat,
      type: 'break'
    })),
    costing,
    directions_options: { units: 'km' }
  }

  if (resolvedAlternates && resolvedAlternates > 0) {
    requestBody.alternates = resolvedAlternates
  }

  const costingOptions: {
    use_traffic?: number
    shortest?: boolean
    use_tolls?: number
    use_highways?: number
    use_ferry?: number
    exclude_tolls?: boolean
    exclude_highways?: boolean
    exclude_ferries?: boolean
  } = {}

  if (traffic && mode === 'drive') {
    costingOptions.use_traffic = 1
  }

  if (shortest) {
    costingOptions.shortest = true
  }

  if (mode === 'drive') {
    if (avoidTolls) {
      costingOptions.use_tolls = 0
    }
    if (avoidHighways) {
      costingOptions.use_highways = 0
    }
    if (avoidFerries) {
      costingOptions.use_ferry = 0
    }
  } else {
    if (avoidTolls) {
      costingOptions.exclude_tolls = true
    }
    if (avoidHighways) {
      costingOptions.exclude_highways = true
    }
    if (avoidFerries) {
      costingOptions.exclude_ferries = true
    }
  }

  if (Object.keys(costingOptions).length > 0) {
    requestBody.costing_options = {
      [costing]: costingOptions
    }
  }

  let data: ValhallaResponse
  try {
    data = await requestRoute(valhallaUrl, requestBody)
  } catch (error) {
    const shouldRetryWithoutAlternates =
      requestBody.alternates &&
      requestBody.alternates > 0 &&
      error instanceof Error &&
      error.message.includes('429')

    if (!shouldRetryWithoutAlternates) {
      throw error
    }

    const fallbackRequestBody: ValhallaRequest = {
      ...requestBody
    }
    delete fallbackRequestBody.alternates
    data = await requestRoute(valhallaUrl, fallbackRequestBody)
  }

  const { polyline, legStartIndices } = buildRoutePolyline(data.trip.legs)
  const durationSeconds = data.trip.summary.time
  const distanceMeters = data.trip.summary.length * 1000

  const result: RouteResult = {
    durationSeconds,
    durationText: formatDuration(durationSeconds),
    distanceMeters,
    distanceText: formatDistance(distanceMeters),
    polyline
  }

  if (includeManeuvers) {
    result.maneuvers = buildManeuvers(data.trip.legs, polyline, legStartIndices)
  }

  // Parse alternate routes
  if (data.alternates && data.alternates.length > 0) {
    result.alternates = data.alternates.map((alt) => buildAlternateRoute(alt.trip))
  }

  return result
}
