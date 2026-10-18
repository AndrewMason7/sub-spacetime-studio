import * as THREE from 'three';

export interface FKCRTSceneHandles {
  group: THREE.Group;
  meshMat: THREE.ShaderMaterial;
  wireMat: THREE.ShaderMaterial;
  branchesMat: THREE.ShaderMaterial;
}

export function createFKCRTScene(): FKCRTSceneHandles {
  const group = new THREE.Group();
  const icoGeo = new THREE.IcosahedronGeometry(2.35, 6);

  const shaderUniforms = {
    uTime: { value: 0 },
    uQ: { value: 2.2 },
    uRoughness: { value: 1.15 },
    uResolutionScale: { value: 3.2 },
    uShockwave: { value: 0.0 }
  };

  const vertexShaderSource = `
    uniform float uTime;
    uniform float uQ;
    uniform float uRoughness;
    uniform float uResolutionScale;
    uniform float uShockwave;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying float vTreeFactor;
    varying float vExcursionHeight;

    float besselBridgeExcursion(vec3 dir, float t, float freq) {
      float b1 = sin(dir.x * freq + t * 1.4) * cos(dir.y * freq - t * 1.1);
      float b2 = sin(dir.y * freq * 1.7 - t * 1.6) * cos(dir.z * freq * 1.3 + t * 0.9);
      float b3 = cos(dir.z * freq * 2.3 + t * 1.2) * sin(dir.x * freq * 1.9 - t * 1.5);
      return sqrt(b1 * b1 + b2 * b2 + b3 * b3) / 1.732;
    }

    void main() {
      vec3 dir = normalize(position);
      float treePhase = smoothstep(3.85, 4.35, uQ);
      vTreeFactor = treePhase;

      float freq = 2.5 + uResolutionScale * 1.2;
      float e1 = besselBridgeExcursion(dir, uTime * 0.65, freq);
      float e2 = besselBridgeExcursion(dir * 2.1, -uTime * 0.45, freq * 2.2);
      float excursion = (e1 * 0.65 + e2 * 0.35) * uRoughness;
      vExcursionHeight = excursion;

      float gamma = clamp(sqrt(uQ) * 0.42, 0.3, 0.95);
      float lqgRadius = 2.25 * (1.0 + 0.28 * gamma * (excursion - 0.5));
      vec3 lqgPos = dir * lqgRadius;

      float branchAngle = abs(sin(dir.x * 5.0) * sin(dir.y * 5.0) * sin(dir.z * 5.0));
      float spine = pow(branchAngle, 0.28);
      float dendriteRadius = 0.18 + pow(excursion, 1.85) * 3.85 * spine;
      vec3 treePos = dir * dendriteRadius;
      treePos += cross(dir, vec3(0.0, 1.0, 0.0)) * 0.25 * sin(excursion * 8.0 + uTime * 2.0) * treePhase;

      vec3 finalPos = mix(lqgPos, treePos, treePhase);
      finalPos *= (1.0 + uShockwave * 0.25);

      vNormal = normalize(normalMatrix * normalize(finalPos));
      vWorldPos = finalPos;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
    }
  `;

  const meshMat = new THREE.ShaderMaterial({
    uniforms: shaderUniforms,
    transparent: true,
    side: THREE.DoubleSide,
    vertexShader: vertexShaderSource,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying float vTreeFactor;
      varying float vExcursionHeight;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.2);

        vec3 sphereCol = mix(vec3(0.05, 0.28, 0.65), vec3(0.0, 0.92, 1.0), clamp(vExcursionHeight, 0.0, 1.0));
        vec3 treeCol = mix(vec3(0.45, 0.08, 0.85), vec3(1.0, 0.78, 0.22), clamp(pow(vExcursionHeight, 1.4), 0.0, 1.0));

        vec3 col = mix(sphereCol, treeCol, vTreeFactor);
        col += fresnel * mix(vec3(0.2, 0.8, 1.0), vec3(1.0, 0.4, 0.9), vTreeFactor) * 1.35;

        float alpha = mix(0.72, 0.52, vTreeFactor);
        gl_FragColor = vec4(col, alpha);
      }
    `
  });

  const wireMat = new THREE.ShaderMaterial({
    uniforms: shaderUniforms,
    wireframe: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    vertexShader: vertexShaderSource,
    fragmentShader: `
      varying float vTreeFactor;
      varying float vExcursionHeight;
      void main() {
        vec3 c1 = vec3(0.0, 0.95, 1.0);
        vec3 c2 = vec3(1.0, 0.55, 0.95);
        vec3 col = mix(c1, c2, vTreeFactor) * (0.6 + 0.8 * vExcursionHeight);
        gl_FragColor = vec4(col, mix(0.28, 0.65, vTreeFactor));
      }
    `
  });

  group.add(new THREE.Mesh(icoGeo, meshMat));
  group.add(new THREE.Mesh(icoGeo, wireMat));

  const haloCount = 8000;
  const haloPos = new Float32Array(haloCount * 3);
  const haloSeed = new Float32Array(haloCount * 3);
  for (let i = 0; i < haloCount; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    haloPos[i * 3] = Math.sin(phi) * Math.cos(theta);
    haloPos[i * 3 + 1] = Math.sin(phi) * Math.sin(theta);
    haloPos[i * 3 + 2] = Math.cos(phi);
    haloSeed[i * 3] = Math.random();
    haloSeed[i * 3 + 1] = Math.random();
    haloSeed[i * 3 + 2] = Math.random();
  }
  const haloGeo = new THREE.BufferGeometry();
  haloGeo.setAttribute('position', new THREE.BufferAttribute(haloPos, 3));
  haloGeo.setAttribute('aSeed', new THREE.BufferAttribute(haloSeed, 3));
  const branchesMat = new THREE.ShaderMaterial({
    uniforms: shaderUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aSeed;
      uniform float uTime;
      uniform float uQ;
      uniform float uRoughness;
      varying vec3 vCol;
      void main() {
        float treePhase = smoothstep(3.85, 4.35, uQ);
        vec3 dir = normalize(position);
        float branch = pow(abs(sin(dir.x * 5.0) * sin(dir.y * 5.0) * sin(dir.z * 5.0)), 0.25);
        float r = mix(2.45 + 0.3 * aSeed.x, 0.3 + 4.4 * branch * aSeed.y * uRoughness, treePhase);
        vec3 p = dir * r + 0.12 * sin(uTime * 3.0 + aSeed * 15.0) * treePhase;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = mix(5.0, 14.0, treePhase * aSeed.z) / max(1.0, -mv.z);
        vCol = mix(vec3(0.0, 0.85, 1.0), vec3(1.0, 0.65, 0.2), treePhase * aSeed.y);
      }
    `,
    fragmentShader: `
      varying vec3 vCol;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        gl_FragColor = vec4(vCol * 1.4, (1.0 - d * 2.0) * 0.75);
      }
    `
  });
  group.add(new THREE.Points(haloGeo, branchesMat));

  return { group, meshMat, wireMat, branchesMat };
}
