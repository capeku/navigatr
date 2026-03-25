import type { LatLng, RouteResult } from '@navigatr/core'
import type { NavigatrMobile } from './index'
import type { RideConfig, RidePhase } from './types'

/**
 * RideSession manages the lifecycle of a ride-sharing trip for React Native apps.
 */
export class RideSession {
  private nav: NavigatrMobile
  private config: RideConfig
  private phase: RidePhase = 'waiting'
  private driverLocation: LatLng | null = null
  private lastHeading = 0
  private currentRoute: RouteResult | null = null

  constructor(nav: NavigatrMobile, config: RideConfig) {
    this.nav = nav
    this.config = config
  }

  getPhase(): RidePhase {
    return this.phase
  }

  getCurrentDestination(): LatLng {
    return this.phase === 'pickup' ? this.config.pickup : this.config.destination
  }

  getCurrentRoute(): RouteResult | null {
    return this.currentRoute
  }

  getDriverLocation(): LatLng | null {
    return this.driverLocation
  }

  async updateDriverLocation(location: LatLng): Promise<RouteResult | null> {
    const nextHeading =
      this.driverLocation && this.hasMovement(this.driverLocation, location)
        ? this.bearingDegrees(this.driverLocation, location)
        : this.lastHeading

    this.driverLocation = location
    this.lastHeading = nextHeading
    this.config.onDriverMove?.(location)

    if (this.config.map) {
      this.config.map.updateDriverMarker({
        ...location,
        heading: nextHeading,
        rotationOffsetDegrees: this.config.driverMarker?.rotationOffsetDegrees ?? 0,
        icon: this.config.driverMarker?.icon ?? 'car',
        image: this.config.driverMarker?.image
      })
    }

    if (this.phase === 'pickup' || this.phase === 'in_progress') {
      return this.recalculateRoute()
    }

    return null
  }

  async startPickup(driverLocation: LatLng): Promise<RouteResult> {
    this.phase = 'pickup'
    this.driverLocation = driverLocation
    this.lastHeading = 0
    this.config.onPhaseChange?.('pickup')

    const route = await this.recalculateRoute()

    if (this.config.map) {
      this.config.map.addMarker({ ...this.config.pickup, label: 'Pickup' })
    }

    return route
  }

  async startTrip(): Promise<RouteResult> {
    this.phase = 'in_progress'
    this.config.onPhaseChange?.('in_progress')

    const route = await this.recalculateRoute()

    if (this.config.map) {
      this.config.map.addMarker({ ...this.config.destination, label: 'Destination' })
    }

    return route
  }

  complete(): void {
    this.phase = 'completed'
    this.config.onPhaseChange?.('completed')

    if (this.config.map) {
      this.config.map.removeDriverMarker()
    }
  }

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

    if (this.config.map) {
      this.config.map.clearRoute()
      this.config.map.drawRoute(route.polyline)
      this.config.map.fitRoute(route.polyline)
    }

    return route
  }

  private hasMovement(from: LatLng, to: LatLng): boolean {
    return Math.abs(from.lat - to.lat) > 1e-8 || Math.abs(from.lng - to.lng) > 1e-8
  }

  private toRadians(value: number): number {
    return (value * Math.PI) / 180
  }

  private bearingDegrees(from: LatLng, to: LatLng): number {
    const phi1 = this.toRadians(from.lat)
    const phi2 = this.toRadians(to.lat)
    const deltaLambda = this.toRadians(to.lng - from.lng)

    const y = Math.sin(deltaLambda) * Math.cos(phi2)
    const x =
      Math.cos(phi1) * Math.sin(phi2) -
      Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)

    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  }
}

export type { RideConfig, RidePhase }
