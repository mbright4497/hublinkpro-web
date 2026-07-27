#!/bin/bash
# HubLinkPro — one-click GitHub sync
# Duke writes the COMMIT_MSG line before each run. Matt double-clicks. That's it.

COMMIT_MSG="Add phone + hours to the HubLinkPro house Channel"

cd "$(dirname "$0")" || exit 1
echo "=============================================="
echo " HubLinkPro -> GitHub sync"
echo " repo: $(pwd)"
echo "=============================================="
echo

# Clear a stale index lock if one is hanging around
[ -f .git/index.lock ] && mv .git/index.lock "/tmp/index.lock.$(date +%s)" 2>/dev/null

git add -A || { echo "!! git add failed"; read -n 1 -s -r -p "Press any key to close..."; exit 1; }

if git diff --cached --quiet; then
  echo "No file changes — making an empty commit so Vercel still gets a deploy trigger."
  git commit --allow-empty -m "$COMMIT_MSG" || { echo "!! empty commit failed"; read -n 1 -s -r -p "Press any key to close..."; exit 1; }
  echo "-> committed (empty): $COMMIT_MSG"
else
  git commit -m "$COMMIT_MSG" || { echo "!! commit failed"; read -n 1 -s -r -p "Press any key to close..."; exit 1; }
  echo "-> committed: $COMMIT_MSG"
fi

echo
echo "-> pushing to origin/main ..."
if git push origin main; then
  echo
  echo "=============================================="
  echo " SUCCESS — main is now at $(git rev-parse --short HEAD)"
  echo "=============================================="
else
  echo
  echo "!! PUSH FAILED — usually means git has no saved credentials."
  echo "   Open GitHub Desktop once and push; it stores the credential,"
  echo "   then this script works every time after."
fi

echo
read -n 1 -s -r -p "Press any key to close this window..."
