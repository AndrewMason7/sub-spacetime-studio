import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  EffectComposer,
  RenderPass,
  EffectPass,
  BloomEffect,
  ChromaticAberrationEffect,
  NoiseEffect,
  VignetteEffect,
  ToneMappingEffect,
  ToneMappingMode,
  BlendFunction
} from 'postprocessing';
import { CameraPresetId, SceneModeId, SimulationUniformState } from '../types/workstation';
import { createObserverHilbertScene, ObserverSceneHandles } from './shaders/observerHilbertShader';
import { createFKCRTScene, FKCRTSceneHandles } from './shaders/fkcrtPhaseShader';
import { createWillowHologramScene, WillowHologramHandles } from './shaders/willowHologramShader';
import { createK3RetractionScene, K3RetractionHandles } from './shaders/k3RetractionShader';
import { ManifoldGlbArticulator } from './ManifoldGlbArticulator';

const SCENE_BASE_SCALES: Record<SceneModeId, number> = {
  observer: 0.84,
  fkcrt: 0.84,
  hologram: 0.84,
  retraction: 0.88
};

const OPTICAL_CENTER_Y = 0.06;
const DEFAULT_CAMERA_DIST = 9.6;

export class QuantumSpacetimeEngine {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private bloomEffect: BloomEffect;
  private chromaticEffect: ChromaticAberrationEffect;
  private controls: OrbitControls;
  private gridHelper: THREE.GridHelper;

  private observerHandles: ObserverSceneHandles;
  private fkcrtHandles: FKCRTSceneHandles;
  private willowHandles: WillowHologramHandles;
  private k3Handles: K3RetractionHandles;
  private starfieldPoints!: THREE.Points;
  private glbArticulator: ManifoldGlbArticulator;

  private activeMode: SceneModeId = 'observer';
  private modePresence: Record<SceneModeId, number> = {
    observer: 1.0,
    fkcrt: 0.0,
    hologram: 0.0,
    retraction: 0.0
  };

  private simTime = 0.0;
  private lastWallTime = performance.now();
  public isPaused = false;
  public timeScale = 1.0;
  private shockwavePulse = 0.0;
  private cameraAnimToken = 0;
  private isDirectorTourActive = false;
  private directorTourTime = 0.0;

  public fps = 60.0;
  private frameCount = 0;
  private lastFpsTime = performance.now();

  public state: SimulationUniformState = {
    observerEntropy: 8.4,
    wormholeCoupling: 1.0,
    manifoldMorph: 0.65,
    clusterParameterQ: 2.2,
    excursionRoughness: 1.15,
    planarEdgesN: 3.2,
    bondiMass: 1.2,
    boundaryQubitFlux: 1.6,
    kerrSpin: 0.72,
    stabilizationSign: 1.0,
    doublePointCountM: 6.0,
    calabiYauSlice: 1.57
  };

