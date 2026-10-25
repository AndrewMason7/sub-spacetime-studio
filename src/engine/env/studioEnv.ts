import * as THREE from 'three';

/**
 * MOD-05 // studio environment map
 *
 * The associahedron is a flat-shaded polyhedron, so every facet has ONE normal.
 * That makes an environment map the correct tool for facet-level reflections:
 * the reflected ray is constant across a facet, so each face samples one point of
 * the environment and reads as a single clean reflection — no round light blobs
 * smeared across a plane (which is what point-light specular does, and it makes
 * flat faces look dented).
 *
 * Built as a 6-face cube of softbox strips: a teal key strip, a violet fill, a
 * bright ceiling, and a dark floor. As the module tumbles, different facets sweep
 * across the strips, so the highlight travels across the solid without moving any
 * light source.
 */
const SIZE = 256;

type Strip = {
  /** horizontal centre of the strip, 0..1 */
  x: number;
  /** half-width of the strip, 0..1 */
  width: number;
  colour: string;
  /** peak alpha */
  strength: number;
};

function makeFace(base: { top: string; bottom: string }, strips: Strip[]): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = SIZE;
  canvas.height = SIZE;
  const ctx = canvas.getContext('2d');

  if (!ctx) return canvas;

  const vertical = ctx.createLinearGradient(0, 0, 0, SIZE);
  vertical.addColorStop(0, base.top);
  vertical.addColorStop(1, base.bottom);
  ctx.fillStyle = vertical;
  ctx.fillRect(0, 0, SIZE, SIZE);

  for (const strip of strips) {
    const centre = strip.x * SIZE;
    const half = Math.max(6, strip.width * SIZE);
    const horizontal = ctx.createLinearGradient(centre - half, 0, centre + half, 0);
    horizontal.addColorStop(0, 'rgba(0,0,0,0)');
    horizontal.addColorStop(0.5, strip.colour);
    horizontal.addColorStop(1, 'rgba(0,0,0,0)');

    // vertical falloff keeps the strip from painting the whole face edge to edge
    const glow = ctx.createLinearGradient(0, 0, 0, SIZE);
    glow.addColorStop(0, `rgba(0,0,0,0)`);
    glow.addColorStop(0.18, `rgba(255,255,255,${strip.strength})`);
    glow.addColorStop(0.62, `rgba(255,255,255,${strip.strength * 0.78})`);
    glow.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = horizontal;
    ctx.fillRect(centre - half, 0, half * 2, SIZE);
    ctx.globalCompositeOperation = 'destination-in';
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, SIZE, SIZE);
    ctx.restore();
  }

  return canvas;
}

export function createStudioEnvMap(): THREE.CubeTexture {
  const key = '#c9fff4';
  const fill = '#c9b6ff';

  const faces = [
    // +X : warm teal key from camera right
    makeFace({ top: '#123038', bottom: '#060a10' }, [
      { x: 0.62, width: 0.17, colour: key, strength: 0.95 }
    ]),
    // -X : violet fill from camera left
    makeFace({ top: '#141428', bottom: '#06070d' }, [
      { x: 0.34, width: 0.2, colour: fill, strength: 0.7 }
    ]),
    // +Y : ceiling softbox
    makeFace({ top: '#a9e9e0', bottom: '#123038' }, [
      { x: 0.5, width: 0.34, colour: '#ffffff', strength: 0.55 }
    ]),
    // -Y : dark floor with a faint teal bounce
    makeFace({ top: '#0a141a', bottom: '#05070b' }, [
      { x: 0.5, width: 0.4, colour: '#2dd4bf', strength: 0.16 }
    ]),
    // +Z : front key, the strip the camera reads first
    makeFace({ top: '#123238', bottom: '#070b12' }, [
      { x: 0.44, width: 0.13, colour: key, strength: 1 }
    ]),
    // -Z : back rim
    makeFace({ top: '#131328', bottom: '#06070c' }, [
      { x: 0.66, width: 0.15, colour: fill, strength: 0.6 }
    ])
  ];

  const texture = new THREE.CubeTexture(faces);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
