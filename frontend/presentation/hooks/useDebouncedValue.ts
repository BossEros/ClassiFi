import { useEffect, useState } from "react"

/**
 * Returns a debounced version of a value.
 *
 * @param value - The source value.
 * @param delayMs - Debounce delay in milliseconds.
 * @returns The debounced value.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => clearTimeout(timeoutId)
  }, [value, delayMs])

  return debouncedValue
}
