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

  private simTime = 0.0;
  private lastWallTime = performance.now();
  public isPaused = false;
  public timeScale = 1.0;
  private shockwavePulse = 0.0;
  private cameraAnimToken = 0;

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

    this.camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 200);
    this.camera.position.set(0, 2.2, 8.8);

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

    this.setMode('observer');
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
    this.observerHandles.group.visible = mode === 'observer';
    this.fkcrtHandles.group.visible = mode === 'fkcrt';
    this.willowHandles.group.visible = mode === 'hologram';
    this.k3Handles.group.visible = mode === 'retraction';
    this.triggerShockwave();
  }

  public setCameraPreset(preset: CameraPresetId): void {
    const token = ++this.cameraAnimToken;
    const startPos = this.camera.position.clone();
    let targetPos = new THREE.Vector3(0, 2.2, 8.8);
    if (preset === 'top') targetPos = new THREE.Vector3(0, 10.5, 0.01);
    else if (preset === 'front') targetPos = new THREE.Vector3(0, 0, 9.2);
    else if (preset === 'right') targetPos = new THREE.Vector3(9.2, 0, 0);
    else if (preset === 'closeup') targetPos = new THREE.Vector3(0, 0.85, 4.1);

    const startTime = performance.now();
    const duration = 550;
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
    return Math.round((9.07 / newDist) * 100);
  }

  public getZoomPercentage(): number {
    const dist = this.camera.position.distanceTo(this.controls.target);
    return Math.round((9.07 / Math.max(1.5, dist)) * 100);
  }

  public setGridVisible(visible: boolean): void {
    this.gridHelper.visible = visible;
  }

  public setAutoRotate(enabled: boolean): void {
    this.controls.autoRotate = enabled;
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
    const dt = (now - this.lastWallTime) / 1000;
    this.lastWallTime = now;

    if (!this.isPaused) {
      this.simTime += dt * this.timeScale;
    }

    this.shockwavePulse = Math.max(0.0, this.shockwavePulse * 0.91 - 0.002);

    const caOffset = 0.0012 + this.shockwavePulse * 0.0015;
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

    if (this.observerHandles.group.visible) {
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
      this.fkcrtHandles.meshMat.uniforms.uTime.value = elapsed;
      this.fkcrtHandles.meshMat.uniforms.uQ.value = this.state.clusterParameterQ;
      this.fkcrtHandles.meshMat.uniforms.uRoughness.value = this.state.excursionRoughness;
      this.fkcrtHandles.meshMat.uniforms.uResolutionScale.value = this.state.planarEdgesN;
      this.fkcrtHandles.meshMat.uniforms.uShockwave.value = this.shockwavePulse;
      this.fkcrtHandles.group.rotation.y = elapsed * 0.12;

      this.glbArticulator.updateFKCRTManifold(elapsed, this.state);
    }

    if (this.willowHandles.group.visible) {
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
      this.k3Handles.surfaceMat.uniforms.uTime.value = elapsed;
      this.k3Handles.surfaceMat.uniforms.uSign.value = this.state.stabilizationSign;
      this.k3Handles.surfaceMat.uniforms.uDoublePointsM.value = this.state.doublePointCountM;
      this.k3Handles.surfaceMat.uniforms.uSliceAngle.value = this.state.calabiYauSlice;
      this.k3Handles.surfaceMat.uniforms.uShockwave.value = this.shockwavePulse;
      this.k3Handles.group.rotation.y = elapsed * 0.18;
      this.k3Handles.group.rotation.x = Math.sin(elapsed * 0.3) * 0.2;

      this.glbArticulator.updateK3Manifold(elapsed, this.state);
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
