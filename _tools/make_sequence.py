#!/usr/bin/env python3
"""Turn a folder of images into a phase background (an "imageSequence").

Why image sequences rather than video:

  playImageSequenceToFrame(media, frame, cb, r) {
      t = frame[0] - 1
      setActiveImage(media, t)
      setTimeout(cb, 1000 - 1000*r)
  }

For an imageSequence, `frame` is a 1-BASED IMAGE INDEX, not a timestamp. So a
phase needs exactly one image per screen and no timing authoring at all — unlike
the video phases, where every screen is a hand-picked moment on a shared
timeline. It also sidesteps video seeking entirely, which is what made scrolling
backwards through the video phases slow.

Usage:
    python3 _tools/make_sequence.py <source-folder> --media-id phase1 --phase 1
    ...then re-run with --apply once the dry run looks right.
"""

import argparse
import json
import os
import shutil
import sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, 'site')
CONTENT = os.path.join(SITE, 'content.json')
EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tif', '.tiff', '.heic'}

# Matches the existing sequences in images/min/PHASE 2 and PHASE 4.
TARGET_W, TARGET_H, QUALITY = 1920, 1080, 82


def cover_crop(im, w, h):
    """Centre-crop to the w:h aspect, like object-fit: cover.

    Never upscales past the source — enlarging a small render adds no detail,
    only softness, so a smaller-than-target image keeps its own pixels and the
    browser scales it instead.
    """
    src_ar, dst_ar = im.width / im.height, w / h
    if src_ar > dst_ar:                      # too wide -> crop the sides
        new_w = round(im.height * dst_ar)
        box = ((im.width - new_w) // 2, 0, (im.width + new_w) // 2, im.height)
    else:                                    # too tall -> crop top/bottom
        new_h = round(im.width / dst_ar)
        box = (0, (im.height - new_h) // 2, im.width, (im.height + new_h) // 2)
    im = im.crop(box)
    if im.width < w:
        w, h = im.width, round(im.width / dst_ar)
    return im.resize((w, h), Image.LANCZOS)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('source', help='folder of images, used in filename order')
    ap.add_argument('--media-id', required=True, help='media id in content.json, e.g. phase1')
    ap.add_argument('--phase', type=int, required=True, help='phase number, 1-7')
    ap.add_argument('--name', help='output folder under images/min/ (default: PHASE <n>)')
    ap.add_argument('--alt', nargs='*', default=[], help='alt text, one per image, in order')
    ap.add_argument('--apply', action='store_true', help='write files and patch content.json')
    args = ap.parse_args()

    files = sorted(f for f in os.listdir(args.source)
                   if os.path.splitext(f)[1].lower() in EXTS)
    if not files:
        sys.exit('No images found in ' + args.source)

    content = json.load(open(CONTENT))
    phases = content['phases']
    if not 1 <= args.phase <= len(phases):
        sys.exit('Phase must be 1..%d' % len(phases))
    phase = phases[args.phase - 1]
    screens = phase['screens']

    print('Phase %d (%s, type=%s) has %d screens' %
          (args.phase, phase.get('menuLink') or 'unnamed', phase['type'], len(screens)))
    print('Source folder has %d images:' % len(files))
    for i, f in enumerate(files):
        im = Image.open(os.path.join(args.source, f))
        print('   %2d. %-40s %dx%d' % (i + 1, f, im.width, im.height))

    if len(files) != len(screens):
        print('\n  NOTE: %d images for %d screens. Screens are assigned an image each, in\n'
              '        order; any extra screens reuse the last image.' % (len(files), len(screens)))

    out_name = args.name or ('PHASE %d' % args.phase)
    out_dir = os.path.join(SITE, 'images', 'min', out_name)

    srcs = []
    for i, f in enumerate(files):
        rel = '/images/min/%s/%02d-min.webp' % (out_name, i + 1)
        alt = args.alt[i] if i < len(args.alt) else 'Phase %d image %d' % (args.phase, i + 1)
        srcs.append([rel, alt])

    media_entry = {'id': args.media_id, 'type': 'imageSequence', 'srcs': srcs}

    print('\ncontent.json media entry:')
    print(json.dumps(media_entry, indent=2)[:600])
    print('\nscreen -> image mapping:')
    for i, sc in enumerate(screens):
        idx = min(i, len(files) - 1) + 1        # frame is 1-based
        print('   screen %d (%-16s) media=%s frame=[%d]' % (i, sc.get('type'), args.media_id, idx))

    if not args.apply:
        print('\nDry run. Re-run with --apply to write the images and patch content.json.')
        return

    os.makedirs(out_dir, exist_ok=True)
    for i, f in enumerate(files):
        im = Image.open(os.path.join(args.source, f)).convert('RGB')
        cover_crop(im, TARGET_W, TARGET_H).save(
            os.path.join(out_dir, '%02d-min.webp' % (i + 1)), 'WEBP', quality=QUALITY, method=6)
    print('\nWrote %d images to %s' % (len(files), out_dir))

    shutil.copy(CONTENT, CONTENT + '.bak')
    media = content.setdefault('media', [])
    for i, m in enumerate(media):
        if m.get('id') == args.media_id:
            media[i] = media_entry
            break
    else:
        media.append(media_entry)

    phase['media'] = args.media_id
    for i, sc in enumerate(screens):
        sc['media'] = args.media_id
        sc['frame'] = [min(i, len(files) - 1) + 1]

    json.dump(content, open(CONTENT, 'w'), indent=1, ensure_ascii=False)
    print('Patched content.json (previous version saved as content.json.bak)')


if __name__ == '__main__':
    main()
