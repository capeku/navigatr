export async function runWithFallback<T>(
  serviceName: string,
  urls: string[],
  execute: (url: string) => Promise<T>
): Promise<T> {
  const candidates = [...new Set(urls.filter(Boolean))]
  const errors: string[] = []

  for (const url of candidates) {
    try {
      return await execute(url)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      errors.push(`${url} -> ${message}`)
    }
  }

  throw new Error(
    `All ${serviceName} providers failed. Tried ${candidates.length} URL${candidates.length === 1 ? '' : 's'}: ${errors.join(' | ')}`
  )
}
