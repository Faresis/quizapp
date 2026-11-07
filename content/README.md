# Coach content workflow

Coaches author content in **Faresis/quizapp**, through GitHub changes and pull requests. They do not need a Clearpath account, coach token, or access to the live Site to submit content.

1. Create a branch and add or edit JSON files under `content/`.
2. Run `npm run content:validate`, `npm run build`, then `npm test` with Node 24+. There are no dependencies to install.
3. Open a pull request. The **Validate app and content** GitHub check runs these same checks. Review the actual questions, answer keys, instructions and timing as well as the check result.
4. Merge the approved pull request to `main`.
5. Redeploy the ChatGPT Site from the merged `main` source using the Sites workflow. For this project, ask Codex: **“Pull the latest Faresis/quizapp main and redeploy Clearpath with ChatGPT Sites.”** The deployment must include the new build, not an old committed `dist/` bundle.
6. After successful deployment, parents open **Content catalog**. They can assign an individual test, schedule a session, or enroll children in a course. Children see their assignments, sessions and **My courses** progress after signing in normally.

A pull request alone does not publish anything. The GitHub check validates and builds; it does not deploy Sites or hold a Site credential. The current hosting source repository and the GitHub repository are distinct, so publication synchronizes the reviewed source through the supported Sites workflow. A coach can contribute entirely through GitHub; the normal publisher handles redeployment. No learner account or coach login is needed for the authoring step.

## File organization

- `tests/*.json`: individual tests, quizzes and generated exercises.
- `sessions/*.json`: reusable sessions containing two or three tests with one focus skill or one generic domain.
- `courses/*.json`: ordered test/session steps with day offsets relative to an enrollment start date.

Subfolders are supported. Each `.json` file anywhere under `content/` must contain exactly one content object. Documentation and schemas belong in Markdown or `docs/`, rather than additional JSON manifests inside `content/`.

Use unique, stable IDs across the entire catalog, such as `reading-comprehension-01`. Do not rename an ID just to edit a title. Increase `revision` when changing published material. Content is also fingerprinted automatically, so reusing a revision number cannot overwrite an assigned snapshot. Referenced tests changing also change their session and course fingerprints.

## Tests and quizzes

Copy `tests/arithmetic-starter.json` for a complete manual-question example. Required outer fields:

```json
{
  "id": "my-new-quiz",
  "kind": "quiz",
  "title": "My new quiz",
  "description": "What the learner will practice.",
  "revision": 1,
  "definition": {
    "title": "My new quiz",
    "domain": "language",
    "intent": "training",
    "instructions": "Read carefully and choose the best answer.",
    "presentation": {"mode": "one_at_a_time", "navigation": "free"},
    "timing": {"test_duration_ms": null, "question_duration_ms": null, "pause_policy": "not_allowed"},
    "retry_policy": {"retries_allowed": true, "max_attempts": 2, "cooldown_seconds": 0, "report_score": "all"},
    "feedback": {"reveal": "after_attempt"},
    "questions": [
      {"id": "q1", "type": "single_select", "points": 1, "prompt": "Which word names an animal?", "options": [{"id": "a", "text": "Cat"}, {"id": "b", "text": "Table"}], "answer_key": ["a"]}
    ]
  }
}
```

`kind` can be `test`, `quiz` or `exercise`; all use the same generic runner. The outer title is the displayed definition title. Domains are reusable labels, not a fixed focus-only list. Existing presentation, navigation, timing, retry, feedback, exact-answer, normalization and manual-review rules are validated using the same engine. See `docs/test-schema.json` for definition fields. Extended responses require a manual rubric; answer keys are authored in GitHub and stripped from child API payloads according to feedback policy.

## Generated focus exercises

Instead of `definition`, supply a named built-in `generator`:

```json
{
  "id": "match-practice-relaxed",
  "kind": "exercise",
  "title": "Match practice · relaxed",
  "description": "Fresh exact-match references at a comfortable pace.",
  "revision": 1,
  "generator": {
    "type": "focus_pair",
    "round": "relaxed",
    "config": {"seed": "match-practice-set-02", "trial_count": 8, "sequence_length": 6, "seconds_per_item": 12}
  }
}
```

