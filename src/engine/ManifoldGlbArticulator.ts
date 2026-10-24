import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SimulationUniformState } from '../types/workstation';
import {
  ASSOCIAHEDRON_ORDERS,
  ASSOCIAHEDRON_ORDERS_LIST,
  clampOrder
} from '../data/associahedronInvariants';
import { resolveFrameIndex } from '../data/associahedronFrameAudit';

export interface ManifoldHostGroups {
  observerGroup: THREE.Group;
  fkcrtGroup: THREE.Group;
  willowGroup: THREE.Group;
  k3Group: THREE.Group;
  associahedronGroup: THREE.Group;
  /** shared glow material for MOD-05 hull-vertex nodes (owned by the scene module) */
  associahedronVertexMat?: THREE.ShaderMaterial;
}

export type AssetStatus = 'idle' | 'loading' | 'ready' | 'failed';

interface AssoFrameRecord {
  mesh: THREE.Mesh;
  material: THREE.MeshPhysicalMaterial;
  wireMaterial: THREE.LineBasicMaterial;
  nodes: THREE.InstancedMesh | null;
}

/** radius the widest hull of each order is fitted to, in host-group units */
const ASSO_TARGET_RADIUS = 2.58;
const ASSO_EDGE_THRESHOLD_DEG = 0.2;

function logLoadFailure(asset: string, err: unknown): void {
  console.warn('[ManifoldGlbArticulator] GLB load failed; module falls back to its shader stage', {
    asset,
    error: err instanceof Error ? err.message : String(err)
  });
}

