#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const MAX_CHARS = 500_000;

async function extractPdfText(filePath) {
  const buffer = await readFile(filePath);
  const data = new Uint8Array(buffer);

  const loadingTask = getDocument({ data, useSystemFonts: true });
  const pdf = await loadingTask.promise;

  const pageTexts = [];
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(pageText);
  }

  const metadata = await pdf.getMetadata();
  const text = pageTexts.join("\n\n").trim();

  return {
    text: text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text,
    numPages: pdf.numPages,
    info: metadata.info ?? {},
    truncated: text.length > MAX_CHARS,
    totalCharacters: text.length,
  };
}

const server = new McpServer({
  name: "pdf-reader",
  version: "1.0.0",
});

server.tool(
  "read_pdf",
  "Extract all text from a PDF file. Use this when the user attaches or references a PDF document.",
  {
    filePath: z
      .string()
      .describe("Absolute or relative path to the PDF file on disk"),
  },
  async ({ filePath }) => {
    try {
      const result = await extractPdfText(filePath);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                filePath,
                numPages: result.numPages,
                totalCharacters: result.totalCharacters,
                truncated: result.truncated,
                metadata: result.info,
                text: result.text,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to read PDF: ${message}` }],
      };
    }
  }
);

server.tool(
  "get_pdf_info",
  "Get PDF metadata (page count, title, author) without returning full text.",
  {
    filePath: z.string().describe("Absolute or relative path to the PDF file"),
  },
  async ({ filePath }) => {
    try {
      const result = await extractPdfText(filePath);
      const preview = result.text.slice(0, 500);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                filePath,
                numPages: result.numPages,
                totalCharacters: result.totalCharacters,
                metadata: result.info,
                preview,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        isError: true,
        content: [{ type: "text", text: `Failed to read PDF info: ${message}` }],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
