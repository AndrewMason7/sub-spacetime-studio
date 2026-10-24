# MOD-05 Associahedron — Design

**Date:** 2026-10-24
**Status:** Draft for approval
**Author:** Hermes (proposal), Andrew (intent)
**Scope size:** Project (~1 day)

---

## 1. Intent

Sub-Spacetime Studio has four modules. Each renders an idea *about* spacetime in 3D — but every one of them is a *rendering of a metaphor*: a torus knot standing in for a K3 retraction, a shader sphere standing in for a Hilbert state.

The associahedron is different in kind. It is a genuine polytope whose vertices are exact combinatorial objects (triangulations of a convex polygon / plane binary trees), whose canonical form defines scattering amplitudes in the ABHY / positive-geometry program — and in the default case it **natively lives in 3D**. Nothing is faked or projected. That gives the studio one module where the geometry *is* the mathematics, not a likeness of it.

**Why now:** cheapest route to a defensible fifth module, and it gives the "spacetime is not fundamental" narrative a positive-geometry anchor that is visibly exact rather than decorative.

## 2. Goals

- A fifth live module, `associahedron`, reachable like the other four (dock, palette, keyboard `5`).
- Vertices generated from **Loday's realization** — exact integer coordinates, no hand-placed points.
- The default view (n = 4, 14 vertices) embedded in 3D **isometrically** — no projection, no distortion.
- Three sliders consistent with existing convention (label, symbol, min/max/step, description).
- HUD telemetry reporting **true** combinatorial invariants (vertex count = Catalan, facet count, Euler characteristic), computed from the hull — never hardcoded.
- A clearly-labelled Lean 4 scaffold file in the right-hand IDE vault.

## 3. Non-goals (v1)

- No amplituhedron, no momentum-twistor geometry.
- No computed scattering amplitudes, residues, or numerical canonical-form values.
- No Blender/GLB bake; the polytope is built at runtime (14 vertices is nothing).
- No new audio stems (reuse the existing `phase` shockwave trigger).
- No Director Tour segment (deferred to v1.1).
- No new responsive layout work; inherit existing mobile rules.
- No α-/Cambrian-associahedron deformation family in v1 (see §7.4 — needs a formula we verify before shipping).

## 4. Anti-goals

- **Do not** ship a `VERIFIED_ZERO_SORRY` badge. This module is not in `openai/math`; claiming verification would poison the repo's most valuable asset — its honesty about what is proven.
- **Do not** print amplitude values we did not compute.
- **Do not** present the n = 5 / n = 6 views as if they were unprojected 3D.

## 5. Constraints

- Existing architecture: each mode is a `create*Scene()` module in `src/engine/shaders/` returning `{ group, ...materials }`, cross-faded by `modePresence`, normalised by `SCENE_BASE_SCALES` (0.84 → bounding radius ≈ 2.15, centred at `OPTICAL_CENTER_Y = 0.06`).
- `SceneModeId` is a closed union in `src/types/workstation.ts`; every consumer switches exhaustively.
- Sliders live in `theoremsCatalog.ts` per mode; telemetry in `physicsTelemetryService.ts`; Lean source in `leanRepositoryFiles.ts`.
- Toolchain is npm (`npm ci`, `npm run lint`, `npm run build`); Node ≥ 20, TypeScript 5.6, three 0.170.

## 6. Approaches considered

| Approach | Trade-off | Verdict |
|---|---|---|
| **A. Loday coordinates + runtime convex hull** | Exact integer vertices, hull computed once per n; 3D default needs zero projection. ~300 lines total. | **Chosen** |
| **B. Hand-authored mesh from published figures** | Fastest to look right, but vertex positions would be invented — defeats the entire point of choosing this module. | Rejected |
| **C. Precompute vertices offline in Python → JSON/GLB** | Matches the existing `v7` Blender pipeline, but adds a build step and a data file for 14 points JS computes in microseconds. | Rejected (overkill) |

## 7. The mathematics

All facts below were **numerically verified** during design (see §9 for the harness).

### 7.1 Loday realization

