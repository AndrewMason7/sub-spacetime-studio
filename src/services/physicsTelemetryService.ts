import { SceneModeId, SimulationUniformState } from '../types/workstation';
import { clampOrder, invariantsFor } from '../data/associahedronInvariants';

export interface ViewportTelemetryReadout {
  invariantStr: string;
  topologyStr: string;
  glbMeshName: string;
}

export interface OscilloscopeSampleReadout {
  sample: number;
  traceColor: string;
}

export interface QuickActionSpec {
  label: string;
  isDanger: boolean;
}

export interface AstPointFocus {
  lineIdx: number;
  endLineIdx: number;
  symbolToken: string;
  phaseNote: string;
}

export const SLIDER_TO_LINE_MAP: Record<string, number[]> = {
  'einstein-four-classification': [12, 15, 19],
  'einstein-four-metric': [18, 34, 40],
  'fkcrt-lean': [18, 33, 39],
  'cks-bondi-penrose': [37, 25, 35],
  'qac-parity': [14, 25, 29],
  'f032-withdrawal-notice': [28, 15, 31],
  'walls-compendium-spec': [13, 14, 15]
};

/**
 * Resolves the exact Lean 4 AST line range, token symbol, and live phase state
 * synchronized in real time with the current uniform values and active slider/timeline/tour.
 */
