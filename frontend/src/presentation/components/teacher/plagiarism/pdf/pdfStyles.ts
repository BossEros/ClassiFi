import { StyleSheet } from "@react-pdf/renderer"

// ─── Color Tokens ─────────────────────────────────────────────────────────────

export const C = {
  white: "#ffffff",
  black: "#000000",
  navy: "#1a2744",
  navyMid: "#2c3d6b",
  ink: "#111827",
  inkMid: "#374151",
  inkLight: "#6b7280",
  border: "#d1d5db",
  borderLight: "#e5e7eb",
  rowAlt: "#f9fafb",
  headerBg: "#f3f4f6",
  highBg: "#fef2f2",
  highBorder: "#fca5a5",
  highText: "#991b1b",
  medBg: "#fffbeb",
  medBorder: "#fcd34d",
  medText: "#92400e",
  lowBg: "#f0fdf4",
  lowBorder: "#86efac",
  lowText: "#166534",
} as const

// ─── Table Column Widths ───────────────────────────────────────────────────────

export const classReportTableColumnWidths = {
  pairLabel: "34%",
  similarity: "13.2%",
  signal: "13.2%",
} as const

export const fragmentReportTableColumnWidths = {
  fragment: "20%",
  range: "32%",
  length: "16%",
} as const

// ─── StyleSheet ────────────────────────────────────────────────────────────────

