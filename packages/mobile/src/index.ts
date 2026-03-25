import { NavigatrCore } from '@navigatr/core'
import type {
  LatLng,
  NavigatrConfig,
  RouteResult,
  TravelMode,
  GeocodeResult,
  RouteOptions,
  Maneuver,
  AutocompleteResult,
  AlternateRoute
} from '@navigatr/core'

import {
  createRouteOverlayData,
  getRouteProgress,
  getRemainingPolyline,
  getTraveledPolyline
} from './route'
import {
  toMapCoordinate,
  toMapCoordinates,
  toLatLng,
  toLatLngList,
  getBoundingRegion
} from './coordinates'
import { createOSMTileConfig, DEFAULT_OSM_URL_TEMPLATE } from './tiles'
import { createInitialRegion, createMap } from './map'
import { RideSession } from './ride'
import type {
  OSMTileOptions,
  OSMTileConfig,
  RouteOverlayData,
  RouteProgress,
  LocationUpdateCallback,
  NavigationEvent,
  NavigationEventCallback,
  FitBoundsOptions,
  BoundingRegionOptions,
  MapCoordinate,
  Region,
  MapConfig,
  MarkerOptions,
  DriverMarkerOptions,
  RouteStyleOptions,
  NavigatrMarker,
  NavigatrMobileMap,
  RideConfig,
  RidePhase,
  MobileMapRenderState,
  MobileMapRef,
  RenderMarker,
  RenderRoute
} from './types'

export class NavigatrMobile extends NavigatrCore {
  private locationCallbacks: LocationUpdateCallback[] = []
  private lastLocation: LatLng | null = null

  constructor(config?: NavigatrConfig) {
    super(config)
  }

  map(config: MapConfig): NavigatrMobileMap {
    return createMap(config)
  }

  createRide(config: RideConfig): RideSession {
    return new RideSession(this, config)
  }

  onLocationUpdate(callback: LocationUpdateCallback): () => void {
    this.locationCallbacks.push(callback)

    return () => {
      const index = this.locationCallbacks.indexOf(callback)
      if (index > -1) {
        this.locationCallbacks.splice(index, 1)
      }
    }
  }

  pushLocationUpdate(location: LatLng): void {
    this.lastLocation = location
    for (const callback of this.locationCallbacks) {
      callback(location)
    }
  }

  getLastLocation(): LatLng | null {
    return this.lastLocation
  }

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

export {
  RideSession,
  createMap,
  createInitialRegion,
  createRouteOverlayData,
  getRouteProgress,
  getRemainingPolyline,
  getTraveledPolyline,
  toMapCoordinate,
  toMapCoordinates,
  toLatLng,
  toLatLngList,
  getBoundingRegion,
  createOSMTileConfig,
  DEFAULT_OSM_URL_TEMPLATE
}

export type {
  OSMTileOptions,
  OSMTileConfig,
  RouteOverlayData,
  RouteProgress,
  LocationUpdateCallback,
  NavigationEvent,
  NavigationEventCallback,
  FitBoundsOptions,
  BoundingRegionOptions,
  MapCoordinate,
  Region,
  MapConfig,
  MarkerOptions,
  DriverMarkerOptions,
  RouteStyleOptions,
  NavigatrMarker,
  NavigatrMobileMap,
  RideConfig,
  RidePhase,
  MobileMapRenderState,
  MobileMapRef,
  RenderMarker,
  RenderRoute,
  LatLng,
  GeocodeResult,
  RouteResult,
  RouteOptions,
  Maneuver,
  NavigatrConfig,
  AutocompleteResult,
  AlternateRoute,
  TravelMode
}
