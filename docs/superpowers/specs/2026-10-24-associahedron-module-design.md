# MOD-05 Associahedron — Design

**Date:** 2026-10-24
**Status:** Shipped (bef306c) — amended 2026-10-24 after review to match the shipped asset (see §11)
**Author:** Hermes (proposal), Andrew (intent)
**Scope size:** Project (~1 day)
**Pipeline:** Blender 5.2.3 LTS on Andrew's Mac, driven over Blender MCP → GLB → `ManifoldGlbArticulator`

---

## 1. Intent

Sub-Spacetime Studio has four modules. Each renders an idea *about* spacetime in 3D — but every one of them is a *rendering of a metaphor*: a torus knot standing in for a K3 retraction, a shader sphere standing in for a Hilbert state.

The associahedron is different in kind. It is a genuine polytope whose vertices are exact combinatorial objects (triangulations of a convex polygon / plane binary trees), whose canonical form defines scattering amplitudes in the ABHY / positive-geometry program — and in the default case it **natively lives in 3D**. Nothing is faked or projected. That gives the studio one module where the geometry *is* the mathematics, not a likeness of it.

**Why now:** cheapest route to a defensible fifth module, and it gives the "spacetime is not fundamental" narrative a positive-geometry anchor that is visibly exact rather than decorative.

## 2. Goals

- A fifth live module, `associahedron`, reachable like the other four (dock, palette, keyboard `5`).
- Geometry **baked in Blender** exactly like M01–M04: `scripts/generate_v8_associahedron.py` builds the cage from Loday coordinates, then `public/models/associahedron.glb` ships to the runtime, loaded by `GLTFLoader`.
- Vertex positions come from **Loday's realization** — exact integer coordinates, no hand-placed points.
- The default view (n = 4, 14 vertices) is embedded in 3D **isometrically** — no projection, no distortion.
- The projection sweep for n ≥ 5 is baked as **24 independent convex hulls per order** (`AssoN5_Proj00..23`, `AssoN6_Proj00..23`), stepped by visibility. Shape keys were the original plan and were **disproved during the bake** — see §7.5.
- HUD telemetry reports **true** combinatorial invariants (V, E, F, χ) computed at bake time and asserted at build time — never hardcoded.
- A clearly-labelled Lean 4 scaffold file in the right-hand IDE vault.

## 3. Non-goals (v1)

- No amplituhedron, no momentum-twistor geometry.
- No computed scattering amplitudes, residues, or numerical canonical-form values.
- No runtime hull computation — the polytope is baked, not rebuilt (that is the house pipeline).
- No new audio stems (reuse the existing `phase` shockwave trigger).
- ~~No Director Tour segment~~ — added as Act V (36–45 s; the loop is now 45 s).
- No new responsive layout work; inherit existing mobile rules.
- No α-/Cambrian-associahedron deformation family in v1 (see §7.6).

## 4. Anti-goals

- **Do not** ship a `VERIFIED_ZERO_SORRY` badge. This module is not in `openai/math`; claiming verification would poison the repo's most valuable asset — its honesty about what is proven.
- **Do not** print amplitude values we did not compute.
- **Do not** present the n = 5 / n = 6 views as if they were unprojected 3D.
- **Do not** let a decorative bevel/subdivision destroy the exact cage. Exactness claims are about the cage; the bevelled display mesh is a duplicate with a small width.

## 5. Constraints

- **Blender is remote.** Blender 5.2.3 LTS runs on Andrew's Mac and its MCP addon listens on `127.0.0.1:9876` **there**; Hermes runs on the VPS. An SSH local-forward must be up: `ssh -f -N -L 127.0.0.1:9876:127.0.0.1:9876 andrew@100.69.249.98`. The addon is unauthenticated by design, so the tunnel keeps it loopback-only on both ends.
- **Shape-key constraint:** morph targets need identical topology. Different orders cannot morph into each other, and — measured during the bake — neither can different projection angles *within* an order, because hull membership changes with the angle. Order switching and the projection sweep are therefore both visibility toggles between independently baked hulls.
- Existing architecture: scene modules in `src/engine/shaders/` return `{ group, ...materials }`, cross-faded by `modePresence`, normalised by `SCENE_BASE_SCALES` (0.84 → bounding radius ≈ 2.15, centred at `OPTICAL_CENTER_Y = 0.06`).
- `SceneModeId` is a closed union in `src/types/workstation.ts`; every consumer switches exhaustively.
- Sliders live in `theoremsCatalog.ts`; telemetry in `physicsTelemetryService.ts`; Lean source in `leanRepositoryFiles.ts`.
- Runtime toolchain: npm (`npm ci`, `npm run lint`, `npm run build`); Node ≥ 20, TypeScript 5.6, three 0.170.