export function resolveActiveAstFocus(
  fileId: string,
  sliderIdx: number | null | undefined,
  uniforms: SimulationUniformState | undefined,
  maxLines: number
): AstPointFocus {
  const clamp = (ln: number) => Math.min(ln, Math.max(0, maxLines - 1));
  const sIdx = sliderIdx ?? 0;

  if (fileId === 'associahedron-lean') {
    const order = clampOrder(uniforms?.associahedronOrder ?? 4);
    const inv = invariantsFor(order, uniforms?.projectionSweep ?? 0.5);
    const focus = uniforms?.facetResidueFocus ?? 0.15;
    if (sIdx === 0) {
      return {
        lineIdx: clamp(27),
        endLineIdx: clamp(29),
        symbolToken: 'loday_sum_const',
        phaseNote: `n = ${order}: Σ x_i = ${inv.coordinateSum} = n(n+1)/2 over ${inv.combinatorialVertices} Catalan vertices`
      };
    }
    if (sIdx === 1) {
      return {
        lineIdx: clamp(38),
        endLineIdx: clamp(39),
        symbolToken: 'facet_count',
        phaseNote: inv.projected
          ? `PROJECTED shadow: hull V=${inv.frame.V} E=${inv.frame.E} F=${inv.frame.F} (χ=${inv.frame.euler})`
          : `EXACT 3D hull: V=${inv.frame.V} E=${inv.frame.E} F=${inv.frame.F} (χ=${inv.frame.euler})`
      };
    }
    return {
      lineIdx: clamp(47),
      endLineIdx: clamp(48),
      symbolToken: 'n4_isometric_embedding',
      phaseNote: inv.projected
        ? `Pole focus Ω = ${focus.toFixed(2)} — facet residues of the canonical form`
        : `Isometry error ${(inv.isometryMaxError ?? 0).toExponential(1)} — no projection in play`
    };
  }

  if (fileId === 'einstein-four-classification') {
    if (sIdx === 0) {
      const sOb = uniforms?.observerEntropy ?? 8.4;
      if (sOb < 0.25) {
        return {
          lineIdx: clamp(12),
          endLineIdx: clamp(14),
          symbolToken: 'CompactSpace M',
          phaseNote: 'S_Ob = 0: Closed Universe Singularity (dim 𝓗 = 1)'
        };
      }
      return {
        lineIdx: clamp(16),
        endLineIdx: clamp(16),
        symbolToken: '∃ a : ℝ, 0 < a',
        phaseNote: `Observer Worldline Active: dim(𝓗_eff) ≈ exp(${sOb.toFixed(2)})`
      };
    }
    if (sIdx === 1) {
      return {
        lineIdx: clamp(15),
        endLineIdx: clamp(15),
        symbolToken: 'HasPositiveSectionalCurvature',
        phaseNote: `Replica Wormhole Island Coupling α_QES = ${(uniforms?.wormholeCoupling ?? 1.0).toFixed(2)}`
      };
    }
    // Slider 2: manifoldMorph (0 = S⁴ -> LN 18, 1 = ℂℙ² -> LN 19, 2 = ℝℙ⁴ -> LN 20)
    const morph = uniforms?.manifoldMorph ?? 0.65;
    if (morph < 0.5) {
      return {
        lineIdx: clamp(17),
        endLineIdx: clamp(17),
        symbolToken: 'roundDistance',
        phaseNote: 'Branch 1/3: Isometric to Round 4-Sphere S⁴ (χ = 2, τ = 0)'
      };
    }
    if (morph < 1.45) {
      return {
        lineIdx: clamp(18),
        endLineIdx: clamp(18),
        symbolToken: 'fubiniStudyDistance',
        phaseNote: 'Branch 2/3: Isometric to Complex Projective Plane ℂℙ² (χ = 3, τ = 1)'
      };
    }
    return {
      lineIdx: clamp(19),
      endLineIdx: clamp(19),
      symbolToken: 'realProjectiveDistance',
      phaseNote: 'Branch 3/3: Isometric to Real Projective 4-Space ℝℙ⁴ (χ = 1, τ = 0)'
    };
  }

  if (fileId === 'einstein-four-metric') {
    if (sIdx === 0) {
      return {
        lineIdx: clamp(34),
        endLineIdx: clamp(37),
        symbolToken: 'IsEinstein',
        phaseNote: 'Einstein Metric Condition: ricciInChart = λ · metricInChart'
      };
    }
    if (sIdx === 1) {
      return {
        lineIdx: clamp(39),
        endLineIdx: clamp(41),
        symbolToken: 'HasPositiveSectionalCurvature',
        phaseNote: 'Strictly Positive Sectional Curvature 0 < sectionalNumerator'
      };
    }
    const morph = uniforms?.manifoldMorph ?? 0.65;
    if (morph < 0.5) {
      return {
        lineIdx: clamp(18),
        endLineIdx: clamp(19),
        symbolToken: 'roundDistance',
        phaseNote: 'RoundSphere4 Geodesic Distance: arccos ⟨p, q⟩'
      };
    }
    if (morph < 1.45) {
      return {
        lineIdx: clamp(21),
        endLineIdx: clamp(22),
        symbolToken: 'fubiniStudyDistance',
        phaseNote: 'ComplexProjective2 Fubini–Study Metric Distance'
      };
    }
    return {
      lineIdx: clamp(24),
      endLineIdx: clamp(25),
      symbolToken: 'realProjectiveDistance',
      phaseNote: 'RealProjective4 Antipodal Quotient Metric Distance'
    };
  }

  if (fileId === 'fkcrt-lean') {
    const q = uniforms?.clusterParameterQ ?? 2.2;
    if (sIdx === 0) {
      if (q <= 4.0) {
        return {
          lineIdx: clamp(18),
          endLineIdx: clamp(20),
          symbolToken: 'fkWeight',
          phaseNote: `Subcritical Regime (q = ${q.toFixed(2)} ≤ 4.0): Discrete FK Partition Law`
        };
      }
      return {
        lineIdx: clamp(39),
        endLineIdx: clamp(40),
        symbolToken: '4 < q',
        phaseNote: `Supercritical CRT Regime (q = ${q.toFixed(2)} > 4.0): GHP Convergence to Brownian Tree`
      };
    }
    if (sIdx === 1) {
      return {
        lineIdx: clamp(33),
        endLineIdx: clamp(36),
        symbolToken: 'standardExcursion',
        phaseNote: `3D Bessel Bridge Excursion ||B_t - t B_1||_3 = ${(uniforms?.excursionRoughness ?? 1.15).toFixed(2)}`
      };
    }
    return {
      lineIdx: clamp(48),
      endLineIdx: clamp(49),
      symbolToken: 'Real.sqrt (n + 1)',
      phaseNote: `Continuum Rescaling Limit c / √(n + 1) at scale ${(uniforms?.planarEdgesN ?? 3.2).toFixed(2)}`
    };
  }

  if (fileId === 'cks-bondi-penrose') {
    if (sIdx === 0) {
      const m = uniforms?.bondiMass ?? 1.2;
      if (m >= 1.8) {
        return {
          lineIdx: clamp(38),
          endLineIdx: clamp(40),
          symbolToken: 'minimumEnclosingArea',
          phaseNote: `Schwarzschild Horizon Saturation: A = 16π m² (${(16 * Math.PI * m * m).toFixed(1)})`
        };
      }
      return {
        lineIdx: clamp(29),
        endLineIdx: clamp(37),
        symbolToken: 'SchwarzschildExample',
        phaseNote: `Bondi Mass-Energy m_Bondi = ${m.toFixed(2)} M_☉`
      };
    }
    if (sIdx === 1) {
      return {
        lineIdx: clamp(25),
        endLineIdx: clamp(27),
        symbolToken: 'MarginalBoundary',
        phaseNote: `Boundary 105-Qubit Willow Flux S(∂R) = ${(uniforms?.boundaryQubitFlux ?? 1.6).toFixed(2)}`
      };
    }
    return {
      lineIdx: clamp(12),
      endLineIdx: clamp(15),
      symbolToken: 'smooth_tensor',
      phaseNote: `CKS Hyperboloidal Extrinsic Curvature K (Spin a/m = ${(uniforms?.kerrSpin ?? 0.72).toFixed(2)})`
    };
  }

  if (fileId === 'qac-parity') {
    if (sIdx === 0) {
      return {
        lineIdx: clamp(14),
        endLineIdx: clamp(16),
        symbolToken: 'Gate',
        phaseNote: 'QAC⁰ Unbounded-Arity Toffoli & Single-Qubit Unitary Gate Layer'
      };
    }
    if (sIdx === 1) {
      return {
        lineIdx: clamp(25),
        endLineIdx: clamp(26),
        symbolToken: 'successProbability',
        phaseNote: 'Born Measurement Probability across Boundary-to-Bulk Qubits'
      };
    }
    return {
      lineIdx: clamp(29),
      endLineIdx: clamp(34),
      symbolToken: 'ParityStatement',
      phaseNote: 'Constant-Depth QAC⁰ Lower Bound: Cannot Compute Parity_n'
    };
  }

  if (fileId === 'f032-withdrawal-notice') {
    const sign = uniforms?.stabilizationSign ?? 1.0;
    const m = Math.round(uniforms?.doublePointCountM ?? 6);
    if (sIdx === 0) {
      if (sign >= 0.0) {
        return {
          lineIdx: clamp(28),
          endLineIdx: clamp(29),
          symbolToken: 'signedDoublePoints',
          phaseNote: `Assumed Sign (+1): -(m) + (+1)·m = 0 (Unverified PDF Draft Assumption)`
        };
      }
      return {
        lineIdx: clamp(31),
        endLineIdx: clamp(34),
        symbolToken: 'cusp_orientation_prevents_cancellation',
        phaseNote: `Reality Sign (-1): I_new = -2m = ${-2 * m} ≠ 0 (Disproved by Lean 4 omega!)`
      };
    }
    if (sIdx === 1) {
      return {
        lineIdx: clamp(15),
        endLineIdx: clamp(15),
        symbolToken: 'I_new = I(f₁) - m = -2m ≠ 0',
        phaseNote: `Double-Point Multiplicity m = ${m} → I_new = ${Math.round(-m + sign * m)}`
      };
    }
    return {
      lineIdx: clamp(17),
      endLineIdx: clamp(19),
      symbolToken: 'Eliashberg-Murphy',
      phaseNote: `K3 / Abelian Eightfold Phase Slice θ = ${(uniforms?.calabiYauSlice ?? 1.57).toFixed(2)} rad`
    };
  }

  if (fileId === 'walls-compendium-spec') {
    if (sIdx === 0) {
      return {
        lineIdx: clamp(32),
        endLineIdx: clamp(33),
        symbolToken: 'effectiveHilbertDim',
        phaseNote: 'Harlow–Usatyuk–Zhao Closed Universe Observer Bound (arXiv:2501.02359)'
      };
    }
    if (sIdx === 1) {
      return {
        lineIdx: clamp(14),
        endLineIdx: clamp(19),
        symbolToken: 'FourManifoldInvariants',
        phaseNote: 'Self-Dual / Anti-Self-Dual Weyl Curvature Decomposition'
      };
    }
    return {
      lineIdx: clamp(22),
      endLineIdx: clamp(28),
      symbolToken: 'hitchin_thorpe_bound',
      phaseNote: 'Hitchin–Thorpe Topological Inequality: 2χ(M) ≥ 3|τ(M)|'
    };
  }

  const map = SLIDER_TO_LINE_MAP[fileId] || [10, 14, 18];
  const targetLine = clamp(map[sIdx] ?? 12);
  return {
    lineIdx: targetLine,
    endLineIdx: targetLine,
    symbolToken: 'theorem',
    phaseNote: 'Synchronized with active DAW parameter'
  };
}

