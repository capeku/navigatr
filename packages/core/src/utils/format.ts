/**
 * Formats duration in seconds to a human-readable string.
 * @param seconds - Duration in seconds
 * @returns Formatted string like "10 mins" or "1 hr 5 mins"
 */
export function formatDuration(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60)

  if (totalMinutes < 60) {
    return `${totalMinutes} min${totalMinutes !== 1 ? 's' : ''}`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (minutes === 0) {
    return `${hours} hr${hours !== 1 ? 's' : ''}`
  }

  return `${hours} hr${hours !== 1 ? 's' : ''} ${minutes} min${minutes !== 1 ? 's' : ''}`
}

/**
 * Formats distance in meters to a human-readable string.
 * @param meters - Distance in meters
 * @returns Formatted string like "3.2 km" or "800 m"
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`
  }

  const km = meters / 1000
  return `${km.toFixed(1)} km`
}
