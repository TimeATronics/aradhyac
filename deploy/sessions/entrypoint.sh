#!/bin/sh
set -e
# The named volume may be created with root ownership depending on Docker version.
# Fix it up, then drop privileges to the node user before running the server.
DIR="/home/node/.config/aradhyac"
mkdir -p "$DIR"
chown -R node:node "$DIR"
exec su node -c "SESSIONS_FILE='$SESSIONS_FILE' PORT='$PORT' node /app/server.mjs"
