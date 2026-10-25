#!/usr/bin/env python3
"""Camera-orbit turntable capture for Sub-Spacetime Studio.

Why this differs from a spinning-object capture:

- The OBJECT stays still (engine paused), the CAMERA orbits. A full 360 camera
  sweep therefore loops perfectly by construction: frame N and frame 0 are the
  same pose. No phase alignment tricks, no secondary oscillation to match.
- Frames are captured with CDP Page.captureScreenshot, not canvas.toDataURL.
  toDataURL on a WebGL canvas needs preserveDrawingBuffer:true, otherwise the
  drawing buffer is cleared after compositing and you silently get BLACK FRAMES
  (this cost a previous run 83 of 857 frames). The browser's own screenshot
  composites correctly, so it cannot happen.
- The camera pose is computed in Python per frame, so the motion is exactly
  even regardless of how fast the renderer manages to paint.

Usage:
    python3 capture-orbit-turntable.py --url http://127.0.0.1:5188/ \
        --width 1920 --height 1080 --frames 390 --out /tmp/orbit --key 5 --hide-ui

Then encode (on the same host, from the measured count):
    ffmpeg -y -framerate 30 -i /tmp/orbit/f%05d.png -c:v libx264 -preset slow \
        -crf 17 -profile:v high -level 4.0 -pix_fmt yuv420p -color_range tv \
        -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
        -movflags +faststart -an out.mp4
"""
from __future__ import annotations

import argparse
import asyncio
import base64
import json
import math
import os
import shutil
import subprocess
import time
import urllib.request

import websockets

HIDE_UI_CSS = """
[class*="panel"], [class*="Panel"], [class*="hud"], [class*="HUD"],
[class*="slim"], [class*="toolbar"], [class*="caption"], [class*="dock"],
[class*="lean"], [class*="Lean"], [class*="modal"], [class*="toast"],
header, aside, footer, nav { display: none !important; visibility: hidden !important; }
"""


