#!/usr/bin/env python3
"""Director's Cut M05 Associahedron 1920x1080 capture over CDP.

Reproduces the exact Director's Cut Act V (M05) visual experience on a clean
Pure 3D stage (1920x1080 @ 30 fps, 450 frames = 15.0s, seamless 360-degree loop):
  - Exact 3D Loday crystal (n = 4, V14 E21 F9, #5eead4 Seafoam Teal)
  - Full Director's Cut multi-axis X/Y/Z tumbling + 360-degree orbital crane sweep
  - Smooth ABHY Canonical-Form Pole Sheen sweep (Omega: 0.15 -> 0.92 -> 0.15)
  - Captured via CDP Page.captureScreenshot (zero black frames, full post-processing)
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
        res = await self.call(
            "Runtime.evaluate", expression=expr, returnByValue=True, awaitPromise=True
        )
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


INIT_JS = """
(() => {
  const id = '__director_m05_hide_ui';
  if (!document.getElementById(id)) {
    const st = document.createElement('style');
    st.id = id;
    st.textContent = %s;
    document.head.appendChild(st);
  }
  const eng = window.__engine;
  if (!eng) return 'no engine';
  eng.activeMode = 'associahedron';
  eng.modePresence = {
    observer: 0.0,
    fkcrt: 0.0,
    hologram: 0.0,
    retraction: 0.0,
    associahedron: 1.0
  };
  eng.isPaused = true;
  eng.isDirectorTourActive = false;
  eng.shockwavePulse = 0.0;
  if (typeof eng.setAutoRotate === 'function') eng.setAutoRotate(false);
  if (eng.controls) {
    eng.controls.enabled = false;
    eng.controls.enableDamping = false;
  }
  eng.state.associahedronOrder = 4.0;
  eng.state.projectionSweep = 0.0;
  eng.state.facetResidueFocus = 0.15;
  eng.update = () => {};
  return 'ready';
})()
"""


def step_director_m05_js(u: float, base_dist: float) -> str:
    """Computes one deterministic frame at normalized loop progress u in [0, 1).
    Every angle is an integer multiple of 2*pi*u so frame N == frame 0 seamlessly!
    """
    phi = 2.0 * math.pi * u
    # Smooth ABHY Canonical-Form Pole Sheen sweep: 0.15 -> 0.92 -> 0.15
    focus = 0.15 + 0.77 * (0.5 - 0.5 * math.cos(phi))
    sweep = 0.5 - 0.5 * math.cos(phi)

    # Director's Cut multi-axis group tumble (periodic over 2*pi)
    grp_rot_y = phi
    grp_rot_x = math.sin(phi) * 0.56
    grp_rot_z = math.cos(phi) * 0.38

    # Inner GLB hull rotation & nod (periodic over 2*pi)
    glb_rot_y = phi
    glb_rot_x = math.sin(phi) * 0.18

    # Director's Cut 360-degree orbital crane camera sweep
    azimuth = -phi
    elev_y = 1.55 + math.sin(phi) * 1.95 + math.cos(phi) * 0.65
    dist = base_dist * (0.94 + 0.05 * math.cos(phi))
    horiz_r = math.sqrt(max(2.0, dist * dist - elev_y * elev_y))
    cam_x = math.sin(azimuth) * horiz_r
    cam_z = math.cos(azimuth) * horiz_r

    # Orbiting grazing light & studio strip phase (periodic over 2*pi)
    light_orbit = -phi + 0.42
    gx = 5.2 * math.cos(light_orbit)
    gy = -2.1 + 0.65 * math.sin(phi)
    gz = 3.2 + 1.8 * math.sin(light_orbit)

    return f"""
