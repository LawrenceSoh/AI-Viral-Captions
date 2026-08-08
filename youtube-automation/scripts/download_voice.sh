#!/usr/bin/env bash
# Download the default offline piper voice (Ryan, US English, professional).
# Voice models are large (~120MB) so they are NOT committed to git.
set -euo pipefail
DIR="$(cd "$(dirname "$0")/.." && pwd)/assets/voices"
mkdir -p "$DIR"
cd "$DIR"
if ls *.onnx >/dev/null 2>&1; then
  echo "Voice already present: $(ls *.onnx)"; exit 0
fi
URL="https://github.com/rhasspy/piper/releases/download/v0.0.2/voice-en-us-ryan-high.tar.gz"
echo "Downloading Ryan voice…"
curl -sL -o ryan.tar.gz "$URL"
tar xzf ryan.tar.gz && rm ryan.tar.gz
echo "Done: $(ls *.onnx)"
