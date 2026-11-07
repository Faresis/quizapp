# Clearpath Family Quiz Studio

A generic, reusable quiz and focus-coaching platform hosted with ChatGPT Sites and Cloudflare D1. **GitHub is the source of reusable content; the database preserves learner activity.**

## Coach workflow

Coaches add tests, quizzes, exercises, sessions and courses as JSON files under `content/`, open a GitHub pull request, and have the reviewed changes merged. Validation and build checks run in GitHub Actions. Redeploy the Site from the merged source, and the new **Content catalog** becomes available. Coaches do not need a Clearpath account or token to author content.

See [the complete coach contribution guide](content/README.md), including copyable examples for manual quizzes, generated focus exercises, session templates and courses. The repository includes a mathematics example and focus starter material. A PR/merge does not automatically deploy ChatGPT Sites: publication uses the supported Sites workflow and must build the merged JSON into the server Worker.

Parents select content from the catalog and assign it to children, set a due/start date and timezone, schedule a reusable session or enroll children in a course. Children sign in normally and see their own assignments, sessions and course progress. Runtime authoring forms have been replaced by this workflow; the hosted Worker rejects runtime test and generator publication.

## Accounts and persistence

The fixed administrator username is `admin`. On first visit the private Site's signed-in owner chooses its password. Admin creates parent/child accounts. All parents share the household's children, tests, reports, assignments and coaching records. Children access only their own work. Temporary passwords must be changed before use. Deleting an account disables its access and preserves history.

ChatGPT Sites viewing access remains separate from Clearpath login. The Site audience is unchanged. New app accounts do not automatically change Site permissions.

Catalog assignments capture immutable test definitions and course/session snapshots in D1. Editing, removing or rolling back content changes the offered catalog after redeploy, and leaves assigned work, responses, scores and deadlines intact. Existing database-authored tests and saved drafts remain exportable under **Test archive**; existing assignments and reports continue to work. No learner identity, result or observation is stored in GitHub content files.

## Tests and coaching

Supported question types: single/multiple select, exact or explicitly normalized short text, extended responses and manual grading. The engine supports both presentation modes, navigation rules, whole-test/item/combined timing, retry policies and feedback controls. Due dates are reminders; timers start with attempts. Server timestamps and saved revisions preserve deadlines on resume.

Focus coaching includes matched exact comparisons, Go/No-Go, rule switching, vigilance, speed–accuracy, interruption/pressure/error recovery, fixed-duration sessions, observations and monthly JSON/CSV exports. Courses group scheduled tests and sessions, with separate child progress. Session rounds require starting their session; course steps otherwise have no forced sequential lockout. No notifications, certificates or automatic difficulty escalation are implemented. Browser timing is approximate and scores are not diagnoses.

References and choices share a bundled font. Character preview checks uppercase/lowercase/digits and mixed strings in actual layouts. Conservative generation excludes unverified confusables. Historical reports retain scores with display-quality caveats. See [display-quality policy](docs/character-legibility.md). The user waived the actual-iPad acceptance check; no device verification is claimed.

## Development

Requires Node 24+. No third-party packages or install step are required.

- `npm run content:validate`: validate all JSON content, definitions, generators and cross-references.
- `npm run build`: validate/compile the repository catalog and emit a server Worker with embedded UI and font.
- `npm test`: policy, API, persistence, catalog and historical compatibility tests.
- `npm run dev`: persistent local preview on port 4173; build first.
- `node scripts/seed-preview.mjs`: optional disposable local QA accounts; never seeds production.

Build before testing after content changes so the packaged Worker matches source JSON. GitHub Actions performs validation, build and tests on pull requests and main pushes. `.openai/hosting.json` preserves the existing Site ID and `DB` binding. Schema-only migrations and the Drizzle journal live in `drizzle/`; publication applies them before deploying the Worker. No schema creation occurs in request handlers.

Content snapshots and results persist across restarts. Answers not yet saved by the server cannot be recovered. Permanent erasure, database backup administration and configurable retention remain future work.
