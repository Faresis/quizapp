# Content contributions

Follow `content/README.md`. Edit reusable JSON content here; use stable IDs and increase revisions for published edits. Do not include learner identities, account data, schedules for named children, credentials, attempts, scores or observations. New content should use complete definitions or the named built-in generators, not executable code.

Before submitting a PR, run `npm run content:validate`, `npm run build`, and `npm test` from the repository root with Node 24+. Test/session/course references must resolve. A merged content PR must be redeployed through ChatGPT Sites before it appears live. Do not claim that opening or merging a PR alone publishes it.
