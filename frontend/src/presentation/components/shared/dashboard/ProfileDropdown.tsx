import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { createPortal } from "react-dom"
import { Settings, LogOut } from "lucide-react"
import { cn } from "@/shared/utils/cn"
import { logoutUser } from "@/business/services/authService"
import type { User } from "@/business/models/auth"

const DESKTOP_PROFILE_DROPDOWN_MEDIA_QUERY = "(min-width: 1024px)"
const EXPANDED_SIDEBAR_WIDTH_PX = 224
const COLLAPSED_SIDEBAR_WIDTH_PX = 64
const SIDEBAR_MENU_GAP_PX = 8

function getIsDesktopViewport(): boolean {
  if (typeof window === "undefined") {
    return false
  }

  return window.matchMedia(DESKTOP_PROFILE_DROPDOWN_MEDIA_QUERY).matches
}

type CompatibleMediaQueryList = MediaQueryList & {
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void
}

interface ProfileDropdownProps {
  user: User | null
  userInitials: string
  children: React.ReactNode
  isSidebarCollapsed?: boolean
}

/**
 * Dropdown menu that displays Settings and Log Out options when profile button is clicked.
 *
 * @param user - The current user object containing profile information.
 * @param userInitials - The user's initials for avatar fallback.
 * @param children - The trigger element (profile button).
 */
export function ProfileDropdown({
  children,
  isSidebarCollapsed = false,
}: ProfileDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isDesktopViewport, setIsDesktopViewport] = useState(
    getIsDesktopViewport,
  )
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownMenuRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const clickedInsideContainer = containerRef.current?.contains(event.target as Node) ?? false
      const clickedInsideDropdown = dropdownMenuRef.current?.contains(event.target as Node) ?? false

      if (!clickedInsideContainer && !clickedInsideDropdown) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
      }
    }
  }, [isOpen])

  useEffect(() => {
    const desktopMediaQueryList = window.matchMedia(
      DESKTOP_PROFILE_DROPDOWN_MEDIA_QUERY,
    ) as CompatibleMediaQueryList

    const syncDesktopViewportState = (matchesDesktopViewport: boolean) => {
      setIsDesktopViewport(matchesDesktopViewport)
    }

    syncDesktopViewportState(desktopMediaQueryList.matches)

    const handleDesktopViewportChange = (event: MediaQueryListEvent) => {
      syncDesktopViewportState(event.matches)
    }

    if (desktopMediaQueryList.addEventListener) {
      desktopMediaQueryList.addEventListener(
        "change",
        handleDesktopViewportChange,
      )
    } else {
      desktopMediaQueryList.addListener?.(handleDesktopViewportChange)
    }

    return () => {
      if (desktopMediaQueryList.removeEventListener) {
        desktopMediaQueryList.removeEventListener(
          "change",
          handleDesktopViewportChange,
        )
      } else {
        desktopMediaQueryList.removeListener?.(handleDesktopViewportChange)
      }
    }
  }, [])

  const handleSettingsClick = () => {
    navigate("/dashboard/settings")
    setIsOpen(false)
  }

  const handleLogout = async () => {
    setIsOpen(false)
    await logoutUser()
    navigate("/login")
  }

  const shouldRenderFloatingDesktopMenu =
    isDesktopViewport && isSidebarCollapsed
  const floatingDesktopMenuLeftPx =
    (isSidebarCollapsed
      ? COLLAPSED_SIDEBAR_WIDTH_PX
      : EXPANDED_SIDEBAR_WIDTH_PX) + SIDEBAR_MENU_GAP_PX

  const dropdownMenu = (
    <div
      ref={dropdownMenuRef}
      className={cn(
        "z-[11000] rounded-lg border border-slate-700 bg-slate-800 p-1 shadow-lg shadow-black/25",
        shouldRenderFloatingDesktopMenu
          ? "fixed bottom-2 w-48"
          : "absolute bottom-full left-0 right-0 mb-2 w-full",
      )}
      style={
        shouldRenderFloatingDesktopMenu
          ? {
              left: `${floatingDesktopMenuLeftPx}px`,
            }
          : undefined
      }
      role="menu"
      aria-orientation="vertical"
    >
      <button
        onClick={handleSettingsClick}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-700 transition-colors rounded-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-inset",
        )}
        role="menuitem"
      >
        <Settings className="w-4 h-4" />
        <span>Settings</span>
      </button>

      <div className="my-1" />

      <button
        onClick={handleLogout}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-rose-400 hover:bg-slate-700 transition-colors rounded-md",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 focus-visible:ring-inset",
        )}
        role="menuitem"
      >
        <LogOut className="w-4 h-4" />
        <span>Sign Out</span>
      </button>
    </div>
  )

  return (
    <div ref={containerRef} className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full cursor-pointer flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors text-gray-300 hover:text-white hover:bg-white/10"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        {children}
      </button>

      {/* Dropdown Menu */}
      {isOpen &&
        (shouldRenderFloatingDesktopMenu
          ? createPortal(dropdownMenu, document.body)
          : dropdownMenu)}
    </div>
  )
}

