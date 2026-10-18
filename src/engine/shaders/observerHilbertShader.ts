import * as THREE from 'three';

export interface ObserverSceneHandles {
  group: THREE.Group;
  particlesMat: THREE.ShaderMaterial;
  coreMat: THREE.ShaderMaterial;
  webLinesMat: THREE.ShaderMaterial;
}

export function createObserverHilbertScene(): ObserverSceneHandles {
  const group = new THREE.Group();
  const count = 24000;
  const positions = new Float32Array(count * 3);
  const seeds = new Float32Array(count * 4);

  const phiGolden = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < count; i++) {
    const u = (i / count);
    const v = (i * phiGolden) % 1.0;
    const w = ((i * phiGolden * phiGolden) % 1.0);

    positions[i * 3] = (u - 0.5) * 0.01;
    positions[i * 3 + 1] = (v - 0.5) * 0.01;
    positions[i * 3 + 2] = (w - 0.5) * 0.01;

    seeds[i * 4] = u * Math.PI * 2.0;
    seeds[i * 4 + 1] = v * Math.PI * 2.0;
    seeds[i * 4 + 2] = w;
    seeds[i * 4 + 3] = ((i * 0.7548776662) % 1.0);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 4));

  const particlesMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uEntropy: { value: 8.4 },
      uWormhole: { value: 1.0 },
      uManifoldMorph: { value: 0.65 },
      uShockwave: { value: 0.0 }
    },
    vertexShader: `
      attribute vec4 aSeed;
      uniform float uTime;
      uniform float uEntropy;
      uniform float uWormhole;
      uniform float uManifoldMorph;
      uniform float uShockwave;
      varying vec3 vColor;
      varying float vAlpha;

      vec3 computeEinsteinSaddle(vec4 seed, float t, float morph) {
        float eta = seed.z * 1.35 + 0.16;
        float xi1 = seed.x + t * (0.16 + 0.08 * seed.w);
        float xi2 = seed.y + t * (0.12 - 0.06 * seed.z);

        vec4 pS4 = vec4(
          sin(eta) * cos(xi1),
          sin(eta) * sin(xi1),
          cos(eta) * cos(xi2),
          cos(eta) * sin(xi2)
        );
        float denom = max(0.55, 1.45 - pS4.w * 0.62);
        vec3 posS4 = pS4.xyz / denom * 2.15;

        float r1 = sin(eta);
        float r2 = cos(eta);
        vec3 posCP2 = vec3(
          r1 * r2 * cos(xi1 - xi2) * 3.05,
          r1 * r2 * sin(xi1 + xi2) * 3.05,
          (r1 * r1 - r2 * r2) * 1.75 + 0.48 * sin(3.0 * xi1)
        );

        vec3 posRP4 = vec3(
          sin(2.0 * eta) * cos(xi1) * cos(xi2) * 2.7,
          sin(eta) * sin(2.0 * xi1) * 2.3,
          cos(eta) * sin(xi2) * cos(xi1) * 2.7
        );

        vec3 blended = mix(posS4, posCP2, clamp(morph, 0.0, 1.0));
        blended = mix(blended, posRP4, clamp(morph - 1.0, 0.0, 1.0));
        return blended;
      }

      void main() {
        float activation = smoothstep(0.0, 10.0, uEntropy);
        float ignition = pow(activation, 0.75);

        vec3 targetPos = computeEinsteinSaddle(aSeed, uTime, uManifoldMorph);
        float islandWave = sin(aSeed.x * 3.0 + uTime * 0.9) * cos(aSeed.y * 3.0 - uTime * 0.7);
        targetPos += normalize(targetPos + vec3(0.001)) * islandWave * 0.26 * uWormhole * ignition;

        vec3 collapsedPos = vec3(
          sin(uTime * 1.4 + aSeed.x) * 0.04,
          cos(uTime * 1.2 + aSeed.y) * 0.04,
          sin(uTime * 1.6 + aSeed.z) * 0.04
        );

        vec3 finalPos = mix(collapsedPos, targetPos, ignition);
        finalPos *= (1.0 + uShockwave * 0.18 * sin(aSeed.w * 6.283));

        vec4 mvPosition = modelViewMatrix * vec4(finalPos, 1.0);
        gl_Position = projectionMatrix * mvPosition;

        vec3 coldCol = vec3(0.32, 0.78, 0.98);
        vec3 midCol = vec3(0.52, 0.42, 0.96);
        vec3 hotCol = vec3(0.92, 0.74, 0.36);

        float colorMix = fract(aSeed.z + 0.12 * sin(uTime * 0.5 + aSeed.x));
        vec3 activeColor = mix(mix(coldCol, midCol, colorMix), hotCol, pow(aSeed.w, 3.2));
        vColor = mix(vec3(0.45, 0.82, 0.98), activeColor, ignition);

        vAlpha = mix(0.14, 0.52, ignition) * (0.82 + 0.18 * sin(uTime * 0.8 + aSeed.w * 62.83));
        gl_PointSize = clamp((mix(3.5, 9.5, aSeed.w) * (0.45 + 0.55 * ignition)) / max(1.5, -mvPosition.z), 1.0, 8.0);
      }
    `,
    fragmentShader: `
      varying vec3 vColor;
      varying float vAlpha;
      void main() {
        vec2 uv = gl_PointCoord - vec2(0.5);
        float d = length(uv);
        if (d > 0.5) discard;
        float glow = pow(1.0 - d * 2.0, 2.0);
        gl_FragColor = vec4(vColor * glow * 0.95, vAlpha * glow);
      }
    `
  });

  group.add(new THREE.Points(geo, particlesMat));

  const coreGeo = new THREE.SphereGeometry(0.22, 48, 48);
  const coreMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uEntropy: { value: 8.4 }
    },
    vertexShader: `
      varying vec3 vNormal;
      uniform float uTime;
      uniform float uEntropy;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        float pulse = 1.0 + 0.035 * sin(uTime * 1.4) * smoothstep(0.0, 5.0, uEntropy);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position * pulse, 1.0);
      }
    `,
    fragmentShader: `
      varying vec3 vNormal;
      uniform float uEntropy;
      void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
        vec3 col = mix(vec3(0.75, 0.92, 1.0), vec3(0.28, 0.78, 0.98), smoothstep(0.0, 4.0, uEntropy));
        gl_FragColor = vec4(col * (0.85 + fresnel * 0.95), 0.72);
      }
    `
  });
  group.add(new THREE.Mesh(coreGeo, coreMat));

  const cageGeo = new THREE.IcosahedronGeometry(2.32, 2);
  const wireGeo = new THREE.WireframeGeometry(cageGeo);
  const webLinesMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uEntropy: { value: 8.4 },
      uWormhole: { value: 1.0 }
    },
    vertexShader: `
      uniform float uTime;
      uniform float uEntropy;
      uniform float uWormhole;
      varying float vVis;
      void main() {
        float act = smoothstep(0.2, 10.0, uEntropy);
        vVis = act;
        vec3 p = position * act;
        p += normal * 0.1 * sin(uTime * 0.9 + position.x * 1.5 + position.y * 1.5) * uWormhole * act;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      varying float vVis;
      void main() {
        if (vVis < 0.01) discard;
        gl_FragColor = vec4(0.22, 0.68, 0.95, 0.11 * vVis);
      }
    `
  });
  group.add(new THREE.LineSegments(wireGeo, webLinesMat));

  return { group, particlesMat, coreMat, webLinesMat };
}
