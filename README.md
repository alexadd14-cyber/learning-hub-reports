# The Learning Hub — Report Generator

Generate formal two-page student progress reports matching The Learning Hub template.

## Features

- Scalable assessment catalog (`data/catalog.json`) — add books, chapters, and questions without code changes
- Mark each question (Correct / Incorrect / Partially correct / Not attempted)
- Auto-calculated score and percentage
- AI-generated summary, bullet points, per-question comments, and teacher comment (OpenAI)
- PDF output matching the centre template: **Access · Aspire · Achieve**

## Setup

```bash
npm install
npm run setup:mcp   # optional — for PDF reading MCP tools
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Adding assessments

Edit `data/catalog.json` — see `data/README.md` for the schema.

## Report structure

**Page 1:** Summary table, overview text, What went well, Areas for improvement, Next steps

**Page 2:** Question-by-question analysis table, Teacher comment

## Environment variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | OpenAI API key |
| `OPENAI_BASE_URL` | Default: `https://api.openai.com/v1` |
| `OPENAI_TEXT_MODEL` | Text model for report writing (default: `gpt-4o-mini`) |
| `OPENAI_VISION_MODEL` | Vision model for photo marking (default: `gpt-4o`) |

## Photo marking flow

1. Select assessment from catalog
2. Upload a photo of the marked test
3. Click **Read marks from photo** — vision AI uses catalog JSON to suggest per-question marks
4. Review highlighted rows, adjust if needed
5. Generate PDF report

If OpenAI is unavailable, a structured fallback report is generated from the marking data.

## Tech stack

Next.js 15 · TypeScript · Tailwind CSS · OpenAI · `@react-pdf/renderer`