  constructor(container: HTMLElement) {
    this.container = container;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x030508);
    this.scene.fog = new THREE.FogExp2(0x030508, 0.025);

    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 200);
    this.camera.position.set(0, 2.1, 9.57);

    this.renderer = new THREE.WebGLRenderer({
      powerPreference: 'high-performance',
      antialias: false,
      stencil: false,
      depth: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.4);
    this.scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xbae6fd, 2.8);
    keyLight.position.set(6, 10, 8);
    this.scene.add(keyLight);

    const rimLight = new THREE.PointLight(0x818cf8, 4.5, 22);
    rimLight.position.set(-6, -4, -5);
    this.scene.add(rimLight);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.045;
    this.controls.maxDistance = 24;
    this.controls.minDistance = 2.0;
    this.controls.autoRotate = true;
    this.controls.autoRotateSpeed = 0.55;

    this.gridHelper = new THREE.GridHelper(24, 24, 0x162032, 0x0b101b);
    this.gridHelper.position.y = -3.65;
    this.scene.add(this.gridHelper);

    this.composer = new EffectComposer(this.renderer, {
      frameBufferType: THREE.HalfFloatType,
      multisampling: 2
    });

    const renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(renderPass);

    this.bloomEffect = new BloomEffect({
      intensity: 0.95,
      luminanceThreshold: 0.42,
      luminanceSmoothing: 0.75,
      mipmapBlur: true
    });

    this.chromaticEffect = new ChromaticAberrationEffect({
      offset: new THREE.Vector2(0.0014, 0.0014),
      radialModulation: true,
      modulationOffset: 0.25
    });

    const noiseEffect = new NoiseEffect({
      blendFunction: BlendFunction.OVERLAY,
      premultiply: true
    });
    noiseEffect.blendMode.opacity.value = 0.026;

    const vignetteEffect = new VignetteEffect({
      eskil: false,
      offset: 0.28,
      darkness: 0.68
    });

    const toneMappingEffect = new ToneMappingEffect({
      mode: ToneMappingMode.ACES_FILMIC
    });

    const effectPass = new EffectPass(
      this.camera,
      this.bloomEffect,
      this.chromaticEffect,
      vignetteEffect,
      noiseEffect,
      toneMappingEffect
    );
    this.composer.addPass(effectPass);

    this.buildAmbientStarfield();
    this.observerHandles = createObserverHilbertScene();
    this.fkcrtHandles = createFKCRTScene();
    this.willowHandles = createWillowHologramScene();
    this.k3Handles = createK3RetractionScene();

    this.observerHandles.group.position.y = OPTICAL_CENTER_Y;
    this.fkcrtHandles.group.position.y = OPTICAL_CENTER_Y;
    this.willowHandles.group.position.y = OPTICAL_CENTER_Y;
    this.k3Handles.group.position.y = OPTICAL_CENTER_Y;

    this.observerHandles.group.scale.setScalar(SCENE_BASE_SCALES.observer);
    this.fkcrtHandles.group.scale.setScalar(0.01);
    this.willowHandles.group.scale.setScalar(0.01);
    this.k3Handles.group.scale.setScalar(0.01);

    this.fkcrtHandles.group.visible = false;
    this.willowHandles.group.visible = false;
    this.k3Handles.group.visible = false;

    this.scene.add(this.observerHandles.group);
    this.scene.add(this.fkcrtHandles.group);
    this.scene.add(this.willowHandles.group);
    this.scene.add(this.k3Handles.group);

    this.glbArticulator = new ManifoldGlbArticulator();
    this.glbArticulator.loadAllManifolds({
      observerGroup: this.observerHandles.group,
      fkcrtGroup: this.fkcrtHandles.group,
      willowGroup: this.willowHandles.group,
      k3Group: this.k3Handles.group
    });
  }

  private buildAmbientStarfield(): void {
    const count = 2400;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 16 + Math.random() * 48;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const c = new THREE.Color().setHSL(0.56 + Math.random() * 0.14, 0.7, 0.55 + Math.random() * 0.35);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const mat = new THREE.PointsMaterial({
      size: 0.13,
      vertexColors: true,
      transparent: true,
      opacity: 0.65,
      blending: THREE.AdditiveBlending
    });
    this.starfieldPoints = new THREE.Points(geo, mat);
    this.scene.add(this.starfieldPoints);
  }

  public setMode(mode: SceneModeId): void {
    const isSame = this.activeMode === mode;
    this.activeMode = mode;
    this.triggerShockwave();

    if (!isSame && !this.isDirectorTourActive) {
      const token = ++this.cameraAnimToken;
      const startPos = this.camera.position.clone();
      const targetCenter = new THREE.Vector3(0, 0, 0);
      const dir = startPos.clone().sub(targetCenter);
      if (dir.lengthSq() < 0.01) dir.set(0, 2.2, 8.8);
      dir.normalize();
      const angle = 0.28;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const rotatedDir = new THREE.Vector3(
        dir.x * cosA - dir.z * sinA,
        THREE.MathUtils.clamp(dir.y, 0.18, 0.38),
        dir.x * sinA + dir.z * cosA
      ).normalize();
      const targetPos = rotatedDir.multiplyScalar(DEFAULT_CAMERA_DIST);

      const startTime = performance.now();
      const duration = 520;
      const animateGlide = (now: number) => {
        if (this.cameraAnimToken !== token) return;
        const t = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - t, 3);
        this.camera.position.lerpVectors(startPos, targetPos, ease);
        this.controls.target.set(0, 0, 0);
        if (t < 1) requestAnimationFrame(animateGlide);
      };
      requestAnimationFrame(animateGlide);
    }
  }

  public setCameraPreset(preset: CameraPresetId): void {
    const token = ++this.cameraAnimToken;
    const startPos = this.camera.position.clone();
    let targetPos = new THREE.Vector3(0, 2.1, DEFAULT_CAMERA_DIST);
    if (preset === 'top') targetPos = new THREE.Vector3(0, 11.2, 0.01);
    else if (preset === 'front') targetPos = new THREE.Vector3(0, 0.4, 10.0);
    else if (preset === 'right') targetPos = new THREE.Vector3(10.0, 0.4, 0);
    else if (preset === 'closeup') targetPos = new THREE.Vector3(0, 0.85, 6.2);

    const startTime = performance.now();
    const duration = 580;
    const animateCam = (now: number) => {
      if (this.cameraAnimToken !== token) return;
      const t = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      this.camera.position.lerpVectors(startPos, targetPos, ease);
      this.controls.target.set(0, 0, 0);
      if (t < 1) requestAnimationFrame(animateCam);
    };
    requestAnimationFrame(animateCam);
  }

  public zoomByFactor(factor: number): number {
    const token = ++this.cameraAnimToken;
    const startPos = this.camera.position.clone();
    const targetCenter = this.controls.target.clone();
    const dir = startPos.clone().sub(targetCenter);
    const currentDist = dir.length();
    const newDist = Math.max(
      this.controls.minDistance,
      Math.min(this.controls.maxDistance, currentDist * factor)
    );
    const targetPos = targetCenter.clone().add(dir.normalize().multiplyScalar(newDist));

    const startTime = performance.now();
    const duration = 260;
    const animateZoom = (now: number) => {
      if (this.cameraAnimToken !== token) return;
      const t = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - t, 3);
      this.camera.position.lerpVectors(startPos, targetPos, ease);
      if (t < 1) requestAnimationFrame(animateZoom);
    };
    requestAnimationFrame(animateZoom);
    return Math.round((DEFAULT_CAMERA_DIST / newDist) * 100);
  }

  public getZoomPercentage(): number {
    const dist = this.camera.position.distanceTo(this.controls.target);
    return Math.round((DEFAULT_CAMERA_DIST / Math.max(1.5, dist)) * 100);
  }

  public setGridVisible(visible: boolean): void {
    this.gridHelper.visible = visible;
  }

  public setAutoRotate(enabled: boolean): void {
    this.controls.autoRotate = enabled;
  }

  public setDirectorTourMode(active: boolean): void {
    this.isDirectorTourActive = active;
    if (!active) {
      const groups = [
        this.observerHandles.group,
        this.fkcrtHandles.group,
        this.willowHandles.group,
        this.k3Handles.group
      ];
      for (const g of groups) {
        g.rotation.x = 0;
        g.rotation.z = 0;
      }
      this.setCameraPreset('perspective');
    }
  }

  public getSimTime(): number {
    return this.simTime;
  }

  public setSimTime(t: number): void {
    this.simTime = t;
  }

  public captureSnapshotDataUrl(): string {
    this.composer.render();
    return this.renderer.domElement.toDataURL('image/png');
  }

  public triggerShockwave(): void {
    this.shockwavePulse = 1.0;
  }

  public update(): void {
    const now = performance.now();
    const dt = Math.min(0.05, (now - this.lastWallTime) / 1000);
    this.lastWallTime = now;

    if (!this.isPaused) {
      this.simTime += dt * this.timeScale;
    }

    this.shockwavePulse = Math.max(0.0, this.shockwavePulse * 0.91 - 0.002);

    const caOffset = 0.0012 + this.shockwavePulse * 0.0016;
    this.chromaticEffect.offset.set(caOffset, caOffset);

    this.frameCount++;
    if (now - this.lastFpsTime >= 450) {
      this.fps = Math.min(60, (this.frameCount * 1000) / (now - this.lastFpsTime));
      this.frameCount = 0;
      this.lastFpsTime = now;
    }

    const elapsed = this.simTime;
    if (this.starfieldPoints) {
      this.starfieldPoints.rotation.y = elapsed * 0.014;
    }

    const groupMap: Record<SceneModeId, THREE.Group> = {
      observer: this.observerHandles.group,
      fkcrt: this.fkcrtHandles.group,
      hologram: this.willowHandles.group,
      retraction: this.k3Handles.group
    };

    const modes: SceneModeId[] = ['observer', 'fkcrt', 'hologram', 'retraction'];
    const morphSpeed = Math.min(1.0, dt * 8.5);

    for (const m of modes) {
      const target = m === this.activeMode ? 1.0 : 0.0;
      const current = this.modePresence[m];
      const next = current + (target - current) * morphSpeed;
      this.modePresence[m] = Math.abs(target - next) < 0.004 ? target : next;

      const grp = groupMap[m];
      const p = this.modePresence[m];
      if (p > 0.006) {
        grp.visible = true;
        const eased = 1 - Math.pow(1 - p, 3);
        grp.scale.setScalar(SCENE_BASE_SCALES[m] * (0.06 + 0.94 * eased));
      } else {
        grp.visible = false;
      }
    }

    if (this.observerHandles.group.visible) {
      const swirl = (1 - this.modePresence.observer) * 0.9;
      if (this.isDirectorTourActive) {
        this.observerHandles.group.rotation.y = elapsed * 0.65 + swirl;
        this.observerHandles.group.rotation.x = Math.sin(this.directorTourTime * 0.85) * 0.65;
        this.observerHandles.group.rotation.z = Math.cos(this.directorTourTime * 0.58) * 0.45;
      } else {
        this.observerHandles.group.rotation.y = swirl;
        this.observerHandles.group.rotation.x *= 0.9;
        this.observerHandles.group.rotation.z *= 0.9;
      }
      this.observerHandles.particlesMat.uniforms.uTime.value = elapsed;
      this.observerHandles.particlesMat.uniforms.uEntropy.value = this.state.observerEntropy;
      this.observerHandles.particlesMat.uniforms.uWormhole.value = this.state.wormholeCoupling;
      this.observerHandles.particlesMat.uniforms.uManifoldMorph.value = this.state.manifoldMorph;
      this.observerHandles.particlesMat.uniforms.uShockwave.value = this.shockwavePulse;

      this.observerHandles.coreMat.uniforms.uTime.value = elapsed;
      this.observerHandles.coreMat.uniforms.uEntropy.value = this.state.observerEntropy;

      this.observerHandles.webLinesMat.uniforms.uTime.value = elapsed;
      this.observerHandles.webLinesMat.uniforms.uEntropy.value = this.state.observerEntropy;
      this.observerHandles.webLinesMat.uniforms.uWormhole.value = this.state.wormholeCoupling;

      this.glbArticulator.updateObserverManifold(elapsed, this.state);
    }

    if (this.fkcrtHandles.group.visible) {
      const swirl = (1 - this.modePresence.fkcrt) * 0.9;
      this.fkcrtHandles.meshMat.uniforms.uTime.value = elapsed;
      this.fkcrtHandles.meshMat.uniforms.uQ.value = this.state.clusterParameterQ;
      this.fkcrtHandles.meshMat.uniforms.uRoughness.value = this.state.excursionRoughness;
      this.fkcrtHandles.meshMat.uniforms.uResolutionScale.value = this.state.planarEdgesN;
      this.fkcrtHandles.meshMat.uniforms.uShockwave.value = this.shockwavePulse;
      if (this.isDirectorTourActive) {
        this.fkcrtHandles.group.rotation.y = elapsed * 0.68 + swirl;
        this.fkcrtHandles.group.rotation.x = Math.sin(this.directorTourTime * 0.78) * 0.72;
        this.fkcrtHandles.group.rotation.z = Math.cos(this.directorTourTime * 0.52) * 0.48;
      } else {
        this.fkcrtHandles.group.rotation.y = elapsed * 0.12 + swirl;
        this.fkcrtHandles.group.rotation.x *= 0.9;
        this.fkcrtHandles.group.rotation.z *= 0.9;
      }

      this.glbArticulator.updateFKCRTManifold(elapsed, this.state);
    }

    if (this.willowHandles.group.visible) {
      const swirl = (1 - this.modePresence.hologram) * 0.9;
      if (this.isDirectorTourActive) {
        this.willowHandles.group.rotation.y = elapsed * 0.62 + swirl;
        this.willowHandles.group.rotation.x = 0.42 + Math.sin(this.directorTourTime * 0.82) * 0.55;
        this.willowHandles.group.rotation.z = Math.cos(this.directorTourTime * 0.62) * 0.46;
      } else {
        this.willowHandles.group.rotation.y = swirl;
        this.willowHandles.group.rotation.x *= 0.9;
        this.willowHandles.group.rotation.z *= 0.9;
      }
      this.willowHandles.horizonMat.uniforms.uTime.value = elapsed;
      this.willowHandles.horizonMat.uniforms.uMass.value = this.state.bondiMass;
      this.willowHandles.horizonMat.uniforms.uSpin.value = this.state.kerrSpin;

      this.willowHandles.diskMat.uniforms.uTime.value = elapsed;
      this.willowHandles.diskMat.uniforms.uMass.value = this.state.bondiMass;
      this.willowHandles.diskMat.uniforms.uSpin.value = this.state.kerrSpin;
      this.willowHandles.diskMat.uniforms.uFlux.value = this.state.boundaryQubitFlux;

      this.willowHandles.latticeMat.uniforms.uTime.value = elapsed;
      this.willowHandles.latticeMat.uniforms.uFlux.value = this.state.boundaryQubitFlux;

      this.willowHandles.raysMat.uniforms.uTime.value = elapsed;
      this.willowHandles.raysMat.uniforms.uMass.value = this.state.bondiMass;
      this.willowHandles.raysMat.uniforms.uFlux.value = this.state.boundaryQubitFlux;

      this.glbArticulator.updateCKSManifold(elapsed, this.state);
    }

    if (this.k3Handles.group.visible) {
      const swirl = (1 - this.modePresence.retraction) * 0.9;
      this.k3Handles.surfaceMat.uniforms.uTime.value = elapsed;
      this.k3Handles.surfaceMat.uniforms.uSign.value = this.state.stabilizationSign;
      this.k3Handles.surfaceMat.uniforms.uDoublePointsM.value = this.state.doublePointCountM;
      this.k3Handles.surfaceMat.uniforms.uSliceAngle.value = this.state.calabiYauSlice;
      this.k3Handles.surfaceMat.uniforms.uShockwave.value = this.shockwavePulse;
      if (this.isDirectorTourActive) {
        this.k3Handles.group.rotation.y = elapsed * 0.72 + swirl;
        this.k3Handles.group.rotation.x = Math.sin(this.directorTourTime * 0.88) * 0.75;
        this.k3Handles.group.rotation.z = Math.cos(this.directorTourTime * 0.64) * 0.55;
      } else {
        this.k3Handles.group.rotation.y = elapsed * 0.18 + swirl;
        this.k3Handles.group.rotation.x = Math.sin(elapsed * 0.3) * 0.2;
        this.k3Handles.group.rotation.z *= 0.9;
      }

      this.glbArticulator.updateK3Manifold(elapsed, this.state);
    }

    if (this.isDirectorTourActive) {
      this.directorTourTime += dt;
      const t = this.directorTourTime;
      const azimuth = t * 0.74;
      const elevationY = 1.6 + Math.sin(t * 0.92) * 3.8 + Math.cos(t * 0.45) * 1.4;
      const dist = DEFAULT_CAMERA_DIST * (0.88 + 0.14 * Math.cos(t * 0.82));
      const horizR = Math.sqrt(Math.max(2.0, dist * dist - elevationY * elevationY));

      this.camera.position.set(
        Math.sin(azimuth) * horizR,
        elevationY,
        Math.cos(azimuth) * horizR
      );
      this.controls.target.set(0, 0, 0);
    }

    this.controls.update();
    this.composer.render();
  }

  public onResize(): void {
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;
    if (width === 0 || height === 0) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
    this.composer.setSize(width, height);
  }

  public dispose(): void {
    this.cameraAnimToken++;
    this.glbArticulator.dispose();
    this.controls.dispose();
    this.scene.traverse((obj) => {
      const meshLike = obj as THREE.Mesh | THREE.Points | THREE.LineSegments;
      if (meshLike.geometry) {
        meshLike.geometry.dispose();
      }
      if (meshLike.material) {
        if (Array.isArray(meshLike.material)) {
          meshLike.material.forEach((m) => m.dispose());
        } else {
          meshLike.material.dispose();
        }
      }
    });
    this.composer.dispose();
    this.renderer.dispose();
    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
