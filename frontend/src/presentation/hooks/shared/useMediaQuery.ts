import { useCallback, useSyncExternalStore } from "react"

/**
 * Subscribes to a CSS media query and returns whether it currently matches.
 *
 * @param query - A valid CSS media query string (e.g. "(max-width: 639px)").
 * @returns True when the viewport matches the media query.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mediaQueryList = window.matchMedia(query)
      mediaQueryList.addEventListener("change", callback)

      return () => mediaQueryList.removeEventListener("change", callback)
    },
    [query],
  )

  const getSnapshot = useCallback(() => {
    return window.matchMedia(query).matches
  }, [query])

  const getServerSnapshot = useCallback(() => false, [])

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}

/** True when viewport width < 640px (phone). */
export function useIsMobile(): boolean {
  return useMediaQuery("(max-width: 639px)")
}

/** True when viewport width < 1024px (phone + tablet). */
export function useIsTabletOrBelow(): boolean {
  return useMediaQuery("(max-width: 1023px)")
}