export const pdfStyles = StyleSheet.create({
  // ── Page ──────────────────────────────────────────────────────────────────
  page: {
    paddingTop: 48,
    paddingRight: 52,
    paddingBottom: 52,
    paddingLeft: 52,
    backgroundColor: C.white,
    color: C.ink,
    fontFamily: "Helvetica",
    fontSize: 10,
    lineHeight: 1.5,
  },

  // ── Document Header ───────────────────────────────────────────────────────
  docHeader: {
    marginBottom: 5,
    paddingBottom: 6,
    borderBottom: `2 solid ${C.navy}`,
  },
  systemName: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.inkLight,
    textTransform: "uppercase",
    letterSpacing: 1.4,
    marginBottom: 2,
  },
  reportTitle: {
    fontSize: 17,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    lineHeight: 1.2,
  },
  reportSubtitle: {
    marginTop: 2,
    fontSize: 9,
    color: C.inkLight,
    lineHeight: 1.4,
  },

  // ── Sections ──────────────────────────────────────────────────────────────
  section: {
    marginTop: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    borderBottom: `1 solid ${C.border}`,
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },

  // ── Metadata Grid ─────────────────────────────────────────────────────────
  metadataGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  metadataEntry: {
    width: "50%",
    paddingTop: 6,
    paddingBottom: 6,
    paddingRight: 16,
    borderBottom: `1 solid ${C.borderLight}`,
  },
  metadataLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.inkLight,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metadataValue: {
    fontSize: 9.5,
    color: C.ink,
  },

  // ── Metric Row (summary stats) ────────────────────────────────────────────
  metricRow: {
    flexDirection: "row",
    border: `1 solid ${C.border}`,
  },
  metricCell: {
    flex: 1,
    paddingTop: 10,
    paddingRight: 12,
    paddingBottom: 10,
    paddingLeft: 12,
    borderRight: `1 solid ${C.border}`,
  },
  metricCellLast: {
    borderRightWidth: 0,
  },
  metricLabel: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: C.inkLight,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    color: C.navy,
  },

  // ── Graph ─────────────────────────────────────────────────────────────────
  graphContainer: {
    border: `1 solid ${C.border}`,
    padding: 12,
  },
  graphCaption: {
    marginBottom: 8,
    fontSize: 8.5,
    color: C.inkLight,
    fontFamily: "Helvetica-Oblique",
  },

  // ── Empty State ───────────────────────────────────────────────────────────
  emptyState: {
    border: `1 solid ${C.border}`,
    paddingTop: 14,
    paddingRight: 14,
    paddingBottom: 14,
    paddingLeft: 14,
    color: C.inkLight,
    fontSize: 9,
    fontFamily: "Helvetica-Oblique",
  },

  // ── Table ─────────────────────────────────────────────────────────────────
  table: {
    border: `1 solid ${C.border}`,
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: C.headerBg,
    borderBottom: `1 solid ${C.border}`,
  },
  tableHeaderCellContainer: {
    paddingTop: 8,
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    justifyContent: "flex-start",
    borderRight: `1 solid ${C.border}`,
    minHeight: 36,
  },
  tableHeaderCellContainerLast: {
    borderRightWidth: 0,
  },
  tableHeaderCellText: {
    fontSize: 6.5,
    fontFamily: "Helvetica-Bold",
    color: C.inkMid,
    textTransform: "uppercase",
    textAlign: "center",
    lineHeight: 1.3,
  },
  tableHeaderCellTextLeft: {
    textAlign: "left",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: `1 solid ${C.borderLight}`,
    backgroundColor: C.white,
  },
  tableRowAlternate: {
    backgroundColor: C.rowAlt,
  },
  tableRowLast: {
    borderBottomWidth: 0,
  },
  tableCellContainer: {
    paddingTop: 8,
    paddingRight: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    justifyContent: "center",
    borderRight: `1 solid ${C.borderLight}`,
    minHeight: 34,
  },
  tableCellContainerLast: {
    borderRightWidth: 0,
  },
  pairLabelText: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
    lineHeight: 1.35,
  },
  plainCellText: {
    fontSize: 9,
    color: C.inkMid,
    textAlign: "center",
  },

  // ── Status Text ───────────────────────────────────────────────────────────
  statusTextHigh: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.highText,
    textAlign: "center",
  },
  statusTextMedium: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.medText,
    textAlign: "center",
  },
  statusTextLow: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.lowText,
    textAlign: "center",
  },

  // ── Code Appendix ─────────────────────────────────────────────────────────
  codeSectionHeader: {
    marginTop: 14,
    marginBottom: 5,
    fontSize: 9.5,
    fontFamily: "Helvetica-Bold",
    color: C.inkMid,
    borderBottom: `1 solid ${C.borderLight}`,
    paddingBottom: 4,
  },
  codeBlock: {
    border: `1 solid ${C.border}`,
    backgroundColor: "#f8fafc",
    paddingTop: 10,
    paddingRight: 12,
    paddingBottom: 10,
    paddingLeft: 12,
  },
  codeText: {
    fontFamily: "Courier",
    fontSize: 7.5,
    lineHeight: 1.4,
    color: C.ink,
  },

  // ── Disclaimer Note ───────────────────────────────────────────────────────
  disclaimerBox: {
    marginTop: 18,
    paddingTop: 8,
    paddingRight: 10,
    paddingBottom: 8,
    paddingLeft: 10,
    borderTop: `1 solid ${C.border}`,
    borderLeft: `3 solid ${C.inkLight}`,
  },
  disclaimerText: {
    fontSize: 8,
    color: C.inkMid,
    lineHeight: 1.5,
    fontFamily: "Helvetica-Oblique",
  },

  // ── Footer ────────────────────────────────────────────────────────────────
  footer: {
    position: "absolute",
    bottom: 24,
    left: 52,
    right: 52,
    borderTop: `1 solid ${C.borderLight}`,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 7.5,
    color: C.inkLight,
  },
  footerBold: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: C.inkLight,
  },

  spacer: {
    marginTop: 8,
  },

  // ── Monaco / IDE-style code view ──────────────────────────────────────────
  monacoContainer: {
    flexDirection: "row",
    border: "1 solid #3E3E42",
    borderRadius: 2,
  },
  monacoPane: {
    flex: 1,
    overflow: "hidden",
  },
  monacoPaneLeft: {
    borderRight: "1 solid #3E3E42",
  },
  monacoTabBar: {
    backgroundColor: "#252526",
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    borderBottom: "1 solid #3E3E42",
  },
  monacoTabStudentName: {
    fontSize: 7,
    color: "#969696",
    fontFamily: "Helvetica",
    marginBottom: 2,
  },
  monacoTabFilename: {
    fontSize: 8,
    color: "#CCCCCC",
    fontFamily: "Courier",
  },
  monacoEditor: {
    backgroundColor: "#1E1E1E",
    paddingTop: 6,
    paddingBottom: 6,
  },
  monacoLine: {
    flexDirection: "row",
    minHeight: 11,
  },
  monacoLineMatch: {
    backgroundColor: "#264F78",
  },
  monacoLineAdded: {
    backgroundColor: "#1B3A27",
  },
  monacoLineRemoved: {
    backgroundColor: "#3F1A1A",
  },
  monacoGutter: {
    width: 28,
    paddingRight: 8,
    paddingLeft: 4,
    backgroundColor: "#1E1E1E",
    borderRight: "1 solid #333333",
    justifyContent: "center",
    alignItems: "flex-end",
  },
  monacoLineNumber: {
    fontSize: 7,
    color: "#858585",
    fontFamily: "Courier",
    lineHeight: 1.4,
  },
  monacoCode: {
    flex: 1,
    paddingLeft: 8,
    paddingRight: 4,
    justifyContent: "center",
  },
  monacoCodeText: {
    fontSize: 7,
    color: "#D4D4D4",
    fontFamily: "Courier",
    lineHeight: 1.4,
  },
  monacoCodeAdded: {
    fontSize: 7,
    color: "#89D185",
    fontFamily: "Courier",
    lineHeight: 1.4,
  },
  monacoCodeRemoved: {
    fontSize: 7,
    color: "#F97583",
    fontFamily: "Courier",
    lineHeight: 1.4,
  },
  monacoCodeHighlight: {
    backgroundColor: "#264F78",
  },
})