## 6. Approaches considered

| Approach | Trade-off | Verdict |
|---|---|---|
| **A. Blender bake over MCP → GLB → GLTFLoader** | Matches M01–M04 exactly: real bevels, materials, `COLOR_0`, shape keys. Costs a bake round-trip and locks topology per order. | **Chosen** |
| **B. Runtime JS hull build** | Live topology changes and a continuous projection sweep, but abandons the house pipeline and loses Blender's materials. | Rejected — this is what the first draft wrongly proposed |
| **C. Node-side `GLTFExporter`** | Real `.glb` in house *format*, no Blender needed — but no art pipeline, no bevels. | Rejected; fallback only if the Mac is unreachable |

## 7. The mathematics

All facts below were **numerically verified** during design (see §9).

### 7.1 Loday realization

Take a plane binary tree with `n` internal nodes and `n + 2` leaves. Label internal nodes `1..n` in in-order. For internal node `i`:

- `L_i` = number of leaves in its left subtree
- `R_i` = number of leaves in its right subtree

The vertex is `x(T) = (L_1·R_1, …, L_n·R_n) ∈ ℝⁿ`. (Note: **no `+1`**. The `(L+1)(R+1)` form belongs to a different, α-weighted family and does *not* satisfy the constant-sum property — checked, and it fails.)

Every vertex satisfies `Σ x_i = n(n+1)/2`, so the polytope is `(n−1)`-dimensional, sitting in the hyperplane `Σx = C`.

Equivalently (Hohlweg–Lange convention): triangulations of a convex `(n+2)`-gon, where triangle `Δ_j(T) = A_i A_j A_k` contributes `δ_j = (j−i)(k−j)`. Both conventions agree on the point set.

| n | vertices `Catalan(n)` | ℝⁿ | Σ | affine dim | view |
|---|---|---|---|---|---|
| **4** | **14** | ℝ⁴ | 10 | **3** | **exact isometric 3D — no projection** |
| 5 | 42 | ℝ⁵ | 15 | 4 | projected to 3D |
| 6 | 132 | ℝ⁶ | 21 | 5 | projected to 3D |

### 7.2 Embedding rule (the trap)

For `n = 4` the hyperplane `Σx = 0` is 3-dimensional, so an orthonormal basis of it embeds the polytope into ℝ³ **isometrically** — exact, distance-preserving, no distortion.

For `n ≥ 5` that hyperplane is 4- or 5-dimensional and **cannot** be embedded in ℝ³. Attempting the basis trick collapses points and produces a hull violating Euler's formula (verified: n = 5 gave V = 41, χ = 16 — nonsense). The correct treatment is a genuine linear projection `P: ℝⁿ → ℝ³` (fixed orthonormal 3×n system), then hull of projected vertices; projection preserves convexity, so the hull of the projected vertices is the projection of the hull.

### 7.3 Face structure (verified for n = 4)

Facets ↔ diagonals of the `(n+2)`-gon: `(n+2)(n−1)/2`. For n = 4 → **9 facets**.

Measured from the actual 3D hull: **V = 14, E = 21, F = 9, χ = 2** ✅

Facet grouping clusters hull triangles into coplanar sets (normal distance < 1e-6, plane offset < 1e-6). The same code returns V = 8, E = 12, F = 6 for a cube, so the counter is validated independently.

### 7.4 Where the math lives in a baked pipeline

