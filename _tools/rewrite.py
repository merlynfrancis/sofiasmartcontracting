#!/usr/bin/env python3
"""Rewrite absolute CDN/vendor URLs to local relative paths."""
import re, os, shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
S = lambda *p: os.path.join(ROOT, "site", *p)

# ---- index.html -------------------------------------------------------
html = open(os.path.join(ROOT, "raw.html"), encoding="utf-8").read()

# CDN -> root-relative (handles https://, //, and the stray double-slash form)
html = re.sub(r'(?:https?:)?//nrgcdn\.b-cdn\.net/+', '/', html)

# third-party libs -> vendored copies
html = html.replace("https://unpkg.com/lenis@1.1.14/dist/lenis.min.js", "/vendor/lenis.min.js")
html = html.replace("https://unpkg.com/@lottiefiles/lottie-player@latest/dist/lottie-player.js",
                    "/vendor/lottie-player.js")
html = html.replace("https://cdn.jsdelivr.net/npm/scrolly-video@latest/dist/scrolly-video.js",
                    "/vendor/scrolly-video.js")

# neutralize third-party trackers (they beacon offsite and cannot work offline)
html = re.sub(r'<script[^>]*assets\.adobedtm\.com[^>]*>\s*</script>',
              '<!-- adobe launch analytics removed (offsite tracker) -->', html)
html = re.sub(r'<script[^>]*cdn\.cookielaw\.org[^>]*>\s*</script>',
              '<!-- onetrust cookie banner removed (offsite tracker) -->', html)
# stub the globals those scripts define so inline callers do not throw
stub = ('<script>window._satellite={track:function(){},getVisitorId:function(){return null}};'
        'window.OneTrust={OnConsentChanged:function(){}};window.OptanonWrapper=function(){};'
        'window.adobeDataLayer=window.adobeDataLayer||[];</script>')
html = html.replace("</head>", stub + "\n</head>")

open(S("index.html"), "w", encoding="utf-8").write(html)

# ---- content.json -----------------------------------------------------
cj = open(os.path.join(ROOT, "probe_content.json"), encoding="utf-8").read()
cj = re.sub(r'(?:https?:)?//nrgcdn\.b-cdn\.net/+', '/', cj)
open(S("content.json"), "w", encoding="utf-8").write(cj)

# ---- scripts.min.js ---------------------------------------------------
js = open(os.path.join(ROOT, "probe_scripts.js"), encoding="utf-8").read()
n_base = js.count('"https://nrgcdn.b-cdn.net"')
js = js.replace('"https://nrgcdn.b-cdn.net"', '""')          # baseUrl -> relative
js = re.sub(r'(?:https?:)?//nrgcdn\.b-cdn\.net/+', '/', js)
os.makedirs(S("dist"), exist_ok=True)
open(S("dist", "scripts.min.js"), "w", encoding="utf-8").write(js)

# ---- style.min.css ----------------------------------------------------
css = open(os.path.join(ROOT, "probe_style.css"), encoding="utf-8").read()
css = re.sub(r'(?:https?:)?//nrgcdn\.b-cdn\.net/+', '/', css)
open(S("dist", "style.min.css"), "w", encoding="utf-8").write(css)

# ---- report -----------------------------------------------------------
leftover = {}
for f in ("index.html", "content.json", "dist/scripts.min.js", "dist/style.min.css"):
    t = open(S(*f.split("/")), encoding="utf-8").read()
    hits = re.findall(r'(?:https?:)?//(?:nrgcdn\.b-cdn\.net|unpkg\.com|cdn\.jsdelivr\.net|assets\.adobedtm\.com|cdn\.cookielaw\.org)[^\s"\')]*', t)
    if hits:
        leftover[f] = sorted(set(hits))
print(f"baseUrl replacements: {n_base}")
print("remaining absolute refs:", leftover if leftover else "none")
