import { readFileSync } from "node:fs";
import path from "node:path";

const HEADER_FILE = "pdf_header.JPG";
const A4_WIDTH_PT = 595.28;
const IMAGE_WIDTH_PX = 1734;
const IMAGE_HEIGHT_PX = 769;

let cachedSrc: string | null = null;

export function getPdfHeaderSrc(): string {
  if (cachedSrc) return cachedSrc;

  const filePath = path.join(process.cwd(), "public", HEADER_FILE);
  const buffer = readFileSync(filePath);
  cachedSrc = `data:image/jpeg;base64,${buffer.toString("base64")}`;
  return cachedSrc;
}

export const pdfHeaderWidthPt = A4_WIDTH_PT;
export const pdfHeaderHeightPt =
  A4_WIDTH_PT * (IMAGE_HEIGHT_PX / IMAGE_WIDTH_PX);
