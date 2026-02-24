import Database from "better-sqlite3";
import fs from "fs";
import path from "path";

const defaultPath = path.join(process.cwd(), "data", "front-desk.db");

function getDb(): Database.Database {
  const dbPath = process.env.DATABASE_PATH ?? defaultPath;
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");
  return db;
}

let _db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!_db) {
    _db = getDb();
    initSchema(_db);
  }
  return _db;
}

export function initSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS centers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      hours TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS parents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      center_id INTEGER NOT NULL REFERENCES centers(id),
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      center_id INTEGER NOT NULL REFERENCES centers(id),
      parent_id INTEGER NOT NULL REFERENCES parents(id),
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS operators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      center_id INTEGER NOT NULL REFERENCES centers(id),
      display_name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS knowledge_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      center_id INTEGER NOT NULL REFERENCES centers(id),
      slug TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      version_number INTEGER NOT NULL DEFAULT 1,
      UNIQUE(center_id, slug)
    );

    CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      center_id INTEGER NOT NULL REFERENCES centers(id),
      parent_id INTEGER NOT NULL REFERENCES parents(id),
      content TEXT NOT NULL,
      outcome TEXT NOT NULL CHECK (outcome IN ('answered', 'low_confidence', 'no_match', 'escalated')),
      confidence TEXT CHECK (confidence IN ('high', 'low')),
      answered INTEGER NOT NULL DEFAULT 0,
      sensitive_flag INTEGER NOT NULL DEFAULT 0,
      suggested_draft TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL REFERENCES questions(id),
      content TEXT NOT NULL,
      source_citation TEXT,
      from_operator INTEGER NOT NULL DEFAULT 0,
      operator_id INTEGER REFERENCES operators(id),
      operator_name TEXT,
      sent_to_parent INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS answer_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      answer_id INTEGER NOT NULL REFERENCES answers(id),
      thumbs INTEGER NOT NULL CHECK (thumbs IN (1, -1)),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_questions_center ON questions(center_id);
    CREATE INDEX IF NOT EXISTS idx_questions_parent ON questions(parent_id);
    CREATE INDEX IF NOT EXISTS idx_questions_created ON questions(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_answers_question ON answers(question_id);
    CREATE INDEX IF NOT EXISTS idx_knowledge_center ON knowledge_items(center_id);
  `);

  // Optional columns for existing DBs
  try {
    const answerCols = db.prepare("SELECT name FROM pragma_table_info('answers')").all() as { name: string }[];
    if (!answerCols.some((c) => c.name === "read_at")) {
      db.exec("ALTER TABLE answers ADD COLUMN read_at TEXT");
    }
    const centerCols = db.prepare("SELECT name FROM pragma_table_info('centers')").all() as { name: string }[];
    if (!centerCols.some((c) => c.name === "phone")) db.exec("ALTER TABLE centers ADD COLUMN phone TEXT");
    if (!centerCols.some((c) => c.name === "address")) db.exec("ALTER TABLE centers ADD COLUMN address TEXT");
    if (!centerCols.some((c) => c.name === "hours")) db.exec("ALTER TABLE centers ADD COLUMN hours TEXT");
    const questionCols = db.prepare("SELECT name FROM pragma_table_info('questions')").all() as { name: string }[];
    if (!questionCols.some((c) => c.name === "confidence")) {
      db.exec("ALTER TABLE questions ADD COLUMN confidence TEXT CHECK (confidence IN ('high', 'low'))");
    }
  } catch {
    // ignore
  }

  // One-time: update seeded parent/operator names to distinct names (id 1–3 = Alamosa/Lowell/Plaza)
  const SEED_NAMES = [
    { parent: "Maria Garcia", operator: "Director Sarah" },
    { parent: "James Chen", operator: "Director Lisa" },
    { parent: "Ana Martinez", operator: "Director Mike" },
  ] as const;
  try {
    for (let i = 0; i < SEED_NAMES.length; i++) {
      const id = i + 1;
      db.prepare("UPDATE parents SET display_name = ? WHERE id = ? AND display_name = 'Parent (Demo)'").run(SEED_NAMES[i].parent, id);
      db.prepare("UPDATE operators SET display_name = ? WHERE id = ? AND display_name = 'Director (Demo)'").run(SEED_NAMES[i].operator, id);
    }
  } catch {
    // ignore
  }

  const row = db.prepare("SELECT COUNT(*) as c FROM centers").get() as { c: number };
  if (row.c === 0) runSeed(db);
  else {
    // Ensure demo parent rows 1–3 exist (auth expects these ids). Handles empty parents table or missing ids.
    for (let i = 0; i < SEED_NAMES.length; i++) {
      const parentId = i + 1;
      const centerId = i + 1;
      const existingParent = db.prepare("SELECT id FROM parents WHERE id = ?").get(parentId);
      if (!existingParent) {
        const centerExists = db.prepare("SELECT id FROM centers WHERE id = ?").get(centerId);
        if (centerExists) {
          db.prepare("INSERT INTO parents (id, center_id, display_name) VALUES (?, ?, ?)").run(parentId, centerId, SEED_NAMES[i].parent);
        }
      }
    }
    // One-time: upgrade old short handbooks to the long per-center form (only if content lacks new section)
    try {
      const rows = db.prepare(
        "SELECT ki.center_id, ki.content, c.name, c.phone, c.address, c.hours FROM knowledge_items ki JOIN centers c ON c.id = ki.center_id WHERE ki.slug = 'handbook' AND c.id <= 3"
      ).all() as Array<{ center_id: number; content: string; name: string; phone: string | null; address: string | null; hours: string | null }>;
      const updateKnowledge = db.prepare(
        "UPDATE knowledge_items SET content = ?, updated_at = datetime('now'), version_number = version_number + 1 WHERE center_id = ? AND slug = 'handbook'"
      );
      for (const r of rows) {
        if (!r.content.includes("Tuition and Payments")) {
          const content = buildHandbookMarkdown(r.name, r.phone ?? "", r.address ?? "", r.hours ?? "");
          updateKnowledge.run(content, r.center_id);
        }
      }
    } catch {
      // ignore
    }
  }
}

/** Builds a full, center-specific family handbook (long form for AI Q&A and deep-linking). */
function buildHandbookMarkdown(centerName: string, phone: string, address: string, hours: string): string {
  return `# Family Handbook — ${centerName}

This handbook describes the policies and practices of **${centerName}**. We follow guidelines from the City of Albuquerque Division of Child and Family Development (DCFD) and New Mexico child care regulations. Please read it carefully and keep it for reference.

**Center:** ${centerName}  
**Address:** ${address}  
**Phone:** ${phone}  
**Hours of Operation:** ${hours}

---

## Hours of Operation

**Regular hours for this center:** ${hours}

Your child must be accompanied by an adult to and from the classroom. Each child must be signed in and out by a parent or designated adult on the official pick-up list. Only people on the written pick-up list who are 18 or older may pick up a child; photo ID may be requested at any time. We do not release children to anyone not on the list, including family members, without prior written authorization.

**Late arrival:** If your child arrives after the start of the program, please sign them in at the office and notify the teacher. Repeated late arrivals are documented and may lead to a parent conference.

**Late pick-up:** If you are running late, please call the center as soon as possible. Staff will stay with your child, but we must reach a designated adult. After three (3) late pick-up occurrences, a parent conference is scheduled. Continued lateness can result in a meeting with the Education Specialist or Program Manager and possible disenrollment. If a child is left after closing and we cannot reach anyone on the emergency list within 30 minutes, Albuquerque Police and Child Protective Services may be contacted.

---

## Important Closure Dates

A list of closure dates for city holidays, staff development days, and center maintenance is updated each school year. You can get the current list from the enrollment office or from the Head Teacher. These dates may vary by year; please request a copy so you know when the center will be closed.

**Observed holidays** typically include New Year’s Day, Martin Luther King Jr. Day, Presidents’ Day, Memorial Day, Independence Day, Labor Day, Veterans Day, Thanksgiving and the day after, and winter break (approximately two weeks). The center is also closed for a limited number of staff development and planning days; advance notice is given.

**Snow days and weather:** All CABQ CDCs follow Albuquerque Public Schools (APS) for weather-related closures. If APS announces a two-hour delay, centers begin accepting children at 10:00 AM. If APS announces early dismissal or a full closure, centers close and families are contacted to pick up children as soon as it is safe to travel. Please ensure your contact information is current.

---

## Attendance and Absences

Children are expected to attend on their scheduled days. Full-time enrollment is typically 6.5 hours per day, 5 days per week. Parents must notify the center **daily** if their child will be absent (e.g. by phone or through the parent portal). This helps us plan staffing and meals and ensures your child’s safety.

If we have no contact and no attendance for **two consecutive weeks**, your child may be disenrolled and the slot offered to another family. If you know your child will be out for an extended period (e.g. travel, medical), please inform the office in writing so we can note the file.

---

## Illness Policy

To protect all children and staff, keep your child at home if they have any of the following:

- **Fever:** 100.4°F or higher, or have had a fever within the last 24 hours. Children must be fever-free for **24 hours without fever-reducing medication** before returning.
- **Vomiting or diarrhea** within the last 24 hours.
- **Pink eye** or symptoms that might be pink eye (red, watery, or crusty eyes). A doctor’s note may be required to return.
- **Runny nose** that is cloudy, yellow, or green (clear runny nose may be acceptable; we may ask you to keep the child home if other symptoms are present).
- **Antibiotics** for less than 24 hours for a contagious condition.
- **Contagious disease** or symptoms (e.g. ringworm, chicken pox, hand-foot-and-mouth, strep throat, undiagnosed rash). These must be reported to the center; other families may be informed as needed while protecting privacy.

If your child develops any of these symptoms **at the center**, you will be called to pick them up promptly. A doctor’s note may be required before the child returns. We follow New Mexico Child Care Licensing guidelines for exclusion and return.

---

## Enrollment and Fees

Enrollment is completed through the enrollment office. Required documentation typically includes: birth certificate or other proof of age, up-to-date immunization records (or an exemption on file), emergency contact and pick-up authorization forms, and income verification for fee determination.

Spaces are offered based on availability and eligibility. Once you accept a slot, you will receive an enrollment packet and a start date. Please complete all forms before the first day.

**Fees are based on a graduated fee schedule** that considers family income and household size. The enrollment office can provide the current fee table and explain how your fee was calculated. Fees are due **in advance** of services (e.g. monthly or biweekly, as specified in your agreement). Fees are **non-refundable**; there is no daily pro-rating for absences. Payment is required regardless of attendance, including for planned closures (e.g. holidays) that fall on your child’s scheduled days, unless your agreement states otherwise.

---

## Tuition and Payments

Tuition (or program fees) is due on the date specified in your enrollment agreement—typically the first of the month or the first day of the pay period. Payment can be made by check, money order, or electronic payment as offered by the center. A late fee may apply if payment is received after the due date; the amount and policy are described in your agreement.

**Late pick-up fee:** \$15.00 per occurrence if you pick up your child after the center or program has closed. This fee is in addition to regular tuition.

If you experience difficulty paying, please contact the office as soon as possible. We may be able to connect you with resources or adjust the payment schedule in limited circumstances. Failure to pay or to communicate may result in disenrollment.

---

## Guidance and Discipline

We use **positive guidance** and age-appropriate redirection consistent with New Mexico Child Care Regulations. Our goal is to help children learn to manage their behavior, respect others, and follow classroom expectations. Discipline is clear, consistent, and explained in terms the child can understand. We focus on teaching skills (e.g. using words, taking turns, calming down) rather than punishment.

**Prohibited at all times:** Physical punishment of any kind; withdrawal of food, rest, or bathroom access as punishment; abusive or profane language; humiliation; unsupervised isolation; or any practice that is hazardous to a child’s physical or mental health.

If you have concerns about your child’s behavior or our approach, please talk with your child’s teacher or the Head Teacher so we can work together.

---

## Nutrition and Allergies

Nutritional meals and snacks are provided in accordance with the Child and Adult Care Food Program (CACFP). Menus are posted and meet requirements for variety and nutrition. Outside food is generally not brought in unless arranged in advance (e.g. for a documented allergy or a special celebration approved by the Head Teacher).

**Food allergies:** If your child has a food allergy or dietary restriction, a **Nutrition/Allergy form** must be completed and signed by a health care provider and given to the Head Teacher. We will make reasonable accommodations and ensure that your child is not served the allergen. In cases of severe allergy, we may ask for an action plan or medication (e.g. EpiPen) to be kept on site.

---

## Parent Visits and Open-Door Policy

Parents and guardians are welcome to visit the classroom at any time. We ask that you plan to stay at least 30 minutes when you visit so your child can comfortably share their experience with you. All visitors must sign in at the office and wear a visitor badge. For discussions longer than about 10 minutes (e.g. about your child’s progress or a concern), please schedule a meeting with the teacher so we can give you our full attention without disrupting the class.

---

## Staff and Leadership

Our center is led by a **Head Teacher** in each classroom and supported by qualified assistants. The **Program Manager** or **Education Specialist** oversees curriculum, policy, and family communication. The **Director** (or site lead) is responsible for day-to-day operations and can be reached at the center phone number for urgent matters.

All staff meet state requirements for training and background checks. We encourage you to get to know your child’s teachers and to reach out with questions or concerns. Staff do not share personal contact information (e.g. personal cell numbers) with families; all official communication should go through the center phone or approved channels.

---

## Inquiries and Grievances

We hope to resolve any question or concern quickly. Please direct inquiries first to your child’s Teacher and Head Teacher. If the matter is not resolved, you may submit concerns in writing to the Education Specialist and/or Program Manager at the DCFD main office: 1820 Randolph Rd SE, Albuquerque NM 87106, or call 767-6500.

We take all complaints seriously and will respond in accordance with our grievance procedure. You also have the right to contact New Mexico Children, Youth and Families Department (CYFD) Child Care Licensing if you have concerns about health, safety, or licensing compliance.

---

## Contact

**This center:** ${centerName}, ${phone}, ${address}.  
**Hours:** ${hours}.

**DCFD Main Office:** 1820 Randolph Rd SE, Albuquerque NM 87106 — 767-6500.
`;
}

/** Seed data: 3 CABQ-style centers (from 2019 DCFD Family Handbook). */
const CABQ_CENTERS: ReadonlyArray<{
  name: string;
  phone: string;
  address: string;
  hours: string;
  demoParent: string;
  demoChild: string;
  demoOperator: string;
}> = [
  {
    name: "Alamosa Preschool & Pre-K",
    phone: "836-8764",
    address: "6900 Gonzales Rd. SW, Albuquerque NM 87121",
    hours: "7:00 am – 5:30 pm (Pre-K 8:00 am – 2:30 pm; Pre-K Extended Care 2:30 pm – 5:30 pm)",
    demoParent: "Maria Garcia",
    demoChild: "Alex",
    demoOperator: "Director Sarah",
  },
  {
    name: "Lowell Preschool & Early Pre-K",
    phone: "764-1522",
    address: "1700 Sunshine Terrace SE, Albuquerque NM 87106",
    hours: "7:00 am – 5:30 pm (Early Pre-K 8:00 am – 2:30 pm; Extended Care 2:30 pm – 5:30 pm)",
    demoParent: "James Chen",
    demoChild: "Jordan",
    demoOperator: "Director Lisa",
  },
  {
    name: "Plaza Feliz Preschool & Pre-K",
    phone: "255-0501",
    address: "517 San Pablo SE Bldg. K, Albuquerque NM 87108",
    hours: "8:00 am – 4:30 pm (Pre-K 8:00 am – 2:30 pm; Extended Care 2:30 pm – 4:30 pm)",
    demoParent: "Ana Martinez",
    demoChild: "Sam",
    demoOperator: "Director Mike",
  },
];

function runSeed(db: Database.Database): void {
  const insertCenter = db.prepare(
    "INSERT INTO centers (name, phone, address, hours) VALUES (?, ?, ?, ?)"
  );
  const insertParent = db.prepare("INSERT INTO parents (center_id, display_name) VALUES (?, ?)");
  const insertChild = db.prepare("INSERT INTO children (center_id, parent_id, display_name) VALUES (?, ?, ?)");
  const insertOperator = db.prepare("INSERT INTO operators (center_id, display_name) VALUES (?, ?)");
  const insertKnowledge = db.prepare(
    "INSERT INTO knowledge_items (center_id, slug, title, content, updated_at, version_number) VALUES (?, 'handbook', 'Handbook', ?, datetime('now'), 1)"
  );

  for (const c of CABQ_CENTERS) {
    insertCenter.run(c.name, c.phone, c.address, c.hours);
    const centerId = (db.prepare("SELECT last_insert_rowid() as id").get() as { id: number }).id;
    insertParent.run(centerId, c.demoParent);
    const parentId = (db.prepare("SELECT last_insert_rowid() as id").get() as { id: number }).id;
    insertChild.run(centerId, parentId, c.demoChild);
    insertOperator.run(centerId, c.demoOperator);
    const handbookContent = buildHandbookMarkdown(c.name, c.phone, c.address, c.hours);
    insertKnowledge.run(centerId, handbookContent);
  }
}

/** Ensures demo parent rows 1–3 exist (for auth). Call when parent lookup fails so UI and DB stay in sync. */
export function ensureDemoParentsExist(db: Database.Database): void {
  const DEMO_PARENTS = [
    { id: 1, centerId: 1, displayName: "Maria Garcia" },
    { id: 2, centerId: 2, displayName: "James Chen" },
    { id: 3, centerId: 3, displayName: "Ana Martinez" },
  ];
  for (const p of DEMO_PARENTS) {
    if (!db.prepare("SELECT id FROM parents WHERE id = ?").get(p.id)) {
      if (db.prepare("SELECT id FROM centers WHERE id = ?").get(p.centerId)) {
        db.prepare("INSERT INTO parents (id, center_id, display_name) VALUES (?, ?, ?)").run(p.id, p.centerId, p.displayName);
      }
    }
  }
}

export type Outcome = "answered" | "low_confidence" | "no_match" | "escalated";
