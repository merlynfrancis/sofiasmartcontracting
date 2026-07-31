#!/usr/bin/env python3
"""Static server for the mirror, with HTTP Range support.

python3 -m http.server answers a Range request with a full 200 and never sends
Accept-Ranges. Browsers therefore cannot seek video: setting currentTime past
what has already been downloaded is silently ignored, so the experience can only
ever play its phase videos linearly — which is what made scrolling back through a
phase sit still for ~20s while the video caught up.
"""

import os
import re
import sys
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

RANGE_RE = re.compile(r"^bytes=(\d*)-(\d*)$")


class RangeHandler(SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def end_headers(self):
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-cache")
        SimpleHTTPRequestHandler.end_headers(self)

    def send_head(self):
        rng = self.headers.get("Range")
        if not rng:
            return SimpleHTTPRequestHandler.send_head(self)

        m = RANGE_RE.match(rng.strip())
        if not m:
            return SimpleHTTPRequestHandler.send_head(self)

        path = self.translate_path(self.path)
        if os.path.isdir(path) or not os.path.isfile(path):
            return SimpleHTTPRequestHandler.send_head(self)

        size = os.path.getsize(path)
        first, last = m.group(1), m.group(2)
        if first == "":                                  # suffix form: bytes=-N
            length = min(int(last or 0), size)
            start, end = size - length, size - 1
        else:
            start = int(first)
            end = int(last) if last else size - 1
            end = min(end, size - 1)

        if start > end or start >= size:
            self.send_response(416)
            self.send_header("Content-Range", "bytes */%d" % size)
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None

        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-type", self.guess_type(path))
        self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.send_header("Content-Length", str(end - start + 1))
        self.end_headers()
        return _Slice(f, end - start + 1)

    def log_message(self, fmt, *args):                   # keep the console quiet
        pass


class _Slice:
    """File wrapper that stops after `remaining` bytes, for copyfile()."""

    def __init__(self, f, remaining):
        self.f, self.remaining = f, remaining

    def read(self, n=-1):
        if self.remaining <= 0:
            return b""
        if n is None or n < 0 or n > self.remaining:
            n = self.remaining
        data = self.f.read(n)
        self.remaining -= len(data)
        return data

    def close(self):
        self.f.close()


if __name__ == "__main__":
    root = sys.argv[1]
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 8899
    os.chdir(root)
    # Threaded: HTTP/1.1 keep-alive plus a single thread deadlocks the page,
    # since the browser holds connections open for the videos while still
    # needing the rest of the assets.
    httpd = ThreadingHTTPServer(("", port), RangeHandler)
    httpd.daemon_threads = True
    print("→ http://localhost:%d  (Range-capable)" % port)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