/** Distinct vertex positions of a (flat-shaded, corner-split) geometry. */
function distinctPositions(geometry: THREE.BufferGeometry): Float32Array {
  const pos = geometry.attributes.position;
  const seen = new Set<string>();
  const out: number[] = [];
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const k = `${x.toFixed(4)},${y.toFixed(4)},${z.toFixed(4)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(x, y, z);
  }
  return new Float32Array(out);
}

/**
 * Releases every geometry and material under `root` — Meshes AND the
 * runtime-created LineSegments / Points. Shared materials passed in by a scene
 * module are skipped via `keep`, since their owner disposes them.
 */
function disposeObjectTree(root: THREE.Object3D, keep?: Set<THREE.Material>): void {
  root.traverse((obj) => {
    const drawable = obj as THREE.Mesh | THREE.LineSegments | THREE.Points;
    drawable.geometry?.dispose();
    const mat = drawable.material;
    if (!mat) return;
    for (const m of Array.isArray(mat) ? mat : [mat]) {
      if (!keep?.has(m)) m.dispose();
    }
  });
}

const HOPF_HARMONIC_RATIOS = [1.0, -1.5, 2.0, -2.5, 3.0];

/**
 * v7.0 Masterpiece Manifold Articulator
 * Drives the 4 Blender 5.2.2 LTS GLB manifolds (19 Sub-Meshes) with:
 * - Baked COLOR_0 Physics Vertex Colors
 * - Thin-Film Quantum Iridescence & Dielectric Clearcoat
 * - Live Shape Key Morph Targets (`Singularity_Collapse`, `Fractal_Roughness`, `Ergo_Bulge`, `Cusp_Shatter`)
 * - Harmonic Gyroscopic Astrolabe Counter-Rotation & Organic CRT Undulation
 */
export class ManifoldGlbArticulator {
  private einsteinGlbGroup: THREE.Group | null = null;
  private fkcrtGlbGroup: THREE.Group | null = null;
  private cksGlbGroup: THREE.Group | null = null;
  private k3GlbGroup: THREE.Group | null = null;
  private assoGlbGroup: THREE.Group | null = null;
  /** order -> frames (one true hull per projection angle); n=4 has a single frame */
  private assoFrames: Map<number, AssoFrameRecord[]> = new Map();
  private assoActiveKey = '';
  private assoStatus: AssetStatus = 'idle';
  private assoVertexMat: THREE.ShaderMaterial | null = null;
  private disposed = false;

  public loadAllManifolds(hosts: ManifoldHostGroups): void {
    const loader = new GLTFLoader();
    this.assoVertexMat = hosts.associahedronVertexMat ?? null;

    // 1. M01: F348 Einstein 4-Saddle + CliffordCore (ShapeKey: Singularity_Collapse) + 5 Hopf Villarceau Rings
    loader.load(
      '/models/einstein_saddle.glb?v=v7',
      (gltf) => {
        if (this.disposed) return;
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const isHopfRing = mesh.name.includes('Hopf');
            const ringIdx = parseInt(mesh.name.replace(/\D/g, '') || '0', 10);
            const hasVCol = Boolean(mesh.geometry.attributes.color);
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: isHopfRing ? (ringIdx % 2 === 0 ? 0x38bdf8 : 0xc084fc) : 0x38bdf8,
              emissive: isHopfRing ? (ringIdx % 2 === 0 ? 0x0284c7 : 0x7e22ce) : 0x0369a1,
              emissiveIntensity: isHopfRing ? 1.35 : 0.78,
              vertexColors: hasVCol,
              metalness: 0.78,
              roughness: isHopfRing ? 0.12 : 0.18,
              iridescence: 0.9,
              iridescenceIOR: 1.33,
              clearcoat: 0.95,
              transparent: true,
              depthWrite: false,
              opacity: isHopfRing ? 0.9 : 0.52
            });
          }
        });
        this.einsteinGlbGroup = model;
        hosts.observerGroup.add(model);
      },
      undefined,
      (err) => logLoadFailure('einstein_saddle.glb', err)
    );

    // 2. M02: FKCRT LQG Sphere (ShapeKey: Fractal_Roughness) + 6 Aldous CRT Spines
    loader.load(
      '/models/fkcrt_manifold.glb?v=v7',
      (gltf) => {
        if (this.disposed) return;
        const model = gltf.scene;
        model.scale.setScalar(0.84);
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const isSpine = mesh.name.includes('BesselTreeSpine');
            const hasVCol = Boolean(mesh.geometry.attributes.color);
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: isSpine ? 0xfbbf24 : 0x7e22ce,
              emissive: isSpine ? 0xd97706 : 0x581c87,
              emissiveIntensity: isSpine ? 1.35 : 0.62,
              vertexColors: hasVCol,
              metalness: 0.85,
              roughness: 0.15,
              iridescence: 0.9,
              iridescenceIOR: 1.33,
              wireframe: !isSpine,
              transparent: true,
              depthWrite: false,
              opacity: isSpine ? 0.86 : 0.34
            });
          }
        });
        this.fkcrtGlbGroup = model;
        hosts.fkcrtGroup.add(model);
      },
      undefined,
      (err) => logLoadFailure('fkcrt_manifold.glb', err)
    );

    // 3. M03: CKS Kerr Funnel + KerrErgosphere (ShapeKey: Ergo_Bulge) + PhotonRing3M
    loader.load(
      '/models/cks_horizon_funnel.glb?v=v7',
      (gltf) => {
        if (this.disposed) return;
        const model = gltf.scene;
        model.position.y = -0.15;
        model.scale.setScalar(1.08);
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const isPhotonRing = mesh.name.includes('PhotonRing');
            const isErgosphere = mesh.name.includes('KerrErgosphere');
            const hasVCol = Boolean(mesh.geometry.attributes.color);
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: isPhotonRing ? 0xfbbf24 : isErgosphere ? 0x38bdf8 : 0x10b981,
              emissive: isPhotonRing ? 0xf59e0b : isErgosphere ? 0x0284c7 : 0x047857,
              emissiveIntensity: isPhotonRing ? 1.65 : isErgosphere ? 0.78 : 0.56,
              vertexColors: hasVCol,
              metalness: 0.84,
              roughness: 0.16,
              iridescence: 0.9,
              iridescenceIOR: 1.33,
              wireframe: !isPhotonRing,
              transparent: true,
              depthWrite: false,
              opacity: isPhotonRing ? 0.92 : isErgosphere ? 0.34 : 0.38
            });
          }
        });
        this.cksGlbGroup = model;
        hosts.willowGroup.add(model);
      },
      undefined,
      (err) => logLoadFailure('cks_horizon_funnel.glb', err)
    );

    // 4. M04: K3 Calabi-Yau Fermat Quintic (ShapeKey: Cusp_Shatter) + 2 Cusp Loci
    loader.load(
      '/models/k3_calabi_yau.glb?v=v7',
      (gltf) => {
        if (this.disposed) return;
        const model = gltf.scene;
        model.scale.setScalar(0.94);
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const isCuspLocus = mesh.name.includes('CuspDoublePointLocus');
            const hasVCol = Boolean(mesh.geometry.attributes.color);
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: isCuspLocus ? 0xf43f5e : 0x2dd4bf,
              emissive: isCuspLocus ? 0xe11d48 : 0x0f766e,
              emissiveIntensity: isCuspLocus ? 1.55 : 0.65,
              vertexColors: hasVCol,
              metalness: 0.86,
              roughness: 0.14,
              iridescence: 0.9,
              iridescenceIOR: 1.33,
              clearcoat: 0.92,
              transparent: true,
              depthWrite: false,
              opacity: isCuspLocus ? 0.9 : 0.42
            });
          }
        });
        this.k3GlbGroup = model;
        hosts.k3Group.add(model);
      },
      undefined,
      (err) => logLoadFailure('k3_calabi_yau.glb', err)
    );

    // 5. M05: Associahedron (Loday realization) — baked as 1 exact hull for n=4
    // and 24 independently hulled projections each for n=5 / n=6.
    this.assoStatus = 'loading';
    loader.load(
      '/models/associahedron.glb?v=v8',
      (gltf) => {
        if (this.disposed) {
          disposeObjectTree(gltf.scene);
          return;
        }
        const model = gltf.scene;
        const accents: Record<number, number> = { 4: 0x5eead4, 5: 0x93c5fd, 6: 0xd8b4fe };
        const frames = new Map<number, AssoFrameRecord[]>();

        // Only real hull meshes may be processed. InstancedMesh.isMesh is TRUE,
        // so without this guard the vertex gems added below get traversed as if
        // they were hulls — each pass adds more gems and the traversal recurses
        // until the stack overflows (that is how the whole module failed to load).
        const HULL_NAME = /^AssoN[456](_Proj\d\d)?(_Cage)?$/;

        model.traverse((child) => {
          if (!(child as THREE.Mesh).isMesh) return;
          const mesh = child as THREE.Mesh;
          if (!HULL_NAME.test(mesh.name)) return;
          const order = mesh.name.startsWith('AssoN6') ? 6 : mesh.name.startsWith('AssoN5') ? 5 : 4;
          const accent = accents[order];
          const isCage = mesh.name.includes('_Cage');

          // Diffuse-forward dielectric. Metalness + high gloss on a starfield read
          // as a near-black ghost (measured: object coverage fell 11.9% -> 1.3% of
          // the viewport), so facets are lit diffusely with a modest self-glow.
          mesh.material = new THREE.MeshPhysicalMaterial({
            color: isCage ? 0x94a3b8 : accent,
            emissive: isCage ? 0x0f172a : accent,
            emissiveIntensity: isCage ? 0.05 : 0.32,
            metalness: 0.15,
            roughness: 0.34,
            clearcoat: 0.65,
            clearcoatRoughness: 0.18,
            iridescence: 0.3,
            iridescenceIOR: 1.25,
            flatShading: true,
            transparent: false,
            depthWrite: true,
            side: THREE.FrontSide
          });
          mesh.visible = false;
          if (isCage) return; // exactness reference only, never rendered

          // glTF cannot carry edge-only meshes, so the lattice is generated here.
          // 0.2° (not 1°) so near-flat ridges of the projected hulls are kept:
          // at 1° EdgesGeometry silently dropped real edges on 5 frames.
          const wire = new THREE.LineSegments(
            new THREE.EdgesGeometry(mesh.geometry, ASSO_EDGE_THRESHOLD_DEG),
            new THREE.LineBasicMaterial({
              color: accent,
              transparent: true,
              opacity: 0.9,
              depthWrite: false,
              toneMapped: false
            })
          );
          wire.name = `${mesh.name}_Wire`;
          mesh.add(wire);

          // Vertex markers sit exactly on the hull's distinct vertex positions.
          // Small instanced octahedra, NOT additive point sprites: the sprites
          // bloomed into cotton balls that hid the geometry they were marking.
          let nodes: THREE.InstancedMesh | null = null;
          const nodePositions = distinctPositions(mesh.geometry);
          const nodeCount = nodePositions.length / 3;
          if (nodeCount > 0) {
            nodes = new THREE.InstancedMesh(
              new THREE.OctahedronGeometry(0.05, 0),
              new THREE.MeshBasicMaterial({ color: accent }),
              nodeCount
            );
            nodes.name = `${mesh.name}_Nodes`;
            const m4 = new THREE.Matrix4();
            for (let i = 0; i < nodeCount; i++) {
              m4.makeTranslation(nodePositions[i * 3], nodePositions[i * 3 + 1], nodePositions[i * 3 + 2]);
              nodes.setMatrixAt(i, m4);
            }
            nodes.instanceMatrix.needsUpdate = true;
            mesh.add(nodes);
          }

          const list = frames.get(order) ?? [];
          list.push({
            mesh,
            material: mesh.material as THREE.MeshPhysicalMaterial,
            wireMaterial: wire.material as THREE.LineBasicMaterial,
            nodes
          });
          frames.set(order, list);
        });

        // frames must be ordered by index, not by traversal order
        for (const list of frames.values()) {
          list.sort((a, b) => a.mesh.name.localeCompare(b.mesh.name));
        }

        // Fail loudly-but-safely if the asset and the sidecar disagree: frame
        // selection is index-based, so a count mismatch would desynchronise the
        // HUD numbers from the mesh on screen.
        for (const order of ASSOCIAHEDRON_ORDERS_LIST) {
          const expected = ASSOCIAHEDRON_ORDERS[order].frames.map((f) => f.mesh);
          const got = (frames.get(order) ?? []).map((r) => r.mesh.name);
          if (expected.length !== got.length || expected.some((name, i) => name !== got[i])) {
            console.warn('[ManifoldGlbArticulator] MOD-05 GLB/sidecar frame mismatch; module disabled', {
              order,
              expected: expected.length,
              got: got.length
            });
            (window as unknown as Record<string, unknown>).__assoMismatch = { expected, got };
            console.error('[MOD-05] frame/sidecar mismatch', { expected, got });
            this.assoStatus = 'failed';
            disposeObjectTree(model);
            return;
          }
          // One uniform scale per ORDER (never per frame, so the sweep does not
          // breathe): fit the order's widest hull into the shared optical sphere.
          // Uniform scaling is a similarity, so n=4 stays isometric up to scale.
          const list = frames.get(order) ?? [];
          let radius = 0;
          for (const rec of list) {
            rec.mesh.geometry.computeBoundingSphere();
            const bs = rec.mesh.geometry.boundingSphere;
            // bs.radius alone: center.length() + radius double-counts the offset and
            // can shrink the object by nearly 2x
            if (bs) radius = Math.max(radius, bs.radius);
          }
          const scale = radius > 0 ? ASSO_TARGET_RADIUS / radius : 1;
          for (const rec of list) rec.mesh.scale.setScalar(scale);
        }

        // Contained lights: MOD-05 is the only module whose surface depends on
        // diffuse shading. Scoped to the group so no other module changes.
        const fill = new THREE.PointLight(0xe0f2fe, 18, 26, 2);
        fill.position.set(2.5, 3.2, 6.0);
        const rim = new THREE.PointLight(0xa78bfa, 10, 26, 2);
        rim.position.set(-4.0, -2.5, -4.0);
        model.add(fill, rim);

        this.assoFrames = frames;
        this.assoGlbGroup = model;
        this.assoStatus = 'ready';
        hosts.associahedronGroup.add(model);
      },
      undefined,
      (err) => {
        this.assoStatus = 'failed';
        (window as unknown as Record<string, unknown>).__assoErr = String(err && (err as Error).message || err);
        logLoadFailure('associahedron.glb', err);
      }
    );
  }

  /** Lifecycle of the MOD-05 asset, so callers can degrade instead of guessing. */
  public getAssociahedronStatus(): AssetStatus {
    return this.assoStatus;
  }

  /**
   * MOD-05: shows exactly one baked hull — the exact n=4 cage, or the n=5/6
   * hull whose projection angle matches the sweep slider. Every frame shown is
   * a true convex hull; nothing is morphed between different topologies. Frame
   * choice goes through `resolveFrameIndex`, the same resolver the HUD uses, so
   * the V/E/F readout always describes the mesh on screen.
   */
  public updateAssociahedronManifold(elapsed: number, state: SimulationUniformState): void {
    if (!this.assoGlbGroup) return;
    const order = clampOrder(state.associahedronOrder);
    const frames = this.assoFrames.get(order);
    if (!frames || frames.length === 0) return;

    const idx = Math.min(frames.length - 1, resolveFrameIndex(state.projectionSweep, order));
    const key = `${order}:${idx}`;
    if (key !== this.assoActiveKey) {
      for (const [o, list] of this.assoFrames) {
        list.forEach((rec, i) => {
          rec.mesh.visible = o === order && i === idx;
        });
      }
      this.assoActiveKey = key;
    }

    this.assoGlbGroup.rotation.y = elapsed * 0.22;
    this.assoGlbGroup.rotation.x = Math.sin(elapsed * 0.31) * 0.18;

    // Global emphasis only: the focus slider brightens the whole active hull.
    // The GLB carries no facet ids, so no single facet is selected (deferred).
    const active = frames[idx];
    const focus = state.facetResidueFocus;
    active.material.emissiveIntensity = 0.30 + focus * 0.22 + 0.03 * Math.sin(elapsed * 3.2);
    active.wireMaterial.opacity = 0.35 + focus * 0.45;
  }

  public updateObserverManifold(elapsed: number, state: SimulationUniformState): void {
    if (!this.einsteinGlbGroup) return;
    const act = Math.min(1.0, state.observerEntropy / 8.0);
    const collapseMorph = Math.max(0.0, Math.min(1.0, 1.0 - state.observerEntropy / 6.0));
    this.einsteinGlbGroup.visible = act > 0.02;
    this.einsteinGlbGroup.scale.setScalar(0.18 + act * 0.82);

    this.einsteinGlbGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) {
          mesh.morphTargetInfluences[0] = collapseMorph;
        }
        if (mesh.name.includes('Hopf')) {
          const idx = parseInt(mesh.name.replace(/\D/g, '') || '0', 10) % 5;
          const ratio = HOPF_HARMONIC_RATIOS[idx];
          mesh.rotation.y = elapsed * 0.22 * ratio;
          mesh.rotation.x = Math.sin(elapsed * 0.35 + idx) * 0.18 * state.wormholeCoupling;
        } else {
          mesh.rotation.y = elapsed * 0.16 + state.manifoldMorph * 0.55;
          mesh.rotation.z = elapsed * 0.1 + state.manifoldMorph * 0.35;
        }
      }
    });
  }

  public updateFKCRTManifold(elapsed: number, state: SimulationUniformState): void {
    if (!this.fkcrtGlbGroup) return;
    const treeFactor = Math.max(0, Math.min(1, (state.clusterParameterQ - 3.6) / 0.8));
    const fractalMorph = Math.max(0, Math.min(1, (state.clusterParameterQ - 1.5) / 4.5));
    this.fkcrtGlbGroup.rotation.x = -elapsed * 0.14;

    this.fkcrtGlbGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) {
          mesh.morphTargetInfluences[0] = fractalMorph;
        }
        if (mesh.name.includes('BesselTreeSpine')) {
          const idx = parseInt(mesh.name.replace(/\D/g, '') || '0', 10);
          const clampedRough = Math.min(1.35, state.excursionRoughness / 1.15);
          const edgeScale = 0.88 + (state.planarEdgesN - 1.0) * 0.06;
          const sway = 1.0 + 0.08 * Math.sin(elapsed * 2.2 + idx * 1.1);
          mesh.scale.setScalar((0.35 + 0.65 * treeFactor * clampedRough) * sway * edgeScale);
          mesh.rotation.z = Math.sin(elapsed * 1.6 + idx * 0.9) * 0.12 * clampedRough;
        }
      }
    });
  }

  public updateCKSManifold(elapsed: number, state: SimulationUniformState): void {
    if (!this.cksGlbGroup) return;
    const ergoMorph = Math.max(0, Math.min(1, state.kerrSpin));
    this.cksGlbGroup.rotation.y = elapsed * (0.24 + state.kerrSpin * 0.58);

    this.cksGlbGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) {
          mesh.morphTargetInfluences[0] = ergoMorph;
        }
        if (mesh.name.includes('PhotonRing')) {
          const pulse = 1.0 + 0.03 * Math.sin(elapsed * 4.0);
          mesh.scale.setScalar((0.82 + state.bondiMass * 0.3) * pulse);
          const mat = mesh.material as THREE.MeshPhysicalMaterial;
          if (mat && typeof mat.emissiveIntensity === 'number') {
            mat.emissiveIntensity = 1.15 + state.boundaryQubitFlux * 0.35;
          }
        }
      }
    });
  }

  public updateK3Manifold(elapsed: number, state: SimulationUniformState): void {
    if (!this.k3GlbGroup) return;
    const shatterFactor = Math.max(0, Math.min(1, (0.35 - state.stabilizationSign) / 1.35));
    const mScale = 0.85 + (state.doublePointCountM / 12.0) * 0.3;
    this.k3GlbGroup.rotation.z = -elapsed * 0.2 + (state.calabiYauSlice - 1.57) * 0.45;

    this.k3GlbGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) {
          mesh.morphTargetInfluences[0] = shatterFactor;
        }
        if (mesh.name.includes('CuspDoublePointLocus')) {
          const idx = parseInt(mesh.name.replace(/\D/g, '') || '0', 10);
          mesh.scale.setScalar((0.88 + shatterFactor * 0.32) * mScale);
          mesh.rotation.x = elapsed * (idx === 0 ? 0.35 : -0.35) + (state.calabiYauSlice - 1.57) * 0.3;
        } else {
          mesh.visible = state.stabilizationSign > -0.35;
        }
      }
    });
  }

  public dispose(): void {
    this.disposed = true;
    const keep = new Set<THREE.Material>(this.assoVertexMat ? [this.assoVertexMat] : []);
    const groups = [this.einsteinGlbGroup, this.fkcrtGlbGroup, this.cksGlbGroup, this.k3GlbGroup, this.assoGlbGroup];
    for (const g of groups) {
      if (!g) continue;
      g.removeFromParent();
      disposeObjectTree(g, keep);
    }
    this.einsteinGlbGroup = null;
    this.fkcrtGlbGroup = null;
    this.cksGlbGroup = null;
    this.k3GlbGroup = null;
    this.assoGlbGroup = null;
    this.assoFrames.clear();
  }
}
