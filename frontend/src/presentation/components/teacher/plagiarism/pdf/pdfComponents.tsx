import { Circle, Line, Rect, Svg, Text, View } from "@react-pdf/renderer"
import type {
  PositionedSimilarityGraphCluster,
  PositionedSimilarityGraphNode,
  SimilarityGraphLayout,
} from "@/presentation/utils/plagiarismGraphUtils"
import { getClusterColor } from "@/presentation/utils/plagiarismGraphUtils"
import type {
  ClassReportPairRow,
  FragmentEvidenceRow,
  ReportMetadataEntry,
  SummaryMetric,
} from "./pdfTypes"
import {
  pdfStyles,
  C,
  classReportTableColumnWidths,
  fragmentReportTableColumnWidths,
} from "./pdfStyles"

// ─── Layout Components ────────────────────────────────────────────────────────

export function ReportHeader({
  title,
  subtitle,
}: {
  title: string
  subtitle: string
}) {
  return (
    <View style={pdfStyles.docHeader} wrap={false}>
      <Text style={pdfStyles.systemName}>
        ClassiFi — Source Code Similarity Detection System
      </Text>
      <Text style={pdfStyles.reportTitle}>{title}</Text>
      <Text style={pdfStyles.reportSubtitle}>{subtitle}</Text>
    </View>
  )
}

export function SectionTitle({ title }: { title: string }) {
  return (
    <View style={pdfStyles.sectionHeaderRow}>
      <Text style={pdfStyles.sectionTitle}>{title}</Text>
    </View>
  )
}

export function MetadataGrid({ entries }: { entries: ReportMetadataEntry[] }) {
  return (
    <View style={pdfStyles.metadataGrid}>
      {entries.map((entry) => (
        <View key={entry.label} style={pdfStyles.metadataEntry} wrap={false}>
          <Text style={pdfStyles.metadataLabel}>{entry.label}</Text>
          <Text style={pdfStyles.metadataValue}>{entry.value}</Text>
        </View>
      ))}
    </View>
  )
}

export function MetricRow({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <View style={pdfStyles.metricRow}>
      {metrics.map((metric, index) => (
        <View
          key={metric.label}
          style={[
            pdfStyles.metricCell,
            ...(index === metrics.length - 1 ? [pdfStyles.metricCellLast] : []),
          ]}
          wrap={false}
        >
          <View style={{ minHeight: 28 }}>
            <Text style={pdfStyles.metricLabel}>{metric.label}</Text>
          </View>
          <Text style={pdfStyles.metricValue}>{metric.value}</Text>
        </View>
      ))}
    </View>
  )
}

export function DocumentFooter() {
  return (
    <View style={pdfStyles.footer} fixed>
      <Text style={pdfStyles.footerText}>
        ClassiFi — Similarity Analysis Report · For institutional use only
      </Text>
      <Text
        style={pdfStyles.footerBold}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  )
}

export function DisclaimerBox() {
  return (
    <View style={pdfStyles.disclaimerBox}>
      <Text style={pdfStyles.disclaimerText}>
        Important Notice: The similarity scores presented in this report are
        computed indicators intended to assist faculty in identifying
        potentially suspicious submissions. A high similarity score does not
        constitute a determination of academic misconduct. The results of this
        analysis are informational in nature and should be interpreted within
        the context of the assignment. All final assessments regarding academic
        integrity remain solely at the discretion of the supervising teacher or
        relevant academic authority.
      </Text>
    </View>
  )
}

// ─── Table Components ─────────────────────────────────────────────────────────

function getSimilarityTextStyle(severity: "high" | "medium" | "low") {
  switch (severity) {
    case "high":
      return pdfStyles.statusTextHigh
    case "medium":
      return pdfStyles.statusTextMedium
    default:
      return pdfStyles.statusTextLow
  }
}

