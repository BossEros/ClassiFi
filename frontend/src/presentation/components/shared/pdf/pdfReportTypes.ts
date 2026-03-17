import type { DocumentProps } from "@react-pdf/renderer"
import type { ReactElement } from "react"

export interface ReportMetadataEntry {
  label: string
  value: string
}

export interface SummaryMetric {
  label: string
  value: string
}

export interface PdfDocumentDownloadOptions {
  document: ReactElement<DocumentProps>
  fileName: string
}
