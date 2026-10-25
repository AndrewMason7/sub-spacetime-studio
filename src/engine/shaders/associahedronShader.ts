import * as THREE from 'three';

/**
 * MOD-05 // ASSOCIAHEDRON — host scene for the Blender-baked polytope.
 *
 * Unlike MOD-01..M04 this module's geometry is NOT procedural: the exact Loday
 * hulls are baked into `public/models/associahedron.glb` by
 * `scripts/generate_v8_associahedron.py` and attached to `group` by
 * ManifoldGlbArticulator. This module only supplies:
 *
 *  - `vertexMat`, the glow material the articulator puts on a Points cloud
 *    built from each baked hull's DISTINCT vertex positions — every node is a
 *    real vertex of the displayed hull, never a decorative lattice point
 *  - an emphasis ring whose sweep tracks the pole-emphasis slider. It is a
 *    global emphasis cue; it does not identify an individual facet.
 */
export interface AssociahedronHandles {
  group: THREE.Group;
  vertexMat: THREE.ShaderMaterial;
  poleRingMat: THREE.ShaderMaterial;
  update(elapsed: number, poleFocus: number, sweep: number): void;
}

export function createAssociahedronScene(): AssociahedronHandles {
  const group = new THREE.Group();

  // --- hull-vertex glow nodes. Positions come from the GLB (see
  // ManifoldGlbArticulator), so this material only shades them.
  const vertexMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uFocus: { value: 0.0 },
      uColor: { value: new THREE.Color(0xe0f2fe) }
    },
    vertexShader: /* glsl */ `
      uniform float uTime;
      uniform float uFocus;
      varying float vDepth;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vDepth = -mv.z;
        float pulse = 1.0 + 0.18 * sin(uTime * 2.4 + position.x * 1.7 + position.z * 1.3);
        gl_PointSize = (1.5 + 0.9 * uFocus) * pulse * (300.0 / max(vDepth, 0.5));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying float vDepth;
      void main() {
        vec2 d = gl_PointCoord - vec2(0.5);
        float falloff = smoothstep(0.5, 0.0, length(d));
        float alpha = falloff * clamp(1.3 - vDepth * 0.09, 0.1, 1.0) * 0.38;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uColor * 1.05, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });

  // --- emphasis ring: sweeps a bright arc around the hull, one lap per unit
  // of the pole-emphasis slider (global cue, not a facet selector).
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
        float alpha = core * shimmer * 0.6;
        if (alpha < 0.01) discard;
        gl_FragColor = vec4(uColor * (0.9 + core * 0.6), alpha);
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
  // The pole-emphasis ring was drawn as a 2.06-radius torus around a hull that is
  // itself ~2.6 units wide: at any framing it read as an orbital cage crossing
  // the crystal and hiding the facets it was meant to emphasise. Emphasis is now
  // carried by the material + edge tint in updateAssociahedronManifold only.
  poleRing.visible = false;

  // subtle ambient contact aura on the ground plane to bed the object in space
  const contactGeo = new THREE.PlaneGeometry(9.0, 9.0);
  const contactMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0x5eead4) }
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      varying vec2 vUv;
      void main() {
        float d = length(vUv - vec2(0.5)) * 2.0;
        if (d > 1.0) discard;
        float falloff = smoothstep(1.0, 0.0, d);
        float alpha = falloff * falloff * 0.07;
        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const contactPlane = new THREE.Mesh(contactGeo, contactMat);
  contactPlane.name = 'AssociahedronContactGlow';
  contactPlane.rotation.x = -Math.PI / 2;
  contactPlane.position.y = -3.2;
  group.add(contactPlane);

  return {
    group,
    vertexMat,
    poleRingMat,
    update(elapsed: number, poleFocus: number, _sweep: number) {
      vertexMat.uniforms.uTime.value = elapsed;
      vertexMat.uniforms.uFocus.value = poleFocus;
      poleRingMat.uniforms.uTime.value = elapsed;
      poleRingMat.uniforms.uFocus.value = poleFocus;
      poleRing.rotation.y = elapsed * 0.12 + poleFocus * Math.PI * 2.0;
    }
  };
}
