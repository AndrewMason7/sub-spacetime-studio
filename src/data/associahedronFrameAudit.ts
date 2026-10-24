// Hand-maintained runtime audit of the baked MOD-05 frames. NOT generated.
//
// An independent re-hull of the Loday points (three/examples ConvexHull, exact
// facet grouping at 1e-7) matches the sidecar for 48 of 49 frames. One does not:
//
//   AssoN6_Proj12  sidecar V35 E60 F27  vs  true hull V39 E66 F29
//
// Its smallest adjacent dihedral angle is 0.483°, below the generator's
// dissolve_limit of 0.5°, so Blender merged two genuinely distinct facets and
// dropped 4 real vertices. The mesh is therefore NOT a faithful hull, and its
// sidecar counts are wrong. Until a re-bake (dissolve angle ≤ 0.1°) replaces it,
// the runtime never shows it and the HUD never reports it: both resolve the
// sweep through `resolveFrameIndex`, which steps over defective frames.
import { ASSOCIAHEDRON_ORDERS, frameIndexFor } from './associahedronInvariants';

export const DEFECTIVE_FRAMES: Readonly<Record<4 | 5 | 6, readonly number[]>> = {
  4: [],
  5: [],
  6: [12]
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
