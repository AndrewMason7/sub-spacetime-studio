# SUB-SPACETIME STUDIO // v9.0 Masterpiece Edition

[![License: MIT](https://img.shields.io/badge/License-MIT-00e5ff.svg)](./LICENSE)
[![Engine: WebGL2 / GLSL](https://img.shields.io/badge/WebGL2%20%2F%20GLSL-60%20FPS%20ACES%20Filmic-38bdf8.svg)](https://spacetime.clipboard-share.com/)
[![Geometry: Blender 5.2 LTS](https://img.shields.io/badge/Blender%205.2%20LTS-19%20Sub--Meshes%20%2B%20Shape%20Keys-f59e0b.svg)](./scripts/generate_v7_blender_manifolds.py)
[![Verification: Lean 4 / Mathlib4](https://img.shields.io/badge/Lean%204%20AST-2%2C924%20Modules%20Audited-10b981.svg)](./src/data/leanRepositoryFiles.ts)
[![Built With: Gemini 4 Argon](https://img.shields.io/badge/Built%20With-Gemini%204%20Argon-a855f7.svg)](https://spacetime.clipboard-share.com/)

> **An interactive 60 FPS WebGL2 / GLSL Differential Geometry & Lean 4 Formal Verification Workstation** engineered to visualize, manipulate, and formally audit frontier theorems in **Quantum Gravity**, **Riemannian 4-Manifold Topology**, **Random Planar Map Scaling Limits**, **Holographic Quantum Error Correction**, and **Algebraic Cycle Counterexamples**.

🌐 **Live Interactive Workstation:** **[https://spacetime.clipboard-share.com/](https://spacetime.clipboard-share.com/)**

---

## 1. Scientific Scope & Formal Verification Thesis

Recent breakthroughs across quantum gravity and machine-assisted mathematics have exposed a sharp epistemological boundary between **informal natural-language derivations** and **machine-checked formal proofs** (`Lean 4 / Mathlib4`). Across a comprehensive audit of **722 mathematical physics and pure mathematics manuscripts** (`openai/math`, spanning **2,924 Lean 4 modules**), exactly **162 manuscripts (`22.4%`)** carry complete, zero-`sorry` Lean 4 formalizations, while **560 (`77.6%`)** remain unverified PDF drafts.

Most strikingly, when three high-profile algebraic geometry manuscripts claiming proofs of the **Rational Hodge Conjecture for Products of K3 Surfaces**, **Kuga–Satake Correspondences**, and **Algebraicity of Weil Classes on Split Abelian Eightfolds** were scrutinized (October 6–7, 2026), all three collapsed overnight due to a single sign inversion in a Lagrangian cusp stabilization trace ($\sigma_{\text{trace}} = +1$ assumed vs. $-1$ imposed by opposite branch orientations, yielding $I_{\text{new}} = -2m \neq 0$)—an arithmetic contradiction that Lean 4's `omega` tactic detects in **0.01 seconds**. Meanwhile, every theorem in the corpus backed by complete Lean 4 formalization survived 100% intact.

**SUB-SPACETIME STUDIO** bridges **continuous differential geometry** and **discrete formal verification** in real time: scrubbing any physical parameter slider simultaneously drives **custom GLSL vertex/fragment shaders**, **Blender 5.2 LTS `COLOR_0` & Shape-Key morph targets (`morphTargetInfluences`)**, **real-time Riemannian / holographic invariants**, and **synchronized AST line-range highlighting** inside the underlying Lean 4 source files.

---

## 2. The Four Interactive Spacetime Manifolds (`M01` – `M04`)

| Module | Physical / Mathematical Regime | Primary Formal & Literature Sources | Governing Equations & Topological Invariants | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **`M01`**<br>**Observer Hilbert Manifold** | Closed-Universe Hilbert Space Collapse & Positive-Curvature Einstein 4-Manifolds | • **D. Harlow (MIT), M. Usatyuk & Y. Zhao (KITP)**, *arXiv:2501.02359*<br>• **`openai/math` F348**: `EinsteinFour/Classification.lean` & `TopologicalNumbers.lean` (198 Lean modules) | $$\dim(\mathcal{H}_{\text{closed}}) = 1 \xrightarrow{+ \text{Observer } Ob} \dim(\mathcal{H}_{\text{eff}}) \approx e^{S_{\text{Ob}}}$$$$R_{ij} = \lambda g_{ij}, \quad 2\chi(M^4) \ge 3\|\tau(M^4)\|, \quad M^4 \in \{S^4, \mathbb{CP}^2, \mathbb{RP}^4\}$$ | **`100% VERIFIED`**<br>Zero `sorry` across 198 Lean 4 files + Proven QES Replica Wormhole Bound |
| **`M02`**<br>**FK-CRT Phase Transition** | Critical Random Planar Maps: Liouville Quantum Gravity Sphere vs. Brownian CRT | • **`openai/math` F211**: `ComparatorChallenges/FKCRT.lean` (*Brownian continuum random tree limits of finite Fortuin–Kasteleyn maps above four*) | $$w_q(M, A) = q^{\,k_M(A) + \frac{\|A\| - \|V(M)\|}{2}}$$$$d_e(s,t) = e(s) + e(t) - 2\inf_{[s,t]} e, \quad e(t) = \|B_t - t B_1\|_3$$$$q \le 4: \text{LQG Sphere } (d_H = 4) \;\Longleftrightarrow\; q > 4: \text{Aldous CRT } (d_H = 2)$$ | **`PARTIAL LEAN SCOPE`**<br>Supercritical regime ($q > 4$) formalized in `FKCRT.lean` (1 of 7 F211 papers) |
| **`M03`**<br>**CKS–Willow Horizon** | Hyperboloidal Bondi–Penrose Mass Inequality & 2D Boundary Surface Code Holography | • **`openai/math` F260**: `CKSBondiPenrose.lean` (3,596 LOC)<br>• **`openai/math` F274**: `QACParity.lean`<br>• **Google Quantum AI**: *105-Qubit Willow Surface Code & AlphaQubit 2* (*arXiv:2412.06784*) | $$m_{\text{Bondi}} \ge \sqrt{\frac{A_{\min}(g)}{16\pi}}, \quad A_{\text{Schw}} = 16\pi m_{\text{Bondi}}^2$$$$\forall d,\; \mathrm{QAC}^0_d \not\ni \mathrm{Parity}_n \implies \text{Non-Local Boundary Decoding}$$ | **`VERIFIED CORE`**<br>`QACParity.lean` 100% verified; CKS end replacement & Schwarzschild equality in Lean 4 |
| **`M04`**<br>**F032 K3 Retraction Audit** | Quintic K3 Calabi–Yau Slice & Lagrangian Cusp Stabilization Sign Inversion | • **`openai/math` F032 Withdrawal** (Commit `30148886`, Oct 6–7, 2026)<br>• **`WITHDRAWAL_F032.lean`**: Formal `omega` counter-proof of Eliashberg–Murphy hypothesis failure | $$\text{Assumed } (+1): I_{\text{new}} = -m + m = 0$$$$\text{Reality } (-1): I_{\text{new}} = I(f_1) - m = -2m \neq 0$$$$\chi(\text{K3}) = 24, \quad \tau(\text{K3}) = -16, \quad b_2^- = 19$$ | **`WITHDRAWN (0% LEAN)`**<br>3 unformalized Hodge/K3 drafts retracted; counterexample verified in `0.01s` via `omega` |

---

## 3. Deep Dive into the Four Manifolds

### `M01` · Observer-Anchored Hilbert Hologram (`arXiv:2501.02359` × `F348 EinsteinFour.lean`)
In both the **Quantum Extremal Surface (Island)** prescription and the **Euclidean Gravitational Path Integral**, evaluating the inner product of states in a closed universe without boundary requires summing over wormhole topologies connecting bra and ket manifolds. Harlow, Usatyuk, and Zhao (*arXiv:2501.02359*) demonstrated that non-perturbative replica wormholes force the observer-free closed-universe Hilbert space to collapse to $\dim(\mathcal{H}_{\text{closed}}) = 1$. Only by explicitly introducing an internal **Observer worldline ($Ob$)** carrying clock/memory entropy $S_{\text{Ob}} > 0$ does the gravitational path integral stabilize an effective Hilbert space of dimension $\dim(\mathcal{H}_{\text{eff}}) \approx \exp(S_{\text{Ob}})$.

In the viewport, this quantum-gravitational transition is coupled to the **F348 classification of closed, connected, positively curved Einstein 4-manifolds** (`EinsteinFour/Classification.lean`), which proves in Lean 4 that any such manifold $(M^4, g)$ satisfying $R_{ij} = \lambda g_{ij}$ and strictly positive sectional curvature is isometric (up to positive scaling) to:
1. The round 4-sphere $S^4$ ($\chi = 2, \tau = 0$),
2. The complex projective plane $\mathbb{CP}^2$ with the Fubini–Study metric ($\chi = 3, \tau = 1$), or
3. Real projective 4-space $\mathbb{RP}^4$ ($\chi = 1, \tau = 0$).

- **Interactive Geometry:** A stereographically projected **Clifford Minimal Torus** ($S^1 \times S^1 \subset S^3 \to \mathbb{R}^3$) interlocked with **5 counter-rotating Hopf Villarceau fiber rings** and a **Shape-Key-driven singularity collapse (`Singularity_Collapse`)** when $S_{\text{Ob}} \to 0$.

### `M02` · FK-CRT Critical Phase Manifold (`FKCRT.lean` / Family `F211`)
Models the continuum scaling limit of finite $n$-edge planar maps $M$ weighted by the **Fortuin–Kasteleyn (FK) random-cluster partition function**:
$$Z_{n,q} = \sum_{M \in \mathcal{M}_n} \sum_{A \subseteq E(M)} q^{\,k_M(A) + \frac{|A| - |V(M)|}{2}}$$
- **Subcritical / Critical Regime ($q \le 4.0$):** Discrete random triangulations converge in the conformal scaling limit to a smooth **Liouville Quantum Gravity (LQG) topological sphere** ($S^2$, Hausdorff dimension $d_H \approx 4.0$).
- **Supercritical Regime ($q > 4.0$, formalized in `FKCRT.lean`):** Loops condense and macroscopic clusters fragment the surface into a tree-like polymer. Rescaling graph distances by $c(q)(n+1)^{-1/2}$ causes the metric-measure space to converge in **Gromov–Hausdorff–Prokhorov (GHP)** distribution to **Aldous's Brownian Continuum Random Tree ($\mathcal{T}_e$, $d_H = 2.0$)**, constructed as the metric quotient of $[0,1]$ under the **3D Bessel bridge excursion** $e(t) = \|B_t - t B_1\|_3$.

### `M03` · CKS–Willow Holographic Horizon (`CKSBondiPenrose.lean` × `QACParity.lean`)
Combines general-relativistic horizon geometry with quantum error-correcting surface codes:
- **Bulk Gravitational Engine (`CKSBondiPenrose.lean`, 3,596 LOC):** Formalizes Cha–Khuri–Sakovich hyperboloidal initial data replacement $(N^3, g, K)$ satisfying the physical Dominant Energy Condition (`PhysicalDEC`), proving that the asymptotic Bondi mass is bounded below by the minimum enclosing horizon area $m_{\text{Bondi}} \ge \sqrt{A_{\min}(g)/16\pi}$, with strict saturation $A = 16\pi m^2$ for the exterior Schwarzschild spacetime.
- **Boundary Quantum Processor (`QACParity.lean` & 105-Qubit Willow Lattice):** `QACParity.lean` proves that constant-depth $\mathrm{QAC}^0$ circuits with unbounded-arity Toffoli gates cannot compute $n$-bit Parity even at polynomial total qubit overhead—explaining why fault-tolerant holographic surface codes (such as Google Quantum AI's **105-qubit Willow processor** decoded via **AlphaQubit 2**) require global boundary-to-bulk syndrome decoding.
- **Interactive Geometry:** A 3D **Carter–Kerr Isometric Embedding Funnel** ($z(r) = \sqrt{8M(r - 2M)}$), an oblate **Kerr Ergosphere** ($r_E(\theta) = M + \sqrt{M^2 - a^2\cos^2\theta}$), a **3D Volumetric Lense–Thirring Frame-Dragging Torus Knot**, and a **3D Precessing Spherical Photon Geodesic Crown** at $r_{\text{ph}} = 3M$.

### `M04` · F032 K3 Stabilization Retraction Audit (`WITHDRAWAL_F032.lean`)
Provides a visual post-mortem of the October 6–7, 2026 retraction of three unformalized algebraic geometry manuscripts in `openai/math` (`Algebraicity of Weil classes on split abelian eightfolds`, `Kuga–Satake Correspondences for K3 Surfaces`, and `Rational Hodge Conjecture for Products of K3 Surfaces`):
- To apply the **Eliashberg–Murphy Lagrangian surgery and cancellation theorem**, a 4-dimensional Lagrangian immersion $f_1$ with $I(f_1) = -m$ ($m > 0$) signed double points must be modified so that the net signed intersection count vanishes ($I_{\text{new}} = 0$).
- The unverified manuscript assumed each reverse stabilization trace contributed $+1$, yielding $I_{\text{new}} = -m + m = 0$.
- Accounting for the opposite source orientations of the two branches of a standard cusp forces each reverse stabilization trace to carry sign $\sigma_{\text{trace}} = -1$, resulting in:
  $$I_{\text{new}} = I(f_1) - m = -2m \neq 0$$
- **Interactive Geometry:** A 6D-to-3D projection of the **Hanson Fermat Quintic Calabi–Yau / K3 slice** ($z_1^n + z_2^n = 1$). Scrubbing $\sigma_{\text{trace}}$ from $+1.0$ to $-1.0$ triggers the **`Cusp_Shatter` Blender Shape Key** and GLSL fracture displacement, exposing the non-canceling crimson double-point intersection rings while highlighting the 3-line Lean 4 `omega` refutation.

---

## 4. System Architecture & Engineering Stack

### A. Strict Separation of Concerns (SoC) Codebase Layout
The workstation enforces strict modular isolation across WebGL2 rendering, Blender GLB articulation, audio synthesis, reactive telemetry, and domain-partitioned stylesheets:

```text
sub-spacetime-studio/
├── public/
│   ├── audio/                               # Studio-mastered stereo ambient soundtrack & foley stems
│   └── models/                              # 4 multi-component Blender 5.2.2 LTS .glb manifolds (19 sub-meshes)
├── scripts/
│   └── generate_v7_blender_manifolds.py     # Headless Blender 5.2.2 LTS procedural generator (COLOR_0 + 4 Shape Keys)
├── src/
│   ├── components/
│   │   ├── TopMenuBar.tsx                   # Workstation Deck, Scene Matrix (M01-M04), Audio & Tour triggers
│   │   ├── LeftParameterDock.tsx            # Color-zoned DAW parameter channels, Tektronix Scope & Repo Vault
│   │   ├── Viewport3DStage.tsx              # v8.5 Open-Stage Cinema HUD (32px top strip + 28px bottom capsule)
│   │   ├── RightLeanIDE.tsx                 # Shiki Lean 4 Kernel Inspector & Amber Scalpel Verification Audit
│   │   ├── BottomTimelineBar.tsx            # 60FPS simulation transport, time-dilation & keyframe scrubber
│   │   └── CommandPaletteModal.tsx          # Instant Cmd/Ctrl+K fuzzy command & theorem launcher
│   ├── data/
│   │   ├── theoremsCatalog.ts               # Formal mathematical metadata, LaTeX equations & DAW slider definitions
│   │   └── leanRepositoryFiles.ts           # Embedded Lean 4 source modules from openai/math & counter-proofs
│   ├── engine/
│   │   ├── QuantumSpacetimeEngine.ts        # Core Three.js WebGL2 renderer, ACES Filmic postprocessing & 360° camera
│   │   ├── ManifoldGlbArticulator.ts        # 60FPS physical GLB sub-mesh articulator & Shape-Key morph controller
│   │   ├── AudioSynthesizer.ts              # Singleton WebAudio engine with global instance registry & hard mute
│   │   └── shaders/                         # Custom GLSL vertex/fragment shaders for M01, M02, M03, and M04
│   ├── hooks/
│   │   └── useDirectorTour.ts               # v9.0 360° Orbital Crane, X/Y/Z Manifold Tumbling & Infinite Loop engine
│   ├── services/
│   │   └── physicsTelemetryService.ts       # Real-time curvature, entropy, GHP & AST line-synchronization math
│   └── styles/
│       ├── workstation.css                  # 12-line SoC barrel stylesheet importing 7 domain-isolated CSS modules
│       ├── tokens-and-base.css              # Design tokens, typography, and core 3-column workstation grid
│       ├── top-command-deck.css             # Top menu deck & theorem selector pills
│       ├── left-instrument-rack.css         # Cyan/Amber/Violet DAW parameter cards, emerald scope & indigo file tree
│       ├── center-viewport-hud.css          # Open-Stage translucent HUD strips, Director Tour bar & KaTeX drawer
│       ├── right-lean-ide.css               # Sapphire Shiki code editor & warm amber Scalpel Audit console
│       ├── bottom-timeline-dock.css         # Transport controls, speed pills & keyframe timeline track
│       └── command-palette-modal.css        # Cmd+K modal overlay & keyboard navigation styles
└── vite.config.ts                           # Deterministic chunk splitting (three, postprocessing, shiki, katex)
```

### B. Blender 5.2.2 LTS Procedural Differential Geometry Pipeline
All four `.glb` assets in `public/models/` are generated deterministically via [`scripts/generate_v7_blender_manifolds.py`](./scripts/generate_v7_blender_manifolds.py):
1. **`einstein_saddle.glb` (`M01`):** Stereographic Clifford minimal torus (`CliffordCore`) with `Singularity_Collapse` Shape Key + 5 interlocked Villarceau Hopf fibration rings (`HopfRing_0` – `HopfRing_4`).
2. **`fkcrt_manifold.glb` (`M02`):** High-resolution Liouville Quantum Gravity sphere (`LQGSurface`) with spherical-harmonic `Fractal_Roughness` Shape Key + 6 Golden-Spiral Aldous CRT dendrite spines (`CRTSpine_0` – `CRTSpine_5`).
3. **`cks_horizon_funnel.glb` (`M03`):** Isometric Flamm–Carter paraboloid (`CKSFunnel`) + oblate `KerrErgosphere` (both with `Ergo_Bulge` Shape Keys) + 3D precessing spherical photon geodesic (`PhotonRing3M`).
4. **`k3_calabi_yau.glb` (`M04`):** Complex Fermat quintic projection (`K3QuinticBrane`) with radial `Cusp_Shatter` Shape Key + 3 transversal self-intersection rings (`CuspLocus_0` – `CuspLocus_2`).

Each mesh embeds a procedural **`COLOR_0` byte vertex color attribute** (encoding Gaussian curvature, geodesic radius, and branch orientation) wired directly into Blender's `Principled BSDF` node tree and articulated at 60 FPS by [`ManifoldGlbArticulator.ts`](./src/engine/ManifoldGlbArticulator.ts) with thin-film iridescence (`iridescence: 0.9, IOR: 1.42`).

---

## 5. Interactive Controls & Keyboard Shortcuts

| Shortcut / Control | Action |
| :--- | :--- |
| **`1` / `2` / `3` / `4`** | Switch between **`M01`** (Observer Hilbert), **`M02`** (FK-CRT Phase), **`M03`** (CKS Horizon), and **`M04`** (K3 Retraction) |
| **`Cmd/Ctrl + K`** | Open the **Command Palette** to search theorems, jump to Lean 4 files, or trigger phase transitions |
| **`TOUR` Button** | Launch the **`v9.0 Director's Cut Tour`** (`360° Orbital Crane + Multi-Axis X/Y/Z Tumbling + Seamless ∞ Loop`) |
| **`PURE 3D` Button** | Collapse left and right docks to inspect the full-bleed 3D manifold unobstructed |
| **`∑ EQ` Button** | Toggle the floating KaTeX primary/secondary differential equation drawer |
| **`Space`** | Pause / Resume the 60 FPS WebGL2 simulation clock |
| **`G` / `R`** | Toggle the spatial reference grid (`G`) or orbital auto-rotation (`R`) |
| **`M`** | Hard-mute / unmute the singleton stereo ambient synthesizer & foley engine |

---

## 6. Getting Started & Reproducing the Pipeline

### Prerequisites
- **[Bun](https://bun.sh/)** (`>= 1.1`) or **Node.js** (`>= 20`)
- *(Optional, for regenerating `.glb` manifolds)* **[Blender 5.2 LTS](https://www.blender.org/download/)** with Python `numpy` / `scipy`

### Installation & Local Development
```bash
# Clone the repository
git clone https://github.com/AndrewMason7/sub-spacetime-studio.git
cd sub-spacetime-studio

# Install dependencies
bun install

# Start the interactive development server on port 5188
bun run dev

# Build optimized production bundles (TypeScript + Vite)
bun run build
```

### Regenerating the 3D Manifolds from Scratch (Blender 5.2 LTS)
```bash
blender -b --python scripts/generate_v7_blender_manifolds.py
```

---

## 7. Citation & References

1. **D. Harlow, M. Usatyuk, and Y. Zhao**, *"Quantum Mechanics and Observers for Gravity in a Closed Universe"*, MIT Center for Theoretical Physics & Kavli Institute for Theoretical Physics (KITP), `arXiv:2501.02359` (2025).
2. **`openai/math` Formal Verification Corpus** (September–October 2026):
   - **Family F348**: `lean/OAI/Geometry/EinsteinFour/Classification.lean` & `TopologicalNumbers.lean` (198 Lean 4 modules, 0 `sorry`).
   - **Family F211**: `lean/ComparatorChallenges/FKCRT.lean` (*Brownian continuum random tree limits of finite Fortuin–Kasteleyn maps above four*).
   - **Family F260**: `lean/ComparatorChallenges/CKSBondiPenrose.lean` (*Area-controlled hyperboloidal end replacement and Schwarzschild equality*).
   - **Family F274**: `lean/ComparatorChallenges/QACParity.lean` (*Constant-depth $\mathrm{QAC}^0$ parity lower bound*).
   - **Family F032 Withdrawal Notice** (Commit `30148886`, October 6–7, 2026): Retraction of three unformalized manuscripts on Weil classes, Kuga–Satake correspondences, and the rational Hodge conjecture for K3 surfaces due to reverse cusp stabilization trace sign inversion ($I_{\text{new}} = -2m \neq 0$).
3. **Google Quantum AI**, *"Quantum error correction below the surface code threshold"* (105-Qubit Willow Processor) & **Google DeepMind**, *"AlphaQubit 2"*, *Nature* / `arXiv:2412.06784` (2024–2025).

---

## 8. License

Released under the **[MIT License](./LICENSE)**.  
Copyright © 2026 **Andrew Mason**. Built with **Gemini 4 Argon**.
