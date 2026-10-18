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

  const horizonGeo = new THREE.SphereGeometry(1.0, 64, 64);
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
        vec3 scaled = position * (0.45 + uMass * 0.55);
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
        float photonRing = pow(1.0 - ndotv, 3.6);
        vec3 rimCol = mix(vec3(0.0, 0.95, 0.75), vec3(1.0, 0.55, 0.1), 0.5 + 0.5 * sin(uTime * 3.0 + uSpin * 5.0));
        gl_FragColor = vec4(rimCol * photonRing * 3.2, 1.0);
      }
    `
  });
  group.add(new THREE.Mesh(horizonGeo, horizonMat));

  const diskGeo = new THREE.RingGeometry(0.9, 4.4, 128, 32);
  diskGeo.rotateX(Math.PI * 0.42);
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
      varying float vRadius;
      uniform float uMass;
      void main() {
        vUv = uv;
        vec3 p = position;
        float r = length(p.xz);
        vRadius = r;
        float horizonR = 0.45 + uMass * 0.55;
        p.y -= 0.45 * exp(-max(0.0, r - horizonR) * 1.2);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      varying float vRadius;
      uniform float uTime;
      uniform float uMass;
      uniform float uSpin;
      uniform float uFlux;
      void main() {
        float horizonR = 0.48 + uMass * 0.55;
        if (vRadius < horizonR) discard;
        float angle = atan(vUv.y - 0.5, vUv.x - 0.5);
        float spiral = sin(angle * 6.0 - vRadius * 5.5 + uTime * (2.5 + uSpin * 6.0));
        float radialFade = exp(-(vRadius - horizonR) * 0.85) * smoothstep(horizonR, horizonR + 0.25, vRadius);
        vec3 col = mix(vec3(0.05, 0.9, 0.65), vec3(0.0, 0.65, 1.0), 0.5 + 0.5 * spiral);
        col = mix(col, vec3(1.0, 0.75, 0.25), exp(-(vRadius - horizonR) * 2.4));
        float alpha = radialFade * (0.45 + 0.35 * spiral) * clamp(uFlux * 0.65, 0.2, 1.4);
        gl_FragColor = vec4(col * 1.4, alpha);
      }
    `
  });
  group.add(new THREE.Mesh(diskGeo, diskMat));

  const boundaryGeo = new THREE.IcosahedronGeometry(4.35, 2);
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
        float pulse = 0.5 + 0.5 * sin(uTime * 3.5 + vPos.x * 1.5 + vPos.y * 1.5);
        vec3 col = mix(vec3(0.06, 0.72, 0.51), vec3(0.0, 0.95, 1.0), pulse);
        gl_FragColor = vec4(col, 0.22 * clamp(uFlux, 0.3, 2.0));
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

    rayPositions[i * 6] = dir.x * 4.35;
    rayPositions[i * 6 + 1] = dir.y * 4.35;
    rayPositions[i * 6 + 2] = dir.z * 4.35;

    rayPositions[i * 6 + 3] = dir.x * 0.85;
    rayPositions[i * 6 + 4] = dir.y * 0.85;
    rayPositions[i * 6 + 5] = dir.z * 0.85;

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
          p = normalize(p) * (0.46 + uMass * 0.55);
        }
        vPulse = fract(aRaySeed + uTime * 0.45);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      varying float vPulse;
      uniform float uFlux;
      void main() {
        vec3 col = mix(vec3(0.06, 0.85, 0.55), vec3(0.0, 0.95, 1.0), vPulse);
        gl_FragColor = vec4(col, 0.26 * clamp(uFlux * 0.7, 0.15, 1.5));
      }
    `
  });
  group.add(new THREE.LineSegments(rayGeo, raysMat));

  return { group, horizonMat, diskMat, latticeMat, raysMat };
}
