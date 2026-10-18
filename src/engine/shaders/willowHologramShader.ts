import * as THREE from 'three';

export interface WillowHologramHandles {
  group: THREE.Group;
  horizonMat: THREE.ShaderMaterial;
  diskMat: THREE.ShaderMaterial;
  latticeMat: THREE.ShaderMaterial;
  raysMat: THREE.ShaderMaterial;
}

export function createWillowHologramScene(): WillowHologramHandles {
  const group = new THREE.Group();

  const horizonGeo = new THREE.SphereGeometry(0.92, 64, 64);
  const horizonMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMass: { value: 1.2 },
      uSpin: { value: 0.72 }
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      uniform float uMass;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec3 scaled = position * (0.62 + uMass * 0.45);
        vec4 mv = modelViewMatrix * vec4(scaled, 1.0);
        vViewPos = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      uniform float uTime;
      uniform float uSpin;
      void main() {
        vec3 viewDir = normalize(vViewPos);
        float ndotv = max(0.0, dot(normalize(vNormal), viewDir));
        float photonRing = pow(1.0 - ndotv, 3.4);
        vec3 rimCol = mix(vec3(0.06, 0.92, 0.72), vec3(0.22, 0.78, 1.0), 0.5 + 0.5 * sin(uTime * 2.4 + uSpin * 4.0));
        gl_FragColor = vec4(rimCol * photonRing * 2.6, 0.92);
      }
    `
  });
  group.add(new THREE.Mesh(horizonGeo, horizonMat));

  // Replaced flat 2D RingGeometry with a true 3D Volumetric Lense-Thirring Twisted Toroidal Manifold
  const diskGeo = new THREE.TorusKnotGeometry(1.38, 0.16, 180, 36, 2, 3);
  const diskMat = new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMass: { value: 1.2 },
      uSpin: { value: 0.72 },
      uFlux: { value: 1.6 }
    },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      uniform float uTime;
      uniform float uMass;
      uniform float uSpin;
      void main() {
        vUv = uv;
        vNormal = normalize(normalMatrix * normal);
        vec3 p = position * (0.78 + uMass * 0.22);
        // Relativistic Lense-Thirring 3D frame-dragging harmonic wave
        float wave = sin(uv.x * 18.8495 + uTime * (1.8 + uSpin * 3.5)) * 0.08 * uSpin;
        p += normal * wave;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vViewPos = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      uniform float uTime;
      uniform float uSpin;
      uniform float uFlux;
      void main() {
        vec3 viewDir = normalize(vViewPos);
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.2);
        float stream = 0.5 + 0.5 * sin(vUv.x * 37.699 - uTime * (2.6 + uSpin * 5.0) + vUv.y * 12.566);
        vec3 col = mix(vec3(0.06, 0.88, 0.68), vec3(0.22, 0.75, 0.98), stream);
        col = mix(col, vec3(0.98, 0.76, 0.28), pow(stream, 4.0) * 0.65);
        float alpha = (0.16 + 0.42 * fresnel) * (0.55 + 0.45 * stream) * clamp(uFlux * 0.65, 0.25, 1.25);
        gl_FragColor = vec4(col * (1.1 + fresnel * 1.4), alpha);
      }
    `
  });
  group.add(new THREE.Mesh(diskGeo, diskMat));

  const boundaryGeo = new THREE.IcosahedronGeometry(2.36, 2);
  const boundaryWire = new THREE.WireframeGeometry(boundaryGeo);
  const latticeMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uFlux: { value: 1.6 }
    },
    vertexShader: `
      varying vec3 vPos;
      void main() {
        vPos = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vPos;
      uniform float uTime;
      uniform float uFlux;
      void main() {
        float pulse = 0.5 + 0.5 * sin(uTime * 3.0 + vPos.x * 1.5 + vPos.y * 1.5);
        vec3 col = mix(vec3(0.06, 0.72, 0.51), vec3(0.22, 0.88, 0.98), pulse);
        gl_FragColor = vec4(col, 0.16 * clamp(uFlux, 0.3, 1.8));
      }
    `
  });
  group.add(new THREE.LineSegments(boundaryWire, latticeMat));

  const qubitCount = 105;
  const rayPositions = new Float32Array(qubitCount * 2 * 3);
  const raySeeds = new Float32Array(qubitCount * 2);
  for (let i = 0; i < qubitCount; i++) {
    const y = 1 - (i / (qubitCount - 1)) * 2;
    const radius = Math.sqrt(1 - y * y);
    const theta = 2.399963229728653 * i;
    const dir = new THREE.Vector3(Math.cos(theta) * radius, y, Math.sin(theta) * radius);

    rayPositions[i * 6] = dir.x * 2.36;
    rayPositions[i * 6 + 1] = dir.y * 2.36;
    rayPositions[i * 6 + 2] = dir.z * 2.36;

    rayPositions[i * 6 + 3] = dir.x * 0.95;
    rayPositions[i * 6 + 4] = dir.y * 0.95;
    rayPositions[i * 6 + 5] = dir.z * 0.95;

    raySeeds[i * 2] = i / qubitCount;
    raySeeds[i * 2 + 1] = i / qubitCount + 10.0;
  }
  const rayGeo = new THREE.BufferGeometry();
  rayGeo.setAttribute('position', new THREE.BufferAttribute(rayPositions, 3));
  rayGeo.setAttribute('aRaySeed', new THREE.BufferAttribute(raySeeds, 1));
  const raysMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uMass: { value: 1.2 },
      uFlux: { value: 1.6 }
    },
    vertexShader: `
      attribute float aRaySeed;
      uniform float uTime;
      uniform float uMass;
      varying float vPulse;
      void main() {
        vec3 p = position;
        if (aRaySeed >= 5.0) {
          p = normalize(p) * (0.62 + uMass * 0.45);
        }
        vPulse = fract(aRaySeed + uTime * 0.45);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      varying float vPulse;
      uniform float uFlux;
      void main() {
        vec3 col = mix(vec3(0.06, 0.85, 0.55), vec3(0.22, 0.92, 1.0), vPulse);
        gl_FragColor = vec4(col, 0.22 * clamp(uFlux * 0.65, 0.15, 1.35));
      }
    `
  });
  group.add(new THREE.LineSegments(rayGeo, raysMat));

  return { group, horizonMat, diskMat, latticeMat, raysMat };
}
