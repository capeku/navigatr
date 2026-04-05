import type { TransitItinerary, TransitLeg, StopInfo } from './types'

// Minimal GeoJSON types — structurally compatible with @types/geojson, no runtime dependency
interface GeoJSONFeature<G, P extends Record<string, unknown> = Record<string, unknown>> {
  type: 'Feature'
  properties: P | null
  geometry: G
}

interface GeoJSONLineString {
  type: 'LineString'
  coordinates: [number, number][]
}

interface GeoJSONPoint {
  type: 'Point'
  coordinates: [number, number]
}

interface GeoJSONFeatureCollection<G> {
  type: 'FeatureCollection'
  features: GeoJSONFeature<G>[]
}

export interface TransitGeoJSON {
  legs: GeoJSONFeatureCollection<GeoJSONLineString>
  stops: GeoJSONFeatureCollection<GeoJSONPoint>
}

export function itineraryToGeoJSON(itinerary: TransitItinerary): TransitGeoJSON {
  // Build leg features
  const legFeatures = itinerary.legs.map((leg, index): GeoJSONFeature<GeoJSONLineString> => ({
    type: 'Feature',
    properties: {
      index,
      mode: leg.mode,
      routeName: leg.routeName ?? null,
      routeColor: leg.routeColor ?? null,
      duration: leg.duration,
      distance: leg.distance,
      isTransfer: leg.isTransfer ?? false,
      // Default colours per mode — consumer can override
      color: getLegColor(leg),
      dashArray: leg.mode === 'WALK' ? [2, 4] : null,
      width: leg.mode === 'WALK' ? 4 : 5
    },
    geometry: leg.geometry
  }))

  // Build stop features from all transit legs
  const stopFeatures: GeoJSONFeature<GeoJSONPoint>[] = []
  for (const leg of itinerary.legs) {
    if (leg.mode === 'WALK') continue
    const legColor = getLegColor(leg)

    if (leg.intermediateStops) {
      for (const stop of leg.intermediateStops) {
        stopFeatures.push({
          type: 'Feature',
          properties: {
            stopId: stop.stopId,
            name: stop.name,
            arrivalTime: stop.arrivalTime ?? null,
            routeName: leg.routeName ?? null,
            color: legColor
          },
          geometry: {
            type: 'Point',
            coordinates: [stop.lng, stop.lat]
          }
        })
      }
    }
  }

  return {
    legs: { type: 'FeatureCollection', features: legFeatures },
    stops: { type: 'FeatureCollection', features: stopFeatures }
  }
}

function getLegColor(leg: TransitLeg): string {
  if (leg.routeColor) return leg.routeColor
  switch (leg.mode) {
    case 'WALK': return '#888888'
    case 'BUS': return '#2196F3'
    case 'RAIL': return '#4CAF50'
    case 'FERRY': return '#00BCD4'
    case 'TRAM': return '#9C27B0'
    default: return '#888888'
  }
}

export function stopInfosToGeoJSON(stops: StopInfo[], fallbackColor?: string): GeoJSONFeatureCollection<GeoJSONPoint> {
  return {
    type: 'FeatureCollection',
    features: stops.map((stop): GeoJSONFeature<GeoJSONPoint> => ({
      type: 'Feature',
      properties: {
        stopId: stop.stopId,
        name: stop.name,
        arrivalTime: stop.arrivalTime ?? null,
        routes: stop.routes ?? null,
        color: fallbackColor ?? '#888888'
      },
      geometry: {
        type: 'Point',
        coordinates: [stop.lng, stop.lat]
      }
    }))
  }
}
