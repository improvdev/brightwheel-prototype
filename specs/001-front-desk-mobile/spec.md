# Feature Specification: AI Front Desk

**Feature Branch**: `001-front-desk-mobile`
**Created**: 2025-02-28
**Status**: Draft
**Input**: AI Front Desk - mobile-friendly parent Q&A and operator control center for childcare centers

## Context

Parents want fast, accurate answers about their center. Operators are busy and can't always respond in real time. Handbooks are hard to search on a phone. An AI Front Desk that correctly handles the majority of inquiries could save hours of admin time each week and improve the parent experience.

**Scope**: A functional prototype with two perspectives—Parent (front desk) and Operator (control center)—using a fictional center and invented policies. No real personal data. The knowledge base is **per center**; each center has its own knowledge base, and operators can only view and edit their own center's knowledge base.

**Identity and associations (prototype):**
- **One center per parent.** A parent is associated with exactly one center (the center where their child is enrolled).
- **Parent and operator are tied to a center.** Parent sees only that center's Q&A; operator sees and manages only their center's knowledge base and question logs. **Multiple operators per center** are supported; each operator is tied to exactly one center. When an operator answers a question, **that operator's name is added to the response** so the parent sees who replied.
- **Parent is tied to a child.** The parent–center link is via the child (parent has a child enrolled at the center). For prototype, one child per parent is sufficient; use placeholders for identities.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Parent Asks Question and Gets Answer (Priority: P1)

A parent opens the app on their phone, asks a question about their childcare center (e.g., "What are your pickup hours?" or "When is tuition due?"), and receives an answer that is specific to the center and feels trustworthy. The interface is mobile-friendly (text input, optionally voice or guided flow).

**Why this priority**: This is the core value—parents get instant answers. Without it, there is no AI Front Desk. They need to be able to get answers at anytime of the day even when the daycare/care giver cant answer.  It will save time for the daycares to not have to answer questions all the time.  They can focus on the children.  

**Independent Test**: Parent can ask "What time does the center close?" and receive a correct, center-specific answer. Delivers immediate value.

**Acceptance Scenarios**:

