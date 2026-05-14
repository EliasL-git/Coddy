#!/bin/bash
# Auto-screenshot script for Coddy build monitoring

REPO_DIR="$HOME/Coddy"
OUTPUT_DIR="$REPO_DIR/screenshots"
mkdir -p "$OUTPUT_DIR"

# Timestamp
TS=$(date +%Y%m%d_%H%M%S)

# 1. Capture OpenCode terminal log
echo "[$TS] Capturing OpenCode log..."
# We'll read the log via process tool, but this script will be triggered by cron
# For now, just create a placeholder
echo "OpenCode log snapshot at $TS" > "$OUTPUT_DIR/terminal-$TS.txt"

# 2. Capture website screenshot if dev server is running
echo "[$TS] Checking dev server..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5173 | grep -q "200\|301"; then
    echo "[$TS] Dev server running, taking screenshot..."
    npx playwright screenshot --viewport-size=1280,720 --wait-for-timeout=3000 http://localhost:5173 "$OUTPUT_DIR/website-$TS.png" 2>/dev/null || \
    npx playwright screenshot --viewport-size=1280,720 http://localhost:5173 "$OUTPUT_DIR/website-$TS.png"
    echo "[$TS] Screenshot saved: $OUTPUT_DIR/website-$TS.png"
else
    echo "[$TS] Dev server not running yet, skipping website screenshot"
fi

echo "[$TS] Done"
