// Verifies the baked associahedron GLB against an INDEPENDENT re-hull.
// Run from the repo root so node resolves `three`:
//   node scripts/verify-associahedron.mjs
//
// Why this checks more than vertex positions: the first bake merged two facets
// 0.483 deg apart on AssoN6_Proj12 and lost 4 vertices. The sidecar agreed with
// the broken GLB, so a positions-vs-sidecar check passed while the mesh was a
// lie. This script re-derives the hull from the Loday formula and compares the
// FACET COUNT — the invariant a silent facet merge cannot preserve.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { ConvexHull } from 'three/examples/jsm/math/ConvexHull.js';

const root = resolve(import.meta.dirname, '..');
const glb = readFileSync(resolve(root, 'public/models/associahedron.glb'));
const sidecar = JSON.parse(readFileSync(resolve(root, 'public/models/associahedron.json'), 'utf8'));

const key = (x, y, z) => `${x.toFixed(5)},${y.toFixed(5)},${z.toFixed(5)}`;

// ------------------------------------------------------------- Loday geometry
function planeBinaryTrees(n) {
  if (n === 0) return [null];
  const out = [];
  for (let k = 0; k < n; k++) {
    for (const left of planeBinaryTrees(k)) {
      for (const right of planeBinaryTrees(n - 1 - k)) out.push([left, right]);
    }
  }
  return out;
}
const leaves = (t) => (t === null ? 1 : leaves(t[0]) + leaves(t[1]));

function lodayVertices(n) {
  return planeBinaryTrees(n).map((tree) => {
    const coords = [];
    const walk = (node) => {
      if (node === null) return;
      walk(node[0]);
      coords.push(leaves(node[0]) * leaves(node[1]));
      walk(node[1]);
    };
    walk(tree);
    return coords;
  });
}

function hyperplaneBasis(n) {
  const basis = [];
  for (let i = 0; i < n - 1; i++) {
    let v = new Array(n).fill(0);
    v[i] = 1;
    v[i + 1] = -1;
    for (const b of basis) {
      const d = v.reduce((s, x, j) => s + x * b[j], 0);
      v = v.map((x, j) => x - d * b[j]);
    }
    const nrm = Math.hypot(...v);
    basis.push(v.map((x) => x / nrm));
  }
  return basis;
}

function projectTo3D(points, n, angle) {
  const basis = hyperplaneBasis(n);
  const [u0, u1, u2] = basis;
  const extra = basis[3] ?? basis[1];
  const c = Math.cos(angle);
  const s = Math.sin(angle);
  let w0 = u0.map((x, i) => c * x + s * extra[i]);
  const nrm = Math.hypot(...w0);
  w0 = w0.map((x) => x / nrm);
  const frame = [w0, u1, u2];
  const centroid = (n * (n + 1)) / 2 / n;
  return points.map((p) => {
    const cc = p.map((x) => x - centroid);
    return new Vector3(...frame.map((f) => f.reduce((sum, fi, i) => sum + fi * cc[i], 0)));
  });
}

/** Number of genuinely distinct facet planes in the hull of `pts3`. */
function hullFacetCount(pts3) {
  const hull = new ConvexHull().setFromPoints(pts3);
  const planes = [];
  for (const f of hull.faces) {
    const nrm = f.normal.clone().normalize();
    const d = nrm.dot(f.edge.head().point);
    if (!planes.some((p) => p.nrm.distanceTo(nrm) < 1e-6 && Math.abs(p.d - d) < 1e-6)) {
      planes.push({ nrm, d });
    }
  }
  return planes.length;
}

// --------------------------------------------------------------- load the GLB
const gltf = await new Promise((res, rej) => {
  new GLTFLoader().parse(glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength), '', res, rej);
});

const rawVerts = new Map();
const uniqueVerts = new Map();
const facetCount = new Map();
const edgeCount = new Map();

gltf.scene.traverse((o) => {
  if (!o.isMesh) return;
  const pos = o.geometry.attributes.position;
  rawVerts.set(o.name, pos.count);

  // glTF splits vertices per face corner for flat shading, so count distinct POSITIONS
  const seen = new Set();
  for (let i = 0; i < pos.count; i++) seen.add(key(pos.getX(i), pos.getY(i), pos.getZ(i)));
  uniqueVerts.set(o.name, seen.size);

  const geo = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry;
  const p = geo.attributes.position;
  const groups = [];
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const ab = new Vector3();
  const ac = new Vector3();
  for (let t = 0; t < p.count; t += 3) {
    a.fromBufferAttribute(p, t);
    b.fromBufferAttribute(p, t + 1);
    c.fromBufferAttribute(p, t + 2);
    ab.subVectors(b, a);
    ac.subVectors(c, a);
    const nrm = new Vector3().crossVectors(ab, ac);
    if (nrm.lengthSq() < 1e-20) continue;
    nrm.normalize();
    const d = nrm.dot(a);
    const tri = { a: a.clone(), b: b.clone(), c: c.clone() };
    const hit = groups.find((g) => g.nrm.distanceTo(nrm) < 1e-4 && Math.abs(g.d - d) < 1e-4);
    if (hit) hit.tris.push(tri);
    else groups.push({ nrm, d, tris: [tri] });
  }

  // Edge count must come from FACET BOUNDARIES: a triangulated facet's interior
  // diagonals are not polytope edges, and counting them inflates Euler.
  const boundary = new Map();
  for (const g of groups) {
    const local = new Map();
    for (const tri of g.tris) {
      for (const [u, v] of [[tri.a, tri.b], [tri.b, tri.c], [tri.c, tri.a]]) {
        const ka = key(u.x, u.y, u.z);
        const kb = key(v.x, v.y, v.z);
        const k = ka < kb ? `${ka}|${kb}` : `${kb}|${ka}`;
        local.set(k, (local.get(k) ?? 0) + 1);
      }
    }
    for (const [k, count] of local) if (count === 1) boundary.set(k, (boundary.get(k) ?? 0) + 1);
  }

  facetCount.set(o.name, groups.length);
  edgeCount.set(o.name, boundary.size);
});

