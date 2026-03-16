import { NavigatrCore } from '@navigatr/core'
import type { LatLng, NavigatrConfig } from '@navigatr/core'
import { createMap } from './map'
import type { MapConfig, NavigatrMap } from './types'

export class Navigatr extends NavigatrCore {
  constructor(config?: NavigatrConfig) {
    super(config)
  }

  map(params: MapConfig): NavigatrMap {
    return createMap(params)
  }
}

export type { NavigatrMap, MapConfig } from './types'
export type { LatLng, GeocodeResult, RouteResult, NavigatrConfig } from '@navigatr/core'
