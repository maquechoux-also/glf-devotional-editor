# GLF Email Editor

A single page that builds Grace Life Fellowship's emails (Devotional, Weekly News,
Letter) and the print Bulletin. Mandy fills in fields, clicks Copy HTML and pastes the
result into Elexio's code view. No dependencies and no build step.

## Deploy
- GitHub Pages serves `main` from the repo root: https://maquechoux-also.github.io/glf-devotional-editor/
- **A merge to main is a live deploy. Ask before every merge.** Use `/ship`.
- Never commit or push to `main`. Pull, work on a branch, and land it by pull request. The description says what changed, by tab.
- Adam (`quibitai`) also works here. Before merging, check the PR page for conflicts and for other open PRs touching the same files; resolve conflicts on the branch, never by overwriting.
- Pushing a branch and opening a PR needs no ask and deploys nothing. Branches are public, like everything else in this repo.
- The repo is public on purpose (free Pages; Mandy is the only user). Don't make it private.
- Everything committed is publicly served. Keep drafts and docs out of the repo.
- This folder is `Grace-Life/email-editor` on the local disk (moved off iCloud on 11/11/2026), with a normal `.git` inside.

## Where things live
- `index.html`: the page, its CSS and all the editor behaviour. Four tabs: `#devotional` (default), `#weekly`, `#letter`, `#bulletin`. 2,000+ lines: grep for what you need, don't read it whole.
- `templates.js`: the email templates and their helpers (`renderDevotionalEmail`, `renderWeeklyEmail`, `renderLetterEmail`), plus the themes and the seed events and announcements. It's pure, with no DOM access. Both the editor and `build-preview.js` load it. To add a field, add its id to the matching `*_FIELDS` list.
- `build-preview.js`: writes `preview-*.html` from the editor defaults. A hook runs it after every edit to `index.html` or `templates.js`. Commit the previews together with the change.
- `bulletin-fonts.js`: base64 of `assets/fonts/*.otf`, used for the print PDF only. Never read it.
- `preview.html`: a legacy redirect. The URL has been shared, so keep it.

## Check
- Preview server: launch config `glf-editor` (port 8777).
- There are no tests. After a template change, look at the email in the browser at 375px and desktop width, and check the console for errors.

## Email HTML rules
- Sent HTML is tables and inline styles. No flexbox, no absolute positioning, no SVG.
- **Don't re-indent `templates.js`.** Whitespace inside the template literals is part of the sent email.
- Elexio decodes quoted-printable, so any `=` followed by two hex digits gets eaten. Keep the spaced `width = device-width` viewport tag, and never emit `=XX`.
- iOS auto-links times and dates and zooms out on long unbreakable words. `protectTimes()` and the fluid-hybrid width handle this; don't remove them.
- Images are the `glf-email-*` assets on the Webflow CDN. Sent emails reference them forever: never rename or delete them.

## Conventions
- Commit messages: `<Tab>: <what changed>`, e.g. `Letter: widen the coral rule`.