The Python generator owns the math (~30 lines: enumerate trees, compute coordinates, embed or project, build mesh). The runtime does **not** recompute geometry; it reads the baked mesh plus a JSON sidecar (`public/models/associahedron.json`, mirrored into `src/data/associahedronInvariants.ts`) holding per-order, per-frame V/E/F/χ and mesh names. It holds **no** per-facet triangle ranges and **no** shape-key labels (neither exists in the asset). The sidecar is checked against the GLB by `node scripts/verify-associahedron.mjs` (unique positions per frame vs sidecar V), and the runtime refuses to show the module if the GLB's frame names disagree with the sidecar. HUD and articulator resolve the sweep through one shared function (`resolveFrameIndex`), so the readout always describes the frame on screen. Caveat: the verify script trusts the sidecar's E/F — an independent re-hull found one frame where the sidecar itself is wrong (§11).

### 7.5 Projection sweep — 24 independent hulls (shape keys disproved)

The first design baked the sweep as shape keys `ProjSweep_00 … ProjSweep_23` on one mesh per order. **That is impossible and was dropped.** Re-hulling a rotating projection showed that the set of points on the hull changes with the angle: n = 5 has 31 hull vertices at the two extreme angles and 27 elsewhere; n = 6 swings between 32 and 39. A morph target cannot add or remove vertices, so a shape-key sweep would display shapes that are not hulls of anything.

What shipped: for each of 24 angles θ_k ∈ [−0.35, +0.35] rad the generator projects the 42 / 132 Loday points with a fixed orthonormal 3-frame rotated by θ_k inside the hyperplane, takes a fresh convex hull, and exports it as its own mesh `AssoN{5,6}_Proj{kk}`. The runtime shows exactly one. Hull **surface vertex counts are 27–31 (n = 5) and 32–39 (n = 6), out of 42 / 132 combinatorial points** — interior points of a projection are not vertices of the shadow. For n = 4 there is a single frame, and the sweep slider is inert; the HUD reads **EXACT 3D**.

### 7.6 Deformation family — deferred

The α-associahedron / Cambrian family `(Σ_left α + 1)(Σ_right α + 1)` is real, but the interpolation path that provably preserves the face lattice at every slider position has not been pinned down. Shipping it risks a polytope that silently changes combinatorial type mid-drag. Deferred rather than faked; the projection sweep supplies the second degree of freedom honestly in the meantime.

## 8. Module specification

### Blender generator — `scripts/generate_v8_associahedron.py` (new)

Mirrors the style and naming discipline of `generate_v7_blender_manifolds.py`:

- Loday coordinates from in-order tree labelling; `assert sum(coords) == n*(n+1)//2` per vertex.
- n = 4: orthonormal hyperplane embedding → exact 3D cage.
- n = 5, 6: orthonormal 3-frame rotated through 24 angles inside the hyperplane → 24 independently hulled meshes `AssoN{5,6}_Proj00..23` (no shape keys; §7.5).
- Per order: `bmesh` cage → duplicate with decorative bevel → material with `COLOR_0` vertex colours → wire overlay.
- Exports **one** `public/models/associahedron.glb` containing `AssoN4` + `AssoN4_Cage`, and empties `AssoN5` / `AssoN6` holding the 24 frame meshes each (wire children are dropped by glTF; the runtime rebuilds them) and writes `public/models/associahedron.json`.
- Prints a manifest (object names, vertex counts, shape-key names) that must match what `ManifoldGlbArticulator` looks for.

Driven over Blender MCP: clear/verify scene → `execute_blender_code` → confirm with `get_scene_info` → export GLB → `scp` the files back to `public/models/` on the VPS.

### Scene module — `src/engine/shaders/associahedronShader.ts` (new)

Shader-only overlay in the house pattern; heavy geometry is the GLB:

```
export interface AssociahedronHandles {
  group: THREE.Group;               // host for the GLB meshes, like k3Handles.group
  vertexMat: THREE.ShaderMaterial;  // glow nodes, placed on the hull's REAL vertices
  poleRingMat: THREE.ShaderMaterial;// global emphasis ring (not a facet selector)
  update(elapsed, poleFocus, sweep): void;
}
export function createAssociahedronScene(): AssociahedronHandles
```

