import { NavigatrCore } from '@navigatr/core'
import type { LatLng, NavigatrConfig, RouteResult, TravelMode } from '@navigatr/core'
import { createMap } from './map'
import { RideSession } from './ride'
import type { RideConfig } from './ride'
import type { MapConfig, NavigatrMap, LocationUpdateCallback } from './types'

export class Navigatr extends NavigatrCore {
  private locationCallbacks: LocationUpdateCallback[] = []
  private lastDriverLocation: LatLng | null = null

  constructor(config?: NavigatrConfig) {
    super(config)
  }

  /**
   * Create a MapLibre GL map in the specified container.
   * CSS is automatically injected - no external stylesheet needed.
   */
  map(params: MapConfig): NavigatrMap {
    return createMap(params)
  }

  /**
   * Create a new ride session for managing ride-sharing trips.
   *
   * RideSession handles the full lifecycle:
   * - Route calculation for pickup and destination phases
   * - Real-time driver tracking with ETA updates
   * - Automatic map rendering (if map is provided)
   *
   * @example
   * ```ts
   * // Rider requests a ride
   * const destination = await nav.geocode({ address: 'Airport' })
   *
   * const ride = nav.createRide({
   *   pickup: riderGPSLocation,    // From device GPS
   *   destination,                  // Geocoded once
   *   map,                          // Optional: auto-render
   *   onETAUpdate: (eta, phase) => {
   *     ui.showETA(eta.durationText)
   *   }
   * })
   *
   * // Driver accepts - start tracking
   * await ride.startPickup(driverLocation)
   *
   * // Connect real-time updates
   * websocket.on('driver-moved', (pos) => ride.updateDriverLocation(pos))
   *
   * // Driver arrives - start trip
   * await ride.startTrip()
   *
   * // Arrived at destination
   * ride.complete()
   * ```
   */
  createRide(config: RideConfig): RideSession {
    return new RideSession(this, config)
  }

  /**
   * Register a callback to receive driver location updates.
   * Connect this to your real-time backend (Firebase, Supabase, Socket.io, etc.)
   *
   * @example
   * ```ts
   * const unsubscribe = nav.onLocationUpdate((location) => {
   *   map.updateDriverMarker({ ...location, icon: 'car' })
   * })
   *
   * // Connect to your backend
   * firebase.database().ref(`rides/${rideId}/driverLocation`).on('value', (snap) => {
   *   nav.pushLocationUpdate(snap.val())
   * })
   *
   * // Cleanup
   * unsubscribe()
   * ```
   */
  onLocationUpdate(callback: LocationUpdateCallback): () => void {
    this.locationCallbacks.push(callback)

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
   * Recalculate ETA from current position to destination.
   * Use this for simple real-time updates without RideSession.
   *
   * @example
   * ```ts
   * nav.onLocationUpdate(async (driverPos) => {
   *   const updated = await nav.recalculateETA(driverPos, destination)
   *   etaDisplay.textContent = updated.durationText
   * })
   * ```
   */
  async recalculateETA(
    currentLocation: LatLng,
    destination: LatLng,
    options?: { traffic?: boolean; mode?: TravelMode }
  ): Promise<RouteResult> {
    return this.route({
      origin: currentLocation,
      destination,
      mode: options?.mode,
      traffic: options?.traffic
    })
  }
}

export { RideSession } from './ride'
export type { RideConfig, RidePhase } from './ride'
export type { NavigatrMap, NavigatrMarker, MapConfig, MarkerOptions, DriverMarkerOptions, LocationUpdateCallback, RouteStyleOptions, NavigationEvent, NavigationEventCallback } from './types'
export type { LatLng, GeocodeResult, RouteResult, RouteOptions, Maneuver, NavigatrConfig, AutocompleteResult, AlternateRoute, TravelMode } from '@navigatr/core'
