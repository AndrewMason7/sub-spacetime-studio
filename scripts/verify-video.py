#!/usr/bin/env python3
"""Verification gates for a captured WebGL video.

Every failure mode of a headless capture produces a file with correct resolution,
duration and plausible framing, so these gates are the only honest check.

Usage:
    python3 verify_video.py clip.mp4 [--expect 1080x1080] [--subject-min 35] [--subject-max 70]

Exit code 0 when every gate passes, 1 otherwise.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import tempfile
from pathlib import Path


def run(cmd: list[str]) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True)


def probe(path: str) -> dict:
    out = run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", path])
    if out.returncode != 0:
        raise SystemExit(f"ffprobe failed: {out.stderr.strip()}")
    data = json.loads(out.stdout)
    v = next((s for s in data["streams"] if s["codec_type"] == "video"), None)
    if v is None:
        raise SystemExit("no video stream")
    return {
        "width": v["width"],
        "height": v["height"],
        "codec": v["codec_name"],
        "profile": v.get("profile"),
        "pix_fmt": v.get("pix_fmt"),
        "color_range": v.get("color_range"),
        "color_space": v.get("color_space"),
        "frames": int(v.get("nb_frames") or 0),
        "fps": v.get("avg_frame_rate"),
        "duration": float(data["format"]["duration"]),
        "size_mb": round(int(data["format"]["size"]) / 1e6, 2),
        "streams": len(data["streams"]),
    }


def fps_of(info: dict) -> float:
    raw = str(info.get("fps") or "30/1")
    try:
        if "/" in raw:
            num, den = raw.split("/")
            return float(num) / float(den or 1)
        return float(raw)
    except Exception:
        return 30.0


def decode_errors(path: str) -> int:
    out = run(["ffmpeg", "-v", "error", "-i", path, "-f", "null", "-"])
    return len([line for line in out.stderr.splitlines() if line.strip()])


def black_frames(path: str) -> tuple[int, float, list[int]]:
    """Black in limited-range YUV is 16, not 0. Anything <= 16.5 is a black frame."""
    tmp = tempfile.NamedTemporaryFile(suffix=".txt", delete=False)
    meta = tmp.name
    tmp.close()
    run([
        "ffmpeg", "-v", "error", "-i", path,
        "-vf", f"signalstats,metadata=print:key=lavfi.signalstats.YAVG:file={meta}",
        "-f", "null", "-",
    ])
    vals: list[float] = []
    for line in Path(meta).read_text(errors="replace").splitlines():
        if "YAVG=" in line:
            try:
                vals.append(float(line.split("YAVG=")[1]))
            except ValueError:
                pass
    Path(meta).unlink(missing_ok=True)
    bad = [i for i, v in enumerate(vals) if v <= 16.5]
    return len(bad), (min(vals) if vals else 0.0), bad


def distinct_frames(path: str) -> int:
    out = run(["ffmpeg", "-i", path, "-vf", "mpdecimate", "-f", "null", "-"])
    found = re.findall(r"frame=\s*(\d+)", out.stderr)
    return int(found[-1]) if found else 0


def frame_subject(path: str, t: float):
    import numpy as np  # local: only needed for this gate
    from PIL import Image

    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    shot = tmp.name
    tmp.close()
    run(["ffmpeg", "-y", "-v", "error", "-i", path, "-ss", str(t), "-frames:v", "1", shot])
    a = np.asarray(Image.open(shot).convert("RGB")).astype(float)
    Path(shot).unlink(missing_ok=True)
    lum = a.mean(axis=2)
    h, w = lum.shape
    ys, xs = np.where(lum > 60)
    if len(xs) == 0:
        return None
    x0, x1 = np.percentile(xs, 1), np.percentile(xs, 99)
    y0, y1 = np.percentile(ys, 1), np.percentile(ys, 99)
    return {
        "mean": float(lum.mean()),
        "width_pct": float(100 * (x1 - x0) / w),
        "height_pct": float(100 * (y1 - y0) / h),
        "clipped": bool(x0 < 3 or x1 > w - 3 or y0 < 3 or y1 > h - 3),
    }


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("path")
    ap.add_argument("--expect", help="WxH, e.g. 1080x1080")
    ap.add_argument("--subject-min", type=float, default=30.0)
    ap.add_argument("--subject-max", type=float, default=80.0)
    ap.add_argument("--samples", type=int, default=5)
    args = ap.parse_args()

    fails: list[str] = []
    info = probe(args.path)

    print("== container ==")
    for k, v in info.items():
        print(f"   {k:12s} {v}")

    if args.expect:
        got = f"{info['width']}x{info['height']}"
        if got != args.expect.lower():
            fails.append(f"resolution {got} != expected {args.expect}")
    if info["pix_fmt"] != "yuv420p":
        fails.append(
            f"pix_fmt {info['pix_fmt']} (want yuv420p; yuvj420p is full-range and needs conversion)"
        )
    if info["color_range"] not in ("tv", "unknown"):
        fails.append(f"color_range {info['color_range']} (want tv)")
    if info["streams"] != 1:
        fails.append(f"{info['streams']} streams (want video only, no audio)")

    print("\n== decode ==")
    errs = decode_errors(args.path)
    print(f"   decode errors: {errs}")
    if errs:
        fails.append(f"{errs} decode errors")

    print("\n== motion ==")
    distinct = distinct_frames(args.path)
    print(f"   distinct frames: {distinct} of {info['frames']}")
    if distinct <= max(2, info["frames"] // 50):
        fails.append(f"only {distinct} distinct of {info['frames']} frames - frozen capture")

    print("\n== black frames ==")
    nbad, miny, bad = black_frames(args.path)
    print(f"   frames with YAVG<=16.5: {nbad}   min YAVG: {miny:.1f}")
    if bad:
        fps = fps_of(info)
        shown = ", ".join(f"{i / fps:.2f}s" for i in bad[:12])
        print(f"   at: {shown}{' ...' if len(bad) > 12 else ''}")
        fails.append(f"{nbad} black frames")

    print("\n== framing ==")
    for i in range(args.samples):
        t = info["duration"] * (i + 0.5) / args.samples
        s = frame_subject(args.path, t)
        if s is None:
            print(f"   t={t:6.2f}s  EMPTY FRAME")
            fails.append(f"empty frame at {t:.2f}s")
            continue
        tag = "CLIPPED" if s["clipped"] else "inside"
        print(f"   t={t:6.2f}s  subject {s['width_pct']:5.1f}% wide  lum {s['mean']:5.1f}  {tag}")
        if s["clipped"]:
            fails.append(f"subject clipped at {t:.2f}s")
        if not (args.subject_min <= s["width_pct"] <= args.subject_max):
            fails.append(
                f"subject {s['width_pct']:.0f}% wide at {t:.2f}s "
                f"(want {args.subject_min}-{args.subject_max}%)"
            )

    print("\n== result ==")
    if fails:
        for f in fails:
            print(f"   FAIL: {f}")
        return 1
    print("   PASS - all gates clear")
    return 0


if __name__ == "__main__":
    sys.exit(main())
