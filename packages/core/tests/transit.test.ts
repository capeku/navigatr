import { describe, it, expect } from 'vitest'
import { itineraryToGeoJSON } from '../src/transit'
import type { TransitItinerary } from '../src/types'

const itinerary: TransitItinerary = {
  duration: 1800,
  durationText: '30 mins',
  transfers: 1,
  walkDistance: 400,
  legs: [
    {
      mode: 'WALK',
      from: { name: 'Home', lat: 51.5, lng: -0.1 },
      to: { name: 'Bus Stop A', lat: 51.501, lng: -0.099 },
      departureTime: '08:00',
      arrivalTime: '08:05',
      duration: 300,
      distance: 200,
      geometry: { type: 'LineString', coordinates: [[-0.1, 51.5], [-0.099, 51.501]] }
    },
    {
      mode: 'BUS',
      from: { name: 'Bus Stop A', lat: 51.501, lng: -0.099, stopId: 'A1' },
      to: { name: 'Bus Stop B', lat: 51.52, lng: -0.08, stopId: 'B2' },
      departureTime: '08:10',
      arrivalTime: '08:25',
      duration: 900,
      distance: 3000,
      routeName: '42',
      routeColor: '#FF5722',
      numStops: 4,
      intermediateStops: [
        { stopId: 'M1', name: 'Middle Stop', lat: 51.51, lng: -0.09 }
      ],
      geometry: { type: 'LineString', coordinates: [[-0.099, 51.501], [-0.09, 51.51], [-0.08, 51.52]] }
    }
  ]
}

describe('itineraryToGeoJSON', () => {
  it('produces one leg feature per leg', () => {
    const { legs } = itineraryToGeoJSON(itinerary)
    expect(legs.type).toBe('FeatureCollection')
    expect(legs.features).toHaveLength(2)
  })

  it('walk leg gets dash array and grey color', () => {
    const { legs } = itineraryToGeoJSON(itinerary)
    const walk = legs.features[0].properties!
    expect(walk.mode).toBe('WALK')
    expect(walk.color).toBe('#888888')
    expect(walk.dashArray).toEqual([2, 4])
    expect(walk.width).toBe(4)
  })

  it('bus leg uses routeColor when provided', () => {
    const { legs } = itineraryToGeoJSON(itinerary)
    const bus = legs.features[1].properties!
    expect(bus.color).toBe('#FF5722')
    expect(bus.dashArray).toBeNull()
    expect(bus.width).toBe(5)
  })

  it('extracts intermediate stops only from non-WALK legs', () => {
    const { stops } = itineraryToGeoJSON(itinerary)
    expect(stops.features).toHaveLength(1)
    expect(stops.features[0].properties!.stopId).toBe('M1')
    expect(stops.features[0].geometry.type).toBe('Point')
  })

  it('uses default mode color when no routeColor set', () => {
    const noColor: TransitItinerary = {
      ...itinerary,
      legs: [{ ...itinerary.legs[1], routeColor: undefined }]
    }
    const { legs } = itineraryToGeoJSON(noColor)
    expect(legs.features[0].properties!.color).toBe('#2196F3') // BUS default
  })
})
