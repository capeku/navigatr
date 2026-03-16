import type { LatLng, RouteResult } from '@navigatr/core'
import type { Navigatr } from './index'
import type { NavigatrMap } from './types'

export type RidePhase = 'waiting' | 'pickup' | 'in_progress' | 'completed'

export interface RideConfig {
  pickup: LatLng
  destination: LatLng
  map?: NavigatrMap
  onETAUpdate?: (eta: RouteResult, phase: RidePhase) => void
  onPhaseChange?: (phase: RidePhase) => void
  onDriverMove?: (location: LatLng) => void
}

/**
 * RideSession manages the lifecycle of a ride-sharing trip.
 *
 * It handles:
 * - Route calculation for each phase (pickup → destination)
 * - Real-time driver tracking
 * - ETA updates as driver moves
 * - Map rendering (if map is provided)
 *
 * @example
 * ```ts
 * // 1. Geocode destination once when ride is requested
 * const destination = await nav.geocode({ address: 'Airport' })
 *
 * // 2. Create ride session with GPS coordinates
 * const ride = nav.createRide({
 *   pickup: riderGPSLocation,
 *   destination,
 *   map,
 *   onETAUpdate: (eta, phase) => {
 *     console.log(`${phase}: ${eta.durationText} away`)
 *   }
 * })
 *
 * // 3. Connect to your real-time backend
 * websocket.on('driver-location', (pos) => {
 *   ride.updateDriverLocation(pos)
 * })
 *
 * // 4. When driver arrives at pickup
 * ride.startTrip()
 *
 * // 5. When ride completes
 * ride.complete()
 * ```
 */
export class RideSession {
  private nav: Navigatr
  private config: RideConfig
  private phase: RidePhase = 'waiting'
  private driverLocation: LatLng | null = null
  private currentRoute: RouteResult | null = null
  private updateInterval: ReturnType<typeof setInterval> | null = null

  constructor(nav: Navigatr, config: RideConfig) {
    this.nav = nav
    this.config = config
  }

  /**
   * Get the current ride phase
   */
  getPhase(): RidePhase {
    return this.phase
  }

  /**
   * Get the current destination based on phase
   */
  getCurrentDestination(): LatLng {
    return this.phase === 'pickup' ? this.config.pickup : this.config.destination
  }

  /**
   * Get the last calculated route
   */
  getCurrentRoute(): RouteResult | null {
    return this.currentRoute
  }

  /**
   * Get the last known driver location
   */
  getDriverLocation(): LatLng | null {
    return this.driverLocation
  }

  /**
   * Update driver location and recalculate ETA.
   * Call this when you receive location updates from your real-time backend.
   */
  async updateDriverLocation(location: LatLng): Promise<RouteResult | null> {
    this.driverLocation = location
    this.config.onDriverMove?.(location)

    // Update map if provided
    if (this.config.map) {
      this.config.map.updateDriverMarker({ ...location, icon: 'car' })
    }

    // Recalculate route if ride is active
    if (this.phase === 'pickup' || this.phase === 'in_progress') {
      return this.recalculateRoute()
    }

    return null
  }

  /**
   * Start the ride (driver accepted, en route to pickup)
   */
  async startPickup(driverLocation: LatLng): Promise<RouteResult> {
    this.phase = 'pickup'
    this.driverLocation = driverLocation
    this.config.onPhaseChange?.('pickup')

    const route = await this.recalculateRoute()

    // Show pickup marker
    if (this.config.map) {
      this.config.map.addMarker({ ...this.config.pickup, label: 'Pickup' })
    }

    return route
  }

  /**
   * Start the trip (rider picked up, en route to destination)
   */
  async startTrip(): Promise<RouteResult> {
    this.phase = 'in_progress'
    this.config.onPhaseChange?.('in_progress')

    const route = await this.recalculateRoute()

    // Show destination marker
    if (this.config.map) {
      this.config.map.addMarker({ ...this.config.destination, label: 'Destination' })
    }

    return route
  }

  /**
   * Complete the ride
   */
  complete(): void {
    this.phase = 'completed'
    this.config.onPhaseChange?.('completed')

    if (this.config.map) {
      this.config.map.removeDriverMarker()
    }
  }

  /**
   * Recalculate route from current driver location to current destination
   */
  private async recalculateRoute(): Promise<RouteResult> {
    if (!this.driverLocation) {
      throw new Error('Driver location not set')
    }

    const destination = this.getCurrentDestination()
    const route = await this.nav.route({
      origin: this.driverLocation,
      destination
    })

    this.currentRoute = route
    this.config.onETAUpdate?.(route, this.phase)

    // Update map if provided
    if (this.config.map) {
      this.config.map.clearRoute()
      this.config.map.drawRoute(route.polyline)
      this.config.map.fitRoute(route.polyline)
    }

    return route
  }
}
