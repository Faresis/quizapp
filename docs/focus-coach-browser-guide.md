# Clearpath coaching workflow

## Author content in GitHub

The coach no longer needs a Clearpath login to create material. Add JSON tests, quizzes, generated exercises, session templates or courses in `content/`, open a pull request and follow [the contribution guide](../content/README.md). After review and merge, redeploy the Site from the merged source. Opening or merging a PR alone does not publish the Site.

## Assign published content

A parent signs in normally and opens **Content catalog**. Choose a test/exercise, session or course, select one or more children, a due/start date and timezone, and submit. A course expands its day offsets into child-specific assignments and session dates. Each assignment keeps the selected version even if GitHub content changes later.

**Courses & practice** shows assigned content and progress. **Assignments** lists due dates and attempt reports. **Test archive** preserves earlier definitions, exports and saved drafts; exporting one allows the coach to wrap it in the repository format and submit a PR.

## Execute sessions and tests

Children sign in under their own accounts. **My tests**, **Coaching sessions** and **My courses** show their assigned work. Open and start a coaching session before its rounds; only the assigned child answers tests. Coached/monthly-review sessions are bounded to 25 minutes and independent sessions to 8 minutes. Refresh does not reset timers. Children may stop safely. Record a debrief and optional pressure ratings.

## Review and coach

Parents use **Reports** for attempt history and manual grading; **Focus Studio** for matched comparisons and focus-history exports; **Monthly review** for session summaries, ratings, observations, advisory guidance and JSON/CSV export. First attempts, retakes, degraded trials and display-quality caveats remain distinct. Compromised attempts can be voided with a reason while retaining evidence. Original scores and historical records are preserved across redeploys.

**Character preview** is available on the learner's device and reports bundled-font loading. The user waived actual-iPad acceptance; no device verification is claimed. Browser timing is approximate and practice scores are not a diagnosis.

Parents share the household's children and records. GitHub content contains reusable learning material only; user accounts, enrollment dates, attempts, scores and observations remain in the hosted database. No separate coach token or external coach API is used.