**As shipped (amended):** there is no `facetMat` and no `wireMat` here. The edge lattice is a runtime `EdgesGeometry` per frame (0.2° threshold) owned by the articulator. `vertexMat` shades a `THREE.Points` cloud the articulator builds from each frame's **distinct vertex positions read from the GLB**, so every glow node is a real vertex of the displayed hull. The original build rendered a 42-point Fibonacci lattice here that was not the polytope's vertices; it was removed because it implied structure the mesh does not have.

### Articulator — `src/engine/ManifoldGlbArticulator.ts` (extend)

`updateAssociahedronManifold(elapsed, state)` in the existing style:

- toggles `AssoN4/5/6` visibility from `associahedronOrder`;
- shows the single `AssoN{5,6}_Proj{kk}` hull chosen by `resolveFrameIndex(projectionSweep)` (n ≥ 5 only);
- applies `facetResidueFocus` as a **global** emphasis (emissive + edge opacity of the active hull, vertex-node size, ring position). **Per-facet selection is deferred**: the GLB carries no facet ids, and a runtime coplanar-grouping pass was not built. The slider is labelled "Pole Emphasis" and its caption says it does not select a facet;
- fits each order into the shared optical radius with one uniform scale per order (a similarity, so n = 4 stays isometric up to scale);
- disposes meshes, runtime `EdgesGeometry`/`LineSegments` and vertex `Points`, and logs (instead of swallowing) GLB load failures.

### Sliders (three, in `theoremsCatalog.ts`)

| id | label | symbol | range | role |
|---|---|---|---|---|
| `associahedronOrder` | Associahedron Order | `n` | 4 → 6, step 1 | n = 4: exact 14-vertex hull; n = 5 / 6: hull of the projected 42 / 132 points (27–31 / 32–39 hull vertices) |
| `projectionSweep` | 4D→3D Projection Sweep | `P_{3}` | 0 → 1, step 0.01 | steps through the 24 baked hulls (n ≥ 5); inert at n = 4 ("EXACT 3D") |
| `facetResidueFocus` | Canonical-Form Pole Emphasis | `Ω` | 0 → 1, step 0.01 | global emphasis only; per-facet pole selection deferred |

### Telemetry (`physicsTelemetryService.ts`)

- `computeViewportTelemetry` → V, E, F, χ, dim, projected — read from `associahedron.json`.
- `computeOscilloscopeSample` → driven by facet count / focus position.
- `getQuickActionSpec` → "PUSH TO n+1".
- `resolveActiveAstFocus` → slider index → scaffold Lean line ranges.
- Equation strings: Loday coordinate formula, `Σx = n(n+1)/2`, Catalan count, facet count — structure only.

### Lean scaffold (`leanRepositoryFiles.ts`)

`Associahedron.lean` at `lean/OAI/PositiveGeometry/Associahedron.lean` — real definitions (Catalan recurrence, triangulation enumeration, diagonal ↔ facet bijection) with explicit `sorry` where unproven. New badge `SCAFFOLD_UNVERIFIED` (amber), `statusLabel: 'SCAFFOLD — NOT IN OPENAI/MATH; GEOMETRY EXACT, PROOF UNVERIFIED'`.

### Integration points (14)

1. `scripts/generate_v8_associahedron.py` — **new**, Blender generator
2. `public/models/associahedron.glb` + `associahedron.json` — **new**, baked assets
3. `src/engine/shaders/associahedronShader.ts` — **new**, overlay shader
4. ~~`src/engine/associahedronLoday.ts`~~ — not built; parity is checked by `scripts/verify-associahedron.mjs` against the GLB instead
5. `src/engine/ManifoldGlbArticulator.ts` — load + articulate the new GLB
6. `src/engine/QuantumSpacetimeEngine.ts` — construct, `modePresence`, `SCENE_BASE_SCALES`, per-frame update, dispose
7. `src/types/workstation.ts` — `SceneModeId`, 3 uniform fields, badge value
8. `src/data/theoremsCatalog.ts` — MOD-05 entry
9. `src/data/leanRepositoryFiles.ts` — scaffold file
10. `src/services/physicsTelemetryService.ts` — telemetry + equations
11. `src/main.tsx` — mode branches, module badge, animate hooks
12. `src/components/CommandPaletteModal.tsx` — palette entry
13. `src/hooks/useKeyboardShortcuts.ts` — key `5`
14. `src/components/LeftParameterDock.tsx` — channel accent colour

