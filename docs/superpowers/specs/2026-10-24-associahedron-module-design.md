# MOD-05 Associahedron — Design

**Date:** 2026-10-24
**Status:** Draft for approval
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
- Shape keys carry the projection sweep for n ≥ 5 (topology is constant within an order, so this is legal).
- HUD telemetry reports **true** combinatorial invariants (V, E, F, χ) computed at bake time and asserted at build time — never hardcoded.
- A clearly-labelled Lean 4 scaffold file in the right-hand IDE vault.

## 3. Non-goals (v1)

- No amplituhedron, no momentum-twistor geometry.
- No computed scattering amplitudes, residues, or numerical canonical-form values.
- No runtime hull computation — the polytope is baked, not rebuilt (that is the house pipeline).
- No new audio stems (reuse the existing `phase` shockwave trigger).
- No Director Tour segment (deferred to v1.1).
- No new responsive layout work; inherit existing mobile rules.
- No α-/Cambrian-associahedron deformation family in v1 (see §7.6).

## 4. Anti-goals

- **Do not** ship a `VERIFIED_ZERO_SORRY` badge. This module is not in `openai/math`; claiming verification would poison the repo's most valuable asset — its honesty about what is proven.
- **Do not** print amplitude values we did not compute.
- **Do not** present the n = 5 / n = 6 views as if they were unprojected 3D.
- **Do not** let a decorative bevel/subdivision destroy the exact cage. Exactness claims are about the cage; the bevelled display mesh is a duplicate with a small width.

## 5. Constraints

- **Blender is remote.** Blender 5.2.3 LTS runs on Andrew's Mac and its MCP addon listens on `127.0.0.1:9876` **there**; Hermes runs on the VPS. An SSH local-forward must be up: `ssh -f -N -L 127.0.0.1:9876:127.0.0.1:9876 andrew@100.69.249.98`. The addon is unauthenticated by design, so the tunnel keeps it loopback-only on both ends.
- **Shape-key constraint:** morph targets need identical topology. n = 4 (14 verts), n = 5 (42), n = 6 (132) **cannot** morph into each other. Order switching = visibility toggle between three baked meshes; the projection sweep = shape keys *within* one order.
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

The Python generator owns the math (~30 lines: enumerate trees, compute coordinates, embed or project, build mesh). The runtime does **not** recompute geometry; it reads the baked mesh plus a JSON sidecar (`public/models/associahedron.json`) holding per-order V/E/F/χ, per-facet triangle index ranges and per-shape-key labels. The sidecar is emitted by the same script and asserted by `npm run verify:math`, so the HUD cannot drift from the mesh.

### 7.5 Projection sweep as shape keys

Within one order the vertex count is fixed, so a family of projections can be baked as shape keys: `ProjSweep_00 … ProjSweep_23` (24 rotated 3D projections of the same 4D/5D point set). The runtime maps the slider to a cross-fade between the two nearest keys. For n = 4 the keys are absent and the HUD reads **EXACT 3D**.

### 7.6 Deformation family — deferred

The α-associahedron / Cambrian family `(Σ_left α + 1)(Σ_right α + 1)` is real, but the interpolation path that provably preserves the face lattice at every slider position has not been pinned down. Shipping it risks a polytope that silently changes combinatorial type mid-drag. Deferred rather than faked; the projection sweep supplies the second degree of freedom honestly in the meantime.

## 8. Module specification

### Blender generator — `scripts/generate_v8_associahedron.py` (new)

Mirrors the style and naming discipline of `generate_v7_blender_manifolds.py`:

- Loday coordinates from in-order tree labelling; `assert sum(coords) == n*(n+1)//2` per vertex.
- n = 4: orthonormal hyperplane embedding → exact 3D cage.
- n = 5, 6: fixed orthonormal 3×n projection → 3D cage + 24 baked projection shape keys.
- Per order: `bmesh` cage → duplicate with decorative bevel → material with `COLOR_0` vertex colours → wire overlay.
- Exports **one** `public/models/associahedron.glb` containing `AssoN4`, `AssoN5`, `AssoN6` (plus wire children) and writes `public/models/associahedron.json`.
- Prints a manifest (object names, vertex counts, shape-key names) that must match what `ManifoldGlbArticulator` looks for.

Driven over Blender MCP: clear/verify scene → `execute_blender_code` → confirm with `get_scene_info` → export GLB → `scp` the files back to `public/models/` on the VPS.

### Scene module — `src/engine/shaders/associahedronShader.ts` (new)

Shader-only overlay in the house pattern; heavy geometry is the GLB:

```
export interface AssociahedronHandles {
  group: THREE.Group;               // host for the GLB meshes, like k3Handles.group
  wireMat: THREE.ShaderMaterial;    // edge lattice glow
  vertexMat: THREE.ShaderMaterial;  // glowing vertex nodes
  facetMat: THREE.ShaderMaterial;   // facet highlight driven by facet id
}
export function createAssociahedronScene(): AssociahedronHandles
```

### Articulator — `src/engine/ManifoldGlbArticulator.ts` (extend)

`updateAssociahedronManifold(elapsed, state)` in the existing style:

- toggles `AssoN4/5/6` visibility from `associahedronOrder`;
- drives `ProjSweep_*` influences from `projectionSweep` (n ≥ 5 only);
- drives facet highlight and vertex pulse from `facetResidueFocus`;
- disposes cleanly alongside the other four.

### Sliders (three, in `theoremsCatalog.ts`)

| id | label | symbol | range | role |
|---|---|---|---|---|
| `associahedronOrder` | Associahedron Order | `n` | 4 → 6, step 1 | shows 14 / 42 / 132-vertex mesh; 5–6 are projected views |
| `projectionSweep` | 4D→3D Projection Sweep | `P_{3}` | 0 → 1, step 0.01 | cross-fades baked projection shape keys (n ≥ 5); inert at n = 4 ("EXACT 3D") |
| `facetResidueFocus` | Canonical-Form Pole Focus | `\Omega` | 0 → 1, step 0.01 | sweeps the highlighted facet — the pole the canonical form localises on |

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
4. `src/engine/associahedronLoday.ts` — **new**, math mirrored for `verify:math` parity against the baked cage
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

- **Bake proven, not claimed:** `get_scene_info` shows `AssoN4` 14 verts / `AssoN5` 42 / `AssoN6` 132 before export; the exported GLB then loads headlessly through `GLTFLoader` with those vertex counts and shape-key names.
- n = 4 cage is isometric: pairwise 3D distances match the ℝ⁴ hyperplane distances to 1e-9.
- `npm run verify:math` asserts 14 / 42 / 132 vertices, exact `Σ = n(n+1)/2`, n = 4 hull → **V 14, E 21, F 9, χ 2**, cube sanity → 8/12/6.
- `npm run lint` and `npm run build` pass.
- Module selectable three ways: dock/palette, keyboard `5`, mode list.
- n = 5 / 6 carry a visible **PROJECTED** indicator; n = 4 shows **EXACT 3D**.
- Badge reads `SCAFFOLD_UNVERIFIED`; no `VERIFIED_ZERO_SORRY` in MOD-05.

## 10. Left to the builder

- Exact colour values consistent with existing module accents.
- Bevel width / segment count for the display mesh.
- Whether the wire overlay is a second GLB mesh or a runtime `EdgesGeometry`.
- Whether the 24 projection keys are evenly spaced rotations or a curated set.
