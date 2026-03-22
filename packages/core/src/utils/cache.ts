interface CacheEntry<T> {
  value: T
  expiresAt: number
}

export interface InMemoryCacheOptions {
  enabled: boolean
  ttlMs: number
  maxEntries: number
}

function cloneCacheValue<T>(value: T): T {
  return typeof structuredClone === 'function'
    ? structuredClone(value)
    : JSON.parse(JSON.stringify(value)) as T
}

export class InMemoryCache {
  private entries = new Map<string, CacheEntry<unknown>>()
  private readonly enabled: boolean
  private readonly ttlMs: number
  private readonly maxEntries: number

  constructor(options: InMemoryCacheOptions) {
    this.enabled = options.enabled
    this.ttlMs = Math.max(0, options.ttlMs)
    this.maxEntries = Math.max(0, options.maxEntries)
  }

  get<T>(key: string): T | undefined {
    if (!this.isActive()) {
      return undefined
    }

    const entry = this.entries.get(key)
    if (!entry) {
      return undefined
    }

    if (entry.expiresAt <= Date.now()) {
      this.entries.delete(key)
      return undefined
    }

    this.entries.delete(key)
    this.entries.set(key, entry)

    return cloneCacheValue(entry.value as T)
  }

  set<T>(key: string, value: T): void {
    if (!this.isActive()) {
      return
    }

    this.entries.delete(key)
    this.entries.set(key, {
      value: cloneCacheValue(value),
      expiresAt: Date.now() + this.ttlMs
    })

    while (this.entries.size > this.maxEntries) {
      const oldestKey = this.entries.keys().next().value
      if (!oldestKey) {
        break
      }
      this.entries.delete(oldestKey)
    }
  }

  clear(): void {
    this.entries.clear()
  }

  private isActive(): boolean {
    return this.enabled && this.ttlMs > 0 && this.maxEntries > 0
  }
}
