export type SceneModeId = 'observer' | 'fkcrt' | 'hologram' | 'retraction';

export type CameraPresetId = 'perspective' | 'top' | 'front' | 'right' | 'closeup';

export interface SliderSpec {
  id: keyof SimulationUniformState;
  label: string;
  symbol: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
  criticalValue?: number;
  criticalLabel?: string;
  description: string;
}

export interface SimulationUniformState {
  observerEntropy: number;
  wormholeCoupling: number;
  manifoldMorph: number;
  clusterParameterQ: number;
  excursionRoughness: number;
  planarEdgesN: number;
  bondiMass: number;
  boundaryQubitFlux: number;
  kerrSpin: number;
  stabilizationSign: number;
  doublePointCountM: number;
  calabiYauSlice: number;
}

export interface LeanVirtualFile {
  id: string;
  filename: string;
  fullPath: string;
  moduleGroup: SceneModeId;
  verificationBadge: 'VERIFIED_ZERO_SORRY' | 'COMPARATOR_CHALLENGE' | 'AUDIT_MARKDOWN' | 'WITHDRAWN_NOTICE';
  badgeColor: string;
  linesCount: number;
  code: string;
}

export interface TheoremMetadata {
  id: SceneModeId;
  codeName: string;
  badgeNumber: string;
  shortTitle: string;
  title: string;
  subtitle: string;
  statusBadge: 'VERIFIED_THEOREM' | 'LEAN4_PARTIAL_SCOPE' | 'LEAN4_FULL' | 'WITHDRAWN_SIGN_ERROR';
  statusLabel: string;
  statusColor: string;
  paperRef: string;
  defaultFileId: string;
  realWorldAnalogy: string;
  formalSummary: string;
  latexPrimary: string;
  latexSecondary: string;
  auditScopeNote: string;
  argonPipelineStats: {
    inputTokens: string;
    outputTokens: string;
    shaderPasses: string;
    verificationLatency: string;
  };
  sliders: SliderSpec[];
}
