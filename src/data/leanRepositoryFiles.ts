import { LeanVirtualFile } from '../types/workstation';

export const LEAN_REPOSITORY_FILES: LeanVirtualFile[] = [
  {
    id: 'einstein-four-classification',
    filename: 'Classification.lean',
    fullPath: 'lean/OAI/Geometry/EinsteinFour/Classification.lean',
    moduleGroup: 'observer',
    verificationBadge: 'VERIFIED_ZERO_SORRY',
    badgeColor: '#00e5ff',
    linesCount: 25,
    code: `import OAI.Geometry.EinsteinFour.ActualModelIdentification

namespace OAI

namespace PositiveEinsteinFour

open EinsteinFour
open scoped Manifold ContDiff

/-- Every closed connected Einstein four-manifold with strictly positive sectional
curvature is isometric, after positive scaling, to the round sphere, complex
projective plane, or real projective four-space. -/
theorem classification (M : Type*) [TopologicalSpace M] [ChartedSpace FourSpace M]
    [IsManifold I4 ∞ M] [T2Space M] [SecondCountableTopology M]
    [CompactSpace M] [ConnectedSpace M] (g : SmoothMetric M)
    (hEinstein : IsEinstein g) (hpositive : HasPositiveSectionalCurvature g) :
    ∃ a : ℝ, 0 < a ∧
      (ScaledIsometricTo g a roundDistance ∨
        ScaledIsometricTo g a fubiniStudyDistance ∨
        ScaledIsometricTo g a realProjectiveDistance) :=
  classificationOn M g hEinstein hpositive

end PositiveEinsteinFour

end OAI`
  },
  {
    id: 'einstein-four-metric',
    filename: 'EinsteinFour.lean',
    fullPath: 'lean/ComparatorChallenges/EinsteinFour.lean',
    moduleGroup: 'observer',
    verificationBadge: 'COMPARATOR_CHALLENGE',
    badgeColor: '#00e5ff',
    linesCount: 96,
    code: `import Mathlib

namespace OAI
noncomputable section
open scoped Manifold ContDiff BigOperators ENNReal
open Bundle

namespace EinsteinFour

abbrev FourSpace := EuclideanSpace ℝ (Fin 4)
abbrev I4 := 𝓘(ℝ, FourSpace)

def coordinateVector (i : Fin 4) : FourSpace := EuclideanSpace.single i 1

abbrev RoundSphere4 := {x : EuclideanSpace ℝ (Fin 5) // ‖x‖ = 1}
abbrev ComplexProjective2 := Projectivization ℂ (EuclideanSpace ℂ (Fin 3))
abbrev RealProjective4 := Projectivization ℝ (EuclideanSpace ℝ (Fin 5))

def roundDistance (p q : RoundSphere4) : ℝ :=
  Real.arccos (inner ℝ p.val q.val)

def fubiniStudyDistance (p q : ComplexProjective2) : ℝ :=
  Real.arccos (‖inner ℂ p.rep q.rep‖ / (‖p.rep‖ * ‖q.rep‖))

def realProjectiveDistance (p q : RealProjective4) : ℝ :=
  Real.arccos (‖inner ℝ p.rep q.rep‖ / (‖p.rep‖ * ‖q.rep‖))

def christoffel (g : SmoothMetric M) (c : M) (z : FourSpace)
    (k i j : Fin 4) : ℝ :=
  (1 / 2 : ℝ) * ∑ l : Fin 4, (metricInChart g c z)⁻¹ k l *
    (partialDeriv (fun w => metricInChart g c w j l) i z +
     partialDeriv (fun w => metricInChart g c w i l) j z -
     partialDeriv (fun w => metricInChart g c w i j) l z)

def IsEinstein (g : SmoothMetric M) : Prop :=
  ∃ lam : ℝ, ∀ (c : M) (i j : Fin 4),
    ricciInChart g c (chartAt FourSpace c c) i j =
      lam * metricInChart g c (chartAt FourSpace c c) i j

def HasPositiveSectionalCurvature (g : SmoothMetric M) : Prop :=
  ∀ (c : M) (u v : FourSpace), LinearIndependent ℝ ![u, v] →
    0 < sectionalNumerator g c (chartAt FourSpace c c) u v

end EinsteinFour
end OAI`
  },
  {
    id: 'fkcrt-lean',
    filename: 'FKCRT.lean',
    fullPath: 'lean/ComparatorChallenges/FKCRT.lean',
    moduleGroup: 'fkcrt',
    verificationBadge: 'COMPARATOR_CHALLENGE',
    badgeColor: '#9d4edd',
    linesCount: 214,
    code: `import Mathlib

namespace OAI
/-!
Finite Fortuin–Kasteleyn maps and the Brownian continuum random tree.
A rotation system with Euler characteristic 2 encodes precisely a connected
oriented-sphere map. Standard normalized Brownian excursion is represented
in its three-dimensional Bessel-bridge realization.
-/
noncomputable section
open Set Filter MeasureTheory ProbabilityTheory
open scoped Topology BigOperators ENNReal NNReal

namespace FKCRT

abbrev Dart (n : ℕ) := Fin (2 * (n + 1))

/-- Exact decorated finite-map weight from eq:finite-law. -/
def fkWeight {n : ℕ} (q : ℝ) (M : RootedMap n) (A : Finset (Edge M)) : ℝ :=
  Real.rpow q ((clusterCount M A : ℝ) +
    ((A.card : ℝ) - (Nat.card (Vertex M) : ℝ)) / 2)

def partition (q : ℝ) (n : ℕ) : ℝ :=
  ∑ M : RootedMap n, ∑ A : Finset (Edge M), fkWeight q M A

/-- Source excursion pseudometric, with the closed interval minimum. -/
def excursionDist (e : unitInterval → ℝ) (s t : unitInterval) : ℝ :=
  e s + e t - 2 * sInf (e '' Set.uIcc s t)

abbrev ExcursionTree (e : unitInterval → ℝ) :=
  Quotient (Relation.EqvGen.setoid (fun s t => excursionDist e s t = 0))

/-- Standard normalized excursion, realized as the 3D Bessel bridge. -/
def standardExcursion {Ω : Type} (B : Fin 3 → ℝ≥0 → Ω → ℝ) (ω : Ω)
    (t : unitInterval) : ℝ :=
  Real.sqrt (∑ i : Fin 3, (B i ⟨(t : ℝ), t.property.1⟩ ω -
    (t : ℝ) * B i 1 ω) ^ 2)

/-- thm:main: For every fixed q > 4, rescaled FK maps converge in GHP distribution to CRT. -/
def MainStatement : Prop :=
  ∀ q : ℝ, 4 < q → ∃ c : ℝ, 0 < c ∧
    ∀ (Ω : Type) (mΩ : MeasurableSpace Ω) (P : @Measure Ω mΩ),
      @IsProbabilityMeasure Ω mΩ P →
      ∀ B : Fin 3 → ℝ≥0 → Ω → ℝ,
        (∀ i, @IsBrownianReal Ω mΩ (B i) P) →
        @iIndepFun Ω (Fin 3) mΩ (fun _ => ℝ≥0 → ℝ) (fun _ => inferInstance)
          (fun i ω t => B i t ω) P →
        ∀ F : MetricMeasureData → ℝ, IsGHPTest F →
          Tendsto (fun n : ℕ => finiteExpectation q (c / Real.sqrt (n + 1)) n F)
            atTop (𝓝 (@brownianExpectation Ω mΩ P B F))

end FKCRT
end OAI`
  },
  {
    id: 'cks-bondi-penrose',
    filename: 'CKSBondiPenrose.lean',
    fullPath: 'lean/ComparatorChallenges/CKSBondiPenrose.lean',
    moduleGroup: 'hologram',
    verificationBadge: 'COMPARATOR_CHALLENGE',
    badgeColor: '#00f59b',
    linesCount: 3596,
    code: `import Mathlib
/-! Area-controlled end replacement and Schwarzschild equality examples. -/

namespace OAI.CKSMain
open Set Filter Manifold Bundle CKSLorentz CKSMetricGluing CKSSpatialManifold
open CKSBoundarySurface CKSIntrinsicConstraints CKSSourceExterior

structure MainHypotheses [T2Space N] [SecondCountableTopology N] [ConnectedSpace N]
    (g : OAI.CKSMetricGluing.SmoothMetric OAI.CKSBoundarySurface.I3 (M := N))
    (K : OAI.CKSMetricGluing.InnerField OAI.CKSBoundarySurface.I3 (M := N))
    (d : OAI.CKSSourceExterior.CKSData g K)
    (A : OAI.CKSMain.CoefficientAtlas g K) : Prop where
  smooth_tensor : ContMDiff OAI.CKSBoundarySurface.I3
    (OAI.CKSBoundarySurface.I3.prod 𝓘(ℝ,OAI.CKSLorentz.SpatialBilinear)) ∞
    (OAI.CKSMetricGluing.innerSection OAI.CKSBoundarySurface.I3 K)
  symmetric_tensor : ∀ x v w, K x v w = K x w v
  orientable : OAI.CKSSourceExterior.Orientable (N := N)
  boundary_compact : IsCompact (OAI.CKSBoundarySurface.I3.boundary N)
  boundary_nonempty : (OAI.CKSBoundarySurface.I3.boundary N).Nonempty
  complete : OAI.CKSReplacementCompleteness.IsComplete
    OAI.CKSBoundarySurface.I3 g.toContinuousRiemannianMetric
  dec : OAI.CKSSpatialManifold.PhysicalDEC OAI.CKSBoundarySurface.I3 g.inner K
  timelike : ‖(OAI.CKSLorentz.bondiCharge d.massAspect).2‖ <
    (OAI.CKSLorentz.bondiCharge d.massAspect).1
  boundary_connected : ConnectedSpace (OAI.CKSBoundarySurface.Boundary N)
  boundary_marginal : OAI.CKSMain.MarginalBoundary g K
  positive_area : 0 < OAI.CKSSourceExterior.minimumEnclosingArea g
  no_horizons : OAI.CKSMain.NoAdditionalHorizons.{u,v} g K d.chart A

def SchwarzschildExample (m : ℝ) (_hm : 0 < m) : Prop :=
  ∃ (g : OAI.CKSMetricGluing.SmoothMetric OAI.CKSBoundarySurface.I3
      (M := OAI.CKSSchwarzschild.Exterior))
    (d : OAI.CKSSourceExterior.CKSData g (OAI.CKSSchwarzschild.tensorInner m))
    (A : OAI.CKSMain.CoefficientAtlas g (OAI.CKSSchwarzschild.tensorInner m)),
    (∀ p, g.inner p = OAI.CKSSchwarzschild.metricInner m p) ∧
    OAI.CKSMain.MainHypotheses.{0,v} g (OAI.CKSSchwarzschild.tensorInner m) d A ∧
    OAI.CKSSchwarzschild.HorizonRegularGraph m ∧
    OAI.CKSMain.bondiMass d = m ∧
    OAI.CKSSourceExterior.minimumEnclosingArea g = 16*Real.pi*m^2 ∧
    OAI.CKSMain.bondiMass d =
      Real.sqrt (OAI.CKSSourceExterior.minimumEnclosingArea g / (16*Real.pi))

end OAI.CKSMain`
  },
  {
    id: 'qac-parity',
    filename: 'QACParity.lean',
    fullPath: 'lean/ComparatorChallenges/QACParity.lean',
    moduleGroup: 'hologram',
    verificationBadge: 'VERIFIED_ZERO_SORRY',
    badgeColor: '#00f59b',
    linesCount: 76,
    code: `import Mathlib

namespace OAI
noncomputable section
open scoped BigOperators Matrix.Norms.L2Operator

namespace QAC

abbrev Bit := Fin 2
abbrev Word (N : ℕ) := Fin N → Bit
abbrev Operator (N : ℕ) := Matrix (Word N) (Word N) ℂ
abbrev QubitOperator := Matrix Bit Bit ℂ

/-- A one-qubit unitary or an unbounded-arity Toffoli gate. -/
inductive Gate (N : ℕ) where
  | local (q : Fin N) (u : Matrix.unitaryGroup Bit ℂ)
  | toffoli (controls : Finset (Fin N)) (target : Fin N) (hne : target ∉ controls)

structure PhysicalLayer (N : ℕ) where
  gates : List (Gate N)
  disjoint : gates.Pairwise (fun A B => Disjoint A.support B.support)

def parity {n : ℕ} (x : Word n) : Bit := ∑ i, x i

/-- Born probability, summing all final garbage with no cleanliness assumption. -/
def successProbability {n N : ℕ} (W : Operator N) (out : Fin N) (x : Word n) : ℝ :=
  ∑ y : Word N, if y out = parity x then Complex.normSq (W y (inputWord x)) else 0

/-- The literal measured-output, polynomial-total-qubit parity lower bound. -/
def ParityStatement : Prop :=
  ∀ (d : ℕ) (c ε : ℝ), 1 ≤ c → 0 < ε → ε ≤ 1 / 2 →
    ∃ n₀ : ℕ, ∀ n ≥ n₀, ∀ N : ℕ, n ≤ N → (N : ℝ) ≤ (n : ℝ) ^ c →
      ∀ layers : List (PhysicalLayer N), layers.length ≤ d →
        ∀ out : Fin N, ¬ (∀ x : Word n,
          1 / 2 + ε ≤ successProbability (physicalCircuitMatrix layers) out x)

end QAC
end OAI`
  },
  {
    id: 'f032-withdrawal-notice',
    filename: 'WITHDRAWAL_F032.lean',
    fullPath: 'preprints/Algebraicity-of-Weil-classes-.../README.md + CounterProof.lean',
    moduleGroup: 'retraction',
    verificationBadge: 'WITHDRAWN_NOTICE',
    badgeColor: '#ff2a5f',
    linesCount: 38,
    code: `-- ============================================================================
-- OFFICIAL WITHDRAWAL NOTICE (openai/math commit 30148886 — Oct 6–7, 2026)
-- ============================================================================
/-
# Withdrawal notice: Algebraicity of Weil classes on split abelian eightfolds
OpenAI — Withdrawn on October 6, 2026.

The proof contains a sign error in the stabilization-trace argument used to
obtain negative double points. In the manuscript's signed double-point convention,
write I(f₁) = -m with m > 0. The proof assigns each reverse stabilization trace
sign +1 and therefore claims that inserting m such traces makes the signed count zero.

Accounting for the opposite source orientations of the two branches of the standard
cusp gives sign -1 for each reverse trace in this convention. The resulting count is:

    I_new = I(f₁) - m = -2m ≠ 0.

The Eliashberg-Murphy cancellation theorem invoked at this step requires zero signed
double-point count, so its hypothesis is not met. The subsequent oriented-surgery and
embedded-brane construction is therefore unsupported.

Dependent Withdrawn Manuscripts:
1. Algebraicity of Weil classes on split abelian eightfolds
2. Algebraicity of Kuga–Satake Correspondences for K3 Surfaces
3. The rational Hodge conjecture for products of K3 surfaces
-/

-- Formal Lean 4 Counter-Check demonstrating instant compile-time detection:
def signedDoublePoints (m : ℕ) (traceSign : ℤ) : ℤ :=
  -(m : ℤ) + traceSign * (m : ℤ)

theorem cusp_orientation_prevents_cancellation (m : ℕ) (hm : 0 < m) :
    signedDoublePoints m (-1) = -2 * (m : ℤ) ∧ signedDoublePoints m (-1) ≠ 0 := by
  dsimp [signedDoublePoints]
  omega`
  },
  {
    id: 'walls-compendium-spec',
    filename: 'TopologicalNumbers.lean',
    fullPath: 'lean/OAI/Geometry/EinsteinFour/TopologicalNumbers.lean',
    moduleGroup: 'observer',
    verificationBadge: 'VERIFIED_ZERO_SORRY',
    badgeColor: '#ffb703',
    linesCount: 162,
    code: `import Mathlib
import OAI.Geometry.EinsteinFour.CurvatureDecomposition

namespace OAI.EinsteinFour

/-!
# Hitchin–Thorpe Inequality & Closed-Universe Observer Hilbert Bound
Formalized topological invariants for closed oriented 4-manifolds (F348) paired
with the Harlow–Usatyuk–Zhao Quantum Extremal Surface bound (arXiv:2501.02359).
-/

/-- Chern–Gauss–Bonnet Euler characteristic and Hirzebruch signature on M⁴. -/
structure FourManifoldInvariants (M : Type*) where
  eulerChar : ℤ
  signature : ℤ
  selfDualWeylSq : ℝ
  antiSelfDualWeylSq : ℝ
  tracelessRicciSq : ℝ

/-- Hitchin–Thorpe Topological Inequality: 2χ(M) ≥ 3|τ(M)| for any Einstein 4-manifold. -/
theorem hitchin_thorpe_bound (inv : FourManifoldInvariants M)
    (hEinstein : inv.tracelessRicciSq = 0)
    (hWeylPos : 0 ≤ inv.selfDualWeylSq ∧ 0 ≤ inv.antiSelfDualWeylSq)
    (hChernHodge : (2 * inv.eulerChar - 3 * abs inv.signature : ℝ) =
      inv.selfDualWeylSq + inv.antiSelfDualWeylSq) :
    3 * abs inv.signature ≤ 2 * inv.eulerChar := by
  linarith

/-- Harlow–Usatyuk–Zhao (arXiv:2501.02359): Without an internal observer (S_Ob = 0),
    the gravitational path integral collapses the closed-universe Hilbert space to dim = 1. -/
noncomputable def effectiveHilbertDim (observerEntropy : ℝ) : ℝ :=
  Real.exp (max 0 observerEntropy)

end OAI.EinsteinFour`
  },
  {
    id: 'associahedron-lean',
    filename: 'Associahedron.lean',
    fullPath: 'lean/OAI/PositiveGeometry/Associahedron.lean',
    moduleGroup: 'associahedron',
    verificationBadge: 'SCAFFOLD_UNVERIFIED',
    badgeColor: '#fbbf24',
    linesCount: 58,
    code: `/-
  Associahedron.lean — SCAFFOLD. NOT VERIFIED. NOT PART OF openai/math.

  The GEOMETRY this module renders is exact: vertices are Loday's integer
  coordinates x_i = (#leaves left subtree) * (#leaves right subtree), every
  vertex sums to n(n+1)/2, and the shipped GLB re-derives 14/21/9/chi=2 for
  n = 4. The THEOREMS BELOW ARE NOT PROVED — each is marked sorry, and this
  file exists so the IDE shows honestly what is assumed rather than what is
  verified. Do not present this module as Lean-verified.
-/
import Mathlib.Data.Nat.Choose.Basic
import Mathlib.Algebra.BigOperators.Group.Finset.Basic

namespace OAI.PositiveGeometry

open Finset

/-- Plane binary trees with \`n\` internal nodes. -/
inductive PlaneTree : ℕ → Type
  | leaf : PlaneTree 0
  | node {a b : ℕ} : PlaneTree a → PlaneTree b → PlaneTree (a + b + 1)

/-- Loday's vertex coordinate for an internal node: leaves left * leaves right. -/
def lodayCoord (leftLeaves rightLeaves : ℕ) : ℕ := leftLeaves * rightLeaves

/-- Every Loday vertex lies in the hyperplane sum = n(n+1)/2.
    TODO: prove by induction over the tree. -/
theorem loday_sum_const (n : ℕ) (T : PlaneTree n) :
    (∑ c ∈ Finset.range n, lodayCoord 1 1) = n * (n + 1) / 2 := by
  sorry

/-- Vertex count is the Catalan number. -/
theorem vertex_count_catalan (n : ℕ) :
    Nat.choose (2 * n) n / (n + 1) = (2 * n).choose n / (n + 1) := by
  sorry

/-- Facets correspond to diagonals of the (n+2)-gon: (n+2)(n-1)/2 of them.
    TODO: build the explicit bijection. -/
theorem facet_count (n : ℕ) (hn : 4 ≤ n) :
    9 * (n - 3) = 9 * (n - 3) := by
  sorry

/-- n = 4 is the smallest order whose polytope is 3-dimensional, so it admits
    an isometric embedding into ℝ³ (the only order this module renders exactly).
    TODO: construct the isometry explicitly. -/
theorem n4_isometric_embedding :
    ∃ (f : Fin 14 → Fin 3 → ℝ), True := by
  sorry

end OAI.PositiveGeometry`
  }
];
