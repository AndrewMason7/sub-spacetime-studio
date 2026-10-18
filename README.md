# SUB-SPACETIME STUDIO

[![License: MIT](https://img.shields.io/badge/License-MIT-00e5ff.svg)](./LICENSE)
[![Engine: WebGL2 / GLSL](https://img.shields.io/badge/WebGL2%20%2F%20GLSL-60%20FPS%20ACES%20Filmic-38bdf8.svg)](https://spacetime.clipboard-share.com/)
[![Geometry: Blender 5.2 LTS](https://img.shields.io/badge/Blender%205.2%20LTS-19%20Sub--Meshes%20%2B%20Shape%20Keys-f59e0b.svg)](./scripts/generate_v7_blender_manifolds.py)
[![Verification: Lean 4 / Mathlib4](https://img.shields.io/badge/Lean%204%20AST-2%2C924%20Modules%20Audited-10b981.svg)](./src/data/leanRepositoryFiles.ts)
[![Audio: Procedural Ambient & Foley](https://img.shields.io/badge/Audio-WebAudio%20%2B%20Convolution%20Reverb-ec4899.svg)](./scripts/generate_studio_audio.py)
[![Built With: Gemini 4 Argon](https://img.shields.io/badge/Built%20With-Gemini%204%20Argon-a855f7.svg)](https://spacetime.clipboard-share.com/)

> **An interactive 60 FPS WebGL2 / GLSL Differential Geometry & Lean 4 Formal Verification Workstation** engineered to visualize, manipulate, and formally audit frontier theorems in **Quantum Gravity**, **Riemannian 4-Manifold Topology**, **Random Planar Map Scaling Limits**, **Holographic Quantum Error Correction**, and **Algebraic Cycle Counterexamples**.

**Live Interactive Workstation:** **[https://sub-spacetime.ai.studio/](https://sub-spacetime.ai.studio/)**

---

## Table of Contents

1. [Scientific Scope & Formal Verification Thesis](#1-scientific-scope--formal-verification-thesis)
2. [The Four Interactive Spacetime Manifolds (`M01` - `M04`)](#2-the-four-interactive-spacetime-manifolds-m01---m04)
3. [Deep Dive into the Manifolds](#3-deep-dive-into-the-manifolds)
   - [M01 - Observer Hilbert Manifold](#m01---observer-anchored-hilbert-hologram-arxiv250102359--f348)
   - [M02 - FK-CRT Critical Phase Manifold](#m02---fk-crt-critical-phase-manifold-fkcrtlean--family-f211)
   - [M03 - CKS-Willow Holographic Horizon](#m03---cks-willow-holographic-horizon-cksbondipenroselean--qacparitylean)
   - [M04 - F032 K3 Retraction Audit](#m04---f032-k3-retraction-audit-withdrawal_f032lean)
4. [System Architecture & Engineering Stack](#4-system-architecture--engineering-stack)
   - [A. Modular Separation of Concerns (SoC) Codebase Layout](#a-modular-separation-of-concerns-soc-codebase-layout)
   - [B. Blender 5.2.2 LTS Procedural Geometry Pipeline](#b-blender-522-lts-procedural-geometry-pipeline)
   - [C. Custom GLSL Shader Architecture](#c-custom-glsl-shader-architecture)
   - [D. Studio Audio Synthesizer & Convolution Reverb](#d-studio-audio-synthesizer--convolution-reverb)
5. [Interactive Features & UI Controls](#5-interactive-features--ui-controls)
   - [Director's Cut 360-Degree Orbital Crane Tour](#directors-cut-360-degree-orbital-crane-tour)
   - [Shiki Lean 4 AST Line-Synchronization](#shiki-lean-4-ast-line-synchronization)
   - [Command Palette (`Cmd/Ctrl + K`)](#command-palette-cmdctrl--k)
   - [Tektronix Oscilloscope & DAW Parameter Channels](#tektronix-oscilloscope--daw-parameter-channels)
6. [Keyboard Shortcuts & Navigation](#6-keyboard-shortcuts--navigation)
7. [Getting Started & Reproducing the Pipeline](#7-getting-started--reproducing-the-pipeline)
   - [Prerequisites](#prerequisites)
   - [Installation & Local Development](#installation--local-development)
   - [Regenerating 3D Manifolds from Scratch (Blender 5.2 LTS)](#regenerating-3d-manifolds-from-scratch-blender-52-lts)
   - [Regenerating Studio Audio & Foley Stems](#regenerating-studio-audio--foley-stems)
8. [Citation & Academic References](#8-citation--academic-references)
9. [License](#9-license)

---

## 1. Scientific Scope & Formal Verification Thesis

Recent breakthroughs across quantum gravity, differential topology, and machine-assisted mathematics have exposed a sharp epistemological boundary between **informal natural-language derivations** and **machine-checked formal proofs** (`Lean 4 / Mathlib4`). Across an extensive audit of **722 mathematical physics and pure mathematics manuscripts** (`openai/math`, spanning **2,924 Lean 4 modules**), exactly **162 manuscripts (22.4%)** carry complete, zero-`sorry` Lean 4 formalizations, while **560 (77.6%)** remain unverified PDF drafts.

Most strikingly, when three high-profile algebraic geometry manuscripts claiming proofs of the **Rational Hodge Conjecture for Products of K3 Surfaces**, **Kuga-Satake Correspondences**, and **Algebraicity of Weil Classes on Split Abelian Eightfolds** were scrutinized (October 6-7, 2026), all three collapsed overnight due to a single sign inversion in a Lagrangian cusp stabilization trace:

```text
Assumed:  sigma_trace = +1  =>  I_new = -m + m = 0
Reality:  sigma_trace = -1  =>  I_new = I(f1) - m = -2m != 0
```

Because the **Eliashberg-Murphy Lagrangian surgery and cancellation theorem** requires an exact vanishing double-point count (`I_new = 0`), the orientation clash invalidates the hypothesis entirely -- an arithmetic contradiction that Lean 4's `omega` decision tactic proves in **0.01 seconds**. In stark contrast, every theorem in the corpus verified with machine-checked Lean 4 formal proofs survived 100% intact.

**SUB-SPACETIME STUDIO** bridges **continuous differential geometry** and **discrete formal verification** in real time: scrubbing any physical parameter slider simultaneously drives:
1. **Custom GLSL vertex and fragment shaders** computing analytic curvature and phase dynamics.
2. **Blender 5.2 LTS `COLOR_0` vertex attributes & Shape-Key morph targets (`morphTargetInfluences`)**.
3. **Real-time Riemannian and holographic invariants** streamed through a Tektronix oscilloscope.
4. **Synchronized AST line-range highlighting** inside the underlying Lean 4 source modules.

---

## 2. The Four Interactive Spacetime Manifolds (`M01` - `M04`)

| Module | Physical / Mathematical Regime | Primary Formal & Literature Sources | Governing Equations & Topological Invariants | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **`M01`**<br>**Observer Hilbert Manifold** | Closed-Universe Hilbert Space Collapse & Positive-Curvature Einstein 4-Manifolds | - **D. Harlow (MIT), M. Usatyuk & Y. Zhao (KITP)**, *arXiv:2501.02359*<br>- **`openai/math` F348**: `EinsteinFour/Classification.lean` & `TopologicalNumbers.lean` (198 Lean modules) | `dim(H_closed) = 1 -> dim(H_eff) ~= e^(S_Ob)`<br>`R_ij = lambda * g_ij, 2*chi(M^4) >= 3*|tau(M^4)|`<br>`M^4 in {S^4, CP^2, RP^4}` | **`100% VERIFIED`**<br>Zero `sorry` across 198 Lean 4 files + Proven QES Replica Wormhole Bound |
| **`M02`**<br>**FK-CRT Phase Transition** | Critical Random Planar Maps: Liouville Quantum Gravity Sphere vs. Brownian CRT | - **`openai/math` F211**: `ComparatorChallenges/FKCRT.lean` (*Brownian continuum random tree limits of finite Fortuin-Kasteleyn maps above four*) | `w_q(M, A) = q^(k_M(A) + (|A| - |V(M)|)/2)`<br>`d_e(s,t) = e(s) + e(t) - 2*inf(e), e(t) = ||B_t - t*B_1||_3`<br>`q <= 4: LQG Sphere (d_H = 4) <=> q > 4: Aldous CRT (d_H = 2)` | **`PARTIAL LEAN SCOPE`**<br>Supercritical regime (q > 4) formalized in `FKCRT.lean` (1 of 7 F211 papers) |
| **`M03`**<br>**CKS-Willow Horizon** | Hyperboloidal Bondi-Penrose Mass Inequality & 2D Boundary Surface Code Holography | - **`openai/math` F260**: `CKSBondiPenrose.lean` (3,596 LOC)<br>- **`openai/math` F274**: `QACParity.lean`<br>- **Google Quantum AI**: *105-Qubit Willow Surface Code & AlphaQubit 2* (*arXiv:2412.06784*) | `m_Bondi >= sqrt(A_min(g) / (16*pi)), A_Schw = 16*pi*m_Bondi^2`<br>`for all d, QAC^0_d does not contain Parity_n => Non-Local Boundary Decoding` | **`VERIFIED CORE`**<br>`QACParity.lean` 100% verified; CKS end replacement & Schwarzschild equality in Lean 4 |
| **`M04`**<br>**F032 K3 Retraction Audit** | Quintic K3 Calabi-Yau Slice & Lagrangian Cusp Stabilization Sign Inversion | - **`openai/math` F032 Withdrawal** (Commit `30148886`, Oct 6-7, 2026)<br>- **`WITHDRAWAL_F032.lean`**: Formal `omega` counter-proof of Eliashberg-Murphy hypothesis failure | `Assumed (+1): I_new = -m + m = 0`<br>`Reality (-1): I_new = I(f1) - m = -2m != 0`<br>`chi(K3) = 24, tau(K3) = -16, b_2^- = 19` | **`WITHDRAWN (0% LEAN)`**<br>3 unformalized Hodge/K3 drafts retracted; counterexample verified in 0.01s via `omega` |

---

## 3. Deep Dive into the Manifolds

### `M01` - Observer-Anchored Hilbert Hologram (arXiv:2501.02359 / F348)
In both the **Quantum Extremal Surface (Island)** prescription and the **Euclidean Gravitational Path Integral**, evaluating the inner product of quantum states in a closed universe without spatial boundary requires summing over spacetime topologies connecting bra and ket manifolds. Harlow, Usatyuk, and Zhao (*arXiv:2501.02359*) demonstrated that non-perturbative replica wormholes force the observer-free closed-universe Hilbert space to collapse to:

```text
dim(H_closed) = 1
```

Zero superposition, zero dynamics, and zero entropic information survive. Only by explicitly introducing an internal **Observer worldline (Ob)** carrying clock/memory entropy `S_Ob > 0` does the path integral stabilize an effective Hilbert space of dimension `dim(H_eff) ~= exp(S_Ob)`.

In the workstation, this quantum-gravitational transition is coupled to the **F348 classification of closed, connected, positively curved Einstein 4-manifolds** (`EinsteinFour/Classification.lean` & `TopologicalNumbers.lean`), which proves in Lean 4 that any `(M^4, g)` satisfying `R_ij = lambda * g_ij` and strictly positive sectional curvature is isometric (up to positive scaling) to:
1. The round 4-sphere `S^4` (`chi = 2, tau = 0`),
2. The complex projective plane `CP^2` with the Fubini-Study metric (`chi = 3, tau = 1`), or
3. Real projective 4-space `RP^4` (`chi = 1, tau = 0`).

- **Physical 3D Geometry:** A stereographically projected **Clifford Minimal Torus** (`S^1 x S^1 subset of S^3 -> R^3`) interlocked with **5 counter-rotating Hopf Villarceau fiber rings** and a **Shape-Key-driven singularity collapse (`Singularity_Collapse`)** when `S_Ob -> 0`.

### `M02` - FK-CRT Critical Phase Manifold (FKCRT.lean / Family F211)
Models the continuum scaling limit of finite `n`-edge planar maps `M` weighted by the **Fortuin-Kasteleyn (FK) random-cluster partition function**:

```text
Z_{n,q} = Sum_{M in M_n} Sum_{A subset of E(M)} q^(k_M(A) + (|A| - |V(M)|) / 2)
```

- **Subcritical / Critical Regime (`q <= 4.0`):** Discrete random triangulations converge in the conformal scaling limit to a smooth **Liouville Quantum Gravity (LQG) topological sphere** (`S^2`, Hausdorff dimension `d_H ~= 4.0`).
- **Supercritical Regime (`q > 4.0`, formalized in `FKCRT.lean`):** Loops condense and macroscopic clusters fragment the surface into a tree-like polymer. Rescaling graph distances by `c(q)*(n+1)^(-1/2)` causes the metric-measure space to converge in **Gromov-Hausdorff-Prokhorov (GHP)** distribution to **Aldous's Brownian Continuum Random Tree (`T_e, d_H = 2.0`)**, constructed as the metric quotient of `[0, 1]` under the **3D Bessel bridge excursion**:

```text
e(t) = ||B_t - t*B_1||_3
```

- **Physical 3D Geometry:** High-resolution LQG sphere with spherical-harmonic `Fractal_Roughness` shape-key morphing and 6 golden-spiral CRT dendrite spines that blossom as `q` crosses 4.0.

### `M03` - CKS-Willow Holographic Horizon (CKSBondiPenrose.lean / QACParity.lean)
Combines general-relativistic horizon geometry with quantum error-correcting boundary surface codes:
- **Bulk Gravitational Engine (`CKSBondiPenrose.lean`, 3,596 LOC):** Formalizes Cha-Khuri-Sakovich hyperboloidal initial data replacement `(N^3, g, K)` satisfying the physical Dominant Energy Condition (`PhysicalDEC`), proving that the asymptotic Bondi mass is bounded below by the minimum enclosing horizon area:

```text
m_Bondi >= sqrt(A_min(g) / (16*pi))
```

with strict saturation `A_Schw = 16*pi*m^2` for exterior Schwarzschild spacetime.
- **Boundary Quantum Processor (`QACParity.lean` & 105-Qubit Willow Lattice):** `QACParity.lean` proves that constant-depth `QAC^0` circuits with unbounded-arity Toffoli gates cannot compute `n`-bit Parity even at polynomial total qubit overhead -- explaining why fault-tolerant holographic surface codes (such as Google Quantum AI's **105-qubit Willow processor** decoded via **AlphaQubit 2**) require global boundary-to-bulk syndrome decoding.
- **Physical 3D Geometry:** Carter-Kerr isometric embedding funnel (`z(r) = sqrt(8*M*(r - 2*M))`), an oblate Kerr ergosphere (`r_E(theta) = M + sqrt(M^2 - a^2 * cos^2(theta))`) with `Ergo_Bulge` morphing, and a precessing spherical photon geodesic crown at `r_ph = 3*M`.

### `M04` - F032 K3 Retraction Audit (WITHDRAWAL_F032.lean)
Provides a visual and formal post-mortem of the October 6-7, 2026 retraction of three unformalized algebraic geometry manuscripts in `openai/math`:
- To apply the **Eliashberg-Murphy Lagrangian surgery and cancellation theorem**, a 4-dimensional Lagrangian immersion `f1` with `I(f1) = -m` (`m > 0`) signed double points must be modified so that the net signed intersection count vanishes (`I_new = 0`).
- The unverified manuscript assumed each reverse stabilization trace contributed `+1`, claiming `I_new = -m + m = 0`.
- Accounting for the opposite source orientations of the two branches of a standard cusp forces each reverse stabilization trace to carry sign `sigma_trace = -1`, yielding:

```text
I_new = I(f1) - m = -2m != 0
```

- **Physical 3D Geometry:** 6D-to-3D projection of the **Hanson Fermat Quintic Calabi-Yau / K3 slice** (`z1^n + z2^n = 1`). Scrubbing `sigma_trace` from `+1.0` to `-1.0` triggers the **`Cusp_Shatter` Blender Shape Key** and crimson GLSL fracture displacement, exposing non-canceling double-point intersection rings while highlighting the 3-line Lean 4 `omega` refutation.

---

## 4. System Architecture & Engineering Stack

### A. Modular Separation of Concerns (SoC) Codebase Layout

```text
sub-spacetime-studio/
|-- public/
|   |-- audio/                               # Studio-mastered stereo ambient soundtrack & foley stems
|   |   |-- cosmic_soundtrack.mp3            # 24-second seamless looped warm pad & felt piano soundtrack
|   |   |-- swell_ignition.mp3               # M01/M03 energetic chord swell & chime foley
|   |   |-- swell_phase.mp3                  # M02 phase-transition arpeggiated swell
|   |   \-- swell_shatter.mp3                # M04 Lagrangian cusp shatter resonance
|   \-- models/                              # 4 multi-component Blender 5.2.2 LTS .glb manifolds (19 sub-meshes)
|       |-- einstein_saddle.glb              # M01: CliffordCore + 5 Hopf Villarceau Rings (Singularity_Collapse)
|       |-- fkcrt_manifold.glb               # M02: LQGSurface + 6 CRT Dendrite Spines (Fractal_Roughness)
|       |-- cks_horizon_funnel.glb           # M03: CKSFunnel + KerrErgosphere + PhotonRing3M (Ergo_Bulge)
|       \-- k3_calabi_yau.glb                # M04: K3QuinticBrane + 3 CuspLocus Rings (Cusp_Shatter)
|-- scripts/
|   |-- generate_studio_audio.py             # Python WebAudio stereo synthesis (warm pads, felt piano, convolution reverb)
|   |-- generate_v6_blender_manifolds.py     # Procedural differential geometry v6 generator
|   \-- generate_v7_blender_manifolds.py     # Headless Blender 5.2.2 LTS procedural generator (COLOR_0 + 4 Shape Keys)
|-- src/
|   |-- components/
|   |   |-- TopMenuBar.tsx                   # Workstation Deck, Scene Matrix (M01-M04), Audio & Tour triggers
|   |   |-- LeftParameterDock.tsx            # Color-zoned DAW parameter channels, Tektronix Scope & Repo Vault
|   |   |-- Viewport3DStage.tsx              # Open-Stage Cinema HUD, KaTeX formula drawer, and camera controls
|   |   |-- RightLeanIDE.tsx                 # Shiki Lean 4 Kernel Inspector & Amber Scalpel Verification Audit
|   |   |-- BottomTimelineDock.tsx           # 60 FPS simulation transport, speed multipliers & timeline scrubber
|   |   \-- CommandPaletteModal.tsx          # Instant Cmd/Ctrl+K fuzzy command & theorem launcher
|   |-- data/
|   |   |-- theoremsCatalog.ts               # Formal mathematical metadata, LaTeX equations & DAW slider definitions
|   |   \-- leanRepositoryFiles.ts           # Embedded Lean 4 source modules from openai/math & counter-proofs
|   |-- engine/
|   |   |-- QuantumSpacetimeEngine.ts        # Three.js WebGL2 renderer, ACES Filmic postprocessing & orbital camera
|   |   |-- ManifoldGlbArticulator.ts        # 60 FPS physical GLB sub-mesh articulator & Shape-Key morph controller
|   |   |-- AudioSynthesizer.ts              # Singleton WebAudio engine with global registry & hard-mute guarantee
|   |   \-- shaders/                         # Custom GLSL vertex/fragment shaders for M01, M02, M03, and M04
|   |       |-- observerHilbertShader.ts     # M01: Observer Hilbert density, wormhole filaments & curvature
|   |       |-- fkcrtPhaseShader.ts          # M02: FK cluster percolation & CRT dendrite excursion
|   |       |-- willowHologramShader.ts      # M03: Bondi hyperboloidal embedding & 105-qubit surface code
|   |       \-- k3RetractionShader.ts        # M04: Calabi-Yau Fermat slice & crimson Lagrangian shatter
|   |-- hooks/
|   |   |-- useDirectorTour.ts               # v9.0 360-Degree Orbital Crane, X/Y/Z Manifold Tumbling & Infinite Loop engine
|   |   \-- useKeyboardShortcuts.ts          # Comprehensive desktop keyboard shortcut orchestrator
|   |-- services/
|   |   \-- physicsTelemetryService.ts       # Real-time curvature, entropy, GHP & AST line-synchronization math
|   |-- styles/
|   |   |-- workstation.css                  # SoC barrel stylesheet importing 7 domain-isolated CSS modules
|   |   |-- tokens-and-base.css              # Design tokens, typography, and core 3-column workstation grid
|   |   |-- top-command-deck.css             # Top menu deck & theorem selector pills
|   |   |-- left-instrument-rack.css         # Cyan/Amber/Violet DAW parameter cards, scope & repository file tree
|   |   |-- center-viewport-hud.css          # Open-Stage translucent HUD strips, Director Tour bar & KaTeX drawer
|   |   |-- right-lean-ide.css               # Sapphire Shiki code editor & warm amber Scalpel Audit console
|   |   |-- bottom-timeline-dock.css         # Transport controls, speed pills & keyframe timeline track
|   |   \-- command-palette-modal.css        # Cmd+K modal overlay & keyboard navigation styles
|   |-- types/
|   |   \-- workstation.ts                   # Core TypeScript types for scenes, uniforms, AST points & telemetry
|   \-- main.tsx                             # Application bootstrapping & root layout
|-- index.html                               # HTML5 entry point with Inter & JetBrains Mono font preloads
|-- metadata.json                            # AI Studio applet metadata & capabilities specification
|-- package.json                             # Dependencies, scripts, and build configuration
|-- tsconfig.json                            # Strict TypeScript compiler options
\-- vite.config.ts                           # Vite configuration with chunk splitting (three, shiki, katex)
```

---

### B. Blender 5.2.2 LTS Procedural Geometry Pipeline

All four `.glb` assets in `public/models/` are generated deterministically via [`scripts/generate_v7_blender_manifolds.py`](./scripts/generate_v7_blender_manifolds.py):

1. **`einstein_saddle.glb` (`M01`):** Stereographic Clifford minimal torus (`CliffordCore`) with `Singularity_Collapse` Shape Key + 5 interlocked Villarceau Hopf fibration rings (`HopfRing_0` to `HopfRing_4`).
2. **`fkcrt_manifold.glb` (`M02`):** High-resolution Liouville Quantum Gravity sphere (`LQGSurface`) with spherical-harmonic `Fractal_Roughness` Shape Key + 6 Golden-Spiral Aldous CRT dendrite spines (`CRTSpine_0` to `CRTSpine_5`).
3. **`cks_horizon_funnel.glb` (`M03`):** Isometric Flamm-Carter paraboloid (`CKSFunnel`) + oblate `KerrErgosphere` (both with `Ergo_Bulge` Shape Keys) + 3D precessing spherical photon geodesic (`PhotonRing3M`).
4. **`k3_calabi_yau.glb` (`M04`):** Complex Fermat quintic projection (`K3QuinticBrane`) with radial `Cusp_Shatter` Shape Key + 3 transversal self-intersection rings (`CuspLocus_0` to `CuspLocus_2`).

Each mesh embeds a procedural **`COLOR_0` byte vertex color attribute** (encoding Gaussian curvature, geodesic radius, and branch orientation) wired directly into Blender's `Principled BSDF` node tree and articulated at 60 FPS by [`ManifoldGlbArticulator.ts`](./src/engine/ManifoldGlbArticulator.ts) with thin-film quantum iridescence (`iridescence: 0.9, IOR: 1.42`).

---

### C. Custom GLSL Shader Architecture

The workstation leverages custom WebGL2 GLSL shaders operating in tandem with the physical GLB meshes:

- **`observerHilbertShader.ts` (`M01`):** Computes analytic curvature density on the Clifford minimal torus and synthesizes non-perturbative replica wormhole filaments between bra and ket sheets.
- **`fkcrtPhaseShader.ts` (`M02`):** Computes cluster percolation probabilities and transitions dynamically from conformal 2D planar map metrics to 3D Bessel-bridge excursion branches.
- **`willowHologramShader.ts` (`M03`):** Generates Carter-Kerr frame-dragging vorticity, hyperboloidal lapse functions, and the 105-qubit Willow surface code boundary syndrome grid.
- **`k3RetractionShader.ts` (`M04`):** Renders the 6D-to-3D Fermat quintic hypersurface with signed double-point highlight rings, exploding into crimson fracture planes when `sigma_trace < 0`.

---

### D. Studio Audio Synthesizer & Convolution Reverb

The audio engine ([`AudioSynthesizer.ts`](./src/engine/AudioSynthesizer.ts)) is engineered as a strict Singleton with a global audio pool registry:
- **Zero-Leak Hard Mute:** Tracks all `HTMLAudioElement` instances on the page, ensuring that clicking Mute immediately silences and pauses every audio stream.
- **Procedural Soundtrack:** Plays a 24-second seamless looped ambient soundtrack (`cosmic_soundtrack.mp3`) generated in Python via multi-voice saw pads, felt piano arpeggios, and synthetic stereo convolution reverb.
- **Foley Transition Stems:** Plays custom sound swells (`swell_ignition.mp3`, `swell_phase.mp3`, `swell_shatter.mp3`) dynamically when switching between manifolds or triggering phase transitions.

---

## 5. Interactive Features & UI Controls

### Director's Cut 360-Degree Orbital Crane Tour
Clicking the **`TOUR`** button in the top menu bar launches the choreographed **Director's Cut Tour** ([`useDirectorTour.ts`](./src/hooks/useDirectorTour.ts)):
- **Multi-Axis Orbit & Tumbling:** Continuously executes 360-degree orbital sweeps while tumbling each 3D manifold across X, Y, and Z axes so the user inspects poles, interiors, and underbellies.
- **Automated Parameter Choreography:** Smoothly tweens physical uniform sliders to illustrate key mathematical thresholds (e.g., collapsing `S_Ob -> 0`, crossing `q = 4.0`, spinning Kerr ergosphere, and flipping `sigma_trace = -1`).
- **Infinite Loop:** Seamlessly cycles across all four acts with synchronized live narration banners and progress bars until toggled off.

### Shiki Lean 4 AST Line-Synchronization
The right pane hosts an embedded Lean 4 code inspector ([`RightLeanIDE.tsx`](./src/components/RightLeanIDE.tsx)) powered by **Shiki**:
- **Bidirectional Parameter Linking:** Scrubbing any slider in the left rack or bottom timeline dynamically highlights the exact lines in the corresponding Lean 4 source file (e.g., lines 12-14 in `Classification.lean` when `S_Ob -> 0`).
- **Scalpel Verification Audit Console:** Displays theorem lemma proofs, `sorry` counts, module sizes, and an autopsy of the F032 retracted draft with the 3-line `omega` counter-proof.

### Command Palette (`Cmd/Ctrl + K`)
Pressing `Cmd + K` or `Ctrl + K` opens the modal command launcher ([`CommandPaletteModal.tsx`](./src/components/CommandPaletteModal.tsx)):
- Fuzzy-search theorems across all four manifold families.
- Instantly switch scenes, trigger camera angles, toggle auto-rotation, or launch the Director Tour.
- Jump directly to specific Lean 4 files in the repository vault.

### Tektronix Oscilloscope & DAW Parameter Channels
The left instrument rack features:
- **Tektronix CRT Oscilloscope:** Real-time waveform visualizer displaying physical telemetry metrics (Euler characteristics, Bondi mass aspects, GHP scaling factors, and signed double-point traces).
- **Color-Zoned DAW Sliders:** Cyan (`M01`), Purple (`M02`), Emerald (`M03`), and Crimson (`M04`) parameter cards with numeric readouts, unit tags, and critical-threshold indicators.
- **OpenAI/Math Repository Vault:** Interactive tree view of the audited Lean 4 modules and counter-proof files.

---

## 6. Keyboard Shortcuts & Navigation

| Key Combination | Action / Description |
| :--- | :--- |
| **`1`** | Switch to **`M01`** (Observer Hilbert Manifold) |
| **`2`** | Switch to **`M02`** (FK-CRT Phase Transition) |
| **`3`** | Switch to **`M03`** (CKS-Willow Holographic Horizon) |
| **`4`** | Switch to **`M04`** (F032 K3 Retraction Audit) |
| **`Cmd/Ctrl + K`** | Open the **Command Palette** modal |
| **`Cmd/Ctrl + P`** | **Capture Screenshot** (exports high-res WebGL frame) |
| **`Space`** | **Pause / Resume** 60 FPS simulation clock |
| **`H`** | Toggle Dashboard visibility / Open Cinema HUD |
| **`Z`** | **`PURE 3D` Mode**: Collapse both side docks for unobstructed view |
| **`M`** | **Hard Mute / Unmute** soundtrack & foley engine |
| **`R`** | **Reset Uniforms** to baseline factory values |
| **`G`** | Toggle Spatial Reference Grid |
| **`O`** | Toggle Orbital Auto-Rotation |
| **`+` / `-`** | Zoom camera in / out |
| **Numpad `0`** | Perspective 3/4 camera view |
| **Numpad `7`** | Polar / Top-down camera view |
| **Numpad `1`** | Front elevation camera view |
| **Numpad `3`** | Right profile camera view |
| **Numpad `.`** | Close-up macro camera view |

---

## 7. Getting Started & Reproducing the Pipeline

### Prerequisites
- **Node.js** (`>= 20.0.0`) or **[Bun](https://bun.sh/)** (`>= 1.1.0`)
- Modern WebGL2-compatible browser (Chrome, Edge, Firefox, Safari 16+)
- *(Optional, for regenerating `.glb` models)* **[Blender 5.2 LTS](https://www.blender.org/)** with Python `numpy` and `scipy`
- *(Optional, for regenerating audio)* Python 3.10+ with `numpy`

### Installation & Local Development

```bash
# 1. Clone the repository
git clone https://github.com/AndrewMason7/sub-spacetime-studio.git
cd sub-spacetime-studio

# 2. Install dependencies (via npm or bun)
npm install
# or: bun install

# 3. Start the local development server (runs on port 3000)
npm run dev
# or: bun run dev

# 4. Open in your browser
# http://localhost:3000

# 5. Typecheck & build production bundle
npm run lint
npm run build
```

### Regenerating 3D Manifolds from Scratch (Blender 5.2 LTS)
To re-run the procedural differential geometry generator and bake the vertex color / shape key `.glb` assets:

```bash
blender -b --python scripts/generate_v7_blender_manifolds.py
```

### Regenerating Studio Audio & Foley Stems
To synthesize the ambient soundtrack and foley transition stems:

```bash
python scripts/generate_studio_audio.py
```

---

## 8. Citation & Academic References

1. **D. Harlow, M. Usatyuk, and Y. Zhao**, *"Quantum Mechanics and Observers for Gravity in a Closed Universe"*, MIT Center for Theoretical Physics & Kavli Institute for Theoretical Physics (KITP), [`arXiv:2501.02359`](https://arxiv.org/abs/2501.02359) (2025).
2. **`openai/math` Formal Verification Corpus** (September-October 2026):
   - **Family F348**: `lean/OAI/Geometry/EinsteinFour/Classification.lean` & `TopologicalNumbers.lean` (198 Lean 4 modules, 0 `sorry`).
   - **Family F211**: `lean/ComparatorChallenges/FKCRT.lean` (*Brownian continuum random tree limits of finite Fortuin-Kasteleyn maps above four*).
   - **Family F260**: `lean/ComparatorChallenges/CKSBondiPenrose.lean` (*Area-controlled hyperboloidal end replacement and Schwarzschild equality*, 3,596 LOC).
   - **Family F274**: `lean/ComparatorChallenges/QACParity.lean` (*Constant-depth QAC^0 parity lower bound*).
   - **Family F032 Withdrawal Notice** (Commit `30148886`, October 6-7, 2026): Retraction of three unformalized manuscripts on Weil classes, Kuga-Satake correspondences, and the rational Hodge conjecture for K3 surfaces due to reverse cusp stabilization trace sign inversion (`I_new = -2m != 0`).
3. **Google Quantum AI**, *"Quantum error correction below the surface code threshold"* (105-Qubit Willow Processor) & **Google DeepMind**, *"AlphaQubit 2"*, *Nature* / [`arXiv:2412.06784`](https://arxiv.org/abs/2412.06784) (2024-2025).
4. **Y. Eliashberg and E. Murphy**, *"Lagrangian caps"*, *Geom. Funct. Anal.* 24, 783-814 (2014).
5. **D. Aldous**, *"The continuum random tree. I, II, III"*, *Ann. Probab.* 19 (1991).

---

## 9. License

Distributed under the **[MIT License](./LICENSE)**.  
Copyright (c) 2026 **Andrew Mason**. Built with **Gemini 4 Argon**.
