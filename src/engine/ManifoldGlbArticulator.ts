import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { SimulationUniformState } from '../types/workstation';

export interface ManifoldHostGroups {
  observerGroup: THREE.Group;
  fkcrtGroup: THREE.Group;
  willowGroup: THREE.Group;
  k3Group: THREE.Group;
}

export class ManifoldGlbArticulator {
  private einsteinGlbGroup: THREE.Group | null = null;
  private fkcrtGlbGroup: THREE.Group | null = null;
  private cksGlbGroup: THREE.Group | null = null;
  private k3GlbGroup: THREE.Group | null = null;
  private disposed = false;

  public loadAllManifolds(hosts: ManifoldHostGroups): void {
    const loader = new GLTFLoader();

    loader.load(
      '/models/einstein_saddle.glb',
      (gltf) => {
        if (this.disposed) return;
        const model = gltf.scene;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const isHopfRing = mesh.name.includes('Hopf');
            const ringIdx = parseInt(mesh.name.replace(/\D/g, '') || '0', 10);
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: isHopfRing ? (ringIdx % 2 === 0 ? 0x38bdf8 : 0xa855f7) : 0x0f2942,
              emissive: isHopfRing ? (ringIdx % 2 === 0 ? 0x0284c7 : 0x7e22ce) : 0x064e78,
              emissiveIntensity: isHopfRing ? 0.92 : 0.42,
              metalness: 0.88,
              roughness: isHopfRing ? 0.14 : 0.24,
              transparent: true,
              depthWrite: false,
              opacity: isHopfRing ? 0.68 : 0.24,
              clearcoat: 0.9
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
      '/models/fkcrt_manifold.glb',
      (gltf) => {
        if (this.disposed) return;
        const model = gltf.scene;
        model.scale.setScalar(0.84);
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const isSpine = mesh.name.includes('BesselTreeSpine');
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: isSpine ? 0xf59e0b : 0x2e1065,
              emissive: isSpine ? 0xd97706 : 0x581c87,
              emissiveIntensity: isSpine ? 1.15 : 0.52,
              metalness: 0.9,
              roughness: 0.16,
              wireframe: !isSpine,
              transparent: true,
              depthWrite: false,
              opacity: isSpine ? 0.78 : 0.24
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
      '/models/cks_horizon_funnel.glb',
      (gltf) => {
        if (this.disposed) return;
        const model = gltf.scene;
        model.position.y = -0.35;
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const isPhotonRing = mesh.name.includes('PhotonRing');
            const isErgosphere = mesh.name.includes('KerrErgosphere');
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: isPhotonRing ? 0xfbbf24 : isErgosphere ? 0x0284c7 : 0x064e3b,
              emissive: isPhotonRing ? 0xf59e0b : isErgosphere ? 0x0369a1 : 0x047857,
              emissiveIntensity: isPhotonRing ? 1.45 : isErgosphere ? 0.68 : 0.48,
              metalness: 0.88,
              roughness: 0.18,
              wireframe: !isPhotonRing,
              transparent: true,
              depthWrite: false,
              opacity: isPhotonRing ? 0.88 : isErgosphere ? 0.22 : 0.28
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
      '/models/k3_calabi_yau.glb',
      (gltf) => {
        if (this.disposed) return;
        const model = gltf.scene;
        model.scale.setScalar(0.72);
        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            const isCuspLocus = mesh.name.includes('CuspDoublePointLocus');
            mesh.material = new THREE.MeshPhysicalMaterial({
              color: isCuspLocus ? 0xf43f5e : 0x1e293b,
              emissive: isCuspLocus ? 0xe11d48 : 0x0f766e,
              emissiveIntensity: isCuspLocus ? 1.35 : 0.52,
              metalness: 0.92,
              roughness: 0.14,
              transparent: true,
              depthWrite: false,
              opacity: isCuspLocus ? 0.86 : 0.3,
              clearcoat: 0.85
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
    this.einsteinGlbGroup.visible = act > 0.04;
    this.einsteinGlbGroup.scale.setScalar(0.01 + act * 0.96);
    this.einsteinGlbGroup.rotation.y = elapsed * 0.18;
    this.einsteinGlbGroup.rotation.z = elapsed * 0.11;
  }

  public updateFKCRTManifold(elapsed: number, state: SimulationUniformState): void {
    if (!this.fkcrtGlbGroup) return;
    const treeFactor = Math.max(0, Math.min(1, (state.clusterParameterQ - 3.8) / 0.6));
    this.fkcrtGlbGroup.rotation.x = -elapsed * 0.16;
    this.fkcrtGlbGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name.includes('BesselTreeSpine')) {
        child.scale.setScalar(0.35 + 0.78 * treeFactor * (state.excursionRoughness / 1.15));
      }
    });
  }

  public updateCKSManifold(elapsed: number, state: SimulationUniformState): void {
    if (!this.cksGlbGroup) return;
    this.cksGlbGroup.rotation.y = elapsed * (0.25 + state.kerrSpin * 0.6);
    this.cksGlbGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh && child.name.includes('PhotonRing')) {
        child.scale.setScalar(0.65 + state.bondiMass * 0.35);
      }
    });
  }

  public updateK3Manifold(elapsed: number, state: SimulationUniformState): void {
    if (!this.k3GlbGroup) return;
    this.k3GlbGroup.rotation.z = -elapsed * 0.22;
    const shatterFactor = Math.max(0, Math.min(1, (0.35 - state.stabilizationSign) / 1.35));
    this.k3GlbGroup.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        if (child.name.includes('CuspDoublePointLocus')) {
          child.scale.setScalar(0.85 + shatterFactor * 0.35);
        } else {
          child.visible = state.stabilizationSign > -0.2;
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
