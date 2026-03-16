import L from 'leaflet'
import type { LatLng } from '@navigatr/core'
import type { MapConfig, MarkerOptions, DriverMarkerOptions, NavigatrMap } from './types'

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
const ROUTE_COLOR = '#00FF94'
const ROUTE_WEIGHT = 4

const DRIVER_ICONS: Record<string, string> = {
  car: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#00FF94"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`,
  bike: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#00FF94"><path d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5zm5.8-10l2.4-2.4.8.8c1.3 1.3 3 2.1 5.1 2.1V9c-1.5 0-2.7-.6-3.6-1.5l-1.9-1.9c-.5-.4-1-.6-1.6-.6s-1.1.2-1.4.6L7.8 8.4c-.4.4-.6.9-.6 1.4 0 .6.2 1.1.6 1.4L11 14v5h2v-6.2l-2.2-2.3zM19 12c-2.8 0-5 2.2-5 5s2.2 5 5 5 5-2.2 5-5-2.2-5-5-5zm0 8.5c-1.9 0-3.5-1.6-3.5-3.5s1.6-3.5 3.5-3.5 3.5 1.6 3.5 3.5-1.6 3.5-3.5 3.5z"/></svg>`,
  walk: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#00FF94"><path d="M13.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM9.8 8.9L7 23h2.1l1.8-8 2.1 2v6h2v-7.5l-2.1-2 .6-3C14.8 12 16.8 13 19 13v-2c-1.9 0-3.5-1-4.3-2.4l-1-1.6c-.4-.6-1-1-1.7-1-.3 0-.5.1-.8.1L6 8.3V13h2V9.6l1.8-.7"/></svg>`,
  default: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="#00FF94"><circle cx="12" cy="12" r="8"/></svg>`
}

function createDriverIcon(type: string = 'default', heading: number = 0): L.DivIcon {
  const svg = DRIVER_ICONS[type] || DRIVER_ICONS.default
  return L.divIcon({
    html: `<div style="transform: rotate(${heading}deg); display: flex; align-items: center; justify-content: center;">${svg}</div>`,
    className: 'navigatr-driver-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  })
}

export function createMap(config: MapConfig): NavigatrMap {
  const map = L.map(config.container).setView(
    [config.center.lat, config.center.lng],
    config.zoom ?? 13
  )

  L.tileLayer(OSM_TILE_URL, {
    attribution: OSM_ATTRIBUTION
  }).addTo(map)

  let currentRoute: L.Polyline | null = null
  let driverMarker: L.Marker | null = null

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
    },

    updateDriverMarker(options: DriverMarkerOptions): void {
      const icon = createDriverIcon(options.icon, options.heading)

      if (driverMarker) {
        driverMarker.setLatLng([options.lat, options.lng])
        driverMarker.setIcon(icon)
      } else {
        driverMarker = L.marker([options.lat, options.lng], { icon }).addTo(map)
      }
    },

    removeDriverMarker(): void {
      if (driverMarker) {
        map.removeLayer(driverMarker)
        driverMarker = null
      }
    },

    panTo(location: LatLng): void {
      map.panTo([location.lat, location.lng])
    }
  }
}
