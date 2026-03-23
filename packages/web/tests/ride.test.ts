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

describe('RideSession', () => {
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
    expect(onETAUpdate).toHaveBeenCalled()
    expect(map.addMarker).toHaveBeenCalledWith({ lat: 5.6, lng: -0.2, label: 'Pickup' })
    expect(map.clearRoute).toHaveBeenCalled()
    expect(map.drawRoute).toHaveBeenCalled()
    expect(map.fitRoute).toHaveBeenCalled()

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
  })

  it('recalculates route on driver updates in active phases', async () => {
    const routeFn = vi.fn().mockResolvedValue(makeRouteResult())
    const nav = { route: routeFn } as any
    const map = makeMapMock() as any
    const onETAUpdate = vi.fn()

    const ride = new RideSession(nav, {
      pickup: { lat: 5.6, lng: -0.2 },
      destination: { lat: 5.5, lng: -0.1 },
      map,
      onETAUpdate
    })

    const waitingResult = await ride.updateDriverLocation({ lat: 5.65, lng: -0.23 })
    expect(waitingResult).toBeNull()
    expect(routeFn).not.toHaveBeenCalled()
    expect(map.updateDriverMarker).toHaveBeenCalledWith({ lat: 5.65, lng: -0.23, icon: 'car' })

    await ride.startPickup({ lat: 5.65, lng: -0.23 })
    await ride.updateDriverLocation({ lat: 5.64, lng: -0.22 })

    expect(routeFn).toHaveBeenCalledWith({
      origin: { lat: 5.64, lng: -0.22 },
      destination: { lat: 5.6, lng: -0.2 }
    })
    expect(onETAUpdate).toHaveBeenCalled()
  })
})
