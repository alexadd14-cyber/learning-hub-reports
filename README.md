# The Learning Hub — Report Generator

A web app for generating formal student progress reports as branded PDFs.

## Features

- Input student name, subject, test, and percentage score
- Provide tutor notes via text or `.txt` file upload
- AI generates personalised report sections (OpenAI)
- Automated PDF assembly with The Learning Hub purple branding

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy the environment file and add your OpenAI API key:

```bash
copy .env.example .env.local
```

3. Start the development server:

```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## How it works

1. **Form** — Staff enter student details and source notes
2. **Validation** — Inputs are checked (no AI needed)
3. **AI generation** — OpenAI writes structured report sections from the notes
4. **PDF** — A consistent branded template is filled and downloaded

## Tech stack

- Next.js 15, React, TypeScript, Tailwind CSS
- OpenAI API (`gpt-4o-mini`)
- `@react-pdf/renderer` for PDF generation