// -------------------------------------------------------------------- asserts
const problems = [];
const check = (cond, msg) => { if (!cond) problems.push(msg); };

check(uniqueVerts.get('AssoN4_Cage') === 14, `AssoN4_Cage unique positions ${uniqueVerts.get('AssoN4_Cage')} != 14`);
check(rawVerts.has('AssoN4'), 'AssoN4 display mesh missing');

for (const order of sidecar.orders) {
  const n = order.order;

  if (!order.projected) {
    const f = order.frames[0];
    check(f.V === 14 && f.E === 21 && f.F === 9 && f.euler === 2,
      `n=4 exact frame is V${f.V}/E${f.E}/F${f.F}/chi${f.euler}, expected 14/21/9/2`);
    // the exact cage is the mathematical object; AssoN4 itself is the bevelled
    // display mesh and legitimately has many small planes
    check(facetCount.get('AssoN4_Cage') === 9, `n=4 cage has ${facetCount.get('AssoN4_Cage')} facet planes, expected 9`);
    check(uniqueVerts.get('AssoN4_Cage') - edgeCount.get('AssoN4_Cage') + facetCount.get('AssoN4_Cage') === 2,
      `n=4 cage Euler characteristic ${uniqueVerts.get('AssoN4_Cage')}-${edgeCount.get('AssoN4_Cage')}+${facetCount.get('AssoN4_Cage')} != 2`);
    continue;
  }

  const pts = lodayVertices(n);
  for (const frame of order.frames) {
    const idx = Number(frame.mesh.slice(-2));
    const angle = -sidecar.sweepAmplitudeRad + (2 * sidecar.sweepAmplitudeRad * idx) / (sidecar.sweepFrames - 1);
    const refF = hullFacetCount(projectTo3D(pts, n, angle));

    const glbV = uniqueVerts.get(frame.mesh);
    const glbE = edgeCount.get(frame.mesh);
    const glbF = facetCount.get(frame.mesh);

    check(glbV === frame.V, `${frame.mesh}: GLB ${glbV} unique positions, sidecar says ${frame.V}`);
    check(glbF === refF,
      `${frame.mesh}: GLB has ${glbF} facet planes but the true hull has ${refF} — facets merged or split at bake time`);
    check(frame.F === refF, `${frame.mesh}: sidecar F=${frame.F} disagrees with re-hull F=${refF} (stale sidecar)`);
    check(glbV - glbE + glbF === 2,
      `${frame.mesh}: GLB Euler characteristic ${glbV}-${glbE}+${glbF}=${glbV - glbE + glbF}, expected 2`);
    check(frame.euler === 2, `${frame.mesh}: sidecar Euler characteristic ${frame.euler} != 2`);
  }

  check(order.frames.length === sidecar.sweepFrames, `n=${n}: ${order.frames.length} frames, expected ${sidecar.sweepFrames}`);
  check(order.coordinateSum === (n * (n + 1)) / 2, `n=${n}: coordinateSum ${order.coordinateSum} != n(n+1)/2`);
}

const f12 = 'AssoN6_Proj12';
console.log(`meshes in GLB: ${facetCount.size}  (n5 frames ${[...facetCount.keys()].filter((k) => k.startsWith('AssoN5_Proj')).length}, n6 frames ${[...facetCount.keys()].filter((k) => k.startsWith('AssoN6_Proj')).length})`);
console.log(`n4 cage: ${uniqueVerts.get('AssoN4_Cage')} positions, ${facetCount.get('AssoN4_Cage')} facet planes`);
console.log(`${f12}: GLB V${uniqueVerts.get(f12)} E${edgeCount.get(f12)} F${facetCount.get(f12)} | re-hull F${hullFacetCount(projectTo3D(lodayVertices(6), 6, 0.015217391304347794))}`);

if (problems.length) {
  console.error('\nFAIL');
  for (const p of problems) console.error('  -', p);
  process.exit(1);
}
console.log('\nPASS — every GLB frame matches an independently re-derived hull (facet count, vertex count, Euler characteristic).');