1. **Given** a logged in parent on the parent view, **When** they type "What are your hours?" and submit, **Then** they see an answer grounded in the center's handbook/policies
2. **Given** a parent asking about schedules, **When** the question matches known policies, **Then** the answer is specific (e.g., "We're open 7am–6pm weekdays") not generic
3. **Given** a mobile browser, **When** the parent opens the app, **Then** the UI is usable and responsive on phone screens
4. **Given** a parent submits a question, **When** the system answers, **Then** the response feels trustworthy (e.g., cites source, or clearly states it's center-specific). The answer **links to the knowledge base document with the anchor** (e.g. `/handbook#hours`); when the parent clicks, they go to that place in the document and the **target section is highlighted or briefly flashed** (e.g. via `:target` styling) so it's obvious where they landed. Policies are versioned.
5. **Given** an operator has sent an update or reply to the parent, **When** the parent is in the app, **Then** they see an in-app notification (or clear in-app indicator) that they have an update; for the prototype, notifications are in-app only (no push/email).
6. **Given** a parent wants to see past questions and answers, **When** they open the app, **Then** they can view their chat history and see any operator updates there.
7. **Given** the parent has an unread update (e.g. operator reply), **When** they see the notification or chat list, **Then** it is very clear that they have not read the update and that they should—e.g. unread badge, "New reply" label, or prominent visual state; tapping the notification or conversation takes them to that conversation so they can read the update.

---

### User Story 2 - Graceful Handling of Uncertain or Sensitive Questions (Priority: P2)

When the system is uncertain about an answer, or the question touches sensitive topics (e.g., **illness** such as fever, **fees**, **discipline**, **staff**), the system handles it gracefully—either by asking for clarification, offering to connect to staff, or declining to answer in a respectful way. No guessing or hallucinations on sensitive topics. In this context, a parent asking about something like a fever is often stressed ("the anxious parent"); the system must not respond with policy alone—it must acknowledge the emotion first.

**Why this priority**: Trustworthiness and safety. A wrong or inappropriate answer damages trust more than no answer. A cold policy-only reply on a sensitive topic can feel dismissive and increase anxiety.

**Independent Test**: Parent asks "How much does enrollment cost?" or an ambiguous question; system either gives a qualified answer with a source or offers to connect to staff. No fabricated details.

**Acceptance Scenarios**:

1. **Given** a question the system cannot confidently answer, **When** the parent submits it, **Then** the system indicates uncertainty (e.g., "I'm not sure about that—here's what I know..." or "Let me connect you with staff")
2. **Given** a question about sensitive topics (fees, discipline, personnel), **When** the system responds, **Then** it avoids inventing details and offers escalation if appropriate
3. **Given** a question flagged as **sensitive** (e.g. illness/fever, discipline, fees), **When** the system answers, **Then** it MUST use a **"Warm Bridge"** tone: (a) prepend a brief empathetic acknowledgment (e.g. "I understand that's stressful" or "I know that can be worrying") before the policy answer; (b) give the handbook answer with link to the relevant section; (c) where appropriate, state that the question has been flagged for staff follow-up (e.g. "I've flagged this for [Director/name] so they can check in on you"). Example: "I understand that's stressful. According to the handbook [Link], children must be fever-free for 24 hours. I've flagged this for Director Sarah so she can check in on you."
4. **Given** an ambiguous question, **When** possible, **Then** the system asks a clarifying question or narrows the scope
5. **Given** the system is uncertain, **When** it responds, **Then** the tone is helpful and never dismissive
6. **Given** a logged-in parent on the parent view, **When** they ask any question, **Then** the system does not hallucinate: it answers only from the knowledge base; if it does not know the answer, it says so and flags the question for review by the daycare admin.
7. **Given** a sensitive question was asked, **When** the system returns a result, **Then** the question and result are flagged as (1) sensitive and (2) not able to answer, so the daycare can respond to the parent.  

---

### User Story 3 - Operator Control Center (Priority: P3)

Staff have a control center where they can: (1) **view** the knowledge base document and **edit** the source of truth (handbook, policies, schedules) in the UI—edits are saved (soft versioning: updated_at and version_number on the item)—and (2) see what questions parents are asking and where the system struggled (low confidence, no match, sensitive topics). **Parent view can also view** the knowledge base document (read-only). Document upload is out of scope for this prototype; the priority is question–answer. Advanced document editing (upload, drafts, etc.) is a future iteration.

**Why this priority**: Operators need to own the knowledge and monitor system performance. Without this, the system cannot improve and may drift from reality.

**Independent Test**: Operator can add or edit a policy (e.g., "Tuition is due by the 1st") and see a list of recent parent questions with confidence/outcome indicators.

**Acceptance Scenarios**:

1. **Given** an operator in the control center, **When** they add or edit a knowledge item in their center's knowledge base, **Then** the change is saved and reflected in future parent answers for that center. Operators can only enter or edit their own center's knowledge base.
2. **Given** an operator providing or updating the source of truth, **When** they edit in the UI and save, **Then** the change is saved and the item's version is updated (e.g. updated_at and version_number); the updated content is incorporated into the center's knowledge base for future answers. (Document upload is out of scope for this prototype.)
3. **Given** an operator or a parent, **When** they open the app, **Then** they can **view the knowledge base document** (operator can also edit; parent is read-only). Answers that cite a source link to the document and to the **specific place** in the document (e.g. section "hours") so clicking the link opens the doc at that section.
4. **Given** an operator, **When** they view the dashboard, **Then** they see a list of questions asked at their center, with indicators for: answered confidently, low confidence, no match, escalated. Operators can see which parent (or household) asked each question so they can follow up when needed (e.g. sensitive or unanswered questions). They only see data for their own center.
5. **Given** a question the system struggled with, **When** the operator views it, **Then** they see an **AI-suggested draft answer** (draft ticket)—e.g. "Parent asked about Veterans Day. Handbook says we follow school district calendar but I don't have the 2026 calendar. Suggested reply: …"—so the operator can one-tap send or edit then send, instead of a blank screen.
6. **Given** a question the system struggled with, **When** the operator views it, **Then** they can see enough context to improve the knowledge base
7. **Given** the operator edits knowledge, **When** they save, **Then** the system reuses the updated content for future questions
8. **Given** a daycare/pre-K admin has logged in, **When** they want to see parent questions and answers, **Then** the UI shows conversations with parents, the time questions were asked, and the ability to thumbs up or thumbs down answers (for future training/improvement)
9. **Given** a question has been asked, **When** the operator views it, **Then** the operator can respond to the parent—elaborating on the AI answer or providing an answer when the system was unable to answer.
10. **Given** an answer exists (e.g. operator response, or result of a rerun), **When** the operator requests it, **Then** that answer can be sent to the parent so they receive it in the conversation. When the answer is from an operator, **the operator's name is shown on the response** so the parent sees who replied. **Idempotency:** One send per operator reply—if the operator clicks "Send" twice for the same reply, the parent sees a single message (no duplicate).

---

### User Story 4 - Easy Improvement Over Time (Priority: P4)

Operators can improve the system over time—even with simple means. For example: marking an answer as wrong, suggesting a correction, or adding a new FAQ. The flow is lightweight so busy staff can do it in seconds.

**Why this priority**: Continuous improvement without requiring engineering. Differentiates a live product from a static demo.

**Independent Test**: Operator sees a question that got a poor answer, adds or corrects the relevant knowledge, and a similar future question gets a better answer.

**Acceptance Scenarios**:

1. **Given** an operator viewing a struggled question, **When** they choose "Add to knowledge" or "Correct answer", **Then** they can add/edit content with minimal friction and rerun the question to verify the system now returns the correct answer
2. **Given** new knowledge is added, **When** a similar question is asked later, **Then** the system uses the new content in its answer
3. **Given** the improvement flow, **When** the operator completes it, **Then** it takes under 30 seconds for a simple edit
4. **Given** an operator flags an answer as wrong, **When** applicable, **Then** the system can deprioritize that source or surface it for review
5. **Given** an operator has provided a manual answer to a Low Confidence or No Match question, **When** they use the one-click "Save this as a new Policy/FAQ" (or "Reply & Update Handbook"), **Then** the system sends the reply to the parent AND creates/upserts a **KnowledgeItem** so the next parent who asks the same type of question gets the operator's logic without human intervention—**Response-to-Knowledge** shortcut; no separate navigation to the Handbook Editor or re-typing.

---

### Edge Cases

- What happens when the parent asks a question in a non-English language or with typos? System should attempt to understand or ask for clarification.
- What happens when the parent asks something completely out of scope (e.g., weather, politics)? System should politely redirect to center-related topics.
- What happens when the knowledge base is empty or very sparse? System should indicate that answers are limited and suggest contacting staff.
- What happens when multiple policies could apply? System should either combine them clearly or ask which aspect the parent cares about.
- What happens when the operator edits content while a parent is mid-session? System uses the latest knowledge; no strict consistency required for prototype.
- **Stale knowledge:** What if the handbook says "Closed on Mondays" but the operator just announced a special event? **Operator replies always override AI/handbook answers in the chat history.** When a question has both an AI answer and an operator reply, the parent sees the operator's reply as the current answer for that conversation; the handbook may be stale, but the operator's message is the source of truth for that thread.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST accept parent input via at least text (voice or guided flow optional)
- **FR-002**: System MUST answer questions using a center-specific knowledge source (handbook, policies, schedules). Each center has its own knowledge base.
- **FR-003**: System MUST surface confidence or uncertainty when answering; MUST NOT fabricate sensitive details. The LLM layer MUST return **structured output** (e.g. via streamText/generateObject): **answer**, **confidence** (e.g. high / low), and **escalate** (boolean). The model MUST be instructed: "If the answer is not explicitly in the context, set confidence: low and escalate: true." **High confidence** → answer the parent immediately. **Low confidence or sensitive** → return a Graceful Bridge message to the parent and create a **Draft Ticket** for the operator (see FR-003b).
- **FR-003b (Draft ticket)**: When the system is low-confidence or cannot answer from context, it MUST generate an **AI-suggested draft answer** for the operator (e.g. "Parent asked about Veterans Day. Handbook says we follow school district calendar but I don't have the 2026 calendar. Suggested reply: …"). The operator MUST see this draft in the question/dashboard view and be able to send it as-is or edit then send—no blank screen.
- **FR-004**: System MUST provide an operator view for editing that operator's center's knowledge base and viewing question logs for that center
- **FR-005**: System MUST support a fictional center with invented policies (no real personal data)
- **FR-006**: System MUST be mobile-friendly for the parent experience
- **FR-007**: System MUST log questions per center with outcome (answered, low confidence, no match, escalated) for operator review. Question logs MUST be attributable to the asking parent (or household) so operators can follow up; operators see only their center's logs. For prototype use placeholders if no real identities.
- **FR-008**: Operators MUST be able to add, edit, or remove knowledge items in their own center's knowledge base only (no access to other centers' knowledge). Staff MUST be able to provide or edit the source of truth by editing in the UI; edits are saved to disk and each save creates a new version. Document upload is out of scope for this prototype. **Parent view and operator view MUST both be able to view the knowledge base document** (operator can edit, parent read-only). When an answer cites a source, the citation MUST **link to the knowledge base document** with the **anchor** (e.g. `/handbook#tuition`). When clicked, the UI MUST open at that specific place in the document and **highlight or briefly flash the target section** (e.g. CSS `:target` or scroll-into-view + highlight) so the parent sees exactly where they landed. The document MUST support section-level anchors or identifiers (e.g. topic/slug) for deep linking.
- **FR-009**: When uncertain or handling sensitive topics, system MUST offer escalation (e.g., "Contact the front desk") or qualified responses
- **FR-009b (Tone / Safety guardrail – "Warm Bridge")**: For any question **flagged as sensitive** (e.g. illness/fever, discipline, fees), the AI response MUST use an empathetic tone: (1) **prepend a brief empathetic acknowledgment** (e.g. "I understand that's stressful" or "I know that can be worrying") before the policy answer; (2) provide the handbook answer with link to the relevant section; (3) where appropriate, state that the question has been flagged for staff follow-up (e.g. "I've flagged this for [staff name] so they can check in on you"). This "Warm Bridge" prevents a cold policy-only reply that can increase parent anxiety.
- **FR-010**: System MUST NOT persist or display real parent/child PII; use placeholders for prototype
- **FR-011**: Parent MUST be tied to exactly one center (via their child's enrollment). Operator MUST be tied to exactly one center; **a center MAY have multiple operators**. Parent MUST be tied to at least one child (parent–center association is through the child). When an operator sends an answer to a parent, **the response MUST include that operator's name** (or display name) so the parent sees who replied.
- **FR-012**: Parent MUST be able to view their chat history and see operator updates (replies) there. When the operator sends an update, the parent MUST see an in-app notification or clear indicator; unread updates MUST be obviously unread (e.g. badge, "New reply") and navigating from the notification or list MUST take the parent to that conversation. For prototype, in-app only (no push/email). **Send-to-parent is idempotent:** one send per operator reply; if the operator clicks "Send" twice for the same reply, the parent sees one message, not two.
- **FR-013**: System MUST store every question and every answer. A question MAY have multiple answers (e.g. first system answer, then operator update). Question metadata MUST include at least outcome, whether answered, and accuracy/feedback where applicable (e.g. operator thumbs). Thumbs up/down are stored (e.g. on the answer or question–answer) and displayed in the operator view; use of feedback for model or retrieval improvement is out of scope for this prototype (future). **In chat history, operator replies always override AI/handbook answers**—when both exist for a question, the displayed current answer for that conversation is the operator's reply (so stale handbook content does not trump a staff correction).
- **FR-014 ("Response-to-Knowledge" Shortcut)**: When an operator provides a manual answer to a **Low Confidence** or **No Match** question, the UI MUST offer a **one-click option** to "Save this as a new Policy/FAQ" (or equivalent, e.g. "Reply & Update Handbook"). **Effect:** This automatically creates (or upserts) a new **KnowledgeItem** in the SQLite database so the LLM is grounded on it for the next parent. Operator answers MAY update the knowledge base either by (1) using the operator's reply text directly, or (2) running an LLM call to summarize that reply into a clean Markdown snippet for the `knowledge_items` table—implementation choice for the prototype. **Validation:** A subsequent question of the same type MUST return the operator's logic without human intervention (high-confidence answer from the KB).

### Non-Functional Requirements

- **NFR-001 (Availability):** Best effort for prototype; no SLA. Production would define availability targets later.
- **NFR-002 (Latency):** System SHOULD respond within **10 seconds** for typical questions (so the plan can consider streaming, timeouts, and LLM/retrieval limits).
- **NFR-003 (Data):** **Retention:** Question logs and feedback are kept for the prototype duration; define retention for production later. **Timestamps:** All stored documents and records MUST have **date and time** (e.g. created_at, updated_at where applicable)—questions, answers, knowledge items, feedback, and any other persisted data.

### Key Entities

- **Center**: A childcare center with a name, policies, schedule, and contact info. Each center has its **own knowledge base** and may have **multiple operators**; answers and operator actions are scoped to that center.
- **Parent**: A user in the parent view, tied to **one center** (the center where their child is enrolled) and tied to **at least one child**. For prototype, one center per parent; use placeholders for identity.
- **Child**: Enrolled at one center; links the parent to that center. For prototype, use placeholders; one child per parent is sufficient.
- **Operator**: A staff user in the control center, tied to **one center** (a center can have multiple operators). Can edit that center's knowledge base and view that center's question logs only. When an operator sends an answer to a parent, **the operator's name is stored with the answer and shown on the response** so the parent sees who replied.
- **KnowledgeItem**: A piece of source-of-truth content (policy, FAQ, schedule entry) belonging to one center, with a topic/category and content; editable only by operators of that center in the UI; stored in SQLite with **soft versioning** (`updated_at`, `version_number` int—each save updates the row and increments the number; no separate version-history table for the prototype). The knowledge base is **viewable** by both parent and operator (operator can edit). Items/sections have **identifiers or anchors** (e.g. slug "hours") so answers can link to a specific place in the document; clicking the link opens the doc at that place.
- **Question**: A parent-submitted query. Stored with metadata: timestamp, center, asker (parent/household), **outcome** (answered / low confidence / no match / escalated), **whether it was answered** (e.g. resolved by system or operator), **accuracy score** (e.g. from operator thumbs or system confidence), **sensitive flag** (if applicable), and any other useful fields (e.g. confidence at answer time). A question is **linked to multiple answers** (1) the first answer (e.g. from the system) and (2) zero or more updated answers (e.g. operator reply or corrected answer). Every question and its answers are stored; operators see only their center's questions.
- **Answer**: One of potentially several responses to a question. Has content, optional source citation, confidence indicator, timestamp, and whether it is from the system or from an operator. **When from an operator, the answer includes the operator's name** (or display name) so the parent sees who replied; stored with the answer. Stored with its question; order/sequence indicates first vs updated. **In the conversation UI, operator replies override AI/handbook answers**—when a question has both, the operator's reply is the current/authoritative answer shown to the parent (handles stale knowledge, e.g. handbook says "Closed Mondays" but operator announced a special event). Optional **operator feedback** (thumbs up/down) per answer—for prototype, stored and displayed in the operator view only; use for model/retrieval improvement is future.
- **QuestionLog** (operator view): Per-center list of questions with their answers and metadata for the operator dashboard (question text, outcome, timestamp, asker, accuracy/feedback). Operators see only their center's logs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Parent can ask a common question (e.g., hours, tuition due date) and receive a correct, center-specific answer within one interaction
- **SC-002**: When the system is uncertain, it communicates uncertainty or offers escalation in 100% of cases (no silent hallucination)
- **SC-003**: Operator can add or edit a policy and see the change affect a subsequent parent answer
- **SC-004**: Operator can view at least the 10 most recent questions with outcome indicators
- **SC-005**: Prototype is functional end-to-end: parent asks → gets answer; operator edits → parent gets updated answer
- **SC-006**: UI is usable on mobile viewport (responsive or mobile-first)
- **SC-007 (Response-to-Knowledge validation)**: After an operator uses "Reply & Update Handbook" (or "Save as Policy/FAQ") for a Low Confidence or No Match question, a subsequent parent question of the same type MUST return a high-confidence answer grounded on the operator's content—no human intervention required. This validates that the center's "brain" was updated.

## Data / Grounding Approach

For this prototype, use one of:

- **Option A**: Small structured dataset—JSON or similar with policies, schedules, FAQ entries
- **Option B**: A tiny "handbook" page (static HTML or Markdown) and ground answers from it
- **Option C**: Inspired by a public handbook (e.g., Albuquerque) but with fictionalized center name and simplified content

Focus on **response quality and trustworthiness** over sophisticated document parsing. A simple retrieval + LLM approach is acceptable.

**Knowledge base for this prototype:** Parent and operator views can **view** the knowledge base document (operator can edit, parent read-only). Operators edit the source of truth in the UI. Updates are saved; for the prototype use **soft versioning** (e.g. `updated_at` and `version_number` on the knowledge item—no separate version table). **Linking:** Answers that cite a source link to the **document itself**; when the user clicks, they go to **that specific place in the document** (e.g. "What are the hours?" → answer "Hours are 9–5" with link that opens the doc at the "hours" section). The document MUST have section-level structure (e.g. headings, topics, or slugs like "hours", "tuition") so links can target a place in the doc. No document upload in scope—that is a future iteration. Later: document upload (formats, size, failure handling, replace vs add), drafts, and richer document editing.

**Storage for questions and answers:** Store every question and every answer; a question is linked to multiple answers (first answer, then updated/operator answers). Question metadata includes outcome, whether answered, accuracy score (e.g. thumbs), sensitive flag, and similar. For the prototype, use **SQLite**: the file is the database—no separate server, no in-memory load at startup; the app opens the file and runs queries. Single file on disk gives schema, timestamps, and simpler concurrency for a single process. **Knowledge base (KnowledgeItems) is stored in the same SQLite database** (e.g. `knowledge_items` table). **Versioning for prototype – soft only:** Do not build full immutable versioning (no separate version-history table or migration logic). Add **`updated_at`** and **`version_number` (int)** to the `knowledge_items` table; each save updates the row and increments `version_number`. This is a "Soft Versioning" POC—enough to show "this was updated" and support linking; full version history is out of scope for the prototype. Thumbs up/down: store with the answer (or question–answer pair) and display in the operator dashboard; using feedback for model/retrieval tuning is future. Production may use a full database (e.g. Postgres).

## Technical Direction

- **Stack**: Node.js / Next.js / TypeScript.
- **Storage**: **SQLite** for the prototype. The DB file is the source of truth—no in-memory DB loaded from JSON; open the file and query. Questions, answers, and the **knowledge base (KnowledgeItems)** all live in the same SQLite database. **Versioning:** Soft only—`knowledge_items` has `updated_at` and `version_number` (int); each save updates the row and bumps the number. No version-history table or immutable versioning for the prototype (avoids a "hard versioning" rabbit hole). Single process; schema, timestamps, and persistence handled by SQLite.
- **Authentication**: Keep limited for prototype; no full auth implementation. Use pre-defined logins (e.g. parent/operator roles).  
- **LLM layer**: Vercel AI SDK **Core** on the backend (answer generation, structured output, tools, optional embeddings/reranking). Provider-agnostic; use env vars for API keys.
- **Self-awareness (technical)**: In streamText or generateObject, instruct the model to return **Answer + Confidence + Escalate**. If the answer is not explicitly in the context, set `confidence: low` and `escalate: true`. **Logic:** High confidence → answer parent immediately. Low confidence / sensitive → return a **Graceful Bridge** to the parent and a **Draft Ticket** (AI-suggested reply) to the operator.
- **Draft & approve (operator value)**: When the AI identifies a gap (e.g. "Handbook says we follow district calendar but I don't have the 2026 calendar"), it creates a **draft suggested answer** for the operator. The operator's question view shows: the question, the AI's suggested reply (e.g. "I'm checking the 2026 district calendar now. Typically we are [Open/Closed]. I'll confirm in 2 minutes."). Operator can one-tap send or edit (e.g. toggle Open/Closed) then send.
- **Persistent learning / "Reply & Update Handbook" (product value)**: Single flow for the operator—no separate trip to the Handbook Editor. **Flow:** (1) Operator types their reply (e.g. "Yes, we are open on Veterans Day this year."). (2) Operator clicks **"Reply & Update Handbook"** (or "Send" + one-click "Save this as Policy/FAQ"). (3) Backend sends the message to the parent AND runs an LLM call (e.g. in the background) to summarize that answer into a clean Markdown snippet. (4) System upserts the snippet into the `knowledge_items` table (or uses the reply text directly—see FR-014). The next parent who asks a similar question gets a high-confidence answer from the KB—support ticket becomes a permanent part of the center's "brain."
- **Parent UI**: When building the parent-facing app in React/Next, add the Vercel AI SDK **UI** package (e.g. `useChat`) for streaming chat; backend remains Core-only.
- **Operator UI**: Can be same Next app (different routes) or separate; no requirement to use the AI SDK UI for the control center.
- **Parent notifications (prototype)**: In-app only—parent sees updates when they are in the app (e.g. indicator on chat list or home). No push or email for prototype. Chat history is viewable; unread operator updates must be clearly marked (e.g. unread badge, "New reply") and tapping takes the parent to that conversation.

**Knowledge base view and edit – Markdown:** Keep it simple. Store knowledge base content as **Markdown**. **View:** render with `react-markdown`; use **rehype-slug** (or a custom `components` for headings) to add `id` to each heading so deep links like `#hours` or `#tuition` work. **Edit:** a Markdown editor (e.g. `@uiw/react-md-editor`, or a textarea). Section anchors come from headings; no custom editor logic. This delivers parent/operator view, operator edit, and links that open at a specific place in the doc.

**Deep linking – link format and target highlight:** Links in chat MUST include the **anchor** (e.g. `/handbook#tuition` or `#hours`). When the parent clicks such a link, the UI MUST not only open the handbook and scroll to the target section but also **highlight or briefly flash the target section** so it's obvious where they landed. Use CSS `:target` (e.g. `:target { background: rgba(255,255,0,0.3); }` or a short transition) or a small scroll-into-view + highlight effect. This makes the deep link feel intentional and premium instead of "just another page."

## Future considerations (VNext)

- **Operator correction → knowledge base update (richer flows)**: In-scope for this prototype: operator can **save their reply to the knowledge base** (upsert to KnowledgeItems) so future similar questions get the answer—see FR and User Story 4 (persistent learning). VNext: richer flows such as "Add as FAQ" vs "Update this policy," auto-suggest which section to update, or diff view before upsert.
- **Frequently asked questions (FAQs) synced with knowledge base**: Maintain a FAQ view or list that is updated when the knowledge base is updated (e.g. when operators add or edit policies, the FAQs reflect those changes so parents see current, consistent answers). Out of scope for the current prototype; consider if scope allows later.
- **City/state rules and regulations**: Pull in not only the center's handbook but also relevant city or state rules, regulations, or handbooks (e.g. licensing, health & safety) so answers can be grounded in both center policy and regulatory requirements. Out of scope for the current prototype; consider if scope allows later.
- **Group + location knowledge (master + local)**: If the daycare is part of a larger group, support one master source of truth at the group level (shared policies, brand, compliance) plus location-specific knowledge (hours, staff, local procedures). Answers combine both; operators at a location edit only their location's layer. Out of scope for the current prototype; consider if scope allows later.
- **Guiding operators to answer needed questions**: Help operators know which questions to address (e.g. unanswered, low-confidence, or frequently asked) and give them templates or suggested topics—e.g. FAQ templates or patterns derived from what other daycares commonly cover—without leaking data across centers (aggregated/anonymized insights or generic templates only; no center-specific content from other daycares). Out of scope for the current prototype; consider if scope allows later.
- **Document upload**: Allow operators to upload a new document (e.g. handbook, policy PDF/DOCX) in addition to in-app editing. Decide: supported formats and max file size for v1; behavior when conversion fails (reject with clear message, or keep original and show warning); replace vs add (e.g. new handbook replaces previous). Convert to canonical format for RAG; optionally keep original as source of record. Out of scope for the current prototype; priority for this scope is Q&A.
- **Richer document editing**: Drafts (save without publishing), more advanced editing workflows, and other document-lifecycle features. Out of scope for the current prototype.
- **Full/immutable versioning**: Version history table, diff view, or rollback for knowledge items. For prototype, soft versioning (updated_at + version_number) only; full versioning is future if needed.
- **Use feedback for model/retrieval improvement**: Use stored thumbs up/down (and other question/answer metadata) to tune the model or retrieval (e.g. ranking, training signals). For prototype, feedback is stored and displayed only; this is future.
