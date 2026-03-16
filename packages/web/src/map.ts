import L from 'leaflet'
import type { LatLng } from '@navigatr/core'
import type { MapConfig, MarkerOptions, NavigatrMap } from './types'

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const ROUTE_COLOR = '#00FF94'
const ROUTE_WEIGHT = 4

export function createMap(config: MapConfig): NavigatrMap {
  const map = L.map(config.container).setView(
    [config.center.lat, config.center.lng],
    config.zoom ?? 13
  )

  L.tileLayer(OSM_TILE_URL, {
    attribution: OSM_ATTRIBUTION
  }).addTo(map)

  let currentRoute: L.Polyline | null = null

  return {
    addMarker(options: MarkerOptions): void {
      const marker = L.marker([options.lat, options.lng]).addTo(map)
      if (options.label) {
        marker.bindPopup(options.label)
      }
    },

    drawRoute(polyline: LatLng[]): void {
      if (currentRoute) {
        map.removeLayer(currentRoute)
      }

      const latLngs = polyline.map((p) => [p.lat, p.lng] as L.LatLngTuple)
      currentRoute = L.polyline(latLngs, {
        color: ROUTE_COLOR,
        weight: ROUTE_WEIGHT
      }).addTo(map)
    },

    fitRoute(polyline: LatLng[]): void {
      if (polyline.length === 0) return

      const latLngs = polyline.map((p) => [p.lat, p.lng] as L.LatLngTuple)
      const bounds = L.latLngBounds(latLngs)
      map.fitBounds(bounds, { padding: [50, 50] })
    },

    clearRoute(): void {
      if (currentRoute) {
        map.removeLayer(currentRoute)
        currentRoute = null
      }
    }
  }
}
