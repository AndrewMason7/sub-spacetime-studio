# MOD-05 Associahedron — turntable video for social

## Shipped files

| File | Spec | Use |
|---|---|---|
| `associahedron-tour.mp4` | 1080×1080, 894 frames, **29.93 s**, 29.9 fps, H.264 High, yuv420p, range tv, bt709, **8.0 MB**, no audio, faststart | the hero — one full revolution |
| `associahedron-tour-fast.mp4` | 1080×1080, 898 frames, **14.97 s**, 60 fps, 5.4 MB | same turn at 2× — better for a feed |
| `associahedron-orbit.mp4` | 1920×1080, 390 frames, **13.0 s**, 30 fps, 9.1 MB | **camera orbits a still object — seamless loop** (seam 1.87/255 vs 1.77 adjacent) |
| `associahedron-orbit-poster.png` | 1920×1080 still | landscape poster |
| `associahedron-orbit-contact-sheet.png` | 6 frames across the orbit | QC of angles |
| `associahedron-poster.png` | 1080×1080 still (t=15 s) | tweet image / thumbnail |
| `associahedron-contact-sheet.png` | 5 frames sampled across the turn | QC of angles |

Both videos: no UI chrome, crystal 50–66 % of frame width, fully inside frame at every
sampled timestamp, **0 black frames** (min per-frame YAVG 42.9), **0 decode errors**.

## Why it was shot on the Mac and not the VPS

1. **VPS + Xvfb + `ffmpeg -f x11grab`** — FAILED, silently. Chrome in Xvfb decides its
   window is occluded and pauses `requestAnimationFrame`: 180 frames, all identical
   (`mpdecimate` kept 1 of 180, per-frame diff 0.000). Adding
   `--disable-backgrounding-occluded-windows --disable-renderer-backgrounding
   --disable-background-timer-throttling --disable-features=CalculateNativeWinOcclusion
   --disable-gpu-vsync --disable-frame-rate-limit` did **not** help. Framing, brightness
   and duration all look correct in the broken output — that is what makes it dangerous.
2. **VPS + CDP `Page.captureScreenshot` loop** — works at ~0.5 fps. Unusable for motion.
3. **Mac + headless Chrome + CDP `Page.startScreencast`** — WON for the real-time version:
   real GPU, ~30–52 fps at 1200–1600 px. Chrome captures its own canvas, so no macOS
   Screen Recording (TCC) permission is needed. `screencapture` over SSH is blocked by TCC
   ("could not create image from display") unless `/usr/sbin/sshd` and
   `/usr/sbin/sshd-keygen-wrapper` are granted Screen Recording.

## Recipe

Tooling: `scripts/capture-mac-cdp.py` (screencast capture), `scripts/capture-associahedron-video.py`
(deterministic engine stepping — see below).

1. Launch headless Chrome with a throwaway profile and `--remote-debugging-port`.
2. Connect over WebSocket, `Page.enable`, set device metrics to a square.
3. Select MOD-05 with `Input.dispatchKeyEvent` (key `5`, code `Digit5`).
4. **Hide the chrome.** At 1600 px the Lean IDE panel covers the right side and lands inside
   any centre crop. Injecting `[class*="panel"], [class*="slim"], [class*="toolbar"],
   [class*="dock"], … { display:none }` gives a clean stage. At ≤1024 px the app hides its
   side panels by itself, but the top HUD strip and bottom caption chip remain.
5. `Page.startScreencast(format=jpeg, quality=95)`; write each frame with its timestamp and
   `Page.screencastFrameAck` it, or Chrome stops sending.
6. Encode from the **measured** rate (`frames / (stamps[-1] - stamps[0])`), never a guessed
   fps, and crop to the crystal's union bounding box across the whole rotation.

## Numbers that matter

- Tumble period is `2π / 0.22` = **28.6 s** per revolution, so ~30 s is the shortest
  real-time capture that shows every facet.
