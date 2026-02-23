# Jira Ticket Management Rule

## Overview

When creating, updating, or managing Jira tickets, **always use the unified Jira utility script** located at `scripts/jira/jira.js`.

## ⚠️ Field Requirements

**REQUIRED FIELDS (MUST Include):**
1. `summary` - Clear, descriptive title
2. `description` - Context, requirements, and acceptance criteria
3. `priority` - Highest/High/Medium/Low/Lowest
4. `labels` - Consistent labels (e.g., security, ios, MVP)
5. `issueType` - Bug/Task/Story/Epic
6. `parent` - Link to the owning epic/initiative (organizes related work)

**HIGHLY RECOMMENDED FIELDS (SHOULD Include):**
7. `components` - System areas affected (e.g., iOS App, Backend API)
8. `assignee` - Owner (email address)
9. `fixVersions` - Target release versions (**NOTE**: Update in code when working on ticket)

## Why Use the Unified Script

- **Consistency**: Single source of truth for all Jira operations
- **Reusability**: Can be used as a module or CLI tool
- **Maintainability**: One script to update instead of multiple scripts
- **Flexibility**: Supports all common Jira operations (create, update, query, link, transition)

## Usage

### Creating Tickets

**Preferred Method**: Create a JSON file in `scripts/jira/tickets/` and use the script:

```bash
# Create tickets from JSON file
node scripts/jira/jira.js create tickets/security-tickets.json

# Create a single ticket
node scripts/jira/jira.js create-single '{"summary":"Title","description":"Desc","priority":"High"}'
```

**JSON File Format**:

**Minimum Required Format:**
```json
[
  {
    "summary": "Ticket title",
    "description": "Ticket description with context, requirements, and acceptance criteria",
    "priority": "Highest|High|Medium|Low|Lowest",
    "labels": ["label1", "label2"],
    "issueType": "Bug|Task|Story|Epic"
  }
]
```

**Recommended Complete Format:**
```json
[
  {
    "summary": "Ticket title",
    "description": "Ticket description with context, requirements, and acceptance criteria",
    "priority": "Highest|High|Medium|Low|Lowest",
    "labels": ["label1", "label2"],
    "issueType": "Bug|Task|Story|Epic",
    "parent": "IN-140",
    "components": ["Component Name"],
    "assignee": "user@example.com",
    "fixVersions": ["v1.2.0"],
    "dueDate": "2024-12-31",
    "environment": "Production"
  }
]
```

**Note**: `fixVersions` should be updated in code when working on the ticket.

> **Automation:** The unified Jira script enforces this rule. Any attempt to create a non-epic issue without a `parent` key results in an error.

## Required Fields (MUST Include)

**These fields are REQUIRED for all tickets:**

1. **`summary`** - Clear, descriptive title
   - Must be searchable and descriptive
   - Format: `[CATEGORY] PRIORITY: Brief description`

2. **`description`** - Detailed description with context and acceptance criteria
   - Must include context, requirements, and acceptance criteria
   - Use markdown formatting for readability

3. **`priority`** - Appropriate priority level
   - Must be one of: `Highest`, `High`, `Medium`, `Low`, `Lowest`
   - Based on business impact and urgency

4. **`labels`** - Consistent labels for filtering
   - Must include relevant labels (e.g., `security`, `ios`, `MVP`, `bug`, `feature`)
   - Use consistent labeling conventions

5. **`issueType`** - Correct issue type
   - Must be one of: `Bug`, `Task`, `Story`, `Epic`, etc.

6. **`parent`** - Ticket must be linked to its epic or higher-level initiative
   - **Why**: Ensures roadmap visibility, dependency tracking, and sprint roll-ups
   - Format: `"IN-XXX"` (epic or parent ticket key)
   - **Enforcement**: Tickets without a parent key should not move into `In Progress`

## Highly Recommended Fields (SHOULD Include)

**These fields are HIGHLY RECOMMENDED for most tickets:**

7. **`components`** - System components affected
   - **Why**: Makes filtering and organization easier
   - Examples: `["iOS App"]`, `["Backend API"]`, `["Web Frontend"]`, `["Authentication"]`

8. **`assignee`** - Owner (email address)
   - **Why**: Clear ownership and workload distribution
   - Format: `"user@example.com"` (email address)