function getSignalTextStyle(level: "high" | "medium" | "low") {
  switch (level) {
    case "high":
      return pdfStyles.statusTextHigh
    case "medium":
      return pdfStyles.statusTextMedium
    default:
      return pdfStyles.statusTextLow
  }
}

function TableHeaderCell({
  children,
  width,
  align = "center",
  isLastColumn = false,
}: {
  children: string
  width: string
  align?: "left" | "center"
  isLastColumn?: boolean
}) {
  return (
    <View
      style={[
        pdfStyles.tableHeaderCellContainer,
        { width },
        ...(isLastColumn ? [pdfStyles.tableHeaderCellContainerLast] : []),
      ]}
    >
      <Text
        style={[
          pdfStyles.tableHeaderCellText,
          ...(align === "left" ? [pdfStyles.tableHeaderCellTextLeft] : []),
        ]}
      >
        {children}
      </Text>
    </View>
  )
}

function TableCell({
  children,
  width,
  align = "center",
  isLastColumn = false,
}: {
  children: React.ReactElement | React.ReactElement[]
  width: string
  align?: "left" | "center"
  isLastColumn?: boolean
}) {
  return (
    <View
      style={[
        pdfStyles.tableCellContainer,
        { width, alignItems: align === "left" ? "flex-start" : "center" },
        ...(isLastColumn ? [pdfStyles.tableCellContainerLast] : []),
      ]}
    >
      {children}
    </View>
  )
}

export function ClassPairsTable({ rows }: { rows: ClassReportPairRow[] }) {
  return (
    <View style={pdfStyles.table}>
      <View style={pdfStyles.tableHeaderRow} wrap={false}>
        <TableHeaderCell
          width={classReportTableColumnWidths.pairLabel}
          align="left"
        >
          Student Pair
        </TableHeaderCell>
        <TableHeaderCell width={classReportTableColumnWidths.similarity}>
          Overall Similarity
        </TableHeaderCell>
        <TableHeaderCell width={classReportTableColumnWidths.similarity}>
          Structural Similarity
        </TableHeaderCell>
        <TableHeaderCell width={classReportTableColumnWidths.similarity}>
          Semantic Similarity
        </TableHeaderCell>
        <TableHeaderCell width={classReportTableColumnWidths.signal}>
          Overlap
        </TableHeaderCell>
        <TableHeaderCell
          width={classReportTableColumnWidths.signal}
          isLastColumn={true}
        >
          Longest Fragment
        </TableHeaderCell>
      </View>

      {rows.map((row, index) => (
        <View
          key={`${row.pairLabel}-${index}`}
          style={[
            pdfStyles.tableRow,
            ...(index % 2 === 1 ? [pdfStyles.tableRowAlternate] : []),
            ...(index === rows.length - 1 ? [pdfStyles.tableRowLast] : []),
          ]}
          wrap={false}
        >
          <TableCell
            width={classReportTableColumnWidths.pairLabel}
            align="left"
          >
            <Text style={pdfStyles.pairLabelText}>{row.pairLabel}</Text>
          </TableCell>
          <TableCell width={classReportTableColumnWidths.similarity}>
            <Text
              style={getSimilarityTextStyle(row.overallSimilarity.severity)}
            >
              {row.overallSimilarity.label}
            </Text>
          </TableCell>
          <TableCell width={classReportTableColumnWidths.similarity}>
            <Text
              style={getSimilarityTextStyle(row.structuralSimilarity.severity)}
            >
              {row.structuralSimilarity.label}
            </Text>
          </TableCell>
          <TableCell width={classReportTableColumnWidths.similarity}>
            <Text
              style={getSimilarityTextStyle(row.semanticSimilarity.severity)}
            >
              {row.semanticSimilarity.label}
            </Text>
          </TableCell>
          <TableCell width={classReportTableColumnWidths.signal}>
            <Text style={getSignalTextStyle(row.overlapSignal.level)}>
              {row.overlapSignal.label}
            </Text>
          </TableCell>
          <TableCell
            width={classReportTableColumnWidths.signal}
            isLastColumn={true}
          >
            <Text style={getSignalTextStyle(row.longestFragmentSignal.level)}>
              {row.longestFragmentSignal.label}
            </Text>
          </TableCell>
        </View>
      ))}
    </View>
  )
}

