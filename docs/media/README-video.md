# MOD-05 Associahedron — turntable video for social

## Shipped files

| File | Spec | Use |
|---|---|---|
| `associahedron-tour.mp4` | 1080×1080, 894 frames, **29.93 s**, 29.9 fps, H.264 High, yuv420p (tv), **7.3 MB**, no audio, faststart | one full revolution in real time |
| `associahedron-tour-fast.mp4` | 1080×1080, 898 frames, **14.97 s**, 60 fps, 5.4 MB | same turn at 2× — better for a feed |
| `associahedron-poster.png` | 1080×1080 still (frame at t=15 s) | tweet image / thumbnail |
| `associahedron-contact-sheet.png` | 5 frames sampled across the turn | quick QC of angles |

Both videos: no UI chrome, crystal 47–69 % of frame width, fully inside frame at every
sampled timestamp, zero decode errors.

## Why it was shot on the Mac and not the VPS

Three capture routes were tried:

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
  and land as `yuvj420p`/`pc`. X wants `yuv420p`/`tv`.

## Deterministic alternative (`capture-associahedron-video.py`)

The engine exposes `window.__engine` with `isPaused`, `setSimTime(t)` and `update()`, plus
`renderer.domElement.toDataURL()`. That allows exact frame stepping instead of sampling a
live clock: 857 frames at 30 fps over one revolution, with the loop seam chosen so
`sin(0.31·t)` matches at both ends (measured frame-0 vs frame-856 difference 1.39/255).

Trade-off: it is deterministic and loop-perfect, but each frame is a PNG `toDataURL` +
Playwright round trip, which costs **~0.9 fps** on software GL — about 16 minutes for a
full revolution. The screencast route is 30× faster and is what the shipped files use.

## Verification performed

- `ffprobe`: 1080×1080, High profile, yuv420p, tv range, 894 frames, 29.93 s, 7.3 MB.
- `ffmpeg -v error -i … -f null -` → **0 decode errors**.
- `-vf mpdecimate` → **894 of 894 distinct frames** (real motion, not a still).
- Mean absolute pixel difference between samples 7.5 s apart: **15.45, 16.14, 19.57, 14.68**.
- Four timestamps checked for clipping: object stays inside frame, 47–69 % width.

## Gotchas worth keeping

- Never claim a capture worked without an `mpdecimate` count or a per-frame diff. A frozen
  clip passes every cosmetic check.
- Seek with `ffmpeg -i file.mp4 -ss <t>` (output seeking). `-ss <t> -i file.mp4` can return
  the same keyframe for every sample and make moving video look static.
- Two agents capturing at once will clobber a shared `/tmp/<name>` path. Parameterise the
  output directory.