- Real-time capture: 894 frames over 29.9 s = **29.9 fps** at 1600×1600 with UI hidden.
- Crop `1118:1118:280:202` → crystal occupies **59 %** of frame width at its widest pose.
- Encoding is two-stage: crop+scale on the Mac (`crf 17`), then range normalisation on the
  VPS (`scale=in_range=full:out_range=tv`, `crf 18`) because screencast JPEGs are full-range
  and land as `yuvj420p`/`pc`. X wants `yuv420p`/`tv`; the final file is tagged `bt709`.

## Camera-orbit turntable (the landscape loop)

`associahedron-orbit.mp4` is a different capture from the two above: the **object is frozen**
(`engine.isPaused = true`, auto-rotate off, OrbitControls disabled) and the **camera** is placed
by hand each frame:

```js
cam.position.set(sin(theta) * R, H, cos(theta) * R);   // theta = 2*pi*i/N
cam.lookAt(target);
```

Two consequences, both good:

1. **Every parameter is a function of `theta` alone, so the loop is exact by construction** —
   frame `N` *is* frame `0`. No phase alignment ceremony. Measured seam **1.87/255** against
   **1.77/255** between adjacent frames, i.e. the loop point is indistinguishable from ordinary
   motion.
2. **It sidesteps the black-frame bug entirely.** That bug was `canvas.toDataURL()` on a WebGL
   canvas without `preserveDrawingBuffer: true`: after compositing, the drawing buffer is cleared
   and the read-back is black. Frames here come from CDP `Page.captureScreenshot`, which
   composites properly — 0 black frames of 390 (`signalstats` min YAVG 27.6).

Capture cost: 390 frames at 1920×1080 took **112 s** (3.5 fps capture rate). The pose is computed
in Python, so slow capture does not affect smoothness — only wall-clock time.

Script: `scripts/capture-orbit-turntable.py` (`--width --height --frames --radius --cam-height`).

Frame 0 and the last frame differ by one 1/30 s step, so a looping player joins them without a
visible cut. Verified: 390/390 distinct frames, 0 decode errors, subject 23–47 % of width with no
clipping.

## Rejected: the deterministic loop version

`scripts/capture-associahedron-video.py` steps the engine (`isPaused`, `setSimTime(t)`,
`update()`, `canvas.toDataURL()`) and can hit a mathematically perfect loop seam: choosing
start phase `t0 = (π/11)/0.31` makes `rotation.x` match at both ends while `rotation.y`
completes exactly 2π. Measured seam **1.67/255**, against 27/255 for the best window of the
real-time cut — the Y spin and the X nod have different periods, so they never re-align in a
live capture.

It was **not shipped**: that render contained **83 black frames out of 857** (~10 %, in runs
up to 0.8 s) at 5.2 s, 13.9 s, 14.3 s, 17.8 s, 22.7 s, 23.2 s, 24.7 s and 27.3 s. Its own
verification missed them because it sampled only four timestamps and all four happened to
land on good frames. The real-time cut has zero.

## Verification performed

- `ffprobe`: 1080×1080, High, yuv420p, tv range, bt709, 894 frames, 29.93 s, 8.0 MB, 2.15 Mb/s.
- `ffmpeg -v error -i … -f null -` → **0 decode errors**.
- `signalstats` YAVG per frame → **0 frames at or below 16.5** (min 42.9). Black in YUV is 16,
  so an `YAVG < 8` test would have passed a video made entirely of black frames.
- `-vf mpdecimate` → 894 frames, real motion (per-frame diffs 15.45, 16.14, 19.57, 14.68
  across 7.5 s gaps).
- Five sampled timestamps: no clipping, object 50–66 % of frame width.

## Gotchas worth keeping

- **Black in YUV is 16, not 0.** Use `signalstats` and test `YAVG <= 16.5`.
- Never claim a capture worked without an `mpdecimate` count or a per-frame diff. A frozen
  clip passes every cosmetic check.
- Seek with `ffmpeg -i file.mp4 -ss <t>` (output seeking). `-ss <t> -i file.mp4` can return
  the same keyframe for every sample and make moving video look static.
- Two agents capturing at once will clobber a shared `/tmp/<name>` path. Parameterise the
  output directory — this cost 624 frames on the first attempt.
