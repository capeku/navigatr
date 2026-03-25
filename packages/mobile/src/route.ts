import type { LatLng, RouteResult } from '@navigatr/core'
import type { RouteOverlayData, RouteProgress } from './types'
import { toMapCoordinates } from './coordinates'

const EARTH_RADIUS_METERS = 6371000

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

function distanceMeters(a: LatLng, b: LatLng): number {
  const lat1 = toRadians(a.lat)
  const lat2 = toRadians(b.lat)
  const deltaLat = toRadians(b.lat - a.lat)
  const deltaLng = toRadians(b.lng - a.lng)

  const haversine =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  return EARTH_RADIUS_METERS * c
}

export function createRouteOverlayData(route: RouteResult): RouteOverlayData {
  return {
    primary: toMapCoordinates(route.polyline),
    alternates: (route.alternates ?? []).map((alt) => toMapCoordinates(alt.polyline))
  }
}

export function getRouteProgress(position: LatLng, routePolyline: LatLng[]): RouteProgress {
  if (routePolyline.length === 0) {
    throw new Error('getRouteProgress requires routePolyline with at least one point')
  }

  let nearestIndex = 0
  let nearestDistanceMeters = Number.POSITIVE_INFINITY

  for (let i = 0; i < routePolyline.length; i++) {
    const candidateDistance = distanceMeters(position, routePolyline[i])
    if (candidateDistance < nearestDistanceMeters) {
      nearestDistanceMeters = candidateDistance
      nearestIndex = i
    }
  }

  return {
    nearestIndex,
    distanceToRouteMeters: nearestDistanceMeters
  }
}

export function getRemainingPolyline(routePolyline: LatLng[], currentIndex: number): LatLng[] {
  if (routePolyline.length === 0) return []
  const safeIndex = Math.max(0, Math.min(currentIndex, routePolyline.length - 1))
  return routePolyline.slice(safeIndex)
}

export function getTraveledPolyline(routePolyline: LatLng[], currentIndex: number): LatLng[] {
  if (routePolyline.length === 0) return []
  const safeIndex = Math.max(0, Math.min(currentIndex, routePolyline.length - 1))
  return routePolyline.slice(0, safeIndex + 1)
}
