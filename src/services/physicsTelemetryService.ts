import { SceneModeId, SimulationUniformState } from '../types/workstation';

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

export const SLIDER_TO_LINE_MAP: Record<string, number[]> = {
  'einstein-four-classification': [11, 15, 19],
  'einstein-four-metric': [18, 34, 40],
  'fkcrt-lean': [18, 33, 39],
  'cks-bondi-penrose': [37, 25, 35],
  'qac-parity': [14, 24, 30],
  'f032-withdrawal-notice': [28, 15, 31],
  'walls-compendium-spec': [14, 15, 16]
};

export function resolveActiveAstLine(
  fileId: string,
  sliderIdx: number | null | undefined,
  maxLines: number
): number | null {
  if (sliderIdx === null || sliderIdx === undefined) return null;
  const map = SLIDER_TO_LINE_MAP[fileId] || [10, 14, 18];
  const targetLine = map[sliderIdx] ?? 11;
  return Math.min(targetLine, Math.max(0, maxLines - 1));
}

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
      label: 'PULSE 105-QUBIT WILLOW BOUNDARY FLUX',
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
