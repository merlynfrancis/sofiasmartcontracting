# Drop your images here

One subfolder per phase you want to replace. Example:

```
_incoming/
  phase1/
    01.jpg
    02.jpg
    03.jpg
    04.jpg
    05.jpg
```

## How many images

**One per screen** in the phase. The screens are already defined in
`site/content.json`:

| phase | name              | type       | screens = images needed |
|-------|-------------------|------------|-------------------------|
| 1     | Site Evaluation   | explore    | 5 |
| 2     | Site Development  | scroll     | 5 (already images) |
| 3     | Construction      | explore    | 4 |
| 4     | Power Ramp-up     | horizontal | 3 (already images) |
| 5     | Fully Operational | explore    | 2 |
| 6     | Virtual Tour      | scroll     | 1 |
| 7     | Get in Touch      | explore    | 1 |

Fewer is fine — leftover screens reuse the last image. More is fine too; the
extras just go unused.

## Format

- **Anything**: jpg, png, webp, heic, tif. Conversion is handled for you.
- **Order matters** — files are taken in filename order, so name them
  `01`, `02`, `03`… (not `1`, `2`, `10`, which sorts wrong).
- **Bigger than 1920x1080 is good.** They get centre-cropped to 16:9 and
  saved as WebP, matching the existing sequences.
- **Keep the subject centred.** The crop takes from the edges, and the site's
  own CSS (`.media img { height:100%; width:150%; right:0 }`) overflows the
  image to the right on top of that.

## Then

Tell me the folder name and which phase it's for. The conversion and the
`content.json` wiring are one command:

```
python3 _tools/make_sequence.py _incoming/phase1 --media-id phase1 --phase 1
```

That prints a dry run — no files touched. Adding `--apply` writes the images and
patches `content.json`, backing the old one up to `content.json.bak` first.
