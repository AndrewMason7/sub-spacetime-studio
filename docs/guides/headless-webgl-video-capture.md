# Capturing Sub-Spacetime Studio to video

How the MOD-05 turntable clip in `docs/media/` was produced, and what not to repeat.

Companion skill: `headless-webgl-video-capture` (holds the general recipe, a capture script
and `scripts/verify_video.py`, which is the gate that must pass before anything ships).

## The short version

```bash
# 1. capture on the Mac (real GPU) — UI hidden, 30 s of motion
python3 <skill>/scripts/capture-cdp-video.py \
  --url https://sub-spacetime.clipboard-share.com/ \
  --size 1600 --seconds 30 --out /tmp/capture --key 5 --hide-ui

# 2. encode at the measured rate, cropped to the crystal
fps=$(python3 -c "import json;d=json.load(open('/tmp/capture/stamps.json'));print(round(d['fps'],3))")
ffmpeg -y -framerate $fps -i /tmp/capture/f%05d.jpg \
  -vf "crop=1118:1118:280:202,scale=1080:1080:flags=lanczos,format=yuv420p" \
  -c:v libx264 -preset slow -crf 17 -profile:v high -level 4.0 \
  -pix_fmt yuv420p -color_range tv -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -movflags +faststart -an docs/media/associahedron-tour.mp4

# 3. gates — do not skip, do not pipe through another command
python3 <skill>/scripts/verify_video.py docs/media/associahedron-tour.mp4 \
  --expect 1080x1080 --subject-min 40 --subject-max 70
```

## Why not capture on the VPS

| Attempt | Result |
|---|---|
| Chrome + `Xvfb` + `ffmpeg -f x11grab` | **Frozen.** Chrome decides the window is occluded, pauses `requestAnimationFrame`; 180 frames, all identical (`mpdecimate` kept 1). Occlusion flags do not help. |
| CDP `Page.captureScreenshot` loop | Works at ~0.5 fps — unusable for motion. |
| Mac headless Chrome + CDP `Page.startScreencast` | **Chosen.** 29.9 fps at 1600 px, 52 fps at 1200 px, 58.6 fps at 1000 px. |

`window.__engine` is exposed on the page, which also makes deterministic stepping possible:
`engine.isPaused = true`, `engine.setSimTime(t)`, `engine.update()`, then
`renderer.domElement.toDataURL()`. That is the only route to a mathematically seamless loop —
but see the black-frame warning below.

## Numbers for MOD-05

- Tumble: `assoGlbGroup.rotation.y = elapsed * 0.22` → **28.56 s per revolution**.
- Composition: the crystal is squat, so its projected width swings **38 %–67 %** of the frame
  across a turn. Crop on the union box, not one frame.
- Shipped hero: 1080×1080, 894 frames, 29.93 s, 8.0 MB, crystal 50–66 % of frame width.
- Loop seam: best achievable from a live capture is **27/255**; the deterministic phase trick
  reaches **1.67/255**.

## Two traps that each shipped a broken file once

1. **A frozen capture passes every cosmetic check.** Right resolution, right duration, plausible
   brightness, good framing — and zero motion. Only `mpdecimate` or frame diffs reveal it.
2. **Black in YUV is 16, not 0.** An `YAVG < 8` test declared a render with **83 black frames
   out of 857** healthy. The deterministic loop render was rejected for this; the real-time cut
   has zero. Use `signalstats` and test `YAVG <= 16.5`.

Both gates are automated in the skill's `verify_video.py` and were validated against synthetic
frozen and black clips as well as the real defective render.

## Lessons about the process

- Two agents capturing at once destroyed 624 frames by sharing `/tmp/asso-capture`. Always
  parameterise the output path (`CAPTURE_OUT`).
- A reviewer sampling four timestamps (10/35/60/85 %) reported a defective render as clean,
  because all four landed on good frames. Per-frame checks only.
- `ffmpeg -i file.mp4 -ss <t>` (output seeking). `-ss <t> -i file.mp4` can return the same
  keyframe repeatedly and make moving video look static.
