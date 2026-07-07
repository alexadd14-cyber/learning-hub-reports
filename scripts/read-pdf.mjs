#!/usr/bin/env node
/**
 * CLI helper to extract PDF text (for terminal use or quick checks).
 * Usage: node scripts/read-pdf.mjs path/to/file.pdf
 */
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pdfjsPath = join(
  __dirname,
  "../mcp/pdf-reader/node_modules/pdfjs-dist/legacy/build/pdf.mjs"
);
const { getDocument } = await import(pathToFileURL(pdfjsPath).href);

const filePath = process.argv[2];

if (!filePath) {
  console.error("Usage: node scripts/read-pdf.mjs <path-to-pdf>");
  process.exit(1);
}

try {
  const buffer = await readFile(filePath);
  const data = new Uint8Array(buffer);
  const pdf = await getDocument({ data, useSystemFonts: true }).promise;

  console.log(`Pages: ${pdf.numPages}`);
  console.log("---");

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    console.log(pageText);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