9. **`fixVersions`** - Target release versions
   - **Why**: Helps with release planning and tracking
   - **IMPORTANT**: This should be updated in code when working on the ticket
   - Format: `["v1.2.0"]` (array of version strings)

## Optional Fields (Use When Applicable)

- `dueDate` - When it needs to be done (ISO format: "YYYY-MM-DD")
- `environment` - Where it applies (e.g., "Production", "iOS", "Web")
- `affectsVersions` - For bugs, which versions are affected

See `docs/guides/jira-ticket-fields.md` for complete field documentation and examples.

### Updating Tickets

```bash
# Update ticket fields
node scripts/jira/jira.js update IN-123 '{"priority":"High","labels":["bug"]}'

# Transition ticket status
node scripts/jira/jira.js transition IN-123 "In Progress"
```

### Querying Tickets

```bash
# Get ticket details
node scripts/jira/jira.js get IN-123

# List tickets with JQL
node scripts/jira/jira.js list "project=IN AND status=Open"
```

### Linking Tickets

```bash
# Link tickets to an epic
node scripts/jira/jira.js link-to-epic "IN-123,IN-124" IN-140
```

### Quick Status Transitions

A convenience npm script wraps the transition command so you can move issues with one line:

```bash
npm run jira:status -- IN-1234 "Code Review"
```

Everything after `--` is passed straight to `scripts/jira/jira.js transition`.

## Enforcing Epic Links on the Board

To make sure every issue has an epic before it moves forward, add the following guardrails in Jira:

### Quick Filter

1. Navigate to your board → **Board settings** → **Quick Filters**.
2. Add a filter named `🚫 No Epic` with JQL:
   ```
   parent = EMPTY AND issuetype != Epic
   ```
3. Use this filter during triage or stand-up to surface any tickets that still need an epic/initiative link.

### Workflow / Automation Rule

1. Open **Project settings → Automation** (or **Workflows** if you prefer validators).
2. Create a rule:
   - **Trigger**: `Issue transitioned`.
   - **Condition**: `Issue fields condition` with `Parent` **is empty**.
   - **Condition (optional)**: `Issue type` **is not** `Epic`.
   - **Action**: `Transition issue` back to the previous status (e.g., `To Do`) and add a comment such as  
     `"Link this issue to an epic or initiative before changing status."`
3. Publish the rule. Any attempt to move a ticket without a parent epic will be blocked and the author will be notified.

If you prefer workflow validators, add a **Field Required (Parent)** validator on the `In Progress` transition instead.

## Standard Ticket Workflow

Follow this checklist for **every** ticket to keep Jira, Git, and the sprint board in sync:

1. **Before you write code**
   - Confirm the ticket already has the correct epic (`parent`) and add/link any blocking or downstream tickets.
   - Move the issue into the active sprint (or create a sprint entry) before starting work.
   - Assign the ticket to yourself and add any missing context (acceptance criteria, attachments, feature doc links).
   - Create a branch that begins with the ticket key:  
     ```bash
     git checkout -b IN-1234-short-description
     ```
2. **Kickoff**
   - Transition the ticket to `In Progress` (CLI keeps the audit trail):  
     ```bash
     node scripts/jira/jira.js transition IN-1234 "In Progress"
     ```
   - Update the ticket comment with the plan if the work will span multiple days or requires cross-team help.
3. **During development**
   - Keep dependencies current (add “linked issues” for blockers, duplicates, or related work).
   - Ensure automated tests, feature docs (`features/*.md`), and architecture notes stay aligned with the ticket scope.
4. **Opening a PR**
   - Push the branch and open the PR referencing the ticket key in the title/description.
   - Decide whether to auto-transition; if ready, move the ticket to `Code Review` and attach the PR link:  
     ```bash
     node scripts/jira/jira.js transition IN-1234 "Code Review"
     ```
     (Confirm with the reviewer before auto-transitioning if required by the team.)
5. **After merge**
   - When the PR merges to `master`/`main`, update the ticket status (`Ready for QA`, `QA In Progress`, or `Done`) and add release notes or deployment info:  
     ```bash
     node scripts/jira/jira.js transition IN-1234 "Ready for QA"
     ```
   - Close or update any linked subtasks; create follow-up tickets for deferred work.

### Automation helpers

- **Linking to an epic** (mandatory for every ticket):  
  ```bash
  node scripts/jira/jira.js link-to-epic "IN-1234" IN-120
  ```