Take a plane binary tree with `n` internal nodes and `n + 2` leaves. Label internal nodes `1..n` in in-order. For internal node `i`:

- `L_i` = number of leaves in its left subtree
- `R_i` = number of leaves in its right subtree

The vertex is `x(T) = (L_1·R_1, …, L_n·R_n) ∈ ℝⁿ`. (Note: **no `+1`**. The `(L+1)(R+1)` form belongs to a different, α-weighted family and does *not* satisfy the constant-sum property — checked, and it fails.)

Every vertex satisfies `Σ x_i = C` where `C = n(n+1)/2`, so the polytope is `(n−1)`-dimensional, sitting in the hyperplane `Σx = C`.

Equivalently (Hohlweg–Lange convention): triangulations of a convex `(n+2)`-gon, where triangle `Δ_j(T) = A_i A_j A_k` contributes `δ_j = (j−i)(k−j)`. Both conventions agree on the point set.

| n | vertices `Catalan(n)` | ℝⁿ | Σ | affine dim | view |
|---|---|---|---|---|---|
| **4** | **14** | ℝ⁴ | 10 | **3** | **exact isometric 3D — no projection** |
| 5 | 42 | ℝ⁵ | 15 | 4 | projected to 3D |
| 6 | 132 | ℝ⁶ | 21 | 5 | projected to 3D |

### 7.2 Embedding rule (the trap)

For `n = 4` the hyperplane `Σx = 0` is 3-dimensional, so an orthonormal basis of it embeds the polytope into ℝ³ **isometrically** — exact, distance-preserving, no distortion.

For `n ≥ 5` the hyperplane is 4- or 5-dimensional and **cannot** be embedded in ℝ³. Attempting the basis trick collapses points together and produces a hull that violates Euler's formula (verified: n = 5 gave V = 41 and χ = 16 — nonsense). The correct treatment is a genuine linear projection `P: ℝⁿ → ℝ³` (fixed orthonormal 3×n system), then hull of the projected vertices; the hull of projected vertices equals the projection of the hull because projection preserves convexity. Counts change under projection and the HUD must say so.

### 7.3 Face structure (verified for n = 4)

Facets ↔ diagonals of the `(n+2)`-gon: `(n+2)(n−1)/2`. For n = 4 → **9 facets**.

Measured from the actual 3D hull: **V = 14, E = 21, F = 9, χ = 2** ✅

Facet grouping is done by clustering hull triangles into coplanar sets (normal distance < 1e-6, plane offset < 1e-6). The same code returns V = 8, E = 12, F = 6 for a cube, so the counter is validated independently.

### 7.4 Deformation (why slider 2 is a projection sweep)

The α-associahedron / Cambrian family `(Σ_left α + 1)(Σ_right α + 1)` is a real deformation family, but the exact formula and the interpolation path that provably preserves combinatorial type have not been pinned down to our satisfaction. Shipping it would risk a polytope that silently changes face lattice mid-slider.

v1 therefore gets its second degree of freedom from something exact: **the projection direction**. For n ≥ 5, sweeping the 3D projection plane rotates the "shadow" of a 4D/5D object — legitimate, visually striking, and honest. For n = 4 the control is inert and the HUD explains that no projection exists — which is itself the teaching moment of the module.

## 8. Module specification

### Scene module — `src/engine/shaders/associahedronShader.ts` (new)

```
export interface AssociahedronHandles {
  group: THREE.Group;
  solidMat: THREE.ShaderMaterial;   // fresnel + facet glow, matching studio aesthetic
  wireMat: THREE.ShaderMaterial;    // edge lattice
  vertexMat: THREE.ShaderMaterial;  // glowing vertex nodes
  rebuild(order: number): void;     // rebuild hull; called only when n crosses an integer
}
export function createAssociahedronScene(): AssociahedronHandles
```

- Pure math in a dependency-free module `src/engine/associahedronLoday.ts`: `lodayVertices(n) → Float64Array`, `embed(points, n) → { coords, projected }`, `faceLattice(points) → { V, E, F }`. No `three` import → verifyable headlessly.
- Hull + per-triangle `aFacetId` attribute (coplanar clustering) so one uniform glows one facet.
- Vertices as an `InstancedMesh` of low-poly icosahedra; edges as `LineSegments` from hull boundary edges.
- `rebuild()` on order change only, never per frame.

