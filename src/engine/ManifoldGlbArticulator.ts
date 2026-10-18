import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SimulationUniformState } from '../types/workstation';

export interface ManifoldHostGroups {
  observerGroup: THREE.Group;
  fkcrtGroup: THREE.Group;
  willowGroup: THREE.Group;
  k3Group: THREE.Group;
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
  private disposed = false;

  public loadAllManifolds(hosts: ManifoldHostGroups): void {
    const loader = new GLTFLoader();

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
      () => {}
    );

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
      () => {}
    );

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
      () => {}
    );

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
      () => {}
    );
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
          mesh.rotation.y = elapsed * 0.16;
          mesh.rotation.z = elapsed * 0.1;
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
          const sway = 1.0 + 0.08 * Math.sin(elapsed * 2.2 + idx * 1.1);
          mesh.scale.setScalar((0.35 + 0.65 * treeFactor * clampedRough) * sway);
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
        }
      }
    });
  }

  public updateK3Manifold(elapsed: number, state: SimulationUniformState): void {
    if (!this.k3GlbGroup) return;
    const shatterFactor = Math.max(0, Math.min(1, (0.35 - state.stabilizationSign) / 1.35));
    this.k3GlbGroup.rotation.z = -elapsed * 0.2;

    this.k3GlbGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.morphTargetInfluences && mesh.morphTargetInfluences.length > 0) {
          mesh.morphTargetInfluences[0] = shatterFactor;
        }
        if (mesh.name.includes('CuspDoublePointLocus')) {
          const idx = parseInt(mesh.name.replace(/\D/g, '') || '0', 10);
          mesh.scale.setScalar(0.88 + shatterFactor * 0.32);
          mesh.rotation.x = elapsed * (idx === 0 ? 0.35 : -0.35);
        } else {
          mesh.visible = state.stabilizationSign > -0.35;
        }
      }
    });
  }

  public dispose(): void {
    this.disposed = true;
    const groups = [this.einsteinGlbGroup, this.fkcrtGlbGroup, this.cksGlbGroup, this.k3GlbGroup];
    for (const g of groups) {
      if (!g) continue;
      g.traverse((obj) => {
        if ((obj as THREE.Mesh).isMesh) {
          const m = obj as THREE.Mesh;
          m.geometry?.dispose();
          if (Array.isArray(m.material)) {
            m.material.forEach((mat) => mat.dispose());
          } else {
            m.material?.dispose();
          }
        }
      });
    }
  }
}
