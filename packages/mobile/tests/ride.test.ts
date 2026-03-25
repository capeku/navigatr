import { describe, expect, it, vi } from 'vitest'
import type { RouteResult } from '@navigatr/core'
import { RideSession } from '../src/ride'

function makeRouteResult(): RouteResult {
  return {
    durationSeconds: 300,
    durationText: '5 mins',
    distanceMeters: 1200,
    distanceText: '1.2 km',
    polyline: [
      { lat: 5.6, lng: -0.2 },
      { lat: 5.61, lng: -0.21 }
    ]
  }
}

function makeMapMock() {
  return {
    addMarker: vi.fn(),
    drawRoute: vi.fn(),
    fitRoute: vi.fn(),
    clearRoute: vi.fn(),
    updateDriverMarker: vi.fn(),
    removeDriverMarker: vi.fn()
  }
}

describe('RideSession (mobile)', () => {
  it('handles full phase lifecycle and map updates', async () => {
    const routeFn = vi.fn().mockResolvedValue(makeRouteResult())
    const nav = { route: routeFn } as any
    const map = makeMapMock() as any
    const onETAUpdate = vi.fn()
    const onPhaseChange = vi.fn()

    const ride = new RideSession(nav, {
      pickup: { lat: 5.6, lng: -0.2 },
      destination: { lat: 5.5, lng: -0.1 },
      map,
      onETAUpdate,
      onPhaseChange
    })

    expect(ride.getPhase()).toBe('waiting')

    await ride.startPickup({ lat: 5.7, lng: -0.25 })
    expect(ride.getPhase()).toBe('pickup')
    expect(onPhaseChange).toHaveBeenCalledWith('pickup')
    expect(routeFn).toHaveBeenCalledWith({
      origin: { lat: 5.7, lng: -0.25 },
      destination: { lat: 5.6, lng: -0.2 }
    })
    expect(map.addMarker).toHaveBeenCalledWith({ lat: 5.6, lng: -0.2, label: 'Pickup' })

    await ride.startTrip()
    expect(ride.getPhase()).toBe('in_progress')
    expect(onPhaseChange).toHaveBeenCalledWith('in_progress')
    expect(routeFn).toHaveBeenLastCalledWith({
      origin: { lat: 5.7, lng: -0.25 },
      destination: { lat: 5.5, lng: -0.1 }
    })
    expect(map.addMarker).toHaveBeenCalledWith({ lat: 5.5, lng: -0.1, label: 'Destination' })

    ride.complete()
    expect(ride.getPhase()).toBe('completed')
    expect(onPhaseChange).toHaveBeenCalledWith('completed')
    expect(map.removeDriverMarker).toHaveBeenCalled()
    expect(onETAUpdate).toHaveBeenCalled()
  })

  it('updates driver marker heading from movement and keeps rotation offset', async () => {
    const routeFn = vi.fn().mockResolvedValue(makeRouteResult())
    const nav = { route: routeFn } as any
    const map = makeMapMock() as any

    const ride = new RideSession(nav, {
      pickup: { lat: 5.6, lng: -0.2 },
      destination: { lat: 5.5, lng: -0.1 },
      map,
      driverMarker: {
        icon: 'car',
        rotationOffsetDegrees: 0
      }
    })

    await ride.startPickup({ lat: 5.6, lng: -0.2 })
    await ride.updateDriverLocation({ lat: 5.6, lng: -0.19 })

    expect(map.updateDriverMarker).toHaveBeenCalled()
    const markerCall = map.updateDriverMarker.mock.calls.at(-1)?.[0]
    expect(markerCall).toMatchObject({
      lat: 5.6,
      lng: -0.19,
      icon: 'car',
      rotationOffsetDegrees: 0
    })
    expect(markerCall.heading).toBeGreaterThan(0)
  })
})
