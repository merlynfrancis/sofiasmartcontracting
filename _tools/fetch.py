#!/usr/bin/env python3
"""Mirror all CDN assets for the build-your-data-center page."""
import os, sys, urllib.request, concurrent.futures as cf

CDN = "https://nrgcdn.b-cdn.net"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/126.0 Safari/537.36")
ROOT = os.path.dirname(os.path.abspath(__file__))

def fetch(path):
    url = CDN + urllib.parse.quote(path, safe="/._-()'")
    out = os.path.join(ROOT, "site" + path)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    if os.path.exists(out) and os.path.getsize(out) > 100:
        return ("skip", path, os.path.getsize(out))
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=90) as r:
            data = r.read()
        if len(data) < 100:
            return ("tiny", path, len(data))
        with open(out, "wb") as f:
            f.write(data)
        return ("ok", path, len(data))
    except Exception as e:
        return ("FAIL", path, str(e)[:80])

paths = [l.strip() for l in open(os.path.join(ROOT, "urls.txt")) if l.strip()]
import urllib.parse
results = []
with cf.ThreadPoolExecutor(max_workers=8) as ex:
    for res in ex.map(fetch, paths):
        results.append(res)
        if res[0] not in ("ok", "skip"):
            print(res[0], res[1], res[2])

ok = sum(1 for r in results if r[0] == "ok")
skip = sum(1 for r in results if r[0] == "skip")
bad = [r for r in results if r[0] not in ("ok", "skip")]
total = sum(r[2] for r in results if isinstance(r[2], int))
print(f"\nok={ok} skip={skip} failed={len(bad)} bytes={total/1e6:.1f}MB")
for r in bad:
    print("  BAD:", r[1], r[2])
