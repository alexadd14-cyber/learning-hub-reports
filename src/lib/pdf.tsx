import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ReportData } from "@/types/report";
import { getScoreBand, getSubjectLabel } from "@/lib/openai";

const PURPLE = "#6b21a8";
const PURPLE_LIGHT = "#9333ea";
const PURPLE_PALE = "#f3e8ff";
const PURPLE_DARK = "#581c87";

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontFamily: "Helvetica",
    fontSize: 11,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: PURPLE,
    marginHorizontal: -48,
    marginTop: -48,
    paddingHorizontal: 48,
    paddingVertical: 28,
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 12,
    color: PURPLE_PALE,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 24,
    gap: 12,
  },
  metaBox: {
    flex: 1,
    backgroundColor: PURPLE_PALE,
    borderRadius: 6,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: PURPLE_LIGHT,
  },
  metaLabel: {
    fontSize: 8,
    color: PURPLE,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  metaValue: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: PURPLE_DARK,
  },
  scoreSection: {
    alignItems: "center",
    marginBottom: 28,
    paddingVertical: 20,
    backgroundColor: PURPLE_PALE,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e9d5ff",
  },
  scoreLabel: {
    fontSize: 10,
    color: PURPLE,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 6,
  },
  scoreValue: {
    fontSize: 42,
    fontFamily: "Helvetica-Bold",
    color: PURPLE,
    marginBottom: 4,
  },
  scoreBand: {
    fontSize: 13,
    color: PURPLE_LIGHT,
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: PURPLE,
    marginBottom: 8,
    marginTop: 16,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e9d5ff",
  },
  paragraph: {
    fontSize: 11,
    lineHeight: 1.6,
    color: "#374151",
    marginBottom: 4,
  },
  footer: {
    position: "absolute",
    bottom: 36,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: "#e9d5ff",
    paddingTop: 12,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 9,
    color: "#9ca3af",
  },
  reportTitle: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: PURPLE_DARK,
    textAlign: "center",
    marginBottom: 20,
  },
});

function ReportDocument({ data }: { data: ReportData }) {
  const formattedDate = new Date(data.generatedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>The Learning Hub</Text>
          <Text style={styles.headerSubtitle}>Student Progress Report</Text>
        </View>

        <Text style={styles.reportTitle}>Progress Report — {data.testName}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Student</Text>
            <Text style={styles.metaValue}>{data.studentName}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Subject</Text>
            <Text style={styles.metaValue}>{getSubjectLabel(data.subject)}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Date</Text>
            <Text style={styles.metaValue}>{formattedDate}</Text>
          </View>
        </View>

        <View style={styles.scoreSection}>
          <Text style={styles.scoreLabel}>Test Score</Text>
          <Text style={styles.scoreValue}>{data.percentage}%</Text>
          <Text style={styles.scoreBand}>{getScoreBand(data.percentage)}</Text>
        </View>

        <Text style={styles.sectionTitle}>Overview</Text>
        <Text style={styles.paragraph}>{data.report.introduction}</Text>

        <Text style={styles.sectionTitle}>Strengths</Text>
        <Text style={styles.paragraph}>{data.report.strengths}</Text>

        <Text style={styles.sectionTitle}>Areas for Improvement</Text>
        <Text style={styles.paragraph}>{data.report.areasForImprovement}</Text>

        <Text style={styles.sectionTitle}>Recommendations</Text>
        <Text style={styles.paragraph}>{data.report.recommendations}</Text>

        <Text style={styles.sectionTitle}>Closing Remarks</Text>
        <Text style={styles.paragraph}>{data.report.closing}</Text>

        <View style={styles.footer} fixed>
          <Text style={styles.footerText}>The Learning Hub — Tuition Centre</Text>
          <Text style={styles.footerText}>Confidential</Text>
        </View>
      </Page>
    </Document>
  );
}

export async function generateReportPdf(data: ReportData): Promise<Buffer> {
  const buffer = await renderToBuffer(<ReportDocument data={data} />);
  return Buffer.from(buffer);
}

export function buildPdfFilename(studentName: string, testName: string): string {
  const safeName = studentName.replace(/[^a-zA-Z0-9]/g, "_");
  const safeTest = testName.replace(/[^a-zA-Z0-9]/g, "_");
  return `${safeName}_${safeTest}_Report.pdf`;
}
