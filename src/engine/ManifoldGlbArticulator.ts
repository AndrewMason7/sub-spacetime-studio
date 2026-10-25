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
  nodesMaterial: THREE.MeshBasicMaterial | null;
  nodes: THREE.InstancedMesh | null;
  shaderUniforms: {
    uAssoSweepPhase: { value: number };
  };
}

const ASSO_ACCENT_COLORS: Record<number, THREE.Color> = {
  4: new THREE.Color(0x5eead4),
  5: new THREE.Color(0x93c5fd),
  6: new THREE.Color(0xd8b4fe)
};

function sampleAssociahedronAccent(continuousOrder: number, target: THREE.Color): THREE.Color {
  const clamped = Math.max(4.0, Math.min(6.0, continuousOrder));
  if (clamped <= 5.0) {
    return target.lerpColors(ASSO_ACCENT_COLORS[4], ASSO_ACCENT_COLORS[5], clamped - 4.0);
  }
  return target.lerpColors(ASSO_ACCENT_COLORS[5], ASSO_ACCENT_COLORS[6], clamped - 5.0);
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
  private assoLightRig: THREE.Group | null = null;
  private assoGrazingLight: THREE.PointLight | null = null;
  /** order -> frames (one true hull per projection angle); n=4 has a single frame */
  private assoFrames: Map<number, AssoFrameRecord[]> = new Map();
  private assoActiveKey = '';
  private assoBlendedColor = new THREE.Color(0x5eead4);
  private assoLastTime = 0;
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

          // Argon's jewel surface (recovered from the archived bundle index-B3-fMCmZ.js).
          // Flat-shaded facets + sheen + a per-facet tangent frame injected into the
          // standard shader: the tangent is the in-plane offset from the facet's pedal
          // centre, so Fresnel and the two travelling studio strips are computed per
          // facet rather than per pixel-across-a-plane. A soft-knee compressor keeps
          // every facet below 0.385 linear luminance, i.e. under the 0.42 bloom threshold.
          const shaderUniforms = { uAssoSweepPhase: { value: 0 } };
          const mat = new THREE.MeshPhysicalMaterial({
            color: isCage ? 0x94a3b8 : accent,
            emissive: isCage ? 0x0f172a : accent,
            emissiveIntensity: isCage ? 0.05 : 0.12,
            metalness: 0.14,
            roughness: 0.22,
            clearcoat: 0.92,
            clearcoatRoughness: 0.16,
            iridescence: 0.58,
            iridescenceIOR: 1.38,
            sheen: 0.62,
            sheenRoughness: 0.24,
            sheenColor: new THREE.Color(0x99f6e4),
            flatShading: true,
            transparent: false,
            depthWrite: true,
            side: THREE.FrontSide
          });

          if (!isCage) {
            mat.onBeforeCompile = (shader) => {
              shader.uniforms.uAssoSweepPhase = shaderUniforms.uAssoSweepPhase;

              shader.vertexShader = shader.vertexShader.replace(
                '#include <common>',
                `#include <common>
                varying vec3 vAssoViewOffset;`
              );
              shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `#include <begin_vertex>
                vec3 assoWorldCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
                vec3 assoWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
                vAssoViewOffset = mat3(viewMatrix) * (assoWorldPos - assoWorldCenter);`
              );

              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <common>',
                `#include <common>
                uniform float uAssoSweepPhase;
                varying vec3 vAssoViewOffset;`
              );

              shader.fragmentShader = shader.fragmentShader.replace(
                '#include <opaque_fragment>',
                `// Exact intra-facet tangent coordinates: for a flat facet with unit normal N,
                // dot(vAssoViewOffset, normal) is the constant support distance of that facet
                // plane, so facetTangent is the in-plane offset from the facet's pedal centre.
                vec3 viewDir = normalize(vViewPosition);
                vec3 facetTangent = vAssoViewOffset - normal * dot(vAssoViewOffset, normal);
                float facetRadial = length(facetTangent);
                // Dispersion normal: discontinuous across crease edges, sweeps within a facet
                vec3 optNormal = normalize(normal + 0.68 * facetTangent);

                float ndotvOpt = clamp(dot(optNormal, viewDir), 0.0, 1.0);
                // Target oblique side and lower facets, preserve the bright top cap
                float sideMask = smoothstep(0.52, -0.05, normal.y);
                // Carve jewelled depth into the interior of side facets
                float interiorCarve = mix(1.0, 0.68 + 0.32 * smoothstep(0.25, 1.05, facetRadial), sideMask);
                outgoingLight *= interiorCarve;

                // 1. Grazing-angle Fresnel along outer and lower facet perimeters
                float fresnelRim = pow(1.0 - ndotvOpt, 2.25) * smoothstep(0.18, 0.95, facetRadial);
                float lowerRightWeight = 0.65 + 0.55 * smoothstep(-0.4, 0.9, vAssoViewOffset.x - 0.65 * vAssoViewOffset.y);

                // 2. Travelling studio strips raking across side and lower facets
                vec3 reflDir = reflect(-viewDir, optNormal);
                float phase = uAssoSweepPhase;
                vec3 rightStudioDir = normalize(vec3(
                  0.64 + 0.16 * sin(phase * 0.65 - 0.8),
                  -0.22 + 0.14 * cos(phase * 0.50),
                  0.70
                ));
                vec3 lowerStudioDir = normalize(vec3(
                  -0.28 + 0.20 * cos(phase * 0.55),
                  -0.58 + 0.14 * sin(phase * 0.45),
                  0.76
                ));
                float specRight = pow(max(0.0, dot(reflDir, rightStudioDir)), 22.0);
                float specLower = pow(max(0.0, dot(reflDir, lowerStudioDir)), 18.0);

                vec3 iceSpecColor = vec3(0.84, 0.99, 0.97);
                vec3 grazingTealColor = mix(vec3(0.37, 0.92, 0.83), vec3(0.58, 0.77, 0.99), smoothstep(0.0, -1.2, vAssoViewOffset.y));
                vec3 violetRimColor = vec3(0.76, 0.54, 0.99);

                outgoingLight += sideMask * (
                  0.18 * fresnelRim * lowerRightWeight * grazingTealColor +
                  0.26 * specRight * iceSpecColor +
                  0.16 * specLower * mix(grazingTealColor, violetRimColor, 0.42)
                );

                // Sub-bloom soft-knee ceiling: the engine's bloom thresholds at 0.42
                // linear luminance, so compress above 0.25 toward an asymptote of 0.385.
                float outLum = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
                if (outLum > 0.25) {
                  float compressedLum = 0.25 + 0.135 * tanh((outLum - 0.25) / 0.135);
                  outgoingLight *= compressedLum / max(outLum, 1e-4);
                }
                #include <opaque_fragment>`
              );
            };
          }

          mesh.material = mat;
          mesh.visible = false;
          if (isCage) return; // exactness reference only, never rendered

          // Edge lattice: for exact n=4 cage, extract the 21 authentic cage edges
          // from AssoN4_Cage to avoid bevel triangulation. For n=5/6, generate
          // with ASSO_EDGE_THRESHOLD_DEG = 0.2° to preserve all true shadow ridges.
          let wireGeo: THREE.BufferGeometry;
          const cageMesh = order === 4 ? (model.getObjectByName('AssoN4_Cage') as THREE.Mesh | null) : null;
          if (order === 4 && cageMesh && cageMesh.geometry) {
            wireGeo = new THREE.EdgesGeometry(cageMesh.geometry, 1.0);
          } else {
            wireGeo = new THREE.EdgesGeometry(mesh.geometry, ASSO_EDGE_THRESHOLD_DEG);
          }

          const wire = new THREE.LineSegments(
            wireGeo,
            new THREE.LineBasicMaterial({
              color: accent,
              transparent: true,
              opacity: 0.75,
              depthWrite: false,
              toneMapped: false
            })
          );
          wire.name = `${mesh.name}_Wire`;
          mesh.add(wire);

          // Vertex markers: placed on the genuine polytope vertices (14 for n=4 via cage,
          // or distinct positions of each convex hull for n=5/6).
          // Styled as luminous faceted octahedra (vertex gems) with controlled tone mapping.
          let nodes: THREE.InstancedMesh | null = null;
          let nodesMaterial: THREE.MeshBasicMaterial | null = null;
          const nodePositions = (order === 4 && cageMesh && cageMesh.geometry)
            ? distinctPositions(cageMesh.geometry)
            : distinctPositions(mesh.geometry);
          const nodeCount = nodePositions.length / 3;
          if (nodeCount > 0) {
            nodesMaterial = new THREE.MeshBasicMaterial({
              color: accent,
              toneMapped: false
            });
            nodes = new THREE.InstancedMesh(
              new THREE.OctahedronGeometry(0.048, 0),
              nodesMaterial,
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
            nodesMaterial,
            nodes,
            shaderUniforms
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

        // Contained light rig (recovered from the archived Argon build):
        // teal key, violet rim, and an orbiting grazing light that rakes the side facets.
        const rig = new THREE.Group();
        rig.name = 'AssociahedronLightRig';
        rig.rotation.order = 'YXZ';
        const fill = new THREE.PointLight(0xccfbf1, 12, 28, 2);
        fill.position.set(3.6, 4.4, 5.6);
        const rim = new THREE.PointLight(0xc084fc, 8.5, 28, 2);
        rim.position.set(-4.6, -2.4, -3.8);
        const grazing = new THREE.PointLight(0x67e8f9, 7.5, 24, 2);
        grazing.position.set(5.6, -2.4, 2.4);
        rig.add(fill, rim, grazing);
        model.add(rig);
        this.assoLightRig = rig;
        this.assoGrazingLight = grazing;

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

    // Smoothly interpolate crystal, wireframe, and vertex-gem color across n = 4 <-> 5 <-> 6
    // so there is never an abrupt color pop when switching orders or running the Director Tour!
    const targetColor = sampleAssociahedronAccent(state.associahedronOrder, new THREE.Color());
    const dt = Math.max(0.005, Math.min(0.1, Math.abs(elapsed - this.assoLastTime) || 0.016));
    this.assoLastTime = elapsed;
    const colorLerpFactor = 1.0 - Math.exp(-dt * 7.5);
    this.assoBlendedColor.lerp(targetColor, colorLerpFactor);

    active.material.color.copy(this.assoBlendedColor);
    active.material.emissive.copy(this.assoBlendedColor);
    active.wireMaterial.color.copy(this.assoBlendedColor);
    if (active.nodesMaterial) {
      active.nodesMaterial.color.copy(this.assoBlendedColor);
    }

    active.material.emissiveIntensity = 0.11 + focus * 0.14 + 0.015 * Math.sin(elapsed * 3.2);
    active.wireMaterial.opacity = 0.62 + focus * 0.3;
    active.shaderUniforms.uAssoSweepPhase.value = elapsed + state.projectionSweep * Math.PI;

    if (this.assoGrazingLight) {
      const orbit = -elapsed * 0.34 + 0.42;
      this.assoGrazingLight.position.set(
        5.2 * Math.cos(orbit),
        -2.1 + 0.65 * Math.sin(elapsed * 0.48),
        3.2 + 1.8 * Math.sin(orbit)
      );
    }
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