Create a second file with another ID, `round: "timed"`, and the **same seed and settings** to produce a matched pair with distinct references. A changed seed makes fresh content; new IDs/revisions provide separate retained sets. Repeated assignment of an unchanged exercise intentionally reuses its references and is marked as previously seen where applicable. Freshness is authored in GitHub, not generated again when an assignment is opened.

For stimulus activities use `generator.type: "activity"` and a `config` like the one in `tests/focus-inhibition.json`. Supported modes are `go_no_go`, `rule_switching`, `sustained_vigilance`, `speed_accuracy`, `interruption_recovery`, `pressure_ladder`, and `error_recovery`. Set `intent` in config to `training` or `assessment`. Assessment suppresses training strategy/reset cues. Protocol bounds and the conservative character policy are checked during build. No arbitrary code or custom generator script is executed from content JSON.

## Session templates

Copy `sessions/focus-starter-session.json`:

```json
{
  "id": "match-coaching-02",
  "kind": "session",
  "title": "Match coaching",
  "description": "One primary skill with a relaxed and timed round.",
  "revision": 1,
  "session_kind": "coached",
  "collect_ratings": true,
  "instructions": "Agree a comfortable strategy, practice, then debrief.",
  "rounds": ["match-practice-relaxed", "match-practice-timed"]
}
```

Rounds must reference 2–3 distinct test/exercise IDs. Focus sessions share one declared focus skill; generic sessions share one domain, such as mathematics or language. Do not mix generic and focus rounds in one session. Generic sessions remain available under Coaching sessions and course progress, and are excluded from the focus-only monthly summary. `coached` and `monthly_review` sessions keep the existing fixed 25-minute maximum and agenda; `independent` sessions keep the 8-minute maximum. Dates and children are chosen by a parent when scheduling. Session-bound tests start only after their session starts and remain under that child's account. Refresh and redeploy do not reset deadlines.

## Courses

Copy `courses/focus-first-week.json`:

```json
{
  "id": "my-focus-course",
  "kind": "course",
  "title": "My focus course",
  "description": "A reusable schedule with coaching and independent practice.",
  "revision": 1,
  "steps": [
    {"type": "session", "ref": "match-coaching-02", "day_offset": 0},
    {"type": "test", "ref": "arithmetic-starter", "day_offset": 2}
  ]
}
```

A course has 1–40 steps ordered by `day_offset` (0–3650). Offsets are calendar days from the chosen start date, stored with the parent's timezone. Day 0 is displayed as Day 1. A test step can reference any test, quiz or exercise; a session step references a session template. Courses do not nest. Steps are available without forced sequential lockout; session-start rules still apply. Due dates are reminders rather than lockouts. Courses do not send reminders or award certificates.

For a multi-week focus plan, list the desired session/test steps and offsets explicitly, with fresh seeded exercise IDs for separate diagnostic sets. A maximum of 80 total rounds can be assigned per request across all selected children; split large enrollments into smaller requests.

## Persistence, editing and retirement

The catalog is read from repository JSON, validated and compiled into the server build. It appears immediately after a successful redeployment; there is no GitHub fetch, token, or synchronization task running in the browser. Parent content-authoring forms are replaced by catalog selection; runtime test/generator authoring requests are rejected by the hosted Worker.

Assigning content saves immutable test definitions, assignments, session configuration and course enrollment snapshots in the hosted database. Each child retains their own history. Retries of the same assignment request do not duplicate enrollment. Older work keeps its content even if a later pull request edits or removes the original files. Reverting a content commit and redeploying changes the currently offered catalog, not existing scores or deadlines.

Existing database-authored tests, saved drafts and old assignments are retained under **Test archive** and normal reports. To move an earlier definition into the catalog, export its JSON from the archive, wrap it in the manual format above and commit it. Do not export attempts or reports as content.

Keep the repository free of learner names, account IDs, credentials, assignments, scores, observations and results. Those remain in the database. Content files may include answer keys; repository access is separate from the child runner's feedback protections. Only the build's server portion contains the full catalog; child catalog metadata and static app assets do not include answer keys.