export function FragmentEvidenceTable({
  rows,
}: {
  rows: FragmentEvidenceRow[]
}) {
  return (
    <View style={pdfStyles.table}>
      <View style={pdfStyles.tableHeaderRow}>
        <TableHeaderCell
          width={fragmentReportTableColumnWidths.fragment}
          align="left"
        >
          Fragment
        </TableHeaderCell>
        <TableHeaderCell width={fragmentReportTableColumnWidths.range}>
          Left Student Lines
        </TableHeaderCell>
        <TableHeaderCell width={fragmentReportTableColumnWidths.range}>
          Right Student Lines
        </TableHeaderCell>
        <TableHeaderCell width={fragmentReportTableColumnWidths.explanation}>
          Match Label
        </TableHeaderCell>
        <TableHeaderCell
          width={fragmentReportTableColumnWidths.length}
          isLastColumn={true}
        >
          Length (Tokens)
        </TableHeaderCell>
      </View>

      {rows.map((row, index) => (
        <View
          key={`${row.fragmentLabel}-${index}`}
          style={[
            pdfStyles.tableRow,
            ...(index % 2 === 1 ? [pdfStyles.tableRowAlternate] : []),
            ...(index === rows.length - 1 ? [pdfStyles.tableRowLast] : []),
          ]}
          wrap={false}
        >
          <TableCell
            width={fragmentReportTableColumnWidths.fragment}
            align="left"
          >
            <Text style={pdfStyles.pairLabelText}>{row.fragmentLabel}</Text>
          </TableCell>
          <TableCell width={fragmentReportTableColumnWidths.range}>
            <Text style={pdfStyles.plainCellText}>{row.leftRange}</Text>
          </TableCell>
          <TableCell width={fragmentReportTableColumnWidths.range}>
            <Text style={pdfStyles.plainCellText}>{row.rightRange}</Text>
          </TableCell>
          <TableCell width={fragmentReportTableColumnWidths.explanation}>
            <Text style={pdfStyles.plainCellText}>{row.explanationLabel}</Text>
          </TableCell>
          <TableCell
            width={fragmentReportTableColumnWidths.length}
            isLastColumn={true}
          >
            <Text style={pdfStyles.plainCellText}>{row.length}</Text>
          </TableCell>
        </View>
      ))}
    </View>
  )
}

// ─── Monaco Code View Components ─────────────────────────────────────────────

import { isLineHighlighted, computeLineDiff, getLineTextSegments } from "./pdfUtils"
import type { SideBySideProps } from "./pdfTypes"

