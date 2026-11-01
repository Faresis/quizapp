# Clearpath Family Quiz Studio

Persistent quiz application for admin, parent and child accounts, hosted with ChatGPT Sites and Cloudflare D1.

## Account hierarchy

The fixed administrator username is `admin`. On the private Site's first visit, its signed-in owner chooses the administrator password. No production password is committed or shared by default. Admin creates parent or child accounts for this single household and deletes accounts by revoking access (historical records retained). All parents share all children, tests, assignments and reports. Parents create child accounts, author/publish tests, assign a version to one or multiple children with a due date/timezone, and review every attempt. Children see and answer only their assignments. New parent/child accounts require changing their temporary password before use.

ChatGPT Sites' owner-private access gate remains unchanged. Application credentials do not grant permission through that outer gate. For separate devices, the owner must configure permitted Site visitors; minors should use guardian-authorized access rather than an independent ChatGPT account. This release does not claim that creating an app user changes Sites sharing.

## Tests and attempts

Published versions are immutable. New versions apply only to new assignments. Due dates are calendar reminders, not hard lockout deadlines. Overdue tests remain available; test timers start with an attempt. Each child has an individual assignment and history, preserving retakes. Answers and progress persist in D1, not browser storage. Resume retains deadlines. Server-owned timestamps, optimistic concurrency and unique attempt constraints enforce timing/retry rules. Normal browser timing and network latency are approximate, not laboratory reaction time. Draft answers that have not reached the server cannot be recovered from a disconnected/closed page.

Supported content: single/multiple select, short exact or explicitly normalized text (normalization via JSON), extended/manual grading, both presentation modes, navigation policies, whole-test/item/combined timing, after-attempt/parent-only/never feedback, import/export and parent manual review. Focus Studio additionally supports timed stimulus protocols, coaching sessions, monthly reviews and household-wide parent coaching tools. Scheduled notifications and a full reusable question bank remain outside this release.

Earlier browser-local prototype records are not automatically imported. Portable exported definitions can be imported into a parent's account. Never publish answer keys to children; the API strips keys until the reveal policy permits them.

## Development

Requires Node 24+ (local SQLite adapter only). No third-party packages required. Schema migrations preserve household records; the local preview applies them separately from production.

- `npm test`: policy and API integration tests using real SQLite with a D1 adapter.
- `npm run build`: produces one ESM Worker with embedded assets.
- `npm run dev`: persistent local preview on port 4173; build first. Local preview supplies a fake Sites identity, isolated from production.
- `node scripts/seed-preview.mjs`: optional disposable local QA accounts. Never seeds production.

SQL schema migration and Drizzle journal live in `drizzle/`. Sites packages and applies these before Worker deployment. `.openai/hosting.json` retains the existing Site ID and declares D1 binding `DB`. Never run schema creation in request handlers.

Production retention policy: account deletion disables access and preserves submissions for the household's history. Permanent data erasure, backups and configurable retention remain future administrative work; avoid collecting unnecessary child information.

This Site represents exactly one household. Creator IDs on children, tests and assignments retain attribution only and do not restrict other parents. Deleting a parent removes only that parent’s access; shared children and records remain available to other parents. Child access remains scoped to their individual assignments and attempts. No schema migration is needed for this policy change.

## Focus Studio

Parents can generate seeded exact-match relaxed/timed pairs, assign each round, and compare completed rounds for the same child. Focus metadata and previously-seen content labels persist with attempts. Reports and JSON/CSV exports separate first attempts and retakes and flag compromised comparisons. See `docs/focus-roadmap.md` for the implemented milestone and remaining Part II requirements. The coaching suite now includes rapid stimulus protocols, fixed-duration sessions, a four-week planner, monthly reviews, observations and browser-based coaching. Browser timing and validity limitations are documented explicitly.

## Coach browser access

Admin creates a regular **Parent** account for the coach. The coach signs in using that username and password and changes the temporary password on first login. All parents share all household children, tests, assignments, coaching sessions, observations and reports. No separate coach role, coach credentials, external API or ChatGPT tool connection is supported.

See [the browser coach guide](docs/focus-coach-browser-guide.md). Legacy unpublished coaching definitions remain available to parents under **Test library → Saved drafts**. Migration 0003 removes stored coach grants and connections while preserving those drafts and all published tests, assignments, attempts and coaching records. Ordinary browser login sessions remain in place.
