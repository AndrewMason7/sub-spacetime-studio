import * as THREE from 'three';

/**
 * MOD-05 // ASSOCIAHEDRON — host scene for the Blender-baked polytope.
 *
 * Unlike MOD-01..M04 this module's geometry is NOT procedural: the exact Loday
 * hulls are baked into `public/models/associahedron.glb` by
 * `scripts/generate_v8_associahedron.py` and attached to `group` by
 * ManifoldGlbArticulator. This module only supplies the stage dressing:
 *
 *  - a faint lattice cage that gives the crystal depth against the starfield
 *  - a facet-scan ring whose radius tracks the pole-focus slider, so the
 *    "canonical form pole" selection reads even when the hull is edge-on
 */
export interface AssociahedronHandles {
  group: THREE.Group;
  cageMat: THREE.ShaderMaterial;
  poleRingMat: THREE.ShaderMaterial;
  update(elapsed: number, poleFocus: number, sweep: number): void;
}

export function createAssociahedronScene(): AssociahedronHandles {
  const group = new THREE.Group();

  // --- vertex lattice: 42 Fibonacci-distributed nodes, matching the n=5
  // combinatorial point count so the cage never claims more structure than
  // the real polytope has.
  const NODES = 42;
  const positions = new Float32Array(NODES * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < NODES; i++) {
    const y = 1 - (i / (NODES - 1)) * 2;
    const radius = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = golden * i;
    positions[i * 3] = Math.cos(theta) * radius;
    positions[i * 3 + 1] = y;
    positions[i * 3 + 2] = Math.sin(theta) * radius;
  }
  const cageGeo = new THREE.BufferGeometry();
  cageGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const cageMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uSweep: { value: 0.0 },
      uColor: { value: new THREE.Color(0x5eead4) }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uSweep;
      varying float vDepth;
      void main() {
        vec3 p = position;
        float breathe = 1.0 + 0.05 * sin(uTime * 0.9 + position.y * 3.0);
        p *= 2.35 * breathe;
        p.y += sin(uTime * 0.45 + p.x * 1.5) * 0.06;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        vDepth = -mv.z;
        gl_PointSize = (2.0 + 1.2 * sin(uTime * 1.6 + position.x * 8.0 + uSweep * 6.28)) * (300.0 / vDepth);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vDepth;
      void main() {
        vec2 d = gl_PointCoord - vec2(0.5);
        float falloff = smoothstep(0.5, 0.0, length(d));
        float alpha = falloff * clamp(1.4 - vDepth * 0.09, 0.0, 1.0) * 0.55;
        gl_FragColor = vec4(uColor * 1.6, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  const cage = new THREE.Points(cageGeo, cageMat);
  cage.name = 'AssociahedronLatticeCage';
  group.add(cage);

  // --- pole focus ring: sweeps a bright arc around the hull, one lap per unit
  // of the facet-focus slider.
  const ringGeo = new THREE.TorusGeometry(2.06, 0.006, 8, 220);
  const poleRingMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uFocus: { value: 0.0 },
      uColor: { value: new THREE.Color(0x7dd3fc) }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uFocus;
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float along = vUv.x;
        float d = abs(along - uFocus);
        d = min(d, 1.0 - d);
        float core = smoothstep(0.085, 0.0, d);
        float shimmer = 0.75 + 0.25 * sin(uTime * 5.0 + along * 40.0);
        float alpha = core * shimmer;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uColor * (1.4 + core), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const poleRing = new THREE.Mesh(ringGeo, poleRingMat);
  poleRing.name = 'AssociahedronPoleRing';
  poleRing.rotation.x = Math.PI / 2.35;
  poleRing.rotation.z = 0.4;
  group.add(poleRing);

  return {
    group,
    cageMat,
    poleRingMat,
    update(elapsed: number, poleFocus: number, sweep: number) {
      cageMat.uniforms.uTime.value = elapsed;
      cageMat.uniforms.uSweep.value = sweep;
      poleRingMat.uniforms.uTime.value = elapsed;
      poleRingMat.uniforms.uFocus.value = poleFocus;
      poleRing.rotation.y = elapsed * 0.12 + poleFocus * Math.PI * 2.0;
    }
  };
}
