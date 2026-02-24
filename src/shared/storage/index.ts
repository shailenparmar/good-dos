export function lsGet(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

export function lsSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage full or unavailable
  }
}

export function lsGetNumber(key: string, fallback: number): number {
  const val = lsGet(key)
  if (val === null) return fallback
  const num = Number(val)
  return isNaN(num) ? fallback : num
}