/**
 * Legacy helper kept for compatibility: resolves the primary line index
 */
export function resolveActiveAstLine(
  fileId: string,
  sliderIdx: number | null | undefined,
  maxLines: number,
  uniforms?: SimulationUniformState
): number | null {
  if (sliderIdx === null || sliderIdx === undefined) return null;
  return resolveActiveAstFocus(fileId, sliderIdx, uniforms, maxLines).lineIdx;
}

/**
 * Computes exact physical & topological invariants for the 3D Viewport HUD
 */
export function computeViewportTelemetry(
  activeMode: SceneModeId,
  uniforms: SimulationUniformState
): ViewportTelemetryReadout {
  if (activeMode === 'observer') {
    const dimH = Math.exp(uniforms.observerEntropy);
    const invariantStr = `dim(𝓗) = ${
      dimH >= 1000 ? dimH.toExponential(2) : dimH.toFixed(2)
    }`;
    const topologyStr =
      uniforms.observerEntropy < 0.15
        ? '0D Singularity (χ = 0)'
        : uniforms.manifoldMorph < 0.5
          ? 'F348 S⁴ (χ = 2, τ = 0)'
          : uniforms.manifoldMorph < 1.5
            ? 'Fubini–Study ℂℙ² (χ = 3, τ = 1)'
            : 'Quotient ℝℙ⁴ (χ = 1, τ = 0)';
    return {
      invariantStr,
      topologyStr,
      glbMeshName: 'einstein_saddle.glb (6 Meshes)'
    };
  }

  if (activeMode === 'fkcrt') {
    const dH =
      uniforms.clusterParameterQ <= 4.0
        ? (2.8 + 0.3 * Math.sqrt(uniforms.clusterParameterQ)).toFixed(2)
        : '2.00';
    return {
      invariantStr: `q = ${uniforms.clusterParameterQ.toFixed(2)} // d_H = ${dH}`,
      topologyStr:
        uniforms.clusterParameterQ <= 4.0
          ? 'LQG Sphere (q ≤ 4)'
          : 'Brownian CRT (q > 4)',
      glbMeshName: 'fkcrt_manifold.glb (7 Meshes)'
    };
  }

  if (activeMode === 'hologram') {
    const area = 16 * Math.PI * uniforms.bondiMass * uniforms.bondiMass;
    const S_BH = 4 * Math.PI * uniforms.bondiMass * uniforms.bondiMass;
    return {
      invariantStr: `A = ${area.toFixed(1)} // S_BH = ${S_BH.toFixed(1)}`,
      topologyStr: 'CKS + Kerr Ergosphere',
      glbMeshName: 'cks_horizon_funnel.glb (3 Meshes)'
    };
  }

  if (activeMode === 'associahedron') {
    const inv = invariantsFor(clampOrder(uniforms.associahedronOrder), uniforms.projectionSweep);
    return {
      invariantStr: `V = ${inv.frame.V} // E = ${inv.frame.E} // F = ${inv.frame.F} // χ = ${inv.frame.euler}`,
      topologyStr: inv.projected
        ? `PROJECTED n=${inv.order} — ${inv.combinatorialVertices} pts → 3D shadow`
        : `EXACT 3D n=${inv.order} — isometric (1.8e-15)`,
      glbMeshName: 'associahedron.glb (1 exact + 48 hulls)'
    };
  }

  const m = Math.round(uniforms.doublePointCountM);
  const iNew = Math.round(-m + uniforms.stabilizationSign * m);
  return {
    invariantStr: `I_new = ${iNew} (${iNew === 0 ? 'CANCELS' : 'FAILS'})`,
    topologyStr:
      uniforms.stabilizationSign > 0.2
        ? 'Smooth K3 (χ = 24)'
        : 'Cusp Singularity (-2m)',
    glbMeshName: 'k3_calabi_yau.glb (3 Meshes)'
  };
}

