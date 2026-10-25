#!/usr/bin/env python3
"""Capture the Sub-Spacetime associahedron on macOS Chrome over CDP.

Why this exists: screen-recording from SSH is blocked by macOS TCC
("could not create image from display"), and Chrome under Xvfb on the VPS
freezes its rAF loop so x11grab records one frame forever. Chrome capturing
itself over CDP needs no TCC grant and uses the real GPU.

Usage:
  python3 mac_capture.py probe            # 3 stills, prints motion diff
  python3 mac_capture.py shoot [seconds]  # frame sequence + mp4
"""
import asyncio
import base64
import json
import os
import shutil
import subprocess
import sys
import time
import urllib.request

import websockets

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9223
URL = os.environ.get("CAPTURE_URL", "https://sub-spacetime.clipboard-share.com/")
SIZE = int(os.environ.get("CAPTURE_SIZE", "1080"))
PROFILE = "/tmp/chrome-capture-profile"
OUTDIR = os.environ.get("CAPTURE_OUT", "/tmp/asso-capture")


def wait_for_devtools(timeout=30):
    deadline = time.time() + timeout
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list", timeout=2) as r:
                return json.load(r)
        except Exception:
            time.sleep(0.5)
    raise SystemExit("devtools endpoint never came up")


class Cdp:
    def __init__(self, ws):
        self.ws = ws
        self.id = 0

    async def call(self, method, **params):
        self.id += 1
        mid = self.id
        await self.ws.send(json.dumps({"id": mid, "method": method, "params": params}))
        while True:
            msg = json.loads(await self.ws.recv())
            if msg.get("id") == mid:
                if "error" in msg:
                    raise RuntimeError(f"{method}: {msg['error']}")
                return msg.get("result", {})

    async def drain(self, seconds):
        """Consume events for a while so the socket does not back up."""
        end = time.time() + seconds
        while time.time() < end:
            try:
                await asyncio.wait_for(self.ws.recv(), timeout=max(0.05, end - time.time()))
            except asyncio.TimeoutError:
                return