### Sliders (three, in `theoremsCatalog.ts`)

| id | label | symbol | range | role |
|---|---|---|---|---|
| `associahedronOrder` | Associahedron Order | `n` | 4 → 6, step 1 | picks 14 / 42 / 132 vertices; 5–6 are projected views |
| `projectionSweep` | 4D→3D Projection Sweep | `P_{3}` | 0 → 1, step 0.01 | rotates the projection plane for n ≥ 5; inert at n = 4 (HUD states "EXACT 3D") |
| `facetResidueFocus` | Canonical-Form Pole Focus | `\Omega` | 0 → 1, step 0.01 | sweeps the highlighted facet — the pole the canonical form is localised on |

### Telemetry (`physicsTelemetryService.ts`)

- `resolveActiveAstFocus` → slider index → scaffold Lean line ranges.
- `computeViewportTelemetry` → `V`, `E`, `F`, `χ`, `dimension`, `projected`.
- `computeOscilloscopeSample` → driven by facet count / focus position.
- `getQuickActionSpec` → "PUSH TO n+1".
- Equation strings: Loday coordinate formula, `Σx = n(n+1)/2`, Catalan vertex count, facet count. Statements of structure only.

### Lean scaffold (`leanRepositoryFiles.ts`)

`Associahedron.lean` at `lean/OAI/PositiveGeometry/Associahedron.lean` — real definitions (Catalan recurrence, triangulation enumeration, diagonal ↔ facet bijection) with explicit `sorry` where unproven. New badge value `SCAFFOLD_UNVERIFIED` (amber), `statusLabel: 'SCAFFOLD — NOT IN OPENAI/MATH; GEOMETRY EXACT, PROOF UNVERIFIED'`.

### Integration points (11 files)

1. `src/types/workstation.ts` — `SceneModeId`, 3 new `SimulationUniformState` fields, new badge value
2. `src/engine/associahedronLoday.ts` — **new**, pure math
3. `src/engine/shaders/associahedronShader.ts` — **new**, scene module
4. `src/engine/QuantumSpacetimeEngine.ts` — construct, `modePresence`, `SCENE_BASE_SCALES`, per-frame update, dispose
5. `src/data/theoremsCatalog.ts` — MOD-05 entry
6. `src/data/leanRepositoryFiles.ts` — scaffold file
7. `src/services/physicsTelemetryService.ts` — telemetry + equations
8. `src/main.tsx` — mode switch branches, module badge, animate hooks
9. `src/components/CommandPaletteModal.tsx` — palette entry
10. `src/hooks/useKeyboardShortcuts.ts` — key `5`
11. `src/components/LeftParameterDock.tsx` — channel accent colour

## 9. Acceptance criteria

- `npm run lint` and `npm run build` pass.
- `npm run verify:math` (new script, runs on Node ≥ 22 with type stripping) asserts:
  - vertex counts 14 / 42 / 132 for n = 4 / 5 / 6;
  - `Σ x_i = n(n+1)/2` exactly for every vertex;
  - n = 4 hull → **V = 14, E = 21, F = 9, χ = 2**;
  - cube sanity check → V = 8, E = 12, F = 6 (proves the counter, not just the polytope);
  - n = 4 3D embedding preserves pairwise distances to 1e-9 (isometry proof).
- Module selectable three ways: dock/palette, keyboard `5`, mode list.
- n = 5 / 6 views carry a visible **PROJECTED** indicator; n = 4 shows **EXACT 3D**.
- Badge reads `SCAFFOLD_UNVERIFIED`; no `VERIFIED_ZERO_SORRY` in MOD-05.

## 10. Left to the builder

- Exact colour values consistent with existing module accents.
- Whether vertex nodes bloom individually or share one instanced shader path.
- Shader micro-detail (fresnel curve, iridescence) matching the studio's existing look.
- `ConvexHull` vs. a hand-rolled incremental hull — only the resulting counts matter.
