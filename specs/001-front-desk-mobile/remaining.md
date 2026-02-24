# AI Front Desk – Remaining vs Spec

## Done ✓

- **Login:** Hardcoded users in `auth-users.ts`; login as parent or operator; middleware protects `/parent`, `/operator`, `/handbook`; handbook and all views scoped by center (parents/operators tied to that center).
- Parent: ask question, answer with confidence/source link, chat history, unread operator reply badge; parent page uses `/api/auth/me` for centerId/dbParentId.
- Operator: dashboard (questions + outcome + suggested draft), reply, Reply & Update Handbook (with LLM summarization); operator page and operator handbook use `/api/auth/me` for centerId/dbOperatorId.
- Handbook: view (parent read-only, operator edit), deep links with `:target` highlight; handbook content fetched by centerId from auth.
- Warm Bridge for sensitive topics; sensitive flag stored
- Operator name on replies; operator override in chat history
- Response-to-Knowledge (FR-014); SC-007 validation via new KB items

---

## Remaining (spec / nice-to-have)

### 1. ~~**Thumbs up/down (FR-013, User Story 3 #8)**~~ ✓  
- **Done:** `POST /api/operator/feedback` (answerId, thumbs 1|-1); operator dashboard shows 👍/👎 on system answer and persists to `answer_feedback`.

### 2. ~~**Send idempotency (FR-012, User Story 3 #10)**~~ ✓  
- **Done:** Before inserting an operator answer, we check if the last answer for that question is already an operator reply with the same content and sent_to_parent=1; if so, return 200 without inserting.

### 3. ~~**Operator sees asker (FR-007)**~~ ✓  
- **Done:** Questions API joins `parents.display_name`; operator dashboard shows “Asked by Parent (Demo)” (or that center’s parent placeholder).

### 4. ~~**Rerun question (User Story 4 #1)**~~ ✓  
- **Done:** `GET /api/operator/rerun?questionId=1` re-runs the question against the current KB and returns the new answer; operator UI has “Rerun question (verify after handbook edit)” and shows the new answer in a green box (not persisted to parent chat).

### 5. **Remove knowledge item (FR-008)**  
- **Spec:** Operators can add, edit, **or remove** knowledge items.  
- **Gap:** Only one handbook row is editable; FAQ items added via "Reply & Update Handbook" (and any future items) can’t be removed in the UI.

### 6. **Outcome "no_match"**  
- **Spec:** Outcome can be answered / low_confidence / **no_match** / escalated.  
- **Gap:** Chat route only sets answered / low_confidence / escalated; we could set `no_match` when the model has no relevant context at all.

### 7. **Mobile viewport (FR-006, SC-006)**  
- **Spec:** Parent experience mobile-friendly.  
- **Gap:** Layout is responsive; ensure viewport meta and touch targets are explicit if needed.

### 8. **Edge cases (spec “Edge Cases”)**  
- Non-English / typos: prompt could ask for clarification.  
- Out-of-scope (weather, politics): prompt already says answer from KB only; could add explicit redirect.  
- Empty/sparse KB: handled by low confidence + escalate.  
- Multiple policies: model can combine or ask; no explicit UX.

---

## Still to do (lower priority)

- **Remove knowledge item (FR-008)** – Add UI to delete/remove a knowledge item (e.g. FAQ rows). For single-handbook prototype, optional.  
- ~~**Outcome no_match**~~ ✓ – Chat route sets outcome to `no_match` when the model returns `noMatch: true` (no relevant context in the KB). Schema and prompt updated.  
- **Mobile viewport** – Confirm viewport meta and touch targets; already responsive.  
- **Edge cases** – Non-English/typos, out-of-scope redirect, empty KB message; can be refined in prompts.
