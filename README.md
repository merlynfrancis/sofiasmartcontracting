# Sofia Smart Contracting

A scroll-driven website for Sofia Smart Contracting, a UAE general contractor
and subcontractor. Visitors move through the build process one phase at a time,
from design and feasibility to handover and aftercare, with a walkthrough of the
finished project at the end.

## Running it locally

The site must be served over HTTP (opening `index.html` as a file breaks the
`content.json` fetch and video seeking). A small Range-capable server is
included:

```bash
./serve.sh
```

Then open http://localhost:8899/index.html

`serve.sh` runs `_tools/serve.py`, a threaded server that supports HTTP Range
requests. The stock `python3 -m http.server` does not, which stops the phase
videos from seeking and makes scrolling backwards stall.

## Structure

| Path | What it is |
|------|------------|
| `site/index.html` | Page markup, nav, splash, and start screen |
| `site/content.json` | All phase copy, node text, deep dives, and the tour |
| `site/brand.css` | Sofia brand overrides on top of the compiled styles |
| `site/two-way-scroll.js` | Enables scrolling both up and down through the phases |
| `site/dist/` | Compiled JS and CSS bundles |
| `site/images/`, `site/videos/` | Phase backgrounds and image sequences |
| `_tools/` | Dev helpers: the server, content scripts, and probes |

## Editing content

Phase text, node labels, deep-dive panels, and the tour all live in
`site/content.json`. The phase order, animation frames, and media ids there are
wired to the bundle in `site/dist/`, so keep those numeric fields intact and
change the copy only.

## Dependencies

The `_tools/` probe scripts use `puppeteer-core`, which is not committed. To use
them:

```bash
cd _tools && npm install
```
