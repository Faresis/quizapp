# Focus coaching release coverage

## Exercise modules (Part II §6–8)

- FCS-01: seeded exact discrimination with configurable alphabet, length, distractor distance, primary skill, relaxed/timed pairs, exact answers and fresh references.
- FCS-02: Go/No-Go streams with target frequency, exposure, response window, interval and trial count; hits, misses, false alarms and correct rejections.
- FCS-03: declarative rule mappings, switch intervals, explicit rule acknowledgement, post-switch errors, perseverations and valid-response switch cost.
- FCS-04: rare-target vigilance configuration, segment omission/accuracy/latency and response-time variability. Quiet distractions are optional and not enabled.
- FCS-05: novel exact-match references across three response windows, per-window accuracy/latency and comfortable-minus-timed percentage-point gaps. Parent selects timing. Order is fixed within this protocol and order/practice effects are explicitly disclosed; use new seeds and alternate order manually for separate matched pairs.
- FCS-06: planned interruptions with a location/resumption prompt, resumption time and non-punitive location-error telemetry.
- FCS-07: novel exact-match pressure ladder with three bounded windows, child opt-out, optional session pre/post pressure ratings and condition gaps. There are no child leaderboards or forced audience/competition conditions.
- FCS-08: training-only reset cues following configured errors and subsequent-trial recovery records. Assessment mode suppresses strategy/reset cues.
- FCS-09: parent-recorded real-world context, strategy, independent/prompted application and observation notes.

## Sessions and planning

Parents schedule two or three immutable rounds for one child with one declared primary skill. Coached sessions and monthly reviews last at most 25 minutes (2-minute objective, 4-minute technique, 15-minute exercises, 4-minute debrief). Independent sessions last at most 8 minutes (1/6/1 agenda). Start/end times are server-owned and cannot be reset by refresh or a repeated start. Child and parent can complete early; unfinished attempts are retained as interrupted. Session-bound rounds cannot start before the session or after its end.

The four-week planner schedules two coached and three independent sessions per week, replacing the second coached session in week four with a monthly review. It generates new seeded variants rather than blindly reusing diagnostic items. A retained request ID makes retries safe. Planning generated sessions does not send reminders or notifications.

## Measurement and reports

First attempts, retakes, generic omissions, timing quality, focus labels and version history remain separate. Per-trial records preserve estimated onset offset, measured exposure, input type, client latency, server receipt, actual outcome and degraded status. Browser calibration samples animation-frame intervals; it does not calibrate hardware input/display latency. Hidden tabs, large onset/exposure deviations and poor/missing calibration invalidate trials for rate metrics. Refreshed trials never receive new deadlines or replayed exposure.

Parents can void a compromised attempt with a reason while retaining evidence. Its retry allowance is restored; scheduling a fresh assignment/session preserves the original history. Children can stop without silently erasing the attempt.

Monthly reviews show scheduled/completed/elapsed sessions, per-child first-attempt histories, optional attributed pressure ratings, transfer observations and JSON/CSV exports. Degraded trials are excluded from inhibition and latency rates. UTC is used for monthly attempt/observation buckets and is stated in the UI; scheduled session dates retain the chosen household date/timezone. Raw planned-item points and valid-trial rates have different denominators. Records with invalid trials have provisional scores.

Difficulty advice requires at least three matching first attempts for one child, skill, difficulty, modality and assistance condition. It is advisory: parents must approve any adjustment, no automatic pressure escalation or deadline shortening occurs, and the suggested sequence-length ceiling is 20.

## Coach/agent integration (§9)

Parents issue credentials with calendar-month expiration (12 months by default, with longer periods supported) with selected scopes and child IDs, and can revoke them immediately. Default scope is authoring only; publish, assignment and result access require explicit adult selection. Drafts, validation, immutable publication, authorized assignments and reports are supported by the `/v1` API. Credentials are stored as hashes, never embedded in student payloads; requests are rate-limited and relevant actions audited. Coach authentication is through this scoped API, while the interactive parent UI remains household-wide. Private Sites access is a separate outer requirement for external callers.

Portable JSON Schema and OpenAPI contracts are in `docs/test-schema.json` and `docs/openapi.json`. Imported definitions cannot execute code. The parent JSON import workflow remains available without an external coach credential.

## Limits of the implementation

This is a browser coaching instrument, not validated psychometric testing or tamper-proof proctoring. Display/input hardware, network conditions, fixed protocol order and practice effects limit interpretation. Client-reported measurements can be manipulated; server deadlines protect acceptance but do not establish scientific latency. Drill accuracy alone does not establish broad attention improvement or a diagnosis. Physical keyboard and touchscreen latency must be assessed on the actual devices used.

All changes are additive. Existing accounts, test versions, assignments and attempts are preserved. Older attempts without novelty/timing fields are labelled unknown rather than retrospectively inventing measurements.
