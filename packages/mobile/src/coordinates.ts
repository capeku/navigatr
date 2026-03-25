import type { LatLng } from '@navigatr/core'
import type { Region } from 'react-native-maps'
import type { BoundingRegionOptions, MapCoordinate } from './types'

const DEFAULT_MIN_DELTA = 0.002

export function toMapCoordinate(point: LatLng): MapCoordinate {
  return { latitude: point.lat, longitude: point.lng }
}

export function toMapCoordinates(points: LatLng[]): MapCoordinate[] {
  return points.map(toMapCoordinate)
}

export function toLatLng(point: MapCoordinate): LatLng {
  return { lat: point.latitude, lng: point.longitude }
}

export function toLatLngList(points: MapCoordinate[]): LatLng[] {
  return points.map(toLatLng)
}

export function getBoundingRegion(
  points: LatLng[],
  options?: BoundingRegionOptions
): Region {
  if (points.length === 0) {
    throw new Error('getBoundingRegion requires at least one point')
  }

  const latPaddingRatio = options?.latPaddingRatio ?? 0.2
  const lngPaddingRatio = options?.lngPaddingRatio ?? 0.2
  const minDelta = options?.minDelta ?? DEFAULT_MIN_DELTA

  let minLat = points[0].lat
  let maxLat = points[0].lat
  let minLng = points[0].lng
  let maxLng = points[0].lng

  for (const point of points) {
    minLat = Math.min(minLat, point.lat)
    maxLat = Math.max(maxLat, point.lat)
    minLng = Math.min(minLng, point.lng)
    maxLng = Math.max(maxLng, point.lng)
  }

  const latSpan = maxLat - minLat
  const lngSpan = maxLng - minLng

  const latitudeDelta = Math.max(latSpan * (1 + latPaddingRatio), minDelta)
  const longitudeDelta = Math.max(lngSpan * (1 + lngPaddingRatio), minDelta)

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta,
    longitudeDelta
  }
}
