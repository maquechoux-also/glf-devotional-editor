---
description: Commit the current work and deploy it to the live editor (GitHub Pages), with a confirmation before the push
---

Deploy the editor. Pushing to `main` publishes it to staff at
https://maquechoux-also.github.io/glf-devotional-editor/ within a minute or two.

1. `git pull --rebase origin main` first. Adam (`quibitai`) also pushes here. If the rebase conflicts, stop and tell me.
2. Run `node build-preview.js`. If it fails, stop and fix that first.
3. Show `git status --short` and a short summary of the diff, grouped by tab (Devotional, Weekly News, Letter, Bulletin).
4. Commit with a message in this repo's style: `<Tab>: <what changed>`. Use one commit per tab if the changes are unrelated. Include the regenerated `preview-*.html` files in the same commit as the template change.
5. **Stop and ask me before pushing.** Say what will go live, in one or two lines.
6. After I say yes: `git push origin main`.
7. Verify the deploy. Poll with a cache-buster until the live page matches the pushed `index.html`, at most about 3 minutes:
   `curl -s "https://maquechoux-also.github.io/glf-devotional-editor/index.html?cb=$(date +%s)" | shasum -a 256` compared with `shasum -a 256 index.html`.
   Report whether it's live or still pending. Don't loop forever.

$ARGUMENTS
