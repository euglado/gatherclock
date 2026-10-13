#!/bin/sh
set -eu
cd "$(dirname "$0")"
command -v node >/dev/null || { echo 'Install Node.js 24 LTS: https://nodejs.org/'; exit 1; }
npm ci
npm run build
npm run setup
echo 'Install the bot using the printed link, then run: npm run register'