export function SideBySideCodeView({
  leftStudentName,
  leftFileName,
  leftCode,
  leftHighlightRanges = [],
  rightStudentName,
  rightFileName,
  rightCode,
  rightHighlightRanges = [],
  fragments = [],
}: SideBySideProps) {
  const leftLines = leftCode.split("\n")
  const rightLines = rightCode.split("\n")
  const useColumnHighlight = fragments.length > 0

  return (
    <View style={pdfStyles.monacoContainer}>
      <View style={[pdfStyles.monacoPane, pdfStyles.monacoPaneLeft]}>
        <View style={pdfStyles.monacoTabBar}>
          <Text style={pdfStyles.monacoTabStudentName}>{leftStudentName}</Text>
          <Text style={pdfStyles.monacoTabFilename}>{leftFileName}</Text>
        </View>
        <View style={pdfStyles.monacoEditor}>
          {leftLines.map((line, i) => {
            if (useColumnHighlight) {
              const segments = getLineTextSegments(line, i, fragments, "left")

              return (
                <View key={i} style={pdfStyles.monacoLine}>
                  <View style={pdfStyles.monacoGutter}>
                    <Text style={pdfStyles.monacoLineNumber}>{i + 1}</Text>
                  </View>
                  <View style={pdfStyles.monacoCode}>
                    <Text style={pdfStyles.monacoCodeText}>
                      {segments.map((seg, idx) =>
                        seg.isHighlighted ? (
                          <Text key={idx} style={pdfStyles.monacoCodeHighlight}>
                            {seg.text}
                          </Text>
                        ) : (
                          <Text key={idx}>{seg.text}</Text>
                        ),
                      )}
                    </Text>
                  </View>
                </View>
              )
            }

            return (
              <View
                key={i}
                style={[
                  pdfStyles.monacoLine,
                  isLineHighlighted(i, leftHighlightRanges)
                    ? pdfStyles.monacoLineMatch
                    : {},
                ]}
              >
                <View style={pdfStyles.monacoGutter}>
                  <Text style={pdfStyles.monacoLineNumber}>{i + 1}</Text>
                </View>
                <View style={pdfStyles.monacoCode}>
                  <Text style={pdfStyles.monacoCodeText}>{line || " "}</Text>
                </View>
              </View>
            )
          })}
        </View>
      </View>

      <View style={pdfStyles.monacoPane}>
        <View style={pdfStyles.monacoTabBar}>
          <Text style={pdfStyles.monacoTabStudentName}>{rightStudentName}</Text>
          <Text style={pdfStyles.monacoTabFilename}>{rightFileName}</Text>
        </View>
        <View style={pdfStyles.monacoEditor}>
          {rightLines.map((line, i) => {
            if (useColumnHighlight) {
              const segments = getLineTextSegments(line, i, fragments, "right")

              return (
                <View key={i} style={pdfStyles.monacoLine}>
                  <View style={pdfStyles.monacoGutter}>
                    <Text style={pdfStyles.monacoLineNumber}>{i + 1}</Text>
                  </View>
                  <View style={pdfStyles.monacoCode}>
                    <Text style={pdfStyles.monacoCodeText}>
                      {segments.map((seg, idx) =>
                        seg.isHighlighted ? (
                          <Text key={idx} style={pdfStyles.monacoCodeHighlight}>
                            {seg.text}
                          </Text>
                        ) : (
                          <Text key={idx}>{seg.text}</Text>
                        ),
                      )}
                    </Text>
                  </View>
                </View>
              )
            }

            return (
              <View
                key={i}
                style={[
                  pdfStyles.monacoLine,
                  isLineHighlighted(i, rightHighlightRanges)
                    ? pdfStyles.monacoLineMatch
                    : {},
                ]}
              >
                <View style={pdfStyles.monacoGutter}>
                  <Text style={pdfStyles.monacoLineNumber}>{i + 1}</Text>
                </View>
                <View style={pdfStyles.monacoCode}>
                  <Text style={pdfStyles.monacoCodeText}>{line || " "}</Text>
                </View>
              </View>
            )
          })}
        </View>
      </View>
    </View>
  )
}