/**
 * Computes real-time cathode-ray oscilloscope waveform sample from current physics state
 */
export function computeOscilloscopeSample(
  activeMode: SceneModeId,
  uniforms: SimulationUniformState,
  t: number,
  defaultColor: string
): OscilloscopeSampleReadout {
  let sample = 0.5;
  let traceColor = defaultColor;

  if (activeMode === 'observer') {
    const amp = Math.min(1, uniforms.observerEntropy / 12.0);
    sample =
      0.5 +
      (Math.sin(t * 2.8) * Math.cos(t * 1.9 * uniforms.wormholeCoupling) * 0.36 +
        Math.sin(t * 7.5) * 0.08) *
        amp;
  } else if (activeMode === 'fkcrt') {
    const isTree = uniforms.clusterParameterQ > 4.0;
    sample =
      0.5 +
      Math.sin(t * 3.2) * 0.24 * (uniforms.excursionRoughness / 2.0) +
      (isTree ? Math.sin(t * 14.0) * Math.cos(t * 5.3) * 0.22 : 0);
  } else if (activeMode === 'hologram') {
    sample =
      0.5 +
      Math.sin(t * (2.4 + uniforms.kerrSpin * 4.5)) *
        0.35 *
        Math.min(1, uniforms.bondiMass / 2.2) +
      Math.cos(t * 9.0) * 0.07 * (uniforms.boundaryQubitFlux / 2.5);
  } else if (activeMode === 'associahedron') {
    const inv = invariantsFor(clampOrder(uniforms.associahedronOrder), uniforms.projectionSweep);
    const focus = uniforms.facetResidueFocus;
    // one pulse per facet of the displayed hull — the trace literally counts faces
    sample =
      0.5 +
      Math.sin(t * (1.6 + inv.frame.F * 0.08) + focus * Math.PI * 2.0) * 0.22 +
      Math.sin(t * 8.5) * 0.06 * focus;
    traceColor = inv.projected ? '#93c5fd' : '#5eead4';
  } else if (activeMode === 'retraction') {
    const shattered = uniforms.stabilizationSign < 0.0;
    sample =
      0.5 +
      (shattered
        ? Math.sin(t * 19.0) * 0.32 + Math.sin(t * 43.0) * 0.18
        : Math.sin(t * 2.2) * 0.28);
    traceColor = shattered ? '#f43f5e' : '#34d399';
  }

  return { sample, traceColor };
}

