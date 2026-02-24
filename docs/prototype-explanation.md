# AI Front Desk — Prototype Explanation

**Format:** Hosted URL for the prototype + **either** this explanation doc (< 1 page) **or** a short video (< 2 mins).

---

## Hosted URL

**Prototype:** [*Your Cloud Run or hosted URL here*]

Example after deploy: `https://front-desk-xxxxx-uc.a.run.app`

---

## What This Is

**AI Front Desk** is a mobile-friendly prototype for childcare centers. It gives **parents** instant, center-specific answers from the center’s handbook (e.g., hours, tuition, policies) and gives **operators** a control center to edit that knowledge and handle questions the system couldn’t answer confidently.

- **Parent experience:** Ask a question in natural language → get an answer grounded in the center’s policies, with optional links into the handbook. Sensitive topics (e.g., illness, fees) get an empathetic “warm bridge” and optional staff follow-up.
- **Operator experience:** View questions (answered / low confidence / no match), see AI-suggested draft replies, send replies to parents, and use **Reply & Update Handbook** so the next parent gets that answer from the knowledge base.

No real personal data; one fictional center with sample handbook and placeholder identities.

---

## What to Try

| Role      | Where           | Try this |
|----------|-----------------|----------|
| **Parent**  | `/parent`       | Ask “What are your hours?” or “When is tuition due?” — answer is center-specific; click any handbook link to jump to that section. |
| **Operator**| `/operator`     | Open the questions list (badges: answered / low confidence / no match). Open a question → send or edit the suggested reply; use “Reply & Update Handbook” to add the reply to the knowledge base. |
| **Both**    | `/handbook`     | View the center handbook (read-only for parent; operator can edit at `/operator/handbook`). |

---

## Tech (Brief)

Next.js 16, TypeScript, SQLite, Vercel AI SDK + OpenAI. Answers are grounded in the center’s knowledge base; the system returns confidence and escalation and does not hallucinate. Deploy: see `docs/guides/deploy-gcp.md`.
