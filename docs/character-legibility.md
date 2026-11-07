# Exact-match display quality (issue #1)

References and answer strings use the bundled, unmodified **JetBrains Mono Regular v2.304**, 24px, weight 400, letter spacing 0.08em, line height 1.5. Ligatures, contextual alternates, font synthesis and kerning are disabled. The same rendering helpers and CSS serve existing and new question activities, timed reference/choice streams, and Character preview. Long strings scroll without shrinking their type size.

Font source: https://github.com/JetBrains/JetBrainsMono/tree/v2.304
License: `web/fonts/OFL.txt` (SIL OFL 1.1).
WOFF2 SHA-256: `a9cb1cd82332b23a47e3a1239d25d13c86d16c4220695e34b243effa999f45f2`.
The font is served from the same Site, with no external font request. An explicit FontFace load and availability check must succeed before the browser starts or resumes an exact-match activity. Font failure blocks a new attempt; an already started timer cannot be extended by a font failure or refresh. The preview reports font-load success separately from human legibility verification.

## Conservative generation policy

Until actual-iPad acceptance is recorded, new generators use `ACEFHJKNPQRTUVXY3479`, with default groups `AC EF HJ KN PQ RT UV XY 3479`. All lowercase letters and the unverified characters `I l 1 O 0 o S 5 s B 8 b G 6 g Z 2 z` are excluded; multi-character lowercase confusions `rn/m`, `cl/d`, `vv/w` cannot be generated. Unsafe custom groups return a validation error. No UI toggle re-enables them. This is a conservative exclusion, not a claim that every remaining pair has been scientifically validated.

New stimulus protocols store `alphabet_policy: clear-v2`. Existing protocols without that marker retain their legacy deterministic generator so recorded or in-progress trial stimuli, answer keys and scores do not change. A new four-week plan made from old templates uses the conservative policy. Imported/historical definitions may still contain excluded characters; they render with the new font, without changing their content or scores.

## Historical results

The updated browser sends rendering profile `match-v2` after loading the font; the server records it only when supplied. An older tab that stays open across publication cannot silently acquire the new profile. This is browser-reported rendering metadata, not independent hardware or legibility verification. Earlier/unrecorded exact-match attempts show an explicit caveat that I/l legibility was reported on iPad and the attempt's display was not verified. This does not assert the same device or defect for every historical attempt. The original baseline falls within this caution; an affected error is not established evidence of an attention lapse. Original answers, test versions and stored scores remain untouched. Caveats appear in reports, history, monthly review and JSON/CSV exports. Flagged histories are excluded from advisory adaptation and clean matched comparisons. Comparisons across differing profiles are also marked ineligible.

## Actual-device acceptance (waived by user)

Open **Character preview** on the learner's actual iPad in Safari at normal zoom. Confirm the bundled-font success status, then inspect `I/l/1`, `O/0/o`, `S/5/s`, `B/8/b`, `G/6/g`, `Z/2/z`, `rn/m`, `cl/d` and `vv/w` in references and choices, plus uppercase/lowercase/digit/mixed-case samples. The preview includes both the question and timed activity layouts and creates no attempt or score.

The user waived this acceptance check and issue #1 was closed. Desktop browser QA verified implementation and loading only; no actual-iPad legibility verification is claimed. Conservative character exclusions remain enabled.