- **Fast status updates**: use the `transition` command with the desired workflow state.
- **Sprint validation**: run `node scripts/jira/jira.js get IN-1234` and confirm the `fields.customfield_*sprint*` entry matches the current sprint; adjust on the Jira board if needed.
- **Dependency mapping**: add blockers or relates-to directly in Jira or script a quick update with `update`.

## When to Create New Ticket Files

Create new JSON files in `scripts/jira/tickets/` when:
- Creating multiple related tickets (e.g., security issues, feature tasks)
- Tickets share common metadata (labels, priority, parent epic)
- You want to version control the ticket definitions
- You need to recreate tickets in different projects/environments

## When to Use create-single

Use `create-single` for:
- One-off tickets
- Quick ticket creation during development
- Testing the script
- Tickets that don't need to be version controlled

## Using as a Module

The script can also be imported as a Node.js module:

```javascript
const jira = require('./scripts/jira/jira.js');

// Create a ticket
await jira.createTicket({
  summary: "Test",
  description: "Test description",
  priority: "High"
}, 'IN');

// Update a ticket
await jira.updateTicket('IN-123', {
  priority: 'Highest',
  labels: ['security']
});
```

## Field Requirements Checklist

Before creating any ticket, ensure:

**Required Fields (MUST have):**
- [ ] `summary` - Clear, descriptive title
- [ ] `description` - Includes context, requirements, and acceptance criteria
- [ ] `priority` - Set to appropriate level (Highest/High/Medium/Low/Lowest)
- [ ] `labels` - Includes relevant, consistent labels
- [ ] `issueType` - Correct issue type (Bug/Task/Story/Epic)
- [ ] `parent` - Linked to an epic or initiative (`IN-XXX`)

**Highly Recommended Fields (SHOULD have):**
- [ ] `components` - System components specified
- [ ] `assignee` - Owner assigned (email address)
- [ ] `fixVersions` - Target release version set (update in code when working on ticket)

## Best Practices

1. **Always use the unified script** - Don't create new Jira scripts
2. **Fill out all required fields** - Summary, description, priority, labels, issueType, and parent are mandatory
3. **Fill out highly recommended fields** - Components, assignee, and fixVersions should be included for every ticket that moves forward
4. **Validate epic linkage** - Every ticket must reference its epic/initiative and note related blockers or dependencies
5. **Place work in the active sprint** - Move the ticket into the current sprint before pushing code or opening a PR
6. **Update status as you work** - `In Progress` when development starts, `Code Review` when the PR is ready (confirm before auto-transition), and the appropriate post-merge status (`Ready for QA`, `Done`, etc.) after merge
7. **Update fixVersions in code** - When working on a ticket, update the fix version in your code/PR
8. **Store ticket definitions in JSON files** - Makes them version controllable and reusable
9. **Use descriptive file names** - e.g., `security-tickets.json`, `ios-parity-tasks.json`
10. **Document ticket files** - Add comments in JSON or create a README explaining the ticket set
11. **Test with create-single first** - When creating new ticket formats, test with a single ticket
12. **Use appropriate priorities** - Follow project conventions for priority levels
13. **Add relevant labels** - Use consistent labeling for easier filtering and organization

## Examples

### Creating Security Review Tickets

```bash
# Security tickets are already defined in tickets/security-tickets.json
node scripts/jira/jira.js create tickets/security-tickets.json
```

### Creating Feature Tasks

1. Create `scripts/jira/tickets/feature-xyz-tasks.json`
2. Define tickets in JSON format
3. Run: `node scripts/jira/jira.js create tickets/feature-xyz-tasks.json`

### Bulk Updates

```bash
# Update multiple tickets (use a script that calls the module)
# Or update individually:
node scripts/jira/jira.js update IN-123 '{"priority":"High"}'
node scripts/jira/jira.js update IN-124 '{"priority":"High"}'
```

## Migration from Old Scripts

If you have old Jira scripts (e.g., `jira-create-*.js`), migrate them to:
1. Create a JSON file in `scripts/jira/tickets/` with the ticket definitions
2. Use the unified script to create tickets
3. Delete the old script

## Reference

- Script location: `scripts/jira/jira.js`
- Documentation: `scripts/jira/README.md`
- Ticket files: `scripts/jira/tickets/`