class Cdp:
    def __init__(self, ws):
        self.ws = ws
        self.id = 0

    async def call(self, method: str, **params):
        self.id += 1
        mid = self.id
        await self.ws.send(json.dumps({"id": mid, "method": method, "params": params}))
        while True:
            msg = json.loads(await self.ws.recv())
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})

    async def drain(self, seconds: float):
        end = time.time() + seconds
        while time.time() < end:
            try:
                await asyncio.wait_for(self.ws.recv(), timeout=max(0.05, end - time.time()))
            except asyncio.TimeoutError:
                return

    async def evaluate(self, expr: str):
        res = await self.call("Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True)
        return res.get("result", {}).get("value")


def launch(chrome: str, port: int, profile: str, url: str, w: int, h: int):
    shutil.rmtree(profile, ignore_errors=True)
    args = [
        chrome,
        f"--remote-debugging-port={port}",
        f"--user-data-dir={profile}",
        "--headless=new",
        "--no-first-run",
        "--no-default-browser-check",
        "--mute-audio",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-background-timer-throttling",
        "--disable-features=CalculateNativeWinOcclusion",
        f"--window-size={w},{h}",
        url,
    ]
    return subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def wait_for_devtools(port: int, timeout: float = 30.0):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list", timeout=2) as r:
                return json.load(r)
        except Exception:
            time.sleep(0.5)
    raise SystemExit("devtools endpoint never came up")


async def open_page(port: int, w: int, h: int):
    pages = [p for p in wait_for_devtools(port) if p.get("type") == "page"]
    if not pages:
        raise SystemExit("no page target")
    ws = await websockets.connect(pages[0]["webSocketDebuggerUrl"], max_size=None)
    cdp = Cdp(ws)
    await cdp.call("Page.enable")
    await cdp.call(
        "Emulation.setDeviceMetricsOverride", width=w, height=h, deviceScaleFactor=1, mobile=False
    )
    return ws, cdp


async def press_key(cdp: Cdp, key: str):
    for kind in ("keyDown", "keyUp"):
        await cdp.call(
            "Input.dispatchKeyEvent",
            type=kind,
            key=key,
            code=f"Digit{key}" if key.isdigit() else key,
            windowsVirtualKeyCode=ord(key.upper()),
            nativeVirtualKeyCode=ord(key.upper()),
            text=key if kind == "keyDown" else "",
        )


FREEZE_JS = """
(() => {
  const id = '__orbit_hide_ui';
  if (!document.getElementById(id)) {
    const st = document.createElement('style');
    st.id = id;
    st.textContent = %s;
    document.head.appendChild(st);
  }
  const eng = window.__engine;
  if (!eng) return 'no engine';
  eng.isPaused = true;                       // stop time advancing: object holds still
  if (typeof eng.setAutoRotate === 'function') eng.setAutoRotate(false);
  if (eng.controls) { eng.controls.enabled = false; eng.controls.enableDamping = false; }
  if (eng.state) { eng.state.autoRotate = false; }
  window.__orbitTarget = window.__orbitTarget || { x: 0, y: 0.06, z: 0 };
  return 'frozen';
})()
"""


def orbit_js(theta: float, radius: float, height: float) -> str:
    return f"""
(() => {{
  const eng = window.__engine;
  if (!eng) return 'no engine';
  const cam = eng.camera;
  const t = window.__orbitTarget || {{ x: 0, y: 0.06, z: 0 }};
  cam.position.set(Math.sin({theta}) * {radius}, {height}, Math.cos({theta}) * {radius});
  cam.lookAt(t.x, t.y, t.z);
  cam.updateMatrixWorld(true);
  return [cam.position.x, cam.position.y, cam.position.z];
}})()
"""


async def settle(cdp: Cdp, frames: int = 2):
    await cdp.evaluate(
        "new Promise(r => { let n = 0; const step = () => (++n >= %d ? r(true) : requestAnimationFrame(step)); requestAnimationFrame(step); })"
        % frames
    )


async def capture(port: int, w: int, h: int, frames: int, out: str, key: str | None, hide: bool,
                  radius: float, height: float, settle_frames: int):
    await asyncio.sleep(6)
    ws, cdp = await open_page(port, w, h)
    if key:
        await press_key(cdp, key)
    await cdp.drain(3)

    status = await cdp.evaluate(
        "window.__engine?.glbArticulator?.getAssociahedronStatus?.() || 'none'"
    )
    if status != "ready":
        await cdp.drain(5)
        status = await cdp.evaluate(
            "window.__engine?.glbArticulator?.getAssociahedronStatus?.() || 'none'"
        )
    print("module status:", status)

    if hide:
        print("freeze:", await cdp.evaluate(FREEZE_JS % repr(HIDE_UI_CSS)))
        await settle(cdp, 3)

    if os.path.isdir(out):
        shutil.rmtree(out)
    os.makedirs(out, exist_ok=True)

    t0 = time.time()
    for i in range(frames):
        theta = 2 * math.pi * i / frames          # 0..2pi, exclusive: frame N == frame 0
        await cdp.evaluate(orbit_js(theta, radius, height))
        await settle(cdp, settle_frames)
        res = await cdp.call("Page.captureScreenshot", format="png")
        with open(os.path.join(out, f"f{i:05d}.png"), "wb") as fh:
            fh.write(base64.b64decode(res["data"]))
        if (i + 1) % 50 == 0 or i == frames - 1:
            rate = (i + 1) / (time.time() - t0)
            print(f"  frame {i + 1}/{frames}  {rate:.1f} fps  eta {(frames - i - 1) / max(rate, 1e-9):.0f}s")

    total = time.time() - t0
    with open(os.path.join(out, "capture.json"), "w") as fh:
        json.dump(
            {
                "frames": frames,
                "seconds": round(total, 2),
                "fps_capture": round(frames / total, 2),
                "radius": radius,
                "height": height,
                "note": "camera orbit, object paused; frame N == frame 0 so it loops",
            },
            fh,
            indent=2,
        )
    print(f"captured {frames} frames in {total:.1f}s")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="http://127.0.0.1:5188/")
    ap.add_argument("--width", type=int, default=1920)
    ap.add_argument("--height", type=int, default=1080)
    ap.add_argument("--frames", type=int, default=390)
    ap.add_argument("--out", default="/tmp/orbit")
    ap.add_argument("--port", type=int, default=9223)
    ap.add_argument("--key", default="5")
    ap.add_argument("--hide-ui", action="store_true")
    ap.add_argument("--radius", type=float, default=7.42)
    ap.add_argument("--cam-height", type=float, default=2.1)
    ap.add_argument("--settle-frames", type=int, default=2)
    ap.add_argument(
        "--chrome",
        default=os.environ.get(
            "CAPTURE_CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        ),
    )
    args = ap.parse_args()

    url = f"{args.url}{'&' if '?' in args.url else '?'}v={int(time.time())}"
    proc = launch(args.chrome, args.port, "/tmp/chrome-orbit-profile", url, args.width, args.height)
    try:
        asyncio.run(
            capture(
                args.port, args.width, args.height, args.frames, args.out, args.key,
                args.hide_ui, args.radius, args.cam_height, args.settle_frames,
            )
        )
    finally:
        proc.terminate()


if __name__ == "__main__":
    main()