/**
 * Returns the contextual quick-trigger button label and alert state for the Left Parameter Rack
 */
export function getQuickActionSpec(
  activeMode: SceneModeId,
  uniforms: SimulationUniformState
): QuickActionSpec {
  if (activeMode === 'observer') {
    return {
      label:
        uniforms.observerEntropy < 2.0
          ? 'INJECT OBSERVER WORLDLINE (S_Ob → 9.6)'
          : 'COLLAPSE TO OBSERVER-FREE (S_Ob → 0)',
      isDanger: false
    };
  }
  if (activeMode === 'fkcrt') {
    return {
      label:
        uniforms.clusterParameterQ <= 4.0
          ? 'CROSS CRITICAL THRESHOLD (q → 6.8 CRT)'
          : 'RETURN TO LIOUVILLE SPHERE (q → 2.0)',
      isDanger: false
    };
  }
  if (activeMode === 'hologram') {
    return {
      label:
        uniforms.bondiMass < 1.8
          ? 'PULSE 105-QUBIT WILLOW BOUNDARY FLUX (m → 2.25 M_☉)'
          : 'RELAX WILLOW BOUNDARY HORIZON (m → 0.85 M_☉)',
      isDanger: false
    };
  }
  if (activeMode === 'associahedron') {
    const n = clampOrder(uniforms.associahedronOrder);
    return {
      label:
        n < 6
          ? `RAISE ORDER (n = ${n} → ${n + 1}): GO PROJECTED`
          : 'DROP TO EXACT 3D (n = 6 → 4): NO PROJECTION',
      isDanger: false
    };
  }
  return {
    label:
      uniforms.stabilizationSign >= 0
        ? 'INJECT REALITY SIGN (-1.0): SHATTER K3 BRANE'
        : 'RESTORE CLAIMED SIGN (+1.0): SMOOTH K3 BRANE',
    isDanger: true
  };
}
