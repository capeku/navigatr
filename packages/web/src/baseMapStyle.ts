import type { BaseMapStylePreset } from '@navigatr/core'

export const DEFAULT_BASE_MAP_STYLE: BaseMapStylePreset = 'liberty'

export const BASE_MAP_STYLE_URLS: Record<BaseMapStylePreset, string> = {
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  bright: 'https://tiles.openfreemap.org/styles/bright',
  positron: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark'
}

export interface BaseMapStyleConfig {
  stylePreset?: BaseMapStylePreset
  styleUrl?: string
}

export function resolveBaseMapStyle(config?: BaseMapStyleConfig): string {
  if (config?.styleUrl) {
    return config.styleUrl
  }

  return BASE_MAP_STYLE_URLS[config?.stylePreset ?? DEFAULT_BASE_MAP_STYLE]
}
