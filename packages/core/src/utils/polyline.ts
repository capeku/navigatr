import type { LatLng } from '../types'

/**
 * Decodes an encoded polyline string into an array of coordinates.
 * Uses the Google polyline encoding algorithm with precision 6 (for Valhalla).
 */
export function decodePolyline(encoded: string, precision: number = 6): LatLng[] {
  const factor = Math.pow(10, precision)
  const coordinates: LatLng[] = []
  let index = 0
  let lat = 0
  let lng = 0

  while (index < encoded.length) {
    let shift = 0
    let result = 0
    let byte: number

    // Decode latitude
    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1
    lat += deltaLat

    // Decode longitude
    shift = 0
    result = 0

    do {
      byte = encoded.charCodeAt(index++) - 63
      result |= (byte & 0x1f) << shift
      shift += 5
    } while (byte >= 0x20)

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1
    lng += deltaLng

    coordinates.push({
      lat: lat / factor,
      lng: lng / factor
    })
  }

  return coordinates
}
