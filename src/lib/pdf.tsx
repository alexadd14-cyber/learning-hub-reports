import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  renderToBuffer,
} from "@react-pdf/renderer";
import type { ReportData } from "@/types/report";
import { brand, getSubjectLabel } from "@/lib/brand";
import {
  FooterMottoBar,
  Page1Header,
  Page2Header,
  PagePill,
} from "@/components/pdf/ReportChrome";

const GAP = 4;
const RADIUS = 8;

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 72,
    paddingHorizontal: 36,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: brand.text,
    backgroundColor: brand.pageBg,
  },
  content: {
    paddingTop: 20,
  },
  mainTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: brand.purple,
    marginBottom: 4,
  },
  assessmentTitle: {
    fontSize: 13,
    fontFamily: "Helvetica",
    color: brand.purple,
    marginBottom: 18,
  },
  sectionHeading: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: brand.purple,
    marginBottom: 8,
  },
  columnHeader: {
    backgroundColor: brand.purple,
    borderTopLeftRadius: RADIUS,
    borderTopRightRadius: RADIUS,
    paddingVertical: 8,
    paddingHorizontal: 4,
    alignItems: "center",
  },
  columnHeaderText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: brand.white,
    textAlign: "center",
  },
  columnBody: {
    backgroundColor: brand.lavender,
    borderBottomLeftRadius: RADIUS,
    borderBottomRightRadius: RADIUS,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: "center",
    minHeight: 36,
    justifyContent: "center",
  },
  columnBodyText: {
    fontSize: 8.5,
    color: brand.purple,
    textAlign: "center",
  },
  columnBodySubtext: {
    fontSize: 7.5,
    color: brand.purple,
    textAlign: "center",
    marginTop: 2,
  },
  summaryBox: {
    backgroundColor: brand.lavender,
    borderRadius: RADIUS,
    padding: 14,
    marginBottom: 12,
  },
  summaryBoxHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: brand.purple,
    marginBottom: 8,
  },
  summaryBoxText: {
    fontSize: 9.5,
    lineHeight: 1.55,
    color: brand.purple,
  },
  feedbackBox: {
    backgroundColor: brand.lavender,
    borderRadius: RADIUS,
    padding: 14,
  },
  feedbackHeading: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    color: brand.purple,
    marginBottom: 5,
    marginTop: 6,
  },
  bulletRow: {
    flexDirection: "row",
    marginBottom: 3,
    paddingLeft: 4,
  },
  bullet: {
    width: 10,
    fontSize: 9,
    color: brand.purple,
  },
  bulletText: {
    flex: 1,
    fontSize: 9,
    lineHeight: 1.45,
    color: brand.purple,
  },
  qTableHeaderCell: {
    backgroundColor: brand.purple,
    paddingVertical: 7,
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  qTableHeaderText: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: brand.white,
    textAlign: "center",
  },
  qTableBodyCell: {
    backgroundColor: brand.lavender,
    paddingVertical: 7,
    paddingHorizontal: 5,
    minHeight: 28,
    justifyContent: "center",
  },
  qTableBodyText: {
    fontSize: 8,
    color: brand.purple,
    textAlign: "center",
  },
  teacherBox: {
    backgroundColor: brand.cream,
    borderRadius: RADIUS,
    padding: 14,
    marginTop: 14,
    minHeight: 70,
  },
  teacherHeading: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: brand.goldText,
    marginBottom: 8,
  },
  teacherText: {
    fontSize: 9.5,
    lineHeight: 1.5,
    color: brand.purple,
  },
});

const SUMMARY_COLUMNS = [
  { key: "student", header: "Student", width: "18%" },
  { key: "assessment", header: "Assessment", width: "22%" },
  { key: "subject", header: "Subject", width: "16%" },
  { key: "score", header: "Recorded Score", width: "22%" },
  { key: "percentage", header: "Percentage", width: "18%" },
] as const;

const Q_COLUMNS = [
  { key: "question", header: "Question", width: "12%" },
  { key: "skill", header: "Skill area", width: "24%" },
  { key: "performance", header: "Performance", width: "18%" },
  { key: "comment", header: "Comment", width: "42%" },
] as const;

