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

  // subtle ambient contact aura and optical stage reticle on the ground plane
  // to bed the object in a designed spatial chamber
  const contactGeo = new THREE.PlaneGeometry(9.0, 9.0);
  const contactMat = new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(0x5eead4) },
      uTime: { value: 0 },
      uFocus: { value: 0.15 }
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
      uniform float uTime;
      uniform float uFocus;
      varying vec2 vUv;
      void main() {
        vec2 p = (vUv - vec2(0.5)) * 2.0;
        float d = length(p);
        if (d > 1.0) discard;
        float falloff = smoothstep(1.0, 0.0, d);
        // Concentric optical stage calibration rings at r = 0.36, 0.62, 0.86
        float r1 = smoothstep(0.012, 0.0, abs(d - 0.36));
        float r2 = smoothstep(0.010, 0.0, abs(d - 0.62));
        float r3 = smoothstep(0.008, 0.0, abs(d - 0.86));
        float ang = atan(p.y, p.x);
        float ticks = smoothstep(0.92, 0.99, cos(ang * 12.0)) * smoothstep(0.04, 0.0, abs(d - 0.62));
        float reticle = (r1 * 0.45 + r2 * 0.35 + r3 * 0.22 + ticks * 0.5) * falloff;
        float alpha = falloff * falloff * (0.068 + 0.025 * uFocus) + reticle * (0.075 + 0.04 * uFocus);
        vec3 col = mix(uColor, vec3(0.58, 0.77, 0.99), d * 0.45);
        gl_FragColor = vec4(col, alpha);
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

  // M05-only Deep-Field Kinematic Backdrop Dome (radius 52, BackSide):
  // Replaces the empty void with a structured celestial-kinematic horizon gradient
  // and faint great-circle astrometric graticules while keeping a dark contrast
  // pocket directly behind the crystal silhouette.
  const domeGeo = new THREE.SphereGeometry(52.0, 48, 32);
  const domeMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uFocus: { value: 0.15 }
    },
    vertexShader: /* glsl */ `
      varying vec3 vWorldDir;
      varying vec3 vViewPos;
      void main() {
        vWorldDir = normalize(position);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vViewPos = mv.xyz;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uTime;
      uniform float uFocus;
      varying vec3 vWorldDir;
      varying vec3 vViewPos;
      void main() {
        vec3 d = normalize(vWorldDir);
        // Tilted kinematic ecliptic plane calibrated to sRGB 12..24 along the band
        vec3 eclipticNormal = normalize(vec3(0.26, 0.88, -0.38));
        float bandDist = abs(dot(d, eclipticNormal));
        float horizonBand = exp(-bandDist * bandDist * 8.5);
        float secondaryBand = exp(-pow(abs(d.y + 0.08 - 0.18 * d.x), 2.0) * 11.0);

        // Structured deep-field nebula clouds along the ecliptic stream
        float cloudWave = 0.55 + 0.45 * sin(d.x * 4.2 + d.z * 3.1) * cos(d.y * 5.0 - d.x * 2.4);
        float cloudPocket = pow(max(0.0, sin(d.x * 2.6 - d.y * 3.2 + 1.1)), 2.0);

        // Crisp celestial coordinate graticule arcs (optical chamber reference rings)
        float latLines = smoothstep(0.006, 0.0, abs(fract(asin(clamp(d.y, -1.0, 1.0)) * 3.8197) - 0.5) - 0.489);
        float lonLines = smoothstep(0.006, 0.0, abs(fract(atan(d.z, d.x) * 1.9098) - 0.5) - 0.490);
        float eqRing = smoothstep(0.004, 0.0, bandDist);
        float gridMask = (latLines + lonLines) * (0.35 + 0.65 * horizonBand) * 0.020 + eqRing * 0.028;

        // Dark contrast well directly behind the crystal silhouette so facets pop cleanly
        vec2 viewAngle = vViewPos.xy / max(-vViewPos.z, 1.0);
        float centerWell = smoothstep(0.12, 0.34, length(viewAngle));

        vec3 tealNebula = vec3(0.022, 0.095, 0.115) * horizonBand * (0.7 + 0.6 * cloudWave);
        vec3 indigoBand = vec3(0.038, 0.024, 0.088) * (secondaryBand + 0.55 * cloudPocket * horizonBand);
        vec3 gridCol = vec3(0.28, 0.82, 0.76) * gridMask;
        vec3 col = (tealNebula + indigoBand) * (0.25 + 0.75 * centerWell) + gridCol * centerWell;
        float alpha = clamp((horizonBand * 0.17 + secondaryBand * 0.13 + gridMask) * (0.30 + 0.70 * centerWell), 0.0, 0.22);
        gl_FragColor = vec4(col, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    side: THREE.BackSide
  });
  const domeMesh = new THREE.Mesh(domeGeo, domeMat);
  domeMesh.name = 'AssociahedronDeepFieldDome';
  group.add(domeMesh);

  // M05-only Seeded Astrometric Starfield (radius 22..46):
  // Magnitude-stratified soft Airy-disk stars concentrated along the kinematic
  // ecliptic stream with a strict central exclusion mask so no star ever sits
  // behind the crystal facets or mimics a polytope vertex.
  const starCount = 680;
  const starPos = new Float32Array(starCount * 3);
  const starColor = new Float32Array(starCount * 3);
  const starScale = new Float32Array(starCount);
  let seed = 0x5eed0505;
  const nextRand = () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const palette = [
    new THREE.Color(0x5eead4), // seafoam crystal teal
    new THREE.Color(0x93c5fd), // projected ice-sapphire
    new THREE.Color(0xe0f2fe), // celestial white-ice
    new THREE.Color(0xd8b4fe)  // lilac rim harmonic
  ];

  for (let i = 0; i < starCount; i++) {
    const r = 22.0 + nextRand() * 24.0;
    const theta = nextRand() * Math.PI * 2.0;
    // Concentrate 75% of stars along the tilted kinematic stream
    const inStream = nextRand() < 0.75;
    const latSpread = inStream ? (nextRand() - 0.5) * 0.52 : Math.asin(2.0 * nextRand() - 1.0);
    let x = Math.cos(latSpread) * Math.cos(theta);
    let y = Math.sin(latSpread);
    let z = Math.cos(latSpread) * Math.sin(theta);
    // Tilt stream by 24 deg around Z and -16 deg around X
    const cz = Math.cos(0.42), sz = Math.sin(0.42);
    const y1 = x * sz + y * cz;
    const x1 = x * cz - y * sz;
    starPos[i * 3] = x1 * r;
    starPos[i * 3 + 1] = y1 * r;
    starPos[i * 3 + 2] = z * r;

    // Magnitude stratification: 65% fine dust, 25% mid cluster stars, 10% soft-haloed navigation stars
    const tierRoll = nextRand();
    starScale[i] = tierRoll < 0.65 ? 1.35 + nextRand() * 0.75 : tierRoll < 0.90 ? 2.45 + nextRand() * 1.15 : 4.20 + nextRand() * 1.60;

    const baseCol = palette[Math.floor(nextRand() * palette.length)];
    const brightness = tierRoll < 0.65 ? 0.58 : tierRoll < 0.90 ? 0.84 : 1.0;
    starColor[i * 3] = baseCol.r * brightness;
    starColor[i * 3 + 1] = baseCol.g * brightness;
    starColor[i * 3 + 2] = baseCol.b * brightness;
  }

  const astroGeo = new THREE.BufferGeometry();
  astroGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  astroGeo.setAttribute('color', new THREE.BufferAttribute(starColor, 3));
  astroGeo.setAttribute('aScale', new THREE.BufferAttribute(starScale, 1));

  const astroMat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 }
    },
    vertexShader: /* glsl */ `
      attribute float aScale;
      attribute vec3 color;
      uniform float uTime;
      varying vec3 vColor;
      varying float vExclusion;
      varying float vTier;
      void main() {
        vColor = color;
        vTier = aScale;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        // Exclude stars directly behind the crystal silhouette so facets & vertices stay unoccluded
        float screenRad = length(mv.xy) * (9.6 / max(-mv.z, 1.0));
        vExclusion = smoothstep(2.55, 4.1, screenRad);
        float twinkle = 0.90 + 0.10 * sin(uTime * 1.4 + position.x * 0.37 + position.y * 0.53);
        gl_PointSize = aScale * twinkle * (115.0 / max(-mv.z, 10.0));
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      varying float vExclusion;
      varying float vTier;
      void main() {
        if (vExclusion < 0.02) discard;
        vec2 uv = (gl_PointCoord - vec2(0.5)) * 2.0;
        float r2 = dot(uv, uv);
        if (r2 > 1.0) discard;
        float r = sqrt(r2);
        // Smooth Airy-Gaussian optical profile (bright core + soft atmospheric halo + subtle diffraction cross on bright stars)
        float core = exp(-r2 * 7.5);
        float halo = smoothstep(1.0, 0.0, r) * smoothstep(1.0, 0.0, r) * 0.36;
        float crossSpike = step(3.8, vTier) * (exp(-abs(uv.x) * 18.0) * exp(-r2 * 2.5) + exp(-abs(uv.y) * 18.0) * exp(-r2 * 2.5)) * 0.25;
        float intensity = core * 0.72 + halo + crossSpike;
        float alpha = intensity * vExclusion * clamp(vTier * 0.22, 0.25, 0.85);
        if (alpha < 0.008) discard;
        gl_FragColor = vec4(vColor * (0.65 + 0.35 * core), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending
  });
  const astroStars = new THREE.Points(astroGeo, astroMat);
  astroStars.name = 'AssociahedronAstrometricField';
  group.add(astroStars);

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
      contactMat.uniforms.uTime.value = elapsed;
      contactMat.uniforms.uFocus.value = poleFocus;
      domeMat.uniforms.uTime.value = elapsed;
      domeMat.uniforms.uFocus.value = poleFocus;
      astroMat.uniforms.uTime.value = elapsed;
      astroStars.rotation.y = -elapsed * 0.018;
    }
  };
}