export function SideBySideDiffView({
  leftStudentName,
  leftFileName,
  leftCode,
  rightStudentName,
  rightFileName,
  rightCode,
}: SideBySideProps) {
  const diff = computeLineDiff(leftCode, rightCode)

  return (
    <View style={pdfStyles.monacoContainer}>
      <View style={[pdfStyles.monacoPane, pdfStyles.monacoPaneLeft]}>
        <View style={pdfStyles.monacoTabBar}>
          <Text style={pdfStyles.monacoTabStudentName}>{leftStudentName}</Text>
          <Text style={pdfStyles.monacoTabFilename}>{leftFileName}</Text>
        </View>
        <View style={pdfStyles.monacoEditor}>
          {diff.left.map((line, i) => (
            <View
              key={i}
              style={[
                pdfStyles.monacoLine,
                line.kind === "removed" ? pdfStyles.monacoLineRemoved : {},
              ]}
            >
              <View style={pdfStyles.monacoGutter}>
                <Text style={pdfStyles.monacoLineNumber}>
                  {line.lineNumber ?? ""}
                </Text>
              </View>
              <View style={pdfStyles.monacoCode}>
                <Text
                  style={
                    line.kind === "removed"
                      ? pdfStyles.monacoCodeRemoved
                      : pdfStyles.monacoCodeText
                  }
                >
                  {line.text || " "}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <View style={pdfStyles.monacoPane}>
        <View style={pdfStyles.monacoTabBar}>
          <Text style={pdfStyles.monacoTabStudentName}>{rightStudentName}</Text>
          <Text style={pdfStyles.monacoTabFilename}>{rightFileName}</Text>
        </View>
        <View style={pdfStyles.monacoEditor}>
          {diff.right.map((line, i) => (
            <View
              key={i}
              style={[
                pdfStyles.monacoLine,
                line.kind === "added" ? pdfStyles.monacoLineAdded : {},
              ]}
            >
              <View style={pdfStyles.monacoGutter}>
                <Text style={pdfStyles.monacoLineNumber}>
                  {line.lineNumber ?? ""}
                </Text>
              </View>
              <View style={pdfStyles.monacoCode}>
                <Text
                  style={
                    line.kind === "added"
                      ? pdfStyles.monacoCodeAdded
                      : pdfStyles.monacoCodeText
                  }
                >
                  {line.text || " "}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  )
}

// ─── Graph Components ─────────────────────────────────────────────────────────

export function SimilarityGraphPdf({
  layout,
}: {
  layout: SimilarityGraphLayout
}) {
  return (
    <Svg
      width={490}
      height={260}
      viewBox={`0 0 ${layout.width} ${layout.height}`}
    >
      <Rect
        x={0}
        y={0}
        width={layout.width}
        height={layout.height}
        fill={C.white}
      />
      {layout.clusters.map((cluster) => (
        <ClusterCircle key={cluster.clusterId} cluster={cluster} />
      ))}
      {layout.edges.map((edge) => {
        const sourceNode = layout.nodes.find(
          (node) => node.submissionId === edge.sourceId && node.isVisible,
        )
        const targetNode = layout.nodes.find(
          (node) => node.submissionId === edge.targetId && node.isVisible,
        )

        if (!sourceNode || !targetNode) {
          return null
        }

        return (
          <Line
            key={edge.edgeId}
            x1={sourceNode.x}
            y1={sourceNode.y}
            x2={targetNode.x}
            y2={targetNode.y}
            stroke={getClusterColor(edge.clusterId ?? 1)}
            strokeWidth={1.5 + edge.similarity * 2.5}
            strokeOpacity={0.5}
          />
        )
      })}
      {layout.nodes
        .filter((node) => node.isVisible)
        .map((node) => (
          <GraphNode key={node.submissionId} node={node} />
        ))}
    </Svg>
  )
}

function ClusterCircle({
  cluster,
}: {
  cluster: PositionedSimilarityGraphCluster
}) {
  return (
    <Circle
      cx={cluster.x}
      cy={cluster.y}
      r={cluster.radius}
      fill="#f9fafb"
      stroke={cluster.color}
      strokeWidth={1}
      fillOpacity={0.7}
      strokeOpacity={0.3}
    />
  )
}

function GraphNode({ node }: { node: PositionedSimilarityGraphNode }) {
  return (
    <>
      <Circle
        cx={node.x}
        cy={node.y}
        r={node.radius}
        fill={node.color}
        stroke={C.white}
        strokeWidth={1.5}
      />
      <Text
        x={node.x}
        y={node.y + 3}
        textAnchor="middle"
        style={{ fontSize: 7, fontWeight: 700, color: C.white }}
      >
        {node.initials}
      </Text>
    </>
  )
}
