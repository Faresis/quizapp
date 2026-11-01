# Focus coaching implementation

## Implemented first milestone

FCS-01 seeded exact discrimination generator: configurable seed, item count, sequence length and confusable alphabet; exact one-character distractors. Generates separate relaxed/timed immutable tests with distinct references. Parent chooses timing and explicitly assigns each round. Default one attempt and parent-only feedback.

MET-01/02/03/04/05 foundations: first-attempt/retake labels; separate omission categories; approximate server-observed latency and quality; per-child relaxed-minus-timed accuracy gap in percentage points with denominators; primary skill, condition, round, difficulty, assistance and version labels. Parent Focus Studio provides summaries and JSON/CSV exports without child names. Novelty is calculated at attempt start from previously activated question content for the same child, across assignments and versions. Reusing a seed repeats content and is flagged when previously seen.

Metadata matching is not psychometric equating. Generated variants share alphabet, length, item count and distractor distance, but human difficulty equivalence is not guaranteed. Round order is manually controlled; practice and order effects remain possible. Degraded timing, unseen items, retakes, repeated items and metadata mismatches warn rather than being treated as matched first-attempt evidence.

Older attempts did not capture a novelty snapshot; historical focus summaries label novelty unknown. Existing accounts, tests, assignments and attempts are unchanged. No schema changes in this milestone.

## Remaining Part II work

- FCS-02/03/04: precisely controlled Go/No-Go, switching and vigilance stimulus runtime, calibration, touch/keyboard distinction and invalid/degraded trial handling.
- FCS-05/06/07/08: full multi-limit speed/accuracy protocol, interruption/resumption, pressure ladder with opt-out and self-ratings, and error recovery cues and sequences.
- Sessions: single-skill bundles, fixed agenda/end-time, 25-minute coached / 8-minute independent sessions and recurring monthly review workflow.
- Reports: inhibition/switch cost/vigilance/resumption metrics, monthly scheduled-vs-completed trends, real-world transfer notes, and richer optional self-ratings.
- Adult-authorized void/reschedule workflow for compromised trials.
- Separately scoped coach accounts and external-agent tokens/API contracts.
- Bounded adaptive difficulty; no automatic escalation of time pressure.

The capability API explicitly lists only near_match as available. Unsupported exercise mechanics are rejected during publication. No claim is made that all Part II requirements are implemented.
