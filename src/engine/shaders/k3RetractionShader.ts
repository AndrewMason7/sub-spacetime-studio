import * as THREE from 'three';

export interface K3RetractionHandles {
  group: THREE.Group;
  surfaceMat: THREE.ShaderMaterial;
  wireMat: THREE.ShaderMaterial;
  sparksMat: THREE.ShaderMaterial;
}

export function createK3RetractionScene(): K3RetractionHandles {
  const group = new THREE.Group();
  const baseGeo = new THREE.TorusKnotGeometry(1.75, 0.52, 220, 48, 2, 3).toNonIndexed();
  const posAttr = baseGeo.attributes.position;
  const triCount = posAttr.count / 3;

  const centroids = new Float32Array(posAttr.count * 3);
  const randomDirs = new Float32Array(posAttr.count * 3);

  for (let t = 0; t < triCount; t++) {
    const i0 = t * 3;
    const cx = (posAttr.getX(i0) + posAttr.getX(i0 + 1) + posAttr.getX(i0 + 2)) / 3;
    const cy = (posAttr.getY(i0) + posAttr.getY(i0 + 1) + posAttr.getY(i0 + 2)) / 3;
    const cz = (posAttr.getZ(i0) + posAttr.getZ(i0 + 1) + posAttr.getZ(i0 + 2)) / 3;

    const rx = (Math.random() - 0.5) * 2.0;
    const ry = (Math.random() - 0.5) * 2.0;
    const rz = (Math.random() - 0.5) * 2.0;

    for (let v = 0; v < 3; v++) {
      const idx = (i0 + v) * 3;
      centroids[idx] = cx;
      centroids[idx + 1] = cy;
      centroids[idx + 2] = cz;

      randomDirs[idx] = rx;
      randomDirs[idx + 1] = ry;
      randomDirs[idx + 2] = rz;
    }
  }

  baseGeo.setAttribute('aCentroid', new THREE.BufferAttribute(centroids, 3));
  baseGeo.setAttribute('aRandomDir', new THREE.BufferAttribute(randomDirs, 3));

  const k3Uniforms = {
    uTime: { value: 0 },
    uSign: { value: 1.0 },
    uDoublePointsM: { value: 6.0 },
    uSliceAngle: { value: 1.57 },
    uShockwave: { value: 0.0 }
  };

  const k3Vert = `
    attribute vec3 aCentroid;
    attribute vec3 aRandomDir;
    uniform float uTime;
    uniform float uSign;
    uniform float uDoublePointsM;
    uniform float uSliceAngle;
    uniform float uShockwave;
    varying vec3 vNormal;
    varying vec3 vWorldPos;
    varying float vShatterAmount;
    varying float vCuspStress;

    void main() {
      float shatter = clamp((0.35 - uSign) / 1.35, 0.0, 1.0);
      vShatterAmount = shatter;

      vec3 p = position;
      float cyHarmonic = sin(p.x * 2.0 + uSliceAngle) * cos(p.y * 2.0 - uSliceAngle) * sin(p.z * 2.0);
      p += normal * cyHarmonic * 0.14;

      float cuspWave = sin(atan(p.y, p.x) * uDoublePointsM + uTime * 3.0);
      vCuspStress = abs(cuspWave);

      vec3 localOffset = p - aCentroid;
      float explodeDist = pow(shatter, 1.35) * (0.85 + 0.12 * uDoublePointsM) * (0.6 + 0.6 * abs(cuspWave));
      vec3 shatteredCentroid = aCentroid + normalize(aCentroid + aRandomDir * 0.5) * explodeDist;
      shatteredCentroid += aRandomDir * shatter * 0.45 * sin(uTime * 6.0 + aCentroid.x * 4.0);

      float ang = shatter * 3.14 * (aRandomDir.x + uTime * 0.8);
      float s = sin(ang);
      float c = cos(ang);
      vec3 rotatedLocal = vec3(
        localOffset.x * c - localOffset.y * s,
        localOffset.x * s + localOffset.y * c,
        localOffset.z
      );

      vec3 finalPos = mix(p, shatteredCentroid + rotatedLocal * (1.0 - 0.18 * shatter), shatter);
      finalPos *= (1.0 + uShockwave * 0.22);

      vNormal = normalize(normalMatrix * normal);
      vWorldPos = finalPos;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPos, 1.0);
    }
  `;

  const surfaceMat = new THREE.ShaderMaterial({
    uniforms: k3Uniforms,
    side: THREE.DoubleSide,
    transparent: true,
    vertexShader: k3Vert,
    fragmentShader: `
      varying vec3 vNormal;
      varying vec3 vWorldPos;
      varying float vShatterAmount;
      varying float vCuspStress;

      void main() {
        vec3 viewDir = normalize(cameraPosition - vWorldPos);
        float fresnel = pow(1.0 - abs(dot(normalize(vNormal), viewDir)), 2.0);

        vec3 intactCol = mix(vec3(0.05, 0.75, 0.68), vec3(0.25, 0.55, 1.0), fresnel);
        vec3 brokenCol = mix(vec3(0.95, 0.12, 0.28), vec3(1.0, 0.65, 0.1), vCuspStress);
        brokenCol += vec3(1.0, 0.2, 0.4) * fresnel * 1.8;

        vec3 col = mix(intactCol, brokenCol, vShatterAmount);
        gl_FragColor = vec4(col, mix(0.84, 0.72, vShatterAmount));
      }
    `
  });

  const wireMat = new THREE.ShaderMaterial({
    uniforms: k3Uniforms,
    wireframe: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    vertexShader: k3Vert,
    fragmentShader: `
      varying float vShatterAmount;
      void main() {
        vec3 col = mix(vec3(0.2, 0.95, 0.85), vec3(1.0, 0.25, 0.35), vShatterAmount);
        gl_FragColor = vec4(col, mix(0.22, 0.58, vShatterAmount));
      }
    `
  });

  group.add(new THREE.Mesh(baseGeo, surfaceMat));
  group.add(new THREE.Mesh(baseGeo, wireMat));

  const sparkCount = 4500;
  const sparkPos = new Float32Array(sparkCount * 3);
  const sparkSeed = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = 1.2 + Math.random() * 1.8;
    sparkPos[i * 3] = Math.cos(a) * r;
    sparkPos[i * 3 + 1] = Math.sin(a) * r;
    sparkPos[i * 3 + 2] = (Math.random() - 0.5) * 1.8;
    sparkSeed[i * 3] = Math.random();
    sparkSeed[i * 3 + 1] = Math.random();
    sparkSeed[i * 3 + 2] = Math.random();
  }
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  sparkGeo.setAttribute('aSeed', new THREE.BufferAttribute(sparkSeed, 3));
  const sparksMat = new THREE.ShaderMaterial({
    uniforms: k3Uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute vec3 aSeed;
      uniform float uTime;
      uniform float uSign;
      varying float vShatter;
      void main() {
        float shatter = clamp((0.35 - uSign) / 1.35, 0.0, 1.0);
        vShatter = shatter;
        vec3 p = position * (1.0 + shatter * 0.9 * sin(uTime * 3.0 + aSeed.x * 10.0));
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = (mix(3.0, 14.0, shatter * aSeed.y)) / max(1.0, -mv.z);
      }
    `,
    fragmentShader: `
      varying float vShatter;
      void main() {
        float d = length(gl_PointCoord - vec2(0.5));
        if (d > 0.5) discard;
        vec3 col = mix(vec3(0.1, 0.9, 0.8), vec3(1.0, 0.18, 0.32), vShatter);
        gl_FragColor = vec4(col * 1.8, (1.0 - d * 2.0) * (0.2 + 0.75 * vShatter));
      }
    `
  });
  group.add(new THREE.Points(sparkGeo, sparksMat));

  return { group, surfaceMat, wireMat, sparksMat };
}
