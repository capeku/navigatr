import { StatusBar } from 'expo-status-bar'
import React from 'react'
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native'
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps'
import {
  createInitialRegion,
  createOSMTileConfig,
  type AutocompleteResult,
  type LatLng,
  type MobileMapRef,
  type MobileMapRenderState,
  type NavigatrMobileMap,
  type RidePhase,
  type RideSession,
  type RouteResult,
  NavigatrMobile
} from '@navigatr/mobile'

const nav = new NavigatrMobile({
  valhallaUrl: 'http://localhost:8002'
})
const tile = createOSMTileConfig()
const fallbackCenter = { lat: -1.286389, lng: 36.817223 }
const customDriverMarkerImage = require('./assets/car.png')

type ActiveField = 'pickup' | 'destination' | null
type GeocodeFeatureType = 'country' | 'state' | 'city' | 'settlement'

function createMapRefBridge(mapRef: React.RefObject<MapView | null>): MobileMapRef {
  return {
    animateToRegion: (region, duration) => mapRef.current?.animateToRegion(region, duration),
    animateCamera: (camera, options) => mapRef.current?.animateCamera(camera, options),
    setCamera: (camera) => mapRef.current?.setCamera(camera),
    fitToCoordinates: (coords, options) => mapRef.current?.fitToCoordinates(coords, options)
  }
}

function parseFeatureType(value: string): GeocodeFeatureType | undefined {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'country') return 'country'
  if (normalized === 'state') return 'state'
  if (normalized === 'city') return 'city'
  if (normalized === 'settlement') return 'settlement'
  return undefined
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180
}

function bearingDegrees(from: LatLng, to: LatLng): number {
  const phi1 = toRadians(from.lat)
  const phi2 = toRadians(to.lat)
  const deltaLambda = toRadians(to.lng - from.lng)

  const y = Math.sin(deltaLambda) * Math.cos(phi2)
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda)

  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  )
}

