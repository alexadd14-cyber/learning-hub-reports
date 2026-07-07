import { Svg, Path, Text, View, Image } from "@react-pdf/renderer";
import { MOTTO, brand } from "@/lib/brand";
import {
  getPdfHeaderSrc,
  pdfHeaderHeightPt,
  pdfHeaderWidthPt,
} from "@/lib/pdf-header";

const chrome = {
  mottoRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 10,
  },
  mottoText: {
    color: brand.white,
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
  },
  footerBand: {
    position: "absolute" as const,
    bottom: 28,
    left: 0,
    right: 0,
    backgroundColor: brand.purple,
    paddingVertical: 10,
    alignItems: "center" as const,
  },
  pagePill: {
    position: "absolute" as const,
    bottom: 8,
    left: 36,
    backgroundColor: brand.white,
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  pagePillText: {
    fontSize: 8,
    color: brand.textSoft,
    fontFamily: "Helvetica",
  },
};

function BookIcon({ size = 10 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 12 12">
      <Path
        d="M2 2h4v8H3c-.6 0-1-.4-1-1V2zm6 0h2c.6 0 1 .4 1 1v6c0 .6-.4 1-1 1H8V2z"
        fill={brand.white}
      />
    </Svg>
  );
}

function PdfHeaderImage() {
  return (
    <View style={{ marginHorizontal: -36, marginTop: -36 }}>
      <Image
        src={getPdfHeaderSrc()}
        style={{ width: pdfHeaderWidthPt, height: pdfHeaderHeightPt }}
      />
    </View>
  );
}

export function FooterMottoBar() {
  return (
    <View style={chrome.footerBand} fixed>
      <View style={chrome.mottoRow}>
        <Text style={chrome.mottoText}>{MOTTO[0]}</Text>
        <BookIcon />
        <Text style={chrome.mottoText}>{MOTTO[1]}</Text>
        <BookIcon />
        <Text style={chrome.mottoText}>{MOTTO[2]}</Text>
      </View>
    </View>
  );
}

export function PagePill({ current, total }: { current: number; total: number }) {
  return (
    <View style={chrome.pagePill} fixed>
      <Text style={chrome.pagePillText}>
        Page {current} of {total}
      </Text>
    </View>
  );
}

export function Page1Header() {
  return <PdfHeaderImage />;
}

export function Page2Header() {
  return <PdfHeaderImage />;
}
