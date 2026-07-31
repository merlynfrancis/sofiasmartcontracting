#!/bin/bash
# Serve the mirror. Must be served over HTTP (file:// breaks fetch of content.json).
#
# Uses _tools/serve.py rather than `python3 -m http.server`: the stdlib server
# ignores Range requests and never sends Accept-Ranges, so the browser cannot
# seek the phase videos. That forces the experience to play them linearly, which
# is what made scrolling backwards sit still for ~20s at a time.
cd "$(dirname "$0")" && exec python3 _tools/serve.py site 8899
