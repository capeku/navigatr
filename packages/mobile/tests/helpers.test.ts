import { describe, expect, it } from 'vitest'
import {
  createOSMTileConfig,
  getBoundingRegion,
  getRemainingPolyline,
  getRouteProgress,
  getTraveledPolyline,
  toMapCoordinate,
  toMapCoordinates,
  toLatLng,
  toLatLngList
} from '../src/index'

describe('coordinates helpers', () => {
  it('converts LatLng to react-native-maps coordinates and back', () => {
    const point = { lat: -1.286389, lng: 36.817223 }

    const mapPoint = toMapCoordinate(point)
    expect(mapPoint).toEqual({ latitude: -1.286389, longitude: 36.817223 })

    const roundTrip = toLatLng(mapPoint)
    expect(roundTrip).toEqual(point)
  })

  it('converts lists of points', () => {
    const points = [
      { lat: -1.286389, lng: 36.817223 },
      { lat: -1.292066, lng: 36.821945 }
    ]

    const mapPoints = toMapCoordinates(points)
    expect(toLatLngList(mapPoints)).toEqual(points)
  })

  it('creates a non-zero bounding region', () => {
    const region = getBoundingRegion([
      { lat: -1.286389, lng: 36.817223 },
      { lat: -1.292066, lng: 36.821945 }
    ])

    expect(region.latitudeDelta).toBeGreaterThan(0)
    expect(region.longitudeDelta).toBeGreaterThan(0)
  })
})

describe('route helpers', () => {
  const polyline = [
    { lat: -1.286389, lng: 36.817223 },
    { lat: -1.292066, lng: 36.821945 },
    { lat: -1.300000, lng: 36.830000 }
  ]

  it('computes route progress against nearest point', () => {
    const progress = getRouteProgress({ lat: -1.292000, lng: 36.822000 }, polyline)
    expect(progress.nearestIndex).toBe(1)
    expect(progress.distanceToRouteMeters).toBeGreaterThanOrEqual(0)
  })

  it('splits traveled and remaining polyline slices', () => {
    expect(getTraveledPolyline(polyline, 1)).toHaveLength(2)
    expect(getRemainingPolyline(polyline, 1)).toHaveLength(2)
  })
})

describe('tile config helper', () => {
  it('defaults to osm tile template and android replacement mode', () => {
    const config = createOSMTileConfig()
    expect(config.urlTileProps.urlTemplate).toContain('tile.openstreetmap.org')
    expect(config.mapViewProps.mapType).toBe('none')
  })

  it('supports retaining base provider map', () => {
    const config = createOSMTileConfig({ shouldReplaceMapContentOnAndroid: false })
    expect(config.mapViewProps.mapType).toBe('standard')
  })
})