def launch(width=1080, height=1080, headless=True, url=None):
    shutil.rmtree(PROFILE, ignore_errors=True)
    args = [
        CHROME,
        f"--remote-debugging-port={PORT}",
        f"--user-data-dir={PROFILE}",
        "--no-first-run",
        "--no-default-browser-check",
        "--mute-audio",
        "--hide-scrollbars",
        "--force-device-scale-factor=1",
        "--autoplay-policy=no-user-gesture-required",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-background-timer-throttling",
        "--disable-features=CalculateNativeWinOcclusion",
        f"--window-size={width},{height}",
    ]
    if headless:
        args.append("--headless=new")
    args.append(url or URL)
    proc = subprocess.Popen(args, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return proc


async def open_page(width=1080, height=1080):
    pages = [p for p in wait_for_devtools() if p.get("type") == "page"]
    if not pages:
        raise SystemExit("no page target")
    ws_url = pages[0]["webSocketDebuggerUrl"]
    ws = await websockets.connect(ws_url, max_size=None)
    cdp = Cdp(ws)
    await cdp.call("Page.enable")
    await cdp.call("Emulation.setDeviceMetricsOverride", width=width, height=height,
                   deviceScaleFactor=1, mobile=False)
    return ws, cdp


async def select_module(cdp):
    for kind in ("keyDown", "keyUp"):
        await cdp.call("Input.dispatchKeyEvent", type=kind, key="5", code="Digit5",
                       windowsVirtualKeyCode=53, nativeVirtualKeyCode=53, text="5")


async def grab(cdp, path):
    res = await cdp.call("Page.captureScreenshot", format="png")
    with open(path, "wb") as f:
        f.write(base64.b64decode(res["data"]))


async def probe():
    await asyncio.sleep(6)
    ws, cdp = await open_page(width=SIZE, height=SIZE)
    await select_module(cdp)
    if os.environ.get("CAPTURE_HIDE_UI", "0") == "1":
        await hide_ui(cdp)
        await asyncio.sleep(1.5)
    await cdp.drain(5)
    os.makedirs(OUTDIR, exist_ok=True)
    shots = []
    for i in range(3):
        p = f"{OUTDIR}/probe_{i}.png"
        await grab(cdp, p)
        shots.append(p)
        await asyncio.sleep(1.0)
    await ws.close()
    print("probe frames:", shots)


async def shoot(seconds=20.0, fps_target=30):
    await asyncio.sleep(6)
    ws, cdp = await open_page(width=SIZE, height=SIZE)
    await select_module(cdp)
    if os.environ.get("CAPTURE_HIDE_UI", "0") == "1":
        await hide_ui(cdp)
        await asyncio.sleep(1.5)
    await cdp.drain(4)
    if os.path.isdir(OUTDIR):
        shutil.rmtree(OUTDIR)
    os.makedirs(OUTDIR, exist_ok=True)
    t0 = time.time()
    n = 0
    stamps = []
    while time.time() - t0 < seconds:
        p = f"{OUTDIR}/f{n:05d}.png"
        await grab(cdp, p)
        stamps.append(time.time() - t0)
        n += 1
    await ws.close()
    total = time.time() - t0
    with open(f"{OUTDIR}/stamps.json", "w") as f:
        json.dump({"frames": n, "seconds": total, "stamps": stamps}, f)
    print(f"captured {n} frames in {total:.1f}s -> {n/total:.1f} fps")


HIDE_UI_CSS = """
[class*="panel"], [class*="Panel"], [class*="hud"], [class*="HUD"],
[class*="slim"], [class*="toolbar"], [class*="caption"], [class*="dock"],
[class*="lean"], [class*="Lean"], [class*="modal"], [class*="toast"],
header, aside, footer, nav { display: none !important; visibility: hidden !important; }
"""


async def hide_ui(cdp):
    await cdp.call("Runtime.evaluate", expression=(
        "(() => {"
        "  const id = '__hermes_hide_ui';"
        "  if (document.getElementById(id)) return 'already';"
        "  const st = document.createElement('style');"
        "  st.id = id;"
        f"  st.textContent = {HIDE_UI_CSS!r};"
        "  document.head.appendChild(st);"
        "  return 'injected';"
        "})()"
    ), returnByValue=True)


async def shoot_stream(seconds=30.0, size=None):
    """Page.startScreencast: frames stream from Chrome as they are produced.

    Per-frame Page.captureScreenshot round-trips cost ~430 ms each (2.3 fps at
    1600px), which is too coarse for smooth motion. Screencast pushes JPEG frames
    as the compositor emits them, so the capture rate tracks the real frame rate.
    """
    size = size or SIZE
    await asyncio.sleep(6)
    ws, cdp = await open_page(width=size, height=size)
    await select_module(cdp)
    if os.environ.get("CAPTURE_HIDE_UI", "0") == "1":
        await hide_ui(cdp)
        await asyncio.sleep(1.5)
    await cdp.drain(4)
    if os.path.isdir(OUTDIR):
        shutil.rmtree(OUTDIR)
    os.makedirs(OUTDIR, exist_ok=True)

    frames = []
    end = time.time() + seconds

    async def on_frame():
        while time.time() < end:
            msg = json.loads(await ws.recv())
            if msg.get("method") == "Page.screencastFrame":
                meta = msg["params"]["metadata"]
                data = base64.b64decode(msg["params"]["data"])
                idx = len(frames)
                path = f"{OUTDIR}/f{idx:05d}.jpg"
                with open(path, "wb") as f:
                    f.write(data)
                frames.append({"path": path, "ts": meta.get("timestamp", time.time())})
                await cdp.call("Page.screencastFrameAck",
                               sessionId=msg["params"]["sessionId"])

    await cdp.call("Page.startScreencast", format="jpeg", quality=95,
                   maxWidth=size, maxHeight=size, everyNthFrame=1)
    try:
        await on_frame()
    finally:
        try:
            await cdp.call("Page.stopScreencast")
        except Exception:
            pass
        await ws.close()

    stamps = [f["ts"] for f in frames]
    total = (stamps[-1] - stamps[0]) if len(stamps) > 1 else 0
    with open(f"{OUTDIR}/stamps.json", "w") as f:
        json.dump({"frames": len(frames), "seconds": total,
                   "stamps": [t - stamps[0] for t in stamps] if stamps else []}, f)
    print(f"screencast: {len(frames)} frames over {total:.1f}s -> {len(frames)/max(total,1e-9):.1f} fps")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "probe"
    headless = os.environ.get("CAPTURE_HEADLESS", "1") == "1"
    proc = launch(width=SIZE, height=SIZE, headless=headless)
    try:
        if mode == "probe":
            asyncio.run(probe())
        elif mode == "stream":
            secs = float(sys.argv[2]) if len(sys.argv) > 2 else 30.0
            asyncio.run(shoot_stream(secs))
        else:
            secs = float(sys.argv[2]) if len(sys.argv) > 2 else 20.0
            asyncio.run(shoot(secs))
    finally:
        proc.terminate()