(() => {{
  const eng = window.__engine;
  if (!eng) return 'no engine';
  eng.state.associahedronOrder = 4.0;
  eng.state.facetResidueFocus = {focus:.6f};
  eng.state.projectionSweep = {sweep:.6f};

  // Update backdrop dome, contact reticle & astrometric field (periodic over 2*pi)
  eng.assoHandles.update(0.0, {focus:.6f}, {sweep:.6f});

  // Ensure exact n=4 hull is active and apply Director's Cut multi-axis tumble
  const art = eng.glbArticulator;
  art.updateAssociahedronManifold(0.0, eng.state);
  if (art.assoGlbGroup) {{
    art.assoGlbGroup.rotation.y = {glb_rot_y:.6f};
    art.assoGlbGroup.rotation.x = {glb_rot_x:.6f};
  }}
  const active = art.assoFrames.get(4)?.[0];
  if (active) {{
    active.material.emissiveIntensity = 0.11 + {focus:.6f} * 0.14 + 0.015 * Math.sin({phi:.6f} * 2.0);
    active.wireMaterial.opacity = 0.62 + {focus:.6f} * 0.30;
    active.shaderUniforms.uAssoSweepPhase.value = 3.14159 * (1.0 - Math.cos({phi:.6f}));
  }}
  if (art.assoGrazingLight) {{
    art.assoGrazingLight.position.set({gx:.6f}, {gy:.6f}, {gz:.6f});
  }}

  eng.assoHandles.group.rotation.set({grp_rot_x:.6f}, {grp_rot_y:.6f}, {grp_rot_z:.6f});

  eng.assoHandles.group.updateMatrixWorld(true);
  let targetX = 0, targetY = 0.06, targetZ = 0;
  if (active && active.mesh && active.mesh.geometry) {{
    active.mesh.geometry.computeBoundingBox();
    const bb = active.mesh.geometry.boundingBox;
    if (bb) {{
      const cx = (bb.min.x + bb.max.x) * 0.5;
      const cy = (bb.min.y + bb.max.y) * 0.5;
      const cz = (bb.min.z + bb.max.z) * 0.5;
      const v = active.mesh.position.clone().set(cx, cy, cz);
      active.mesh.localToWorld(v);
      targetX = v.x;
      targetY = v.y;
      targetZ = v.z;
    }}
  }}

  // Position Director's Cut orbital crane camera
  eng.camera.position.set(targetX + {cam_x:.6f}, targetY - 0.06 + {elev_y:.6f}, targetZ + {cam_z:.6f});
  eng.camera.lookAt(targetX, targetY, targetZ);
  eng.camera.updateMatrixWorld(true);

  if (eng.usePostProcessing && eng.composer) {{
    eng.composer.render();
  }} else {{
    eng.renderer.render(eng.scene, eng.camera);
  }}
  return {focus:.4f};
}})()
"""


async def settle(cdp: Cdp, frames: int = 2):
    await cdp.evaluate(
        "new Promise(r => { let n = 0; const step = () => (++n >= %d ? r(true) : requestAnimationFrame(step)); requestAnimationFrame(step); })"
        % frames
    )


async def capture(
    port: int,
    w: int,
    h: int,
    frames: int,
    out: str,
    base_dist: float,
    settle_frames: int,
):
    await asyncio.sleep(6)
    ws, cdp = await open_page(port, w, h)
    await press_key(cdp, "5")
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
    if status != "ready":
        raise SystemExit(f"MOD-05 failed to become ready: {status}")

    print("init:", await cdp.evaluate(INIT_JS % repr(HIDE_UI_CSS)))
    await settle(cdp, 3)

    if os.path.isdir(out):
        shutil.rmtree(out)
    os.makedirs(out, exist_ok=True)

    t0 = time.time()
    for i in range(frames):
        u = i / frames
        await cdp.evaluate(step_director_m05_js(u, base_dist))
        await settle(cdp, settle_frames)
        res = await cdp.call("Page.captureScreenshot", format="png")
        with open(os.path.join(out, f"f{i:05d}.png"), "wb") as fh:
            fh.write(base64.b64decode(res["data"]))
        if (i + 1) % 45 == 0 or i == frames - 1:
            rate = (i + 1) / (time.time() - t0)
            eta = (frames - i - 1) / max(rate, 1e-9)
            print(f"  frame {i + 1:3d}/{frames}  {rate:.1f} fps  eta {eta:.0f}s", flush=True)

    total = time.time() - t0
    with open(os.path.join(out, "capture.json"), "w") as fh:
        json.dump(
            {
                "frames": frames,
                "seconds": round(total, 2),
                "fps_capture": round(frames / total, 2),
                "base_dist": base_dist,
                "mode": "director_cut_m05_pure_3d",
            },
            fh,
            indent=2,
        )
    await ws.close()
    print(f"captured {frames} frames in {total:.1f}s")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", default="https://sub-spacetime.clipboard-share.com/")
    ap.add_argument("--width", type=int, default=1920)
    ap.add_argument("--height", type=int, default=1080)
    ap.add_argument("--frames", type=int, default=450)
    ap.add_argument("--out", default="/tmp/asso-director-cut")
    ap.add_argument("--port", type=int, default=9225)
    ap.add_argument("--base-dist", type=float, default=5.15)
    ap.add_argument("--settle-frames", type=int, default=1)
    ap.add_argument(
        "--chrome",
        default=os.environ.get(
            "CAPTURE_CHROME", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
        ),
    )
    args = ap.parse_args()

    url = f"{args.url}{'&' if '?' in args.url else '?'}v={int(time.time())}"
    proc = launch(args.chrome, args.port, "/tmp/chrome-director-m05-profile", url, args.width, args.height)
    try:
        asyncio.run(
            capture(
                args.port,
                args.width,
                args.height,
                args.frames,
                args.out,
                args.base_dist,
                args.settle_frames,
            )
        )
    finally:
        proc.terminate()


if __name__ == "__main__":
    main()
