# AI Front Desk

Next.js prototype for the **AI Front Desk** spec: parent Q&A and operator control center for childcare centers.

## Stack

- **Next.js 16** (App Router), TypeScript, Tailwind CSS
- **SQLite** (better-sqlite3) for questions, answers, knowledge base
- **Vercel AI SDK** + OpenAI for grounded answers with confidence/escalate

## Setup

1. **Install dependencies** (already done if you ran from repo root):
   ```bash
   npm install
   ```

2. **Environment**: Create a `.env.local` in this directory (see `.env.example` if present, or use):
   - `OPENAI_API_KEY` — required for AI answers
   - `DATABASE_PATH` — optional; default is `./data/front-desk.db`

3. **Run dev server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Routes

- **/** — Home (Parent | Operator | Handbook)
- **/parent** — Parent: ask a question, get answer with optional handbook link
- **/handbook** — Read-only handbook (Markdown, deep links with `#section`)
- **/operator** — Operator dashboard: questions, outcome badges, suggested drafts, reply + “Reply & Update Handbook”
- **/operator/handbook** — Edit handbook (Markdown), Save

## Features (from spec)

- **Parent**: Ask question → answer grounded in center KB; confidence/escalate; link to handbook section; deep link highlights section (`:target`).
- **Operator**: View questions (answered / low confidence / no match / escalated); see AI-suggested draft reply; send reply to parent; one-click “Reply & Update Handbook” to upsert reply into knowledge base.
- **Knowledge base**: Single handbook per center (Markdown), soft versioning; operator edit; parent read-only.

## Data

- SQLite file is created on first request (default: `front-desk/data/front-desk.db`). Schema and seed (one center, one parent, one operator, sample handbook) run automatically when the DB is empty.
