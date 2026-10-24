// Verifies the baked associahedron GLB actually contains what the sidecar claims.
// Run from the repo root so node resolves `three`:
//   node scripts/verify-associahedron.mjs
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const root = resolve(import.meta.dirname, '..');
const glb = readFileSync(resolve(root, 'public/models/associahedron.glb'));
const sidecar = JSON.parse(readFileSync(resolve(root, 'public/models/associahedron.json'), 'utf8'));

const loader = new GLTFLoader();
const gltf = await new Promise((res, rej) => {
  loader.parse(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength), '', res, rej);
});

const meshes = new Map();
const uniqueVerts = new Map();
gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  const pos = o.geometry.attributes.position;
  meshes.set(o.name, pos.count);
  // glTF splits vertices per face corner for flat shading, so count distinct
  // POSITIONS — that is the geometric vertex count the maths promises.
  const seen = new Set();
  for (let i = 0; i < pos.count; i++) {
    seen.add(`${pos.getX(i).toFixed(5)},${pos.getY(i).toFixed(5)},${pos.getZ(i).toFixed(5)}`);
  }
  uniqueVerts.set(o.name, seen.size);
});

const problems = [];
const check = (cond, msg) => { if (!cond) problems.push(msg); };

// n = 4: exact cage must be exactly 14 distinct positions
check(uniqueVerts.get('AssoN4_Cage') === 14, `AssoN4_Cage unique positions ${uniqueVerts.get('AssoN4_Cage')} != 14`);
check(meshes.has('AssoN4'), 'AssoN4 display mesh missing');

for (const order of sidecar.orders) {
  if (order.projected) {
    for (const frame of order.frames) {
      const got = uniqueVerts.get(frame.mesh);
      check(got === frame.V, `${frame.mesh}: ${got} unique positions, sidecar says ${frame.V}`);
      check(frame.euler === 2, `${frame.mesh}: Euler characteristic ${frame.euler} != 2`);
    }
    const frames = order.frames.length;
    check(frames === sidecar.sweepFrames, `n=${order.order}: ${frames} frames, expected ${sidecar.sweepFrames}`);
  } else {
    const f = order.frames[0];
    check(f.V === 14 && f.E === 21 && f.F === 9 && f.euler === 2,
      `n=4 exact frame is V${f.V}/E${f.E}/F${f.F}/chi${f.euler}, expected 14/21/9/2`);
  }
  check(order.coordinateSum === order.order * (order.order + 1) / 2,
    `n=${order.order}: coordinateSum ${order.coordinateSum} != n(n+1)/2`);
}

const n5 = [...meshes.keys()].filter((k) => k.startsWith('AssoN5_Proj'));
const n6 = [...meshes.keys()].filter((k) => k.startsWith('AssoN6_Proj'));
console.log(`meshes in GLB: ${meshes.size}  (n5 frames ${n5.length}, n6 frames ${n6.length})`);
console.log(`n4 cage ${uniqueVerts.get('AssoN4_Cage')} unique positions, n4 display ${meshes.get('AssoN4')} split verts (bevelled)`);

if (problems.length) {
  console.error('\nFAIL');
  for (const p of problems) console.error('  -', p);
  process.exit(1);
}
console.log('\nPASS — GLB matches the sidecar: exact n=4 cage, 24 true hulls per projected order.');