function SummaryColumns({ data }: { data: ReportData }) {
  const values: Record<string, string | string[]> = {
    student: data.studentName,
    assessment: [data.bookName, data.chapter],
    subject: getSubjectLabel(data.subject),
    score: `${data.recordedScore}/${data.maxScore}`,
    percentage: `${data.percentage}%`,
  };

  return (
    <View style={{ marginBottom: 14 }}>
      <View style={{ flexDirection: "row", gap: GAP }}>
        {SUMMARY_COLUMNS.map((col) => (
          <View key={col.key} style={{ width: col.width }}>
            <View style={styles.columnHeader}>
              <Text style={styles.columnHeaderText}>{col.header}</Text>
            </View>
            <View style={styles.columnBody}>
              {Array.isArray(values[col.key]) ? (
                <>
                  <Text style={styles.columnBodyText}>
                    {(values[col.key] as string[])[0]}
                  </Text>
                  <Text style={styles.columnBodySubtext}>
                    {(values[col.key] as string[])[1]}
                  </Text>
                </>
              ) : (
                <Text style={styles.columnBodyText}>
                  {values[col.key] as string}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function BulletSection({ heading, items }: { heading: string; items: string[] }) {
  return (
    <View>
      <Text style={styles.feedbackHeading}>{heading}</Text>
      {items.map((item, index) => (
        <View key={index} style={styles.bulletRow}>
          <Text style={styles.bullet}>•</Text>
          <Text style={styles.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function QuestionTable({ data }: { data: ReportData }) {
  return (
    <View>
      <View style={{ flexDirection: "row", gap: GAP, marginBottom: GAP }}>
        {Q_COLUMNS.map((col, index) => (
          <View
            key={col.key}
            style={{
              width: col.width,
              borderTopLeftRadius: index === 0 ? RADIUS : 0,
              borderTopRightRadius: index === Q_COLUMNS.length - 1 ? RADIUS : 0,
              overflow: "hidden",
            }}
          >
            <View style={styles.qTableHeaderCell}>
              <Text style={styles.qTableHeaderText}>{col.header}</Text>
            </View>
          </View>
        ))}
      </View>

      {data.report.questions.map((question, rowIndex) => {
        const isLast = rowIndex === data.report.questions.length - 1;
        const rowValues = [
          question.label,
          question.skillArea,
          question.performance,
          question.comment,
        ];

        return (
          <View
            key={question.label}
            style={{
              flexDirection: "row",
              gap: GAP,
              marginBottom: isLast ? 0 : GAP,
            }}
          >
            {Q_COLUMNS.map((col, colIndex) => (
              <View
                key={col.key}
                style={{
                  width: col.width,
                  borderBottomLeftRadius:
                    isLast && colIndex === 0 ? RADIUS : 0,
                  borderBottomRightRadius:
                    isLast && colIndex === Q_COLUMNS.length - 1 ? RADIUS : 0,
                  overflow: "hidden",
                }}
              >
                <View style={styles.qTableBodyCell}>
                  <Text style={styles.qTableBodyText}>{rowValues[colIndex]}</Text>
                </View>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
}

function ReportDocument({ data }: { data: ReportData }) {
  const subjectLabel = getSubjectLabel(data.subject);
  const assessmentLine = `${subjectLabel} Assessment — ${data.chapter}`;

  return (
    <Document
      title={`${data.studentName} — ${data.assessmentTitle}`}
      author="The Learning Hub"
      subject="Student Progress Report"
    >
      <Page size="A4" style={styles.page}>
        <Page1Header />

        <View style={styles.content}>
          <Text style={styles.mainTitle}>Student Progress Report</Text>
          <Text style={styles.assessmentTitle}>{assessmentLine}</Text>

          <SummaryColumns data={data} />

          <View style={styles.summaryBox}>
            <Text style={styles.summaryBoxHeading}>Summary</Text>
            <Text style={styles.summaryBoxText}>{data.report.summaryText}</Text>
          </View>

          <View style={styles.feedbackBox}>
            <BulletSection
              heading="What went well"
              items={data.report.whatWentWell}
            />
            <BulletSection
              heading="Areas for improvement"
              items={data.report.areasForImprovement}
            />
            <BulletSection heading="Next steps" items={data.report.nextSteps} />
          </View>
        </View>

        <FooterMottoBar />
        <PagePill current={1} total={2} />
      </Page>

      <Page size="A4" style={styles.page}>
        <Page2Header />

        <View style={styles.content}>
          <Text style={[styles.sectionHeading, { fontSize: 13, marginBottom: 12 }]}>
            Question-by-question analysis
          </Text>

          <QuestionTable data={data} />

          <View style={styles.teacherBox}>
            <Text style={styles.teacherHeading}>Teacher comment</Text>
            <Text style={styles.teacherText}>
              {data.report.finalTeacherComment}
            </Text>
          </View>
        </View>

        <FooterMottoBar />
        <PagePill current={2} total={2} />
      </Page>
    </Document>
  );
}

export async function generateReportPdf(data: ReportData): Promise<Buffer> {
  const buffer = await renderToBuffer(<ReportDocument data={data} />);
  return Buffer.from(buffer);
}

export function buildPdfFilename(
  studentName: string,
  assessmentTitle: string
): string {
  const safeName = studentName.replace(/[^a-zA-Z0-9]/g, "_");
  const safeAssessment = assessmentTitle.replace(/[^a-zA-Z0-9]/g, "_");
  return `${safeName}_${safeAssessment}_Report.pdf`;
}