function AppContent() {
  const insets = useSafeAreaInsets()
  const mapRef = React.useRef<MapView>(null)
  const rideRef = React.useRef<RideSession | null>(null)
  const pickupMarkerRef = React.useRef<{ setLatLng: (location: LatLng) => void; remove: () => void } | null>(null)
  const destinationMarkerRef = React.useRef<{ setLatLng: (location: LatLng) => void; remove: () => void } | null>(null)
  const simulationTimerRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
  const autocompleteTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)
  const pickupHeadingRef = React.useRef(0)

  const [mapState, setMapState] = React.useState<MobileMapRenderState | null>(null)
  const [phase, setPhase] = React.useState<RidePhase>('waiting')
  const [etaText, setEtaText] = React.useState('Search pickup and destination')
  const [isBusy, setIsBusy] = React.useState(false)
  const [isSearching, setIsSearching] = React.useState(false)
  const [errorText, setErrorText] = React.useState<string | null>(null)

  const [pickupInput, setPickupInput] = React.useState('')
  const [destinationInput, setDestinationInput] = React.useState('')
  const [pickup, setPickup] = React.useState<LatLng | null>(null)
  const [destination, setDestination] = React.useState<LatLng | null>(null)
  const [routeResult, setRouteResult] = React.useState<RouteResult | null>(null)
  const [selectedRouteIndex, setSelectedRouteIndex] = React.useState(-1)
  const [suggestions, setSuggestions] = React.useState<AutocompleteResult[]>([])
  const [activeField, setActiveField] = React.useState<ActiveField>(null)
  const [countryCodesInput, setCountryCodesInput] = React.useState('')
  const [featureTypeInput, setFeatureTypeInput] = React.useState('')
  const [extraParamsInput, setExtraParamsInput] = React.useState('')
  const [showRestrictions, setShowRestrictions] = React.useState(false)

  const [topCardHeight, setTopCardHeight] = React.useState(190)
  const [bottomCardHeight, setBottomCardHeight] = React.useState(190)

  const map = React.useMemo<NavigatrMobileMap>(() => {
    return nav.map({
      center: fallbackCenter,
      zoom: 14,
      mapRef: createMapRefBridge(mapRef),
      onStateChange: setMapState
    })
  }, [])

  React.useEffect(() => {
    const unsubscribeMap = map.subscribe(setMapState)
    const unsubscribeNav = nav.onLocationUpdate((location) => {
      void rideRef.current?.updateDriverLocation(location)
    })
    const unsubscribeAlt = map.onAlternateRouteClick((index) => {
      setSelectedRouteIndex(index)
    })
    const unsubscribeNavEvents = map.onNavigationEvent((event) => {
      if (event.type === 'arrived') {
        setEtaText('Arrived at destination')
      }
    })

    return () => {
      unsubscribeMap()
      unsubscribeNav()
      unsubscribeAlt()
      unsubscribeNavEvents()
      clearSimulation()
      if (autocompleteTimerRef.current) clearTimeout(autocompleteTimerRef.current)
    }
  }, [map])

  const initialRegion = React.useMemo(
    () => createInitialRegion({ center: fallbackCenter, mapRef: createMapRefBridge(mapRef) }),
    []
  )

  const navProgress = React.useMemo(() => {
    const total = mapState?.route.primary.length ?? 0
    const traveled = mapState?.route.traveled.length ?? 0
    if (total === 0) return 0
    return Math.max(0, Math.min(100, Math.round((traveled / total) * 100)))
  }, [mapState])

  const currentRouteMeta = React.useMemo(() => {
    if (!routeResult) return null
    if (selectedRouteIndex < 0) {
      return { durationText: routeResult.durationText, distanceText: routeResult.distanceText }
    }
    const alt = routeResult.alternates?.[selectedRouteIndex]
    if (!alt) return null
    return { durationText: alt.durationText, distanceText: alt.distanceText }
  }, [routeResult, selectedRouteIndex])

  const parsedSearchFilters = React.useMemo(() => {
    const countryCodes = countryCodesInput
      .split(',')
      .map((code) => code.trim().toLowerCase())
      .filter((code) => code.length > 0)

    const featureType = parseFeatureType(featureTypeInput)

    const extraParams: Record<string, string> = {}
    extraParamsInput
      .split('&')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .forEach((entry) => {
        const [rawKey, ...rest] = entry.split('=')
        const key = rawKey?.trim()
        const value = rest.join('=').trim()
        if (!key) return
        if (value.length === 0) return
        extraParams[key] = value
      })

    return {
      countryCodes: countryCodes.length > 0 ? countryCodes : undefined,
      featureType,
      extraParams: Object.keys(extraParams).length > 0 ? extraParams : undefined
    }
  }, [countryCodesInput, featureTypeInput, extraParamsInput])

  function clearSimulation(): void {
    if (simulationTimerRef.current) {
      clearInterval(simulationTimerRef.current)
      simulationTimerRef.current = null
    }
  }

  function fitWithOverlayPadding(polyline: LatLng[]): void {
    map.fitRoute(polyline, {
      edgePadding: {
        top: Math.round(insets.top + topCardHeight + 18),
        right: 34,
        bottom: Math.round(insets.bottom + bottomCardHeight + 20),
        left: 34
      },
      animated: true
    })
  }

  function upsertMarker(type: 'pickup' | 'destination', point: LatLng): void {
    if (type === 'pickup') {
      if (pickupMarkerRef.current) pickupMarkerRef.current.setLatLng(point)
      else pickupMarkerRef.current = map.addMarker({ ...point, label: 'Pickup' })
      return
    }

    if (destinationMarkerRef.current) destinationMarkerRef.current.setLatLng(point)
    else destinationMarkerRef.current = map.addMarker({ ...point, label: 'Destination' })
  }

  async function setLocationFromSuggestion(type: 'pickup' | 'destination', suggestion: AutocompleteResult): Promise<void> {
    const location = { lat: suggestion.lat, lng: suggestion.lng }

    if (type === 'pickup') {
      setPickupInput(suggestion.name || suggestion.displayName)
      setPickup(location)
    } else {
      setDestinationInput(suggestion.name || suggestion.displayName)
      setDestination(location)
    }

    upsertMarker(type, location)
    map.panTo(location)
    setSuggestions([])
    setActiveField(null)
    Keyboard.dismiss()

    const nextPickup = type === 'pickup' ? location : pickup
    const nextDestination = type === 'destination' ? location : destination
    if (nextPickup && nextDestination) {
      await calculateRouteWithPoints(nextPickup, nextDestination)
    }
  }

  function requestAutocomplete(type: 'pickup' | 'destination', query: string): void {
    if (type === 'pickup') setPickupInput(query)
    if (type === 'destination') setDestinationInput(query)
    setActiveField(type)

    if (autocompleteTimerRef.current) clearTimeout(autocompleteTimerRef.current)

    if (query.trim().length < 2) {
      setSuggestions([])
      return
    }

    autocompleteTimerRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const autocompleteExtraParams = { ...(parsedSearchFilters.extraParams ?? {}) }
        // Photon does not support these params and will fail the request.
        delete autocompleteExtraParams.countrycode
        delete autocompleteExtraParams.countrycodes

        const results = await nav.autocomplete({
          query,
          limit: 5,
          countryCodes: parsedSearchFilters.countryCodes,
          extraParams: Object.keys(autocompleteExtraParams).length > 0 ? autocompleteExtraParams : undefined
        })
        setSuggestions(results)
        if (parsedSearchFilters.countryCodes?.length && results.length === 0) {
          setErrorText(
            `No autocomplete results within ${parsedSearchFilters.countryCodes
              .map((code) => code.toUpperCase())
              .join(', ')}.`
          )
        } else {
          setErrorText(null)
        }
      } catch {
        setSuggestions([])
        setErrorText('Autocomplete request failed. Remove unsupported extra params and retry.')
      } finally {
        setIsSearching(false)
      }
    }, 260)
  }

  async function geocodeFromInput(type: 'pickup' | 'destination'): Promise<void> {
    const query = type === 'pickup' ? pickupInput.trim() : destinationInput.trim()
    if (!query) return

    setIsBusy(true)
    setErrorText(null)
    try {
      const result = await nav.geocode({
        address: query,
        countryCodes: parsedSearchFilters.countryCodes,
        featureType: parsedSearchFilters.featureType,
        extraParams: parsedSearchFilters.extraParams
      })
      const location = { lat: result.lat, lng: result.lng }

      if (type === 'pickup') {
        setPickup(location)
        setPickupInput(result.displayName)
      } else {
        setDestination(location)
        setDestinationInput(result.displayName)
      }

      upsertMarker(type, location)
      map.panTo(location)

      const nextPickup = type === 'pickup' ? location : pickup
      const nextDestination = type === 'destination' ? location : destination
      if (nextPickup && nextDestination) {
        await calculateRouteWithPoints(nextPickup, nextDestination)
      }

      setSuggestions([])
      setActiveField(null)
      Keyboard.dismiss()
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Geocoding failed')
    } finally {
      setIsBusy(false)
    }
  }

  async function calculateRouteWithPoints(origin: LatLng, dest: LatLng): Promise<void> {
    setSelectedRouteIndex(-1)
    const result = await nav.route({ origin, destination: dest, mode: 'drive' })
    setRouteResult(result)

    map.clearRoute()
    map.drawRoute(result.polyline)
    fitWithOverlayPadding(result.polyline)
    map.drawAlternateRoutes(result.alternates ?? [])

    setEtaText(`${result.durationText} • ${result.distanceText}`)
  }

  async function calculateRoute(): Promise<void> {
    if (!pickup || !destination) return
    setIsBusy(true)
    setErrorText(null)
    try {
      await calculateRouteWithPoints(pickup, destination)
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Route calculation failed')
    } finally {
      setIsBusy(false)
    }
  }

  function selectRoute(index: number): void {
    if (!routeResult) return
    setSelectedRouteIndex(index)

    if (index < 0) {
      map.clearRoute()
      map.drawRoute(routeResult.polyline)
      fitWithOverlayPadding(routeResult.polyline)
      map.drawAlternateRoutes(routeResult.alternates ?? [])
      return
    }

    const alt = routeResult.alternates?.[index]
    if (!alt) return
    map.clearRoute()
    map.drawRoute(alt.polyline)
    fitWithOverlayPadding(alt.polyline)
    map.drawAlternateRoutes(routeResult.alternates ?? [])
  }

  function runLocationSimulation(polyline: LatLng[], intervalMs: number, mode: 'pickup' | 'trip'): void {
    clearSimulation()
    if (polyline.length === 0) return

    let routeIndex = 0
    let previousPoint = polyline[0]
    simulationTimerRef.current = setInterval(() => {
      routeIndex = Math.min(routeIndex + 1, polyline.length - 1)
      const point = polyline[routeIndex]

      if (mode === 'trip') map.updatePosition(point)
      else {
        if (point.lat !== previousPoint.lat || point.lng !== previousPoint.lng) {
          pickupHeadingRef.current = bearingDegrees(previousPoint, point)
        }
        map.updateDriverMarker({
          ...point,
          heading: pickupHeadingRef.current,
          icon: 'car',
          image: customDriverMarkerImage,
          rotationOffsetDegrees: 0
        })
        nav.pushLocationUpdate(point)
      }

      previousPoint = point

      if (routeIndex >= polyline.length - 1) clearSimulation()
    }, intervalMs)
  }

  async function requestRide(): Promise<void> {
    if (!pickup || !destination) {
      setErrorText('Select pickup and destination first')
      return
    }

    if (!routeResult) {
      await calculateRoute()
      return
    }

    setIsBusy(true)
    setErrorText(null)

    try {
      const ride = nav.createRide({
        pickup,
        destination,
        map,
        driverMarker: {
          icon: 'car',
          image: customDriverMarkerImage,
          // Car sprite points north/up.
          rotationOffsetDegrees: 0
        },
        onETAUpdate: (eta, nextPhase) => {
          setEtaText(`${nextPhase}: ${eta.durationText} (${eta.distanceText})`)
        },
        onPhaseChange: setPhase
      })
      rideRef.current = ride

      const driverStart = { lat: pickup.lat + 0.012, lng: pickup.lng - 0.009 }
      pickupHeadingRef.current = 0
      const pickupRoute = await ride.startPickup(driverStart)
      setRouteResult(pickupRoute)
      setSelectedRouteIndex(-1)
      runLocationSimulation(pickupRoute.polyline, 1400, 'pickup')
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Request ride failed')
    } finally {
      setIsBusy(false)
    }
  }

  async function startTrip(): Promise<void> {
    if (!rideRef.current) return
    setIsBusy(true)
    setErrorText(null)

    try {
      const tripRoute = await rideRef.current.startTrip()
      setRouteResult(tripRoute)
      setSelectedRouteIndex(-1)
      map.startNavigation(tripRoute)
      runLocationSimulation(tripRoute.polyline, 1000, 'trip')
    } catch (error) {
      setErrorText(error instanceof Error ? error.message : 'Failed to start trip')
    } finally {
      setIsBusy(false)
    }
  }

  function cancelOrCompleteRide(): void {
    clearSimulation()
    rideRef.current?.complete()
    map.stopNavigation()
    setPhase('completed')
    setEtaText('Ride ended')
  }

  const showSuggestions = activeField !== null && suggestions.length > 0 && phase !== 'in_progress'
  const showSearchUi = phase !== 'in_progress'

  return (
    <SafeAreaView style={styles.screen}>
      <MapView
        ref={mapRef}
        style={styles.map}
        mapType={tile.mapViewProps.mapType}
        initialRegion={initialRegion}
        onPress={(event) => {
          const c = event.nativeEvent.coordinate
          map.handleMapPress({ lat: c.latitude, lng: c.longitude })
          setActiveField(null)
          setSuggestions([])
          Keyboard.dismiss()
        }}
      >
        <UrlTile {...tile.urlTileProps} />

        {mapState?.markers.map((marker) => (
          <Marker
            key={marker.id}
            coordinate={marker.coordinate}
            title={marker.label}
            pinColor={marker.label === 'Pickup' ? '#4BAED0' : '#4BAED0'}
          />
        ))}

        {mapState?.driverMarker ? (
          <Marker
            key={mapState.driverMarker.id}
            coordinate={mapState.driverMarker.coordinate}
            pinColor={mapState.driverMarker.image ? undefined : '#0BEA8D'}
            image={mapState.driverMarker.image}
            rotation={mapState.driverMarker.heading ?? 0}
            flat
            anchor={{ x: 0.5, y: 0.5 }}
          />
        ) : null}

        <Polyline coordinates={mapState?.route.primary ?? []} strokeColor="#00E58B" strokeWidth={6} />
        <Polyline coordinates={mapState?.route.traveled ?? []} strokeColor="#2D3F43" strokeWidth={6} />
        {(mapState?.route.alternates ?? []).map((alt, index) => (
          <Polyline
            key={`alt-${index}`}
            coordinates={alt}
            strokeColor="#8FA5AA"
            strokeWidth={3}
            tappable
            onPress={() => map.handleAlternateRoutePress(index)}
          />
        ))}
      </MapView>

      {showSearchUi ? (
        <View
          style={styles.topCardLight}
          onLayout={(event) => {
            setTopCardHeight(event.nativeEvent.layout.height)
          }}
        >
          <View style={styles.searchRow}>
            <Text style={styles.dotGreen}>●</Text>
            <TextInput
              value={pickupInput}
              onChangeText={(text) => requestAutocomplete('pickup', text)}
              placeholder="Pickup location"
              placeholderTextColor="#868686"
              style={styles.searchInput}
              onFocus={() => setActiveField('pickup')}
              onSubmitEditing={() => void geocodeFromInput('pickup')}
            />
            <Pressable style={styles.searchButton} onPress={() => void geocodeFromInput('pickup')}>
              <Text style={styles.searchButtonText}>⌕</Text>
            </Pressable>
          </View>

          <View style={styles.searchDivider} />

          <View style={styles.searchRow}>
            <Text style={styles.dotDark}>●</Text>
            <TextInput
              value={destinationInput}
              onChangeText={(text) => requestAutocomplete('destination', text)}
              placeholder="Where to?"
              placeholderTextColor="#868686"
              style={styles.searchInput}
              onFocus={() => setActiveField('destination')}
              onSubmitEditing={() => void geocodeFromInput('destination')}
            />
            <Pressable style={styles.searchButton} onPress={() => void geocodeFromInput('destination')}>
              <Text style={styles.searchButtonText}>⌕</Text>
            </Pressable>
          </View>

          <View style={styles.searchDivider} />

          <Pressable
            onPress={() => setShowRestrictions((prev) => !prev)}
            style={styles.restrictionsToggle}
          >
            <Text style={styles.restrictionsToggleText}>
              {showRestrictions ? 'Hide' : 'Show'} search restrictions {showRestrictions ? '▴' : '▾'}
            </Text>
          </Pressable>

          {showRestrictions ? (
            <View style={styles.restrictionsPanel}>
              <Text style={styles.filterLabel}>Country codes (comma-separated, e.g. ke,ug)</Text>
              <TextInput
                value={countryCodesInput}
                onChangeText={setCountryCodesInput}
                placeholder="ke,ug"
                placeholderTextColor="#868686"
                style={styles.filterInput}
                autoCapitalize="none"
              />

              <View style={styles.searchDivider} />

              <Text style={styles.filterLabel}>Feature type (country/state/city/settlement)</Text>
              <TextInput
                value={featureTypeInput}
                onChangeText={setFeatureTypeInput}
                placeholder="city"
                placeholderTextColor="#868686"
                style={styles.filterInput}
                autoCapitalize="none"
              />

              <View style={styles.searchDivider} />

              <Text style={styles.filterLabel}>Extra query params (key=value&key2=value2)</Text>
              <TextInput
                value={extraParamsInput}
                onChangeText={setExtraParamsInput}
                placeholder="polygon_geojson=1"
                placeholderTextColor="#868686"
                style={styles.filterInput}
                autoCapitalize="none"
              />
            </View>
          ) : null}

          {showSuggestions ? (
            <FlatList
              style={styles.suggestionsLight}
              data={suggestions}
              keyExtractor={(item, index) => `${item.lat}-${item.lng}-${index}`}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <Pressable
                  style={styles.suggestionItemLight}
                  onPress={() => {
                    if (!activeField) return
                    void setLocationFromSuggestion(activeField, item)
                  }}
                >
                  <Text style={styles.suggestionTitleLight} numberOfLines={1}>
                    {item.name || item.displayName}
                  </Text>
                  <Text style={styles.suggestionSubtitleLight} numberOfLines={1}>
                    {item.city || item.country || item.displayName}
                  </Text>
                </Pressable>
              )}
            />
          ) : null}

          {isSearching ? <ActivityIndicator color="#00E58B" style={styles.searchSpinner} /> : null}
          {errorText ? <Text style={styles.errorLight}>{errorText}</Text> : null}
        </View>
      ) : (
        <View style={styles.topCardDark}>
          <View style={styles.navHeaderRow}>
            <Text style={styles.navArrow}>▲</Text>
            <View>
              <Text style={styles.navTitle}>En route to destination</Text>
              <Text style={styles.navSubtitle}>{navProgress}% complete</Text>
            </View>
          </View>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${navProgress}%` }]} />
          </View>
        </View>
      )}

      {showSearchUi ? (
        <View
          style={styles.bottomSheetLight}
          onLayout={(event) => {
            setBottomCardHeight(event.nativeEvent.layout.height)
          }}
        >
          <View style={styles.sheetDivider} />
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{currentRouteMeta?.durationText ?? '—'}</Text>
              <Text style={styles.statLabel}>DURATION</Text>
            </View>
            <View style={styles.statVertical} />
            <View style={styles.statCol}>
              <Text style={styles.statValue}>{currentRouteMeta?.distanceText ?? '—'}</Text>
              <Text style={styles.statLabel}>DISTANCE</Text>
            </View>
          </View>
          <View style={styles.sheetDivider} />

          <Pressable
            style={[styles.requestButton, (!pickup || !destination || isBusy) && styles.buttonDisabled]}
            disabled={!pickup || !destination || isBusy}
            onPress={() => {
              if (phase === 'pickup') {
                void startTrip()
                return
              }
              void requestRide()
            }}
          >
            <Text style={styles.requestButtonText}>{phase === 'pickup' ? 'Start Trip' : 'Request Ride'}</Text>
          </Pressable>

          {routeResult?.alternates?.length ? (
            <View style={styles.altButtonsRow}>
              <RouteChip label="Fastest" active={selectedRouteIndex === -1} onPress={() => selectRoute(-1)} />
              {routeResult.alternates.map((_, index) => (
                <RouteChip
                  key={`chip-${index}`}
                  label={`Alt ${index + 1}`}
                  active={selectedRouteIndex === index}
                  onPress={() => selectRoute(index)}
                />
              ))}
            </View>
          ) : null}
        </View>
      ) : (
        <View style={styles.bottomSheetDark}>
          <Pressable style={styles.cancelButton} onPress={cancelOrCompleteRide}>
            <Text style={styles.cancelButtonText}>Cancel Ride</Text>
          </Pressable>
        </View>
      )}

      {isBusy ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#00E58B" />
        </View>
      ) : null}

      <StatusBar style={showSearchUi ? 'dark' : 'light'} />
    </SafeAreaView>
  )
}

function RouteChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.routeChip, active ? styles.routeChipActive : null]}>
      <Text style={[styles.routeChipText, active ? styles.routeChipTextActive : null]}>{label}</Text>
    </Pressable>
  )
}

const mono = 'Menlo'

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F4F4'
  },
  map: {
    flex: 1
  },
  topCardLight: {
    position: 'absolute',
    top: 38,
    left: 16,
    right: 16,
    backgroundColor: '#ECECEC',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.14,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 7
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFDFDF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8
  },
  dotGreen: {
    color: '#00E58B',
    fontSize: 14
  },
  dotDark: {
    color: '#3A3A3A',
    fontSize: 14
  },
  searchInput: {
    flex: 1,
    fontFamily: mono,
    fontSize: 16,
    color: '#202020',
    paddingVertical: 4
  },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#00ED91',
    alignItems: 'center',
    justifyContent: 'center'
  },
  searchButtonText: {
    fontSize: 23,
    color: '#031A0D'
  },
  searchDivider: {
    height: 8
  },
  restrictionsToggle: {
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 9
  },
  restrictionsToggleText: {
    fontFamily: mono,
    fontSize: 12,
    color: '#1F1F1F'
  },
  restrictionsPanel: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    padding: 10
  },
  filterLabel: {
    fontFamily: mono,
    fontSize: 10,
    color: '#616161',
    marginBottom: 4
  },
  filterInput: {
    fontFamily: mono,
    fontSize: 13,
    color: '#202020',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    backgroundColor: '#FFFFFF'
  },
  suggestionsLight: {
    marginTop: 8,
    maxHeight: 175,
    borderWidth: 1,
    borderColor: '#D7D7D7',
    borderRadius: 10,
    backgroundColor: '#FFFFFF'
  },
  suggestionItemLight: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#EAEAEA'
  },
  suggestionTitleLight: {
    color: '#202020',
    fontFamily: mono,
    fontSize: 13
  },
  suggestionSubtitleLight: {
    color: '#6F6F6F',
    fontSize: 11,
    marginTop: 2
  },
  searchSpinner: {
    marginTop: 6
  },
  errorLight: {
    marginTop: 8,
    color: '#D93D3D',
    fontSize: 12,
    fontFamily: mono
  },
  topCardDark: {
    position: 'absolute',
    top: 52,
    left: 20,
    right: 20,
    borderRadius: 20,
    backgroundColor: 'rgba(13, 13, 13, 0.96)',
    paddingHorizontal: 22,
    paddingVertical: 18
  },
  navHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  navArrow: {
    color: '#000',
    fontSize: 22,
    fontWeight: '900'
  },
  navTitle: {
    color: '#F1F1F1',
    fontFamily: mono,
    fontSize: 22,
    fontWeight: '800'
  },
  navSubtitle: {
    color: '#1E315F',
    fontFamily: mono,
    fontSize: 14,
    marginTop: 6
  },
  progressTrack: {
    marginTop: 18,
    height: 8,
    borderRadius: 99,
    backgroundColor: '#535353',
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00E58B'
  },
  bottomSheetLight: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ECECEC',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 26
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#D5D5D5',
    marginBottom: 16
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  statCol: {
    alignItems: 'center',
    flex: 1
  },
  statValue: {
    fontFamily: mono,
    fontSize: 48 / 2,
    color: '#15171A',
    fontWeight: '900'
  },
  statLabel: {
    marginTop: 8,
    fontFamily: mono,
    fontSize: 16 / 2,
    color: '#888888',
    letterSpacing: 1.4
  },
  statVertical: {
    width: 1,
    height: 48,
    backgroundColor: '#CACACA'
  },
  requestButton: {
    height: 64,
    borderRadius: 18,
    backgroundColor: '#090A0D',
    alignItems: 'center',
    justifyContent: 'center'
  },
  requestButtonText: {
    color: '#F2F2F2',
    fontFamily: mono,
    fontWeight: '900',
    fontSize: 42 / 2
  },
  altButtonsRow: {
    marginTop: 10,
    flexDirection: 'row',
    gap: 8
  },
  routeChip: {
    borderWidth: 1,
    borderColor: '#C4C4C4',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#EFEFEF'
  },
  routeChipActive: {
    borderColor: '#00E58B',
    backgroundColor: '#D7FFEE'
  },
  routeChipText: {
    fontFamily: mono,
    color: '#515151',
    fontSize: 11
  },
  routeChipTextActive: {
    color: '#0B7A4F'
  },
  bottomSheetDark: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: 'rgba(13, 13, 13, 0.96)',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 22
  },
  cancelButton: {
    height: 68,
    borderRadius: 18,
    backgroundColor: '#FF4343',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cancelButtonText: {
    color: '#FFF4F4',
    fontFamily: mono,
    fontSize: 20 * 1.1,
    fontWeight: '900'
  },
  buttonDisabled: {
    opacity: 0.45
  },
  loading: {
    position: 'absolute',
    top: 18,
    right: 18
  }
})
