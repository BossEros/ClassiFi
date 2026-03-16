import { pdf } from "@react-pdf/renderer"
import type { PdfDocumentDownloadOptions } from "@/presentation/components/shared/pdf/pdfReportTypes"

/**
 * Triggers a browser download for a generated PDF document.
 *
 * @param options - Document instance and target filename.
 * @returns A promise that resolves after the browser download is triggered.
 */
export async function downloadPdfDocument(
  options: PdfDocumentDownloadOptions,
): Promise<void> {
  const pdfBlob = await pdf(options.document).toBlob()
  const downloadUrl = window.URL.createObjectURL(pdfBlob)
  const downloadLinkElement = document.createElement("a")

  try {
    downloadLinkElement.href = downloadUrl
    downloadLinkElement.download = options.fileName
    document.body.appendChild(downloadLinkElement)
    downloadLinkElement.click()
  } finally {
    downloadLinkElement.remove()
    window.URL.revokeObjectURL(downloadUrl)
  }
}
