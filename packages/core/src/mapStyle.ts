import type { MapStyle, MapStylePreset, MapColors, LayerVisibility, MarkerStyle, PolylineStyle, MapTheme } from './types'

// Default style values
const DEFAULT_COLORS: Required<MapColors> = {
  primary: '#3b82f6',
  secondary: '#6366f1',
  background: '#f8fafc',
  roads: '#94a3b8',
  water: '#0ea5e9',
  parks: '#22c55e',
  buildings: '#cbd5e1',
  labels: '#1e293b'
}

const DEFAULT_LAYERS: Required<LayerVisibility> = {
  roads: true,
  labels: true,
  buildings: true,
  water: true,
  parks: true,
  terrain: false,
  traffic: false,
  transit: true
}

const DEFAULT_MARKER: Required<MarkerStyle> = {
  iconUrl: '',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  color: '#3b82f6',
  scale: 1
}

const DEFAULT_POLYLINE: Required<PolylineStyle> = {
  color: '#3b82f6',
  weight: 5,
  opacity: 0.8,
  dashArray: '',
  lineCap: 'round',
  lineJoin: 'round'
}

// Built-in style presets
export const MAP_STYLE_PRESETS: MapStylePreset[] = [
  {
    id: 'default',
    name: 'Default',
    style: {
      theme: 'light',
      colors: DEFAULT_COLORS,
      layers: DEFAULT_LAYERS,
      markers: DEFAULT_MARKER,
      polyline: DEFAULT_POLYLINE
    }
  },
  {
    id: 'dark',
    name: 'Dark Mode',
    style: {
      theme: 'dark',
      colors: {
        primary: '#60a5fa',
        secondary: '#818cf8',
        background: '#0f172a',
        roads: '#475569',
        water: '#0369a1',
        parks: '#166534',
        buildings: '#334155',
        labels: '#e2e8f0'
      },
      layers: DEFAULT_LAYERS,
      markers: { ...DEFAULT_MARKER, color: '#60a5fa' },
      polyline: { ...DEFAULT_POLYLINE, color: '#60a5fa' }
    }
  },
  {
    id: 'satellite',
    name: 'Satellite',
    style: {
      theme: 'satellite',
      colors: {
        ...DEFAULT_COLORS,
        labels: '#ffffff'
      },
      layers: {
        ...DEFAULT_LAYERS,
        buildings: false,
        terrain: true
      },
      markers: { ...DEFAULT_MARKER, color: '#fbbf24' },
      polyline: { ...DEFAULT_POLYLINE, color: '#fbbf24', weight: 4 }
    }
  },
  {
    id: 'navigation',
    name: 'Navigation',
    style: {
      theme: 'light',
      colors: {
        primary: '#2563eb',
        secondary: '#7c3aed',
        background: '#f1f5f9',
        roads: '#64748b',
        water: '#38bdf8',
        parks: '#4ade80',
        buildings: '#e2e8f0',
        labels: '#0f172a'
      },
      layers: {
        ...DEFAULT_LAYERS,
        traffic: true,
        transit: true
      },
      markers: { ...DEFAULT_MARKER, color: '#2563eb' },
      polyline: { color: '#2563eb', weight: 6, opacity: 0.9, lineCap: 'round', lineJoin: 'round', dashArray: '' }
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    style: {
      theme: 'light',
      colors: {
        primary: '#000000',
        secondary: '#404040',
        background: '#ffffff',
        roads: '#d4d4d4',
        water: '#e0f2fe',
        parks: '#ecfdf5',
        buildings: '#f5f5f5',
        labels: '#404040'
      },
      layers: {
        roads: true,
        labels: true,
        buildings: false,
        water: true,
        parks: false,
        terrain: false,
        traffic: false,
        transit: false
      },
      markers: { ...DEFAULT_MARKER, color: '#000000' },
      polyline: { color: '#000000', weight: 3, opacity: 1, lineCap: 'round', lineJoin: 'round', dashArray: '' }
    }
  }
]

/**
 * Get a preset style by ID
 */
export function getPreset(presetId: string): MapStylePreset | undefined {
  return MAP_STYLE_PRESETS.find(p => p.id === presetId)
}

/**
 * Get all available presets
 */
export function getPresets(): MapStylePreset[] {
  return [...MAP_STYLE_PRESETS]
}

/**
 * Create a custom style by merging with defaults
 */
export function createStyle(options: Partial<MapStyle> = {}): MapStyle {
  return {
    id: options.id ?? 'custom',
    name: options.name ?? 'Custom Style',
    theme: options.theme ?? 'custom',
    colors: { ...DEFAULT_COLORS, ...options.colors },
    layers: { ...DEFAULT_LAYERS, ...options.layers },
    markers: { ...DEFAULT_MARKER, ...options.markers },
    polyline: { ...DEFAULT_POLYLINE, ...options.polyline }
  }
}

/**
 * Create a style based on a preset with customizations
 */
export function createFromPreset(presetId: string, customizations: Partial<MapStyle> = {}): MapStyle {
  const preset = getPreset(presetId)
  if (!preset) {
    throw new Error(`Unknown preset: ${presetId}`)
  }

  return {
    id: customizations.id ?? `${preset.id}-custom`,
    name: customizations.name ?? `${preset.name} (Custom)`,
    theme: customizations.theme ?? preset.style.theme,
    colors: { ...preset.style.colors, ...customizations.colors },
    layers: { ...preset.style.layers, ...customizations.layers },
    markers: { ...preset.style.markers, ...customizations.markers },
    polyline: { ...preset.style.polyline, ...customizations.polyline }
  }
}

/**
 * Merge two styles, with the second taking precedence
 */
export function mergeStyles(base: MapStyle, override: Partial<MapStyle>): MapStyle {
  return {
    id: override.id ?? base.id,
    name: override.name ?? base.name,
    theme: override.theme ?? base.theme,
    colors: { ...base.colors, ...override.colors },
    layers: { ...base.layers, ...override.layers },
    markers: { ...base.markers, ...override.markers },
    polyline: { ...base.polyline, ...override.polyline }
  }
}

/**
 * Get default style values
 */
export function getDefaults(): { colors: MapColors; layers: LayerVisibility; markers: MarkerStyle; polyline: PolylineStyle } {
  return {
    colors: { ...DEFAULT_COLORS },
    layers: { ...DEFAULT_LAYERS },
    markers: { ...DEFAULT_MARKER },
    polyline: { ...DEFAULT_POLYLINE }
  }
}

/**
 * Validate a map style object
 */
export function validateStyle(style: MapStyle): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (style.colors) {
    const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
    for (const [key, value] of Object.entries(style.colors)) {
      if (value && !colorRegex.test(value)) {
        errors.push(`Invalid color format for ${key}: ${value}`)
      }
    }
  }

  if (style.polyline) {
    if (style.polyline.weight !== undefined && (style.polyline.weight < 0 || style.polyline.weight > 50)) {
      errors.push('Polyline weight must be between 0 and 50')
    }
    if (style.polyline.opacity !== undefined && (style.polyline.opacity < 0 || style.polyline.opacity > 1)) {
      errors.push('Polyline opacity must be between 0 and 1')
    }
  }

  if (style.markers?.scale !== undefined && (style.markers.scale < 0.1 || style.markers.scale > 5)) {
    errors.push('Marker scale must be between 0.1 and 5')
  }

  return { valid: errors.length === 0, errors }
}

/**
 * Convert style to CSS custom properties for use in web applications
 */
export function toCSSVariables(style: MapStyle, prefix: string = 'navigatr'): Record<string, string> {
  const vars: Record<string, string> = {}

  if (style.colors) {
    for (const [key, value] of Object.entries(style.colors)) {
      if (value) {
        vars[`--${prefix}-${key}`] = value
      }
    }
  }

  if (style.polyline) {
    if (style.polyline.color) vars[`--${prefix}-route-color`] = style.polyline.color
    if (style.polyline.weight) vars[`--${prefix}-route-weight`] = `${style.polyline.weight}px`
    if (style.polyline.opacity) vars[`--${prefix}-route-opacity`] = String(style.polyline.opacity)
  }

  if (style.markers?.color) {
    vars[`--${prefix}-marker-color`] = style.markers.color
  }

  return vars
}
