// Runtime audit of the baked MOD-05 frames. NOT generated.
//
// History: the first bake merged facets below 0.5°, which silently fused two
// genuinely distinct facets on AssoN6_Proj12 (0.483° apart) and dropped 4 real
// vertices — sidecar said V35/E60/F27 where the true hull is V39/E66/F29. An
// independent re-hull found it; the position-only verifier could not, because
// the sidecar itself was wrong.
//
// Fixed at the source: scripts/generate_v8_associahedron.py now dissolves at
// 0.1° and refuses to export if any two adjacent facets are closer than 0.2°.
// The GLB was re-baked and every frame now matches an independent hull.
//
// This table stays as a runtime safety net for any future bake regression: list
// a frame index here and the runtime will never show it nor report its numbers.
import { ASSOCIAHEDRON_ORDERS, frameIndexFor } from './associahedronInvariants';

export const DEFECTIVE_FRAMES: Readonly<Record<4 | 5 | 6, readonly number[]>> = {
  4: [],
  5: [],
  6: []
};

/** Sweep → frame index, skipping known-defective frames (nearest valid, ties go up). */
export function resolveFrameIndex(sweep: number, order: 4 | 5 | 6): number {
  const wanted = frameIndexFor(sweep, order);
  const bad = DEFECTIVE_FRAMES[order];
  if (!bad.includes(wanted)) return wanted;
  const count = ASSOCIAHEDRON_ORDERS[order].frames.length;
  for (let d = 1; d < count; d++) {
    if (wanted + d < count && !bad.includes(wanted + d)) return wanted + d;
    if (wanted - d >= 0 && !bad.includes(wanted - d)) return wanted - d;
  }
  return wanted;
}

/** Same as `invariantsFor`, but through the defect-aware frame resolver. */
export function auditedInvariantsFor(order: 4 | 5 | 6, sweep: number) {
  const data = ASSOCIAHEDRON_ORDERS[order];
  const frameIndex = resolveFrameIndex(sweep, order);
  return { ...data, frameIndex, frame: data.frames[frameIndex] };
}
