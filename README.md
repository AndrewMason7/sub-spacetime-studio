# SUB-SPACETIME STUDIO // v7.0 Masterpiece Edition

**Interactive 60FPS WebGL2 / GLSL Quantum Gravity & Lean 4 Formal Verification Workstation**

Built to visualize and formally audit frontier mathematical physics theorems from the `openai/math` repository and `walls-theorems.md`:

1. **M01 · Observer-Anchored Hilbert Hologram (`EinsteinFour.lean` / `Classification.lean` / `TopologicalNumbers.lean`)**
   - Hitchin–Thorpe Topological Inequality: $2\chi(M) \ge 3|\tau(M)|$
   - Observer Quantum Extremal Surface (QES) bound: $\dim(\mathcal{H}_{\text{bulk}}) = \exp(S_{\text{Ob}})$
2. **M02 · FK-CRT Critical Phase Manifold (`ComparatorChallenges/FKCRT.lean`)**
   - Fortuin–Kasteleyn Random-Cluster Planar Map Scaling Limit: Smooth Liouville Quantum Gravity Sphere ($q \le 4, d_H = 4.0$) vs. Aldous Continuum Random Tree ($q > 4, d_H = 2.0$).
3. **M03 · CKS–Willow Holographic Horizon (`CKSBondiPenrose.lean` / `QACParity.lean`)**
   - Christodoulou–Klainerman–Sormani Bondi–Penrose Asymptotic Mass Inequality ($M_{\text{Bondi}} \ge \sqrt{A_{\text{App}} / 16\pi}$) coupled to a 105-qubit boundary stabilizer lattice.
4. **M04 · F032 K3 Stabilization Retraction Audit (`WITHDRAWAL_F032.lean`)**
   - Formal Lean 4 counterexample demonstrating the sign inversion $\epsilon_{\text{stab}} = +1 \to -1$ and non-vanishing double-point intersection invariant $I_{\text{new}} = -2m \ne 0$ on a Quintic K3 Calabi–Yau slice ($\chi = 24, \tau = -16$).

---

## Architecture Highlights

- **Spatial Floating Hardware HUD (`100vw × 100vh Full-Bleed WebGL2 Canvas`)**: Obsidian glass hardware instruments floating over an ACES Filmic post-processing pipeline (`SelectiveBloom`, radial `ChromaticAberration`, and subtle `NoiseEffect`).
- **Multi-Component Blender 5.2.2 LTS Manifolds (`19 Sub-Meshes`)**: Mathematically parameterized `.glb` manifolds in `public/models/` (`einstein_saddle.glb`, `fkcrt_manifold.glb`, `cks_horizon_funnel.glb`, `k3_calabi_yau.glb`) with live per-layer physical articulation.
- **Fine-Grained Lean 4 Shiki Kernel Inspector**: Instantaneous syntax highlighting using `shiki/core` (`lean4` + `nord`) with live slider-to-AST line synchronization.
- **Pre-Baked Stereo AudioBuffer & Foley Engine (`v7.0`)**: Zero-allocation, phase-locked stereo ambient pad and mechanical fader detent foley.

## Quick Start

```bash
bun install
bun run dev
# Production build:
bun run build
```