## 9. Acceptance criteria

- **Bake proven, not claimed:** `AssoN4_Cage` has 14 distinct positions; each `AssoN{5,6}_Proj{kk}` has the distinct-position count its sidecar frame claims (27–31 / 32–39). There are no shape keys.
- n = 4 cage is isometric: pairwise 3D distances match the ℝ⁴ hyperplane distances to 1e-9 in the float64 bake (measured 1.8e-15); after float32 GLB export the error is 1.8e-7, and the runtime adds one uniform display scale.
- The generator asserts 14 / 42 / 132 **combinatorial points** (Catalan) and exact `Σ = n(n+1)/2`. Only n = 4 has all of them as mesh vertices: n = 4 hull → **V 14, E 21, F 9, χ 2**. The projected meshes have 27–31 (n = 5) and 32–39 (n = 6) **hull** vertices; `node scripts/verify-associahedron.mjs` checks each frame's unique positions against the sidecar.
- `npm run lint` and `npm run build` pass.
- Module selectable three ways: dock/palette, keyboard `5`, mode list.
- n = 5 / 6 carry a visible **PROJECTED** indicator; n = 4 shows **EXACT 3D**.
- Badge reads `SCAFFOLD_UNVERIFIED`; no `VERIFIED_ZERO_SORRY` in MOD-05.

## 10. Left to the builder

- Exact colour values consistent with existing module accents.
- Bevel width / segment count for the display mesh.
- Whether the wire overlay is a second GLB mesh or a runtime `EdgesGeometry`.
- Whether the 24 projection keys are evenly spaced rotations or a curated set.

## 11. Review amendments (post-ship audit)

Independent re-hull of the Loday points in Node (three's `ConvexHull`, exact facet grouping at 1e-7, no Blender) against the shipped GLB and sidecar:

- **n = 4: confirmed.** V 14 / E 21 / F 9 / χ 2, all 14 points extreme, smallest dihedral 54.7°, GLB matches to 1.1e-7.
- **48 of 49 frames match** the sidecar exactly.
- **`AssoN6_Proj12` is defective.** True hull V 39 / E 66 / F 29; the baked mesh and sidecar say V 35 / E 60 / F 27. Its smallest adjacent dihedral is **0.483°**, below the generator's `dissolve_limit` angle of **0.5°**, so Blender merged two genuine facets and dropped 4 real vertices. Runtime mitigation (no re-bake): `src/data/associahedronFrameAudit.ts` lists it as defective and both the articulator and the HUD step to the nearest valid frame, so it is never shown or reported. **Re-bake needed:** lower `dissolve_limit` to ≤ 0.1° (smallest true dihedral across all 49 frames is 0.48°), re-export, then empty `DEFECTIVE_FRAMES`.
- **Edge lattice threshold.** At `EdgesGeometry(…, 1°)` five projected frames lost real edges (e.g. `AssoN5_Proj22` drew 43 of 45). The runtime now uses 0.2°, which reproduces the sidecar E on every valid frame.
- **Display scale.** The raw hulls have radius 4.4 / 7.3 / 10.5 units for n = 4 / 5 / 6 — far outside the shared optical sphere (≈ 2.15). Each order now gets one uniform scale.
- **Honesty of decorations.** Facet focus is **global emphasis** (not per-facet); vertex glow sits **on the hull's real vertices** (the Fibonacci lattice was removed).
- **Not fixed (out of scope here):** the Lean scaffold's theorem statements are placeholders (e.g. `loday_sum_const` does not mention `T`; `facet_count` is `9*(n-3) = 9*(n-3)`; the true count is `(n+2)(n-1)/2`). The file stays labelled `SCAFFOLD_UNVERIFIED`; its statements must be rewritten before any proof attempt.
