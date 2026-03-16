/**
 * similarityReportPdf.tsx
 *
 * Barrel entry point for the PDF report module.
 * Composes document roots and re-exports all public symbols
 * so callers (SimilarityResultsPage) need not change their imports.
 *
 * Internal module structure:
 *  pdfTypes.ts        - shared interfaces, types, and constants
 *  pdfStyles.ts       - StyleSheet + color tokens
 *  pdfUtils.ts        - pure formatting and diff utilities
 *  pdfBuilders.ts     - data builder functions
 *  pdfComponents.tsx  - all PDF React components
 */

import { Document, Page, View } from "@react-pdf/renderer"
import { pdfStyles } from "./pdfStyles"
import type {
  ClassSimilarityReportData,
  PairSimilarityReportData,
} from "./pdfTypes"
import {
  ClassPairsTable,
  DisclaimerBox,
  DocumentFooter,
  FragmentEvidenceTable,
  MetadataGrid,
  MetricRow,
  ReportHeader,
  SectionTitle,
  SideBySideCodeView,
  SideBySideDiffView,
  SimilarityGraphPdf,
} from "./pdfComponents"

export type {
  ClassSimilarityReportData,
  PairSimilarityReportData,
} from "./pdfTypes"
export { CLASS_REPORT_TABLE_HEADERS } from "./pdfTypes"
export {
  buildClassSimilarityReportData,
  buildPairSimilarityReportData,
} from "./pdfBuilders"
export { toFileNameSegment } from "./pdfUtils"

/**
 * Class-level similarity PDF document.
 *
 * @param props - Prebuilt report data.
 * @returns React PDF document for thresholded class evidence.
 */
export function ClassSimilarityReportDocument({
  data,
}: {
  data: ClassSimilarityReportData
}) {
  return (
    <Document title={data.title}>
      <Page size="A4" style={pdfStyles.page}>
        <ReportHeader
          title={data.title}
          subtitle="Thresholded similarity analysis across all submissions with graph and pairwise evidence."
        />

        <View style={pdfStyles.section} wrap={false}>
          <SectionTitle title="Report Information" />
          <MetadataGrid entries={data.reportMetadata} />
        </View>

        <View style={pdfStyles.section} wrap={false}>
          <SectionTitle title="Summary Statistics" />
          <MetricRow metrics={data.summaryMetrics} />
        </View>

        {data.graphLayout && (
          <View style={pdfStyles.section} wrap={false}>
            <SectionTitle title="Similarity Graph" />
            <View style={pdfStyles.graphContainer}>
              <SimilarityGraphPdf layout={data.graphLayout} />
            </View>
          </View>
        )}

        <View style={pdfStyles.section}>
          <SectionTitle title="Pairwise Comparison" />
          {data.filteredPairRows.length > 0 ? (
            <ClassPairsTable rows={data.filteredPairRows} />
          ) : (
            <View style={pdfStyles.emptyState}>
              <SectionTitle title={data.emptyStateMessage} />
            </View>
          )}
        </View>

        <DisclaimerBox />
        <DocumentFooter />
      </Page>
    </Document>
  )
}

/**
 * Pairwise similarity PDF document.
 *
 * @param props - Prebuilt pair report data.
 * @returns React PDF document for a selected pair comparison.
 */
export function PairSimilarityReportDocument({
  data,
}: {
  data: PairSimilarityReportData
}) {
  return (
    <Document title={data.title}>
      <Page size="A4" style={pdfStyles.page}>
        <ReportHeader
          title={data.title}
          subtitle="Detailed comparison evidence with matched fragment references and highlighted side-by-side views for formal review."
        />

        <View style={pdfStyles.section} wrap={false}>
          <SectionTitle title="Report Information" />
          <MetadataGrid entries={data.reportMetadata} />
        </View>

        <View style={pdfStyles.section} wrap={false}>
          <SectionTitle title="Similarity Metrics" />
          <MetricRow metrics={data.summaryMetrics} />
        </View>

        <View style={pdfStyles.section}>
          <SectionTitle title="Matched Fragment Evidence" />
          {data.fragmentRows.length > 0 ? (
            <FragmentEvidenceTable rows={data.fragmentRows} />
          ) : (
            <View style={pdfStyles.emptyState}>
              <SectionTitle title={data.emptyStateMessage} />
            </View>
          )}
        </View>

        <View break style={pdfStyles.section}>
          <SectionTitle title="Side-by-Side Comparison" />
          <SideBySideCodeView
            leftStudentName={data.leftStudentName}
            leftFileName={data.leftFileName}
            leftCode={data.leftCode}
            leftHighlightRanges={data.leftFragmentRanges}
            rightStudentName={data.rightStudentName}
            rightFileName={data.rightFileName}
            rightCode={data.rightCode}
            rightHighlightRanges={data.rightFragmentRanges}
            fragments={data.fragments}
          />
        </View>

        <View style={pdfStyles.section}>
          <SectionTitle title="Side-by-Side Diff View" />
          <SideBySideDiffView
            leftStudentName={data.leftStudentName}
            leftFileName={data.leftFileName}
            leftCode={data.leftCode}
            rightStudentName={data.rightStudentName}
            rightFileName={data.rightFileName}
            rightCode={data.rightCode}
          />
        </View>

        <DisclaimerBox />
        <DocumentFooter />
      </Page>
    </Document>
  )
}
