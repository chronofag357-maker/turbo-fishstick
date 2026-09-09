# RU / EN — first implementation, 09 September 2026

Language switch: `docs/language.js`, styles: `docs/language.css`.
Preference: localStorage `p2p-language`, default Russian. No auth bypass,
no additional provider calls. Changes presentation only, not payloads or bets.
New rendered text is translated using an idempotent observer. Original text
is kept per DOM node for switching back; original fighter names come from
`originalFighters`. Input values, scripts, SVG and user-editable content are excluded.

Current coverage: main navigation, combat/esports markets and common panels.
Editorial MMA/boxing dictionaries are covered by a full Cyrillic-residue test,
including vacant women's titles, city names and fighter pairs in event titles.
Translation runs in a single longest-match pass so individual fighter names
cannot break a longer title translation. Silva/Wang Cong is also tested in
rendered collapsed/expanded cards at 320 and 390 pixels.
This is NOT complete application localisation. Unmatched text stays in its
original language instead of inventing translations. Long help/admin messages,
standalone broadcasts and trainer pages, dynamic provider descriptions and
proper names without originals still need explicit dictionaries and testing.
Do not market this as a fully translated English application yet.

Next: migrate text generation to explicit translation keys per feature,
translate full help/error/scenario copy, retain semantic IDs, audit all dialogs
and standalone screens in both languages. Avoid extracting business state from
translated DOM text. Tests: `test_language.cjs` (including feed updates/reload),
`test_compact_header.cjs`, `test_esports_ui.cjs`.
