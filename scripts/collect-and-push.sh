#!/bin/bash
cd /Users/sojungkim/Desktop/project/apt-tracker

export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

echo "[$(date)] Starting collect..."
npm run collect

# 변경 있으면 commit & push
if ! git diff --quiet data/listings.json; then
  git add data/listings.json
  git commit -m "chore: update listings data $(date +%Y-%m-%d)"
  git push
  echo "[$(date)] Pushed."
else
  echo "[$(date)] No changes."
fi
