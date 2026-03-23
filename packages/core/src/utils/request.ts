import { NavigatrError } from '../types'

export interface RequestOptions {
  timeoutMs?: number
}

export async function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit,
  options: RequestOptions = {}
): Promise<Response> {
  const { timeoutMs } = options
  let timeoutId: ReturnType<typeof setTimeout> | undefined
  let controller: AbortController | undefined

  try {
    if (timeoutMs && timeoutMs > 0) {
      controller = new AbortController()
      timeoutId = setTimeout(() => controller?.abort(), timeoutMs)
    }

    const response = await fetch(input, {
      ...init,
      signal: controller?.signal ?? init?.signal
    })

    return response
  } catch (error) {
    if (error instanceof NavigatrError) {
      throw error
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new NavigatrError(
        'TIMEOUT',
        `Request timed out${timeoutMs ? ` after ${timeoutMs}ms` : ''}`,
        { cause: error }
      )
    }

    throw new NavigatrError('NETWORK_ERROR', 'Network request failed', {
      cause: error
    })
  } finally {
    if (timeoutId) clearTimeout(timeoutId)
  }
}
