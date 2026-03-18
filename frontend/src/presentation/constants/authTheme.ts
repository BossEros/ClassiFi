export const authTheme = {
  pageShell:
    "min-h-screen w-full grid place-items-center bg-gradient-to-br from-[#11211F] via-[#17312D] to-[#0E1B19] p-6 md:p-8",
  backgroundOrbPrimary:
    "absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-teal-400/10 blur-3xl",
  backgroundOrbSecondary:
    "absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-emerald-200/10 blur-3xl",
  cardWrapper: "relative w-full",
  loginCardWidth: "max-w-[448px] min-w-[320px]",
  registerCardWidth: "max-w-[672px] min-w-[320px]",
  cardSurface:
    "rounded-3xl border border-[#D7E2DE] bg-[#F4F7F6] p-6 shadow-2xl sm:p-8 md:p-10",
  compactCardSurface:
    "w-full rounded-3xl border border-[#D7E2DE] bg-[#F4F7F6] p-8 shadow-2xl md:p-10",
  cardTitle: "text-3xl font-bold tracking-tight text-[#13211E] sm:text-4xl",
  cardSubtitle: "text-sm leading-relaxed text-[#5F746E] sm:text-base",
  contentText: "text-sm leading-relaxed text-[#5F746E]",
  label: "block text-sm font-medium text-[#334944]",
  input:
    "border border-[#B8C8C2] bg-[#EDF3F1] text-[#13211E] placeholder:text-[#6F8680] shadow-sm transition-all duration-200 hover:border-[#9FB3AC] focus:border-teal-600 focus:ring-teal-500/20",
  inputWithLeadingIcon: "pl-11",
  inputWithTrailingIcon: "pr-11",
  inputIconNonInteractive:
    "pointer-events-none z-10 text-[#48615A] transition-colors duration-200",
  inputIconInteractive:
    "z-10 text-[#48615A] transition-colors duration-200",
  helperText: "text-xs text-[#6A817A]",
  mutedText: "text-sm text-[#5F746E]",
  footerText: "mt-6 text-center text-xs text-slate-300/80",
  divider: "border-t border-[#D7E2DE]",
  link: "font-semibold text-teal-700 transition-colors hover:text-teal-800 hover:underline",
  subtleLink: "font-medium text-teal-700 transition-colors hover:text-teal-800",
  errorAlert:
    "rounded-lg border border-rose-200 bg-[#FDECEC] p-3 text-sm text-[#B42318]",
  successAlert:
    "rounded-lg border border-emerald-200 bg-[#EAF7F1] p-3 text-sm text-[#166534]",
  progressTrack: "relative h-1.5 rounded-full bg-[#DDE8E4]",
  progressFill:
    "absolute h-full rounded-full bg-gradient-to-r from-teal-700 to-teal-500 transition-all duration-500 ease-out",
  backButton:
    "flex items-center text-[#5F746E] transition-colors hover:text-[#13211E]",
  roleCardBase:
    "relative rounded-2xl border-2 p-8 transition-all duration-200 shadow-sm",
  roleCardDefault:
    "border-[#C7D5D0] bg-[#EDF3F1] hover:border-[#AABBB5] hover:bg-[#F0F5F3]",
  roleCardSelected:
    "border-teal-600 bg-[#E2F3EF] shadow-[0_12px_32px_rgba(13,148,136,0.16)] ring-2 ring-teal-500/15",
  roleIconShell:
    "relative mx-auto mb-4 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-[#C7D5D0] bg-white/80 text-[#35514A] transition-colors duration-200",
  roleIconShellSelected:
    "border-teal-300 bg-white text-teal-700 shadow-[0_10px_24px_rgba(13,148,136,0.16)]",
  selectedBadge:
    "absolute right-4 top-4 inline-flex items-center rounded-full bg-teal-700 px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white",
  successIconShell:
    "flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-600 to-teal-500",
  errorIconShell:
    "flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-rose-500 to-rose-600",
  loadingSpinnerShell:
    "h-10 w-10 animate-spin rounded-full border-4 border-[#C7D5D0] border-t-teal-600",
} as const
