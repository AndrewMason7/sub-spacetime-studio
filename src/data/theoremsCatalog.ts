import { SceneModeId, TheoremMetadata } from '../types/workstation';

export const THEOREM_SCENES: Record<SceneModeId, TheoremMetadata> = {
  observer: {
    id: 'observer',
    codeName: 'MOD-01 // HILBERT-OBSERVER',
    badgeNumber: 'M01 // WALL #13',
    shortTitle: 'OBSERVER HILBERT',
    title: 'Closed Universe Without Observer Collapses to dim(𝓗) = 1',
    subtitle: 'Harlow–Usatyuk–Zhao Theorem (MIT / KITP, arXiv:2501.02359) × F348 Einstein 4-Manifold Saddle',
    statusBadge: 'VERIFIED_THEOREM',
    statusLabel: 'PROVEN QUANTUM GRAVITY WALL (arXiv:2501.02359)',
    statusColor: '#7dd3fc',
    paperRef: 'D. Harlow (MIT), M. Usatyuk & Y. Zhao (KITP), arXiv:2501.02359 + EinsteinFour/Classification.lean (F348)',
    defaultFileId: 'einstein-four-classification',
    realWorldAnalogy:
      'Think of a modern game engine GPU: when no player camera (Observer) is inside the world, the engine renders zero streets, zero physics, and collapses the scene to a single null state. Only when an Observer worldline with internal degrees of freedom (S_Ob > 0) enters the gravitational path integral does the effective Hilbert space expand exponentially into 3D spacetime.',
    formalSummary:
      'Via both the Quantum Extremal Surface (Island) formula and the Euclidean Gravitational Path Integral (stabilized on 4-manifolds classified in F348 EinsteinFour.lean), the Hilbert space of a closed universe viewed from an observer-free perspective is strictly 1-dimensional and real: zero superposition, zero entanglement, zero dynamics. Introducing a physical Observer (Ob) with entropy S_Ob restores an effective Hilbert space of dimension exp(S_Ob).',
    latexPrimary: '\\dim(\\mathcal{H}_{\\text{closed}}) = 1 \\xrightarrow{\\text{+ Observer } Ob} \\dim(\\mathcal{H}_{\\text{eff}}) \\approx e^{S_{Ob}}',
    latexSecondary: 'R_{ij} = \\lambda g_{ij}, \\; M^4 \\in \\{ S^4, \\mathbb{CP}^2, \\mathbb{RP}^4 \\} \\text{ (F348)}',
    auditScopeNote:
      'SCALPEL AUDIT: Wall #13 (Harlow–Usatyuk–Zhao, arXiv:2501.02359) proves dim(H_closed)=1 via replica wormholes in the gravitational path integral. Simultaneously, openai/math F348 (EinsteinFour/Classification.lean) is 100% Lean 4 verified across 198 modules with zero sorrys.',
    argonPipelineStats: {
      inputTokens: '148,920 tok',
      outputTokens: '64,310 tok',
      shaderPasses: '28k Nodes + Blender GLB',
      verificationLatency: '0.42s AST Match'
    },
    sliders: [
      {
        id: 'observerEntropy',
        label: 'Observer Worldline Entropy',
        symbol: 'S_{Ob}',
        min: 0.0,
        max: 12.0,
        step: 0.05,
        defaultValue: 8.4,
        unit: 'nats',
        criticalValue: 0.1,
        criticalLabel: 'S_Ob = 0: Closed Singularity (dim 𝓗 = 1)',
        description: 'Scrub to 0.0 to collapse into a 0D Closed Singularity, or up to 12.0 to expand exp(S_Ob) states.'
      },
      {
        id: 'wormholeCoupling',
        label: 'Replica Wormhole Island Coupling',
        symbol: '\\alpha_{\\mathrm{QES}}',
        min: 0.0,
        max: 2.0,
        step: 0.02,
        defaultValue: 1.0,
        description: 'Modulates Quantum Extremal Surface (Island) non-perturbative entanglement filament tension.'
      },
      {
        id: 'manifoldMorph',
        label: 'F348 Einstein 4-Manifold Saddle',
        symbol: '\\tau_{M^4}',
        min: 0.0,
        max: 2.0,
        step: 0.01,
        defaultValue: 0.65,
        description: 'Morphs the 4D Euclidean gravitational saddle between Round S⁴ (0), Fubini–Study ℂℙ² (1), and ℝℙ⁴ (2).'
      }
    ]
  },

  fkcrt: {
    id: 'fkcrt',
    codeName: 'MOD-02 // FKCRT-PHASE',
    badgeNumber: 'M02 // OPENAI/MATH F211',
    shortTitle: 'FK-CRT PHASE',
    title: 'Random Planar Maps & Critical Phase Transition at q = 4',
    subtitle: 'Fortuin–Kasteleyn Maps: Liouville Quantum Gravity Sphere (q ≤ 4) → Brownian Continuum Random Tree (q > 4)',
    statusBadge: 'LEAN4_PARTIAL_SCOPE',
    statusLabel: 'LEAN 4 FORMALIZED FOR q > 4 (FKCRT.lean — 1/7 Papers)',
    statusColor: '#c084fc',
    paperRef: 'openai/math F211: "Brownian continuum random tree limits of finite Fortuin–Kasteleyn maps above four" (Sept 24, 2026)',
    defaultFileId: 'fkcrt-lean',
    realWorldAnalogy:
      'Spacetime is not a pre-existing stage; it emerges from millions of discrete quantum triangles snapping together at random. When matter density q ≤ 4, those random triangles stitch into a smooth 2D Quantum Gravity sphere. The instant you push matter parameter q past the critical threshold q = 4, the sphere fractures into a branched fractal tree (Brownian CRT)!',
    formalSummary:
      'Each n-edge planar map M is weighted by the Fortuin–Kasteleyn partition function w(M,A) = q^{k_M(A) + (|A|-|V|)/2}. For q ≤ 4, discrete surfaces converge to Liouville Quantum Gravity (S² topology). Strictly above q = 4, rescaling graph distances by c(q)·(n+1)^{-1/2} causes the metric-measure space to converge in Gromov–Hausdorff–Prokhorov (GHP) distribution to the Brownian Continuum Random Tree realized via a 3D Bessel bridge.',
    latexPrimary: 'w_q(M, A) = q^{\\,k_M(A) + \\frac{|A| - |V(M)|}{2}}, \\quad d_e(s,t) = e(s) + e(t) - 2\\inf_{[s,t]} e',
    latexSecondary: 'q \\le 4:\\; \\text{LQG Sphere } (S^2) \\;\\big|\\big|\\; q > 4:\\; \\text{Brownian CRT } (d_H = 2)',
    auditScopeNote:
      'SCALPEL AUDIT (lean/docs/211.md): Family F211 contains 7 manuscripts, but ONLY 1 of 7 ("Brownian CRT limits above q > 4") is formalized in Lean (FKCRT.lean). The LQG sphere regime (q ≤ 4) remains PDF-only.',
    argonPipelineStats: {
      inputTokens: '212,400 tok',
      outputTokens: '91,850 tok',
      shaderPasses: '3D Bessel Bridge + GLB',
      verificationLatency: '0.38s GHP Check'
    },
    sliders: [
      {
        id: 'clusterParameterQ',
        label: 'FK Cluster Matter Parameter',
        symbol: 'q_{\\mathrm{FK}}',
        min: 0.5,
        max: 8.0,
        step: 0.05,
        defaultValue: 2.2,
        criticalValue: 4.0,
        criticalLabel: 'CRITICAL THRESHOLD (q = 4.0): Sphere → Branched CRT',
        description: 'Cross q = 4.0 to trigger the topological phase transition from smooth 2D LQG Sphere into a branched Brownian CRT.'
      },
      {
        id: 'excursionRoughness',
        label: '3D Bessel Bridge Excursion Amplitude',
        symbol: '\\|B_t - t B_1\\|_3',
        min: 0.2,
        max: 2.5,
        step: 0.05,
        defaultValue: 1.15,
        description: 'Modulates the standard 3D Bessel bridge excursion height e(t) driving the quotient tree distance d_e(s,t).'
      },
      {
        id: 'planarEdgesN',
        label: 'Rescaled Planar Map Dart Count',
        symbol: 'n^{-1/2}',
        min: 1.0,
        max: 5.0,
        step: 0.1,
        defaultValue: 3.2,
        description: 'Controls continuum scaling limit resolution c / sqrt(n + 1) across the random triangulation.'
      }
    ]
  },

  hologram: {
    id: 'hologram',
    codeName: 'MOD-03 // WILLOW-PENROSE',
    badgeNumber: 'M03 // F260 & F265 WILLOW',
    shortTitle: 'CKS HORIZON',
    title: 'Bondi–Penrose Horizon Inequality & 2D Boundary Area Law',
    subtitle: 'CKSBondiPenrose.lean (A = 16π m_Bondi²) × F265 Boundary PEPS Holography (105-Qubit Willow Code)',
    statusBadge: 'LEAN4_PARTIAL_SCOPE',
    statusLabel: 'CKS REPLACEMENT & SCHWARZSCHILD EQUALITY IN LEAN 4',
    statusColor: '#34d399',
    paperRef: 'openai/math F260 (CKSBondiPenrose.lean) & F265 (2D Area Law / PEPS) + Google 105-Qubit Willow Surface Code',
    defaultFileId: 'cks-bondi-penrose',
    realWorldAnalogy:
      'Like a holographic security seal where a flat 2D outer surface encodes a 3D interior volume: F265 proves cold 2D quantum states store entanglement strictly on their boundary (Area Law), while F260 proves the 2D enclosing horizon area A = 16πm² bounds the total gravitational mass-energy trapped inside!',
    formalSummary:
      'In CKSBondiPenrose.lean, Cha–Khuri–Sakovich hyperboloidal ends are replaced by asymptotically flat ends preserving the compact interior and Dominant Energy Condition (DEC), proving canonical Schwarzschild saturation m_Bondi = sqrt(A / 16π). Simultaneously, F274 (QACParity.lean — 100% Lean verified) proves constant-depth QAC⁰ circuits cannot compute Parity, underscoring why non-local holographic surface codes (like Google Quantum AI’s 105-qubit Willow with AlphaQubit 2) require boundary-to-bulk error decoding.',
    latexPrimary: 'm_{\\mathrm{Bondi}} \\ge \\sqrt{\\frac{A_{\\min}(g)}{16\\pi}}, \\quad A_{\\mathrm{Schw}} = 16\\pi m_{\\mathrm{Bondi}}^2',
    latexSecondary: '\\forall d,\\; \\mathrm{QAC}^0_d \\not\\ni \\mathrm{Parity}_n \\implies \\text{Non-Local Willow Decoding}',
    auditScopeNote:
      'SCALPEL AUDIT (lean/docs/260.md & 274.md): F274 (QACParity.lean) is 100% Lean 4 verified. In F260 (13 papers), CKS hyperboloidal end replacement and Schwarzschild equality (A = 16πm²) are formalized in CKSBondiPenrose.lean (3,596 lines).',
    argonPipelineStats: {
      inputTokens: '193,241 chars',
      outputTokens: '78,400 tok',
      shaderPasses: 'CKS Funnel GLB + 105Q',
      verificationLatency: '0.51s Bondi Check'
    },
    sliders: [
      {
        id: 'bondiMass',
        label: 'Bondi Gravitational Mass-Energy',
        symbol: 'm_{\\mathrm{Bondi}}',
        min: 0.25,
        max: 2.5,
        step: 0.05,
        defaultValue: 1.2,
        unit: 'M_☉',
        description: 'Scales bulk black hole mass m; watch the minimum enclosing horizon area A = 16πm² expand quadratically.'
      },
      {
        id: 'boundaryQubitFlux',
        label: 'Boundary 105-Qubit Willow Flux',
        symbol: 'S(\\partial R)',
        min: 0.1,
        max: 3.0,
        step: 0.05,
        defaultValue: 1.6,
        description: 'Drives holographic boundary-to-bulk Ryu–Takayanagi / PEPS entanglement rays from the outer quantum lattice.'
      },
      {
        id: 'kerrSpin',
        label: 'Relativistic Frame-Dragging Spin',
        symbol: 'a / m',
        min: 0.0,
        max: 0.99,
        step: 0.01,
        defaultValue: 0.72,
        description: 'Controls relativistic accretion vortex velocity and hyperboloidal CKS foliation twist.'
      }
    ]
  },

  retraction: {
    id: 'retraction',
    codeName: 'MOD-04 // F032-AUDIT',
    badgeNumber: 'M04 // F032 RETRACTION',
    shortTitle: 'K3 RETRACTION',
    title: 'Why 3 Unformalized Hodge & K3 Papers Collapsed Overnight',
    subtitle: 'Withdrawn Oct 6–7, 2026: Reverse Stabilization Trace Sign (+1 Assumed vs. -1 Reality) Shatters Eliashberg–Murphy Cancellation',
    statusBadge: 'WITHDRAWN_SIGN_ERROR',
    statusLabel: 'WITHDRAWN (0% LEAN — SIGN ERROR: I_new = -2m ≠ 0)',
    statusColor: '#f43f5e',
    paperRef: 'openai/math history.md (Oct 7, 2026): 3 Retracted Papers on Weil Classes, Kuga–Satake & Rational Hodge for K3 Surfaces',
    defaultFileId: 'f032-withdrawal-notice',
    realWorldAnalogy:
      'Imagine an AI structural engineer designing a suspension bridge and assuming two opposing steel cables cancel out their tension (-m + m = 0) so the deck stays smooth. In reality, the two cusp branches point in opposite orientations, doubling the tension (-m - m = -2m)! Flip the sign below from +1 (Unverified PDF Assumption) to -1 (Geometric Reality) and watch the K3 Calabi–Yau brane violently self-intersect and shatter!',
    formalSummary:
      'In "Algebraicity of Weil classes on split abelian eightfolds", the proof attempted to eliminate negative double points I(f₁) = -m (m > 0) to invoke the Eliashberg–Murphy cancellation theorem (which strictly requires I_new = 0). Because this manuscript had NO Lean 4 formalization, the model assigned sign +1 to each reverse stabilization trace instead of -1 (imposed by opposite branch orientations of the standard cusp). Thus I_new = -m - m = -2m ≠ 0, collapsing this paper and two dependent K3 Hodge papers!',
    latexPrimary: '\\text{Claimed } (+1): I_{\\mathrm{new}} = -m + m = 0 \\;\\big|\\big|\\; \\text{Reality } (-1): I_{\\mathrm{new}} = -2m \\neq 0',
    latexSecondary: '\\text{Eliashberg–Murphy Requires } I_{\\mathrm{new}} = 0 \\implies \\text{3 K3 Papers Withdrawn}',
    auditScopeNote:
      'SCALPEL AUDIT (history.md): All 3 withdrawn papers in commit 30148886 were unformalized PDF drafts. Every theorem that passed full Lean 4 verification (F196, F348, F274, F003 across 2,924 Lean modules) survived 100% intact.',
    argonPipelineStats: {
      inputTokens: '324,499 diff',
      outputTokens: 'Counter-Proof',
      shaderPasses: 'K3 Quintic GLB Shatter',
      verificationLatency: '0.01s omega'
    },
    sliders: [
      {
        id: 'stabilizationSign',
        label: 'Reverse Stabilization Trace Sign',
        symbol: '\\sigma_{\\mathrm{trace}}',
        min: -1.0,
        max: 1.0,
        step: 0.02,
        defaultValue: 1.0,
        criticalValue: 0.0,
        criticalLabel: 'FLIP TO -1.0: Cusp Orientation Reality (I_new = -2m ≠ 0 → SHATTER)',
        description: 'Scrub from +1.0 (OpenAI PDF assumption) to -1.0 (true cusp orientation) to watch -2m singularities shatter the K3 manifold!'
      },
      {
        id: 'doublePointCountM',
        label: 'Cusp Double-Point Multiplicity',
        symbol: 'm',
        min: 1.0,
        max: 12.0,
        step: 1.0,
        defaultValue: 6.0,
        description: 'Number of reverse stabilization traces m inserted into the Lagrangian immersion.'
      },
      {
        id: 'calabiYauSlice',
        label: 'K3 / Abelian Eightfold Phase Angle',
        symbol: '\\theta_{\\mathrm{K3}}',
        min: 0.0,
        max: 6.28,
        step: 0.05,
        defaultValue: 1.57,
        description: 'Rotates the 4D complex projection slice of the K3 / Kuga–Satake fiber.'
      }
    ]
  }
};
