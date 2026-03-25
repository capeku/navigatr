import { describe, expect, it, vi } from 'vitest'
import type { RouteResult } from '@navigatr/core'
import { createMap } from '../src/map'

function makeRouteResult(): RouteResult {
  return {
    durationSeconds: 420,
    durationText: '7 mins',
    distanceMeters: 2500,
    distanceText: '2.5 km',
    polyline: [
      { lat: 5.6, lng: -0.2 },
      { lat: 5.605, lng: -0.205 },
      { lat: 5.61, lng: -0.21 }
    ],
    maneuvers: [
      {
        instruction: 'Turn right',
        type: 'right',
        distanceMeters: 120,
        distanceText: '120 m',
        durationSeconds: 30,
        durationText: '30 sec',
        startPoint: { lat: 5.605, lng: -0.205 }
      }
    ]
  }
}

describe('createMap (mobile)', () => {
  it('tracks render state for markers, routes, alternates, and driver', () => {
    const fitToCoordinates = vi.fn()
    const map = createMap({
      center: { lat: 5.6, lng: -0.2 },
      mapRef: { fitToCoordinates }
    })

    const marker = map.addMarker({ lat: 5.6, lng: -0.2, label: 'Pickup' })
    map.drawRoute([
      { lat: 5.6, lng: -0.2 },
      { lat: 5.61, lng: -0.21 }
    ])

    map.drawAlternateRoutes([
      {
        durationSeconds: 500,
        durationText: '8 mins',
        distanceMeters: 2800,
        distanceText: '2.8 km',
        polyline: [
          { lat: 5.6, lng: -0.2 },
          { lat: 5.612, lng: -0.212 }
        ]
      }
    ])

    map.updateDriverMarker({ lat: 5.601, lng: -0.201, icon: 'car', heading: 12 })
    map.switchRoute(0)

    const state = map.getRenderState()
    expect(state.markers).toHaveLength(1)
    expect(state.driverMarker?.isDriver).toBe(true)
    expect(state.route.primary.length).toBeGreaterThan(0)
    expect(fitToCoordinates).toHaveBeenCalled()

    marker.remove()
    expect(map.getRenderState().markers).toHaveLength(0)
  })

  it('emits navigation events', () => {
    const animateCamera = vi.fn()
    const map = createMap({
      center: { lat: 5.6, lng: -0.2 },
      mapRef: { animateCamera }
    })

    const route = makeRouteResult()
    const events: string[] = []

    map.onNavigationEvent((event) => {
      events.push(event.type)
    })

    map.startNavigation(route)
    map.updatePosition({ lat: 5.605, lng: -0.205 })
    map.updatePosition({ lat: 5.61, lng: -0.21 })

    expect(events).toContain('navigation_started')
    expect(events).toContain('arrived')
    expect(events).toContain('navigation_stopped')
    expect(animateCamera).toHaveBeenCalled()
  })
})
