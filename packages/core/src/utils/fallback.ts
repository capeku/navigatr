export async function tryWithFallbacks<T>(
  urls: string[],
  request: (url: string) => Promise<T>,
  label: string
): Promise<T> {
  const failures: string[] = []

  for (const url of urls) {
    try {
      return await request(url)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      failures.push(`${url}: ${message}`)
    }
  }

  throw new Error(`${label} failed across all configured services. ${failures.join(' | ')}`)
}
