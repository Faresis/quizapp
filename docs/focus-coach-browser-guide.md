# Clearpath focus coach browser guide

## Sign in

1. Admin opens **Manage accounts**, enters your name, username and temporary password, and chooses **Parent**.
2. Open https://clearpath-quiz-studio.faresis.chatgpt.site/ in the browser using permitted Site access, then sign in with your Clearpath username and password.
3. Change the temporary password when prompted. A coach is a normal parent account. All parents share the household's children, tests, reports and coaching records.

## Prepare and assign practice

- **Children** lists shared child accounts and lets parents create children.
- **Create a test** supports manual questions and validated portable JSON import. **Test library** provides existing versions, export and retained unpublished saved drafts. Publishing a new version preserves existing assignments and reports.
- **Focus Studio** creates fresh relaxed/timed exact-match pairs and stimulus activities. Choose one primary skill, a fresh seed and comfortable timing. Training can include strategy cues; assessment suppresses cues.
- **Assignments** assigns a published version to one or more children with a due date and timezone. Dates are reminders; attempts have their own timers. Existing assignments, completion states and reports appear here.

## Run sessions

1. In **Coaching sessions**, select the child, scheduled date, session type and two or three focus rounds with the same skill.
2. Schedule one session or use **Create 4-week plan with fresh rounds**. The plan creates two coached and three independent sessions weekly, with a monthly review in week four. It does not send notifications.
3. The child logs in under their own account, opens **Coaching sessions**, starts the session and executes its rounds. A parent can start or finish a session, but only the assigned child answers its tests.
4. Coached/review sessions have a fixed 25-minute maximum; independent sessions have an 8-minute maximum. Refreshing does not restart timers. Record a debrief and optional pressure ratings. Children can stop safely.

## Review and coach

- **Reports** and **Assignments → View report** show attempt history and manual grading. Review first attempts separately from retakes.
- **Focus Studio** compares matched relaxed/timed rounds for the same child and exports history. Timing degradation, repeated items and compromised comparisons are flagged.
- **Monthly review** summarizes sessions, first attempts, ratings and observations, with JSON/CSV export. Add real-world context, strategy and whether it was applied independently. Monthly attempt/observation buckets use UTC.
- Parents can mark compromised attempts void with a reason while retaining evidence. Difficulty suggestions require sufficient comparable first attempts and need adult judgment.

Tests, versions, assignments, attempts, sessions and observations persist in the hosted database and survive browser or server restarts. Unsaved answers cannot be recovered. Browser timing is approximate; practice results are not a diagnosis.

To remove a coach's access, admin deletes their parent account. Historical records remain. Site viewing permission is managed separately from Clearpath accounts.
