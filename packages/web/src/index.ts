import { NavigatrCore } from '@navigatr/core'
import type { LatLng, NavigatrConfig, RouteResult } from '@navigatr/core'
import { createMap } from './map'
import type { MapConfig, NavigatrMap, LocationUpdateCallback } from './types'

export class Navigatr extends NavigatrCore {
  private locationCallbacks: LocationUpdateCallback[] = []
  private lastDriverLocation: LatLng | null = null

  constructor(config?: NavigatrConfig) {
    super(config)
  }

  map(params: MapConfig): NavigatrMap {
    return createMap(params)
  }

  /**
   * Register a callback to receive driver location updates.
   * Connect this to your real-time backend (Firebase, Supabase, Socket.io, etc.)
   *
   * @example
   * // With Firebase Realtime Database
   * const unsubscribe = nav.onLocationUpdate((location) => {
   *   map.updateDriverMarker({ ...location, icon: 'car' })
   * })
   *
   * firebase.database().ref(`rides/${rideId}/driverLocation`).on('value', (snap) => {
   *   nav.pushLocationUpdate(snap.val())
   * })
   */
  onLocationUpdate(callback: LocationUpdateCallback): () => void {
    this.locationCallbacks.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.locationCallbacks.indexOf(callback)
      if (index > -1) {
        this.locationCallbacks.splice(index, 1)
      }
    }
  }

  /**
   * Push a new driver location to all registered callbacks.
   * Call this when you receive a location update from your real-time backend.
   */
  pushLocationUpdate(location: LatLng): void {
    this.lastDriverLocation = location
    for (const callback of this.locationCallbacks) {
      callback(location)
    }
  }

  /**
   * Get the last known driver location.
   */
  getLastDriverLocation(): LatLng | null {
    return this.lastDriverLocation
  }

  /**
   * Recalculate ETA from current driver position to destination.
   * Returns updated route with new duration/distance.
   *
   * @example
   * nav.onLocationUpdate(async (driverPos) => {
   *   const updated = await nav.recalculateETA(driverPos, destination)
   *   etaDisplay.textContent = updated.durationText
   *   map.clearRoute()
   *   map.drawRoute(updated.polyline)
   * })
   */
  async recalculateETA(
    currentLocation: LatLng,
    destination: LatLng,
    options?: { traffic?: boolean }
  ): Promise<RouteResult> {
    return this.route({
      origin: currentLocation,
      destination,
      traffic: options?.traffic
    })
  }
}

export type { NavigatrMap, MapConfig, DriverMarkerOptions, LocationUpdateCallback } from './types'
export type { LatLng, GeocodeResult, RouteResult, RouteOptions, Maneuver, NavigatrConfig } from '@navigatr/core'
