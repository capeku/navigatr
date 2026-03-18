#!/usr/bin/env node

/**
 * Embeds MapLibre GL CSS into a TypeScript file for bundling.
 * Run this before building the package.
 */

import { readFileSync, writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = dirname(fileURLToPath(import.meta.url))
const require = createRequire(import.meta.url)

// Find the CSS file using require.resolve (works with pnpm)
const maplibrePath = dirname(require.resolve('maplibre-gl/package.json'))
const cssPath = resolve(maplibrePath, 'dist/maplibre-gl.css')
const outputPath = resolve(__dirname, '../src/styles.ts')

try {
  const css = readFileSync(cssPath, 'utf-8')

  // Minify CSS (basic minification)
  const minified = css
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ')              // Collapse whitespace
    .replace(/\s*{\s*/g, '{')          // Remove space around {
    .replace(/\s*}\s*/g, '}')          // Remove space around }
    .replace(/\s*;\s*/g, ';')          // Remove space around ;
    .replace(/\s*:\s*/g, ':')          // Remove space around :
    .replace(/\s*,\s*/g, ',')          // Remove space around ,
    .trim()

  const tsContent = `// Auto-generated - do not edit
// Run "pnpm run embed-css" to regenerate

const MAPLIBRE_CSS = \`${minified.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`

let injected = false

export function injectMapLibreStyles(): void {
  if (injected || typeof document === 'undefined') return

  const style = document.createElement('style')
  style.setAttribute('data-navigatr', 'maplibre')
  style.textContent = MAPLIBRE_CSS
  document.head.appendChild(style)
  injected = true
}
`

  writeFileSync(outputPath, tsContent)
  console.log(`✓ Embedded MapLibre CSS (${(minified.length / 1024).toFixed(1)}KB minified) into src/styles.ts`)
} catch (err) {
  console.error('Failed to embed CSS:', err.message)
  process.exit(1)
}
