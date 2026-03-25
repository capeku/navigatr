import type { OSMTileConfig, OSMTileOptions } from './types'

const DEFAULT_OSM_URL_TEMPLATE = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'

export function createOSMTileConfig(options?: OSMTileOptions): OSMTileConfig {
  return {
    urlTileProps: {
      urlTemplate: options?.urlTemplate ?? DEFAULT_OSM_URL_TEMPLATE,
      maximumZ: options?.maximumZ,
      minimumZ: options?.minimumZ,
      tileSize: options?.tileSize,
      flipY: options?.flipY
    },
    mapViewProps: {
      mapType: options?.shouldReplaceMapContentOnAndroid === false ? 'standard' : 'none'
    }
  }
}

export { DEFAULT_OSM_URL_TEMPLATE }
