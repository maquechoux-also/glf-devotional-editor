---
description: Commit the current work, open a pull request and deploy it to the live editor (GitHub Pages), with a confirmation before the merge
---

Deploy the editor. Merging a pull request into `main` publishes it to staff at
https://maquechoux-also.github.io/glf-devotional-editor/ within a minute or two.

1. If you are on `main`, create a branch for the work first (`<tab>/<short-name>`). Never commit to `main`.
2. `git fetch origin` then `git merge origin/main`. Adam (`quibitai`) also works here. If the merge conflicts, stop and tell me.
3. Run `node build-preview.js`. If it fails, stop and fix that first.
4. Show `git status --short` and a short summary of the diff, grouped by tab (Devotional, Weekly News, Letter, Bulletin).
5. Commit with a message in this repo's style: `<Tab>: <what changed>`. Use one commit per tab if the changes are unrelated. Include the regenerated `preview-*.html` files in the same commit as the template change.
6. Push the branch and open a pull request with `gh pr create`. The description says what changed, by tab. This deploys nothing.
7. Check the PR is mergeable and list any other open PRs (`gh pr list`) that touch the same files.
8. **Stop and ask me before merging.** Say what will go live, in one or two lines.
9. After I say yes: `gh pr merge --merge --delete-branch`, then `git checkout main && git pull`.
10. Verify the deploy. Poll with a cache-buster until the live page matches the merged `index.html`, at most about 3 minutes:
   `curl -s "https://maquechoux-also.github.io/glf-devotional-editor/index.html?cb=$(date +%s)" | shasum -a 256` compared with `shasum -a 256 index.html`.
   Report whether it's live or still pending. Don't loop forever.

$ARGUMENTS
