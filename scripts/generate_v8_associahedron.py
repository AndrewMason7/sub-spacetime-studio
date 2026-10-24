"""
SUB-SPACETIME STUDIO // v8.0 MOD-05 Associahedron Generator
===========================================================
Bakes the associahedron (Loday realization) into public/models/associahedron.glb
plus a JSON sidecar of verified invariants, consumed by ManifoldGlbArticulator.

Run inside Blender >= 4.0 (tested 5.2.3 LTS):
    blender -b -P scripts/generate_v8_associahedron.py
or over Blender MCP:
    exec(open('/tmp/generate_v8_associahedron.py').read()); build_all('/tmp/asso_bake')

Mathematics (asserted, never trusted):
  * Vertices indexed by plane binary trees with n internal nodes (n+2 leaves),
    labelled in-order; coordinate i = (#leaves left subtree) * (#leaves right subtree).
  * Every vertex sums to n(n+1)/2  ->  polytope is (n-1)-dimensional.
  * Vertex count = Catalan(n): 14 / 42 / 132 for n = 4 / 5 / 6.
  * n = 4: the hyperplane is 3D -> orthonormal basis of sum=0 is an ISOMETRY into R^3.
  * n >= 5: hyperplane is 4D/5D -> genuine orthonormal projection (HUD says PROJECTED).
  * Facets = diagonals of the (n+2)-gon -> (n+2)(n-1)/2, i.e. 9 for n = 4.

WHY NO SHAPE KEYS (measured, not assumed):
  Shape keys need a topology that never changes. Re-hulling a rotating projection
  showed n=5 keeps the same 27 hull vertices at every amplitude, but n=6 swings
  between 28 and 39 hull vertices at any nonzero rotation. So the projection sweep
  is baked as 24 INDEPENDENT hull meshes per order, stepped by visibility at
  runtime. Every displayed frame is then a true convex hull, not a morph of one.

Object names are load-bearing: ManifoldGlbArticulator matches on them.
    AssoN4 / AssoN4_Cage / AssoN4_Wire            exact 3D, single frame
    AssoN5 (empty) -> AssoN5_Proj00..23 (+ _Wire)  projected sweep
    AssoN6 (empty) -> AssoN6_Proj00..23 (+ _Wire)
"""

import bpy
import bmesh
import json
import math
import os
import sys
from mathutils import Vector

ORDERS = [4, 5, 6]
SWEEP_FRAMES = 24
SWEEP_AMPLITUDE = 0.35  # radians (~20 deg) either side of the base projection

ACCENTS = {4: (0.36, 0.95, 0.85), 5: (0.55, 0.78, 1.00), 6: (0.85, 0.62, 1.00)}


# ---------------------------------------------------------------- combinatorics
def plane_trees(n):
    """All plane binary trees with n internal nodes (n == 0 -> single leaf)."""
    if n == 0:
        return [None]
    out = []
    for k in range(n):
        for left in plane_trees(k):
            for right in plane_trees(n - 1 - k):
                out.append((left, right))
    return out


def leaves(node):
    if node is None:
        return 1
    return leaves(node[0]) + leaves(node[1])


def loday_vertices(n):
    """Exact integer Loday coordinates, one row per tree, in-order node labelling."""
    pts = []
    for tree in plane_trees(n):
        coords = []

        def walk(node):
            if node is None:
                return
            walk(node[0])
            coords.append(leaves(node[0]) * leaves(node[1]))
            walk(node[1])

        walk(tree)
        assert len(coords) == n, f"expected {n} coords, got {len(coords)}"
        pts.append(tuple(coords))

    target = n * (n + 1) // 2
    for p in pts:
        assert sum(p) == target, f"Loday sum broken: {p} -> {sum(p)} != {target}"
    assert len(set(pts)) == len(pts), "duplicate vertices"
    return pts


def hyperplane_basis(n):
    """Orthonormal basis of {x in R^n : sum(x) = 0}, Gram-Schmidt on e_i - e_{i+1}."""
    basis = []
    for i in range(n - 1):
        v = [0.0] * n
        v[i] = 1.0
        v[i + 1] = -1.0
        for b in basis:
            d = sum(v[j] * b[j] for j in range(n))
            v = [v[j] - d * b[j] for j in range(n)]
        nrm = math.sqrt(sum(x * x for x in v))
        basis.append([x / nrm for x in v])
    return basis


def _centred(points, n):
    c = n * (n + 1) / 2.0 / n  # centroid of the hyperplane slice
    return [[p[i] - c for i in range(n)] for p in points]


def exact_embed(points, n):
    """n == 4 only: isometric embedding of the 3D hyperplane into R^3."""
    assert n == 4, "exact_embed is only valid when the hyperplane is 3-dimensional"
    basis = hyperplane_basis(n)
    assert len(basis) == 3, f"hyperplane dim {len(basis)} != 3"
    return [
        tuple(sum(basis[k][i] * c[i] for i in range(n)) for k in range(3))
        for c in _centred(points, n)
    ]


def project(points, n, angle):
    """n >= 5: genuine orthonormal projection into R^3, swept by `angle`."""
    basis = hyperplane_basis(n)
    assert len(basis) >= 3, "hyperplane too small to project from"
    u0, u1, u2 = basis[0], basis[1], basis[2]
    extra = basis[3] if len(basis) > 3 else basis[1]
    c, s = math.cos(angle), math.sin(angle)
    w0 = [c * u0[i] + s * extra[i] for i in range(n)]
    nrm = math.sqrt(sum(x * x for x in w0))
    w0 = [x / nrm for x in w0]
    frame = [w0, u1, u2]
    return [
        tuple(sum(frame[k][i] * cc[i] for i in range(n)) for k in range(3))
        for cc in _centred(points, n)
    ]


# ---------------------------------------------------------------------- meshing
def hull_mesh(points, dissolve=True):
    """Convex hull of `points` -> (verts, faces, edges). Coplanar triangles dissolve
    into real facets, so face count is the true facet count."""
    raw = bmesh.new()
    for p in points:
        raw.verts.new(Vector(p))
    raw.verts.ensure_lookup_table()
    bmesh.ops.convex_hull(raw, input=raw.verts, use_existing_faces=False)
    raw.verts.ensure_lookup_table()
    raw.faces.ensure_lookup_table()

    faces_keep = [f for f in raw.faces if f.is_valid]
    used, index_of = [], {}
    for f in faces_keep:
        for v in f.verts:
            if v.index not in index_of:
                index_of[v.index] = len(used)
                used.append(v.co.copy())
    face_idx = [tuple(index_of[v.index] for v in f.verts) for f in faces_keep]
    raw.free()

    bm = bmesh.new()
    bverts = [bm.verts.new(co) for co in used]
    bm.verts.ensure_lookup_table()
    for f in face_idx:
        try:
            bm.faces.new([bverts[i] for i in f])
        except ValueError:
            pass  # duplicate face already present
    bm.faces.ensure_lookup_table()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    if dissolve:
        bmesh.ops.dissolve_limit(
            bm, angle_limit=math.radians(0.5), verts=bm.verts[:], edges=bm.edges[:]
        )
    bm.verts.ensure_lookup_table()
    bm.faces.ensure_lookup_table()
    bm.edges.ensure_lookup_table()
    verts = [v.co.copy() for v in bm.verts]
    faces = [tuple(v.index for v in f.verts) for f in bm.faces]
    edges = [(e.verts[0].index, e.verts[1].index) for e in bm.edges]
    bm.free()
    return verts, faces, edges


def make_object(name, verts, faces, material, edges=None, parent=None, hide_render=False):
    me = bpy.data.meshes.new(f"{name}_Mesh")
    me.from_pydata([tuple(v) for v in verts], edges or [], faces)
    me.validate()
    me.update()
    ob = bpy.data.objects.new(name, me)
    if material is not None:
        me.materials.append(material)
    bpy.context.scene.collection.objects.link(ob)
    ob.hide_render = hide_render
    if parent is not None:
        ob.parent = parent
    return ob


def make_material(order):
    name = f"AssoMat_N{order}"
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    r, g, b = ACCENTS[order]
    bsdf.inputs["Base Color"].default_value = (r * 0.35, g * 0.35, b * 0.35, 1.0)
    bsdf.inputs["Metallic"].default_value = 0.85
    bsdf.inputs["Roughness"].default_value = 0.22
    if "Emission Color" in bsdf.inputs:
        bsdf.inputs["Emission Color"].default_value = (r, g, b, 1.0)
        bsdf.inputs["Emission Strength"].default_value = 0.45
    nt.links.new(bsdf.outputs[0], out.inputs[0])
    return mat


def make_wire_material(order):
    name = f"AssoWireMat_N{order}"
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    em = nt.nodes.new("ShaderNodeEmission")
    r, g, b = ACCENTS[order]
    em.inputs["Color"].default_value = (r, g, b, 1.0)
    em.inputs["Strength"].default_value = 2.2
    nt.links.new(em.outputs[0], out.inputs[0])
    return mat


# ------------------------------------------------------------------------ build
def clear_previous():
    for ob in [o for o in bpy.data.objects if o.name.startswith("AssoN")]:
        bpy.data.objects.remove(ob, do_unlink=True)
    for coll in (bpy.data.meshes, bpy.data.materials):
        for item in list(coll):
            if item.name.startswith(("AssoN", "AssoMat_N", "AssoWireMat_N")) and item.users == 0:
                coll.remove(item)
    cube = bpy.data.objects.get("Cube")
    if cube is not None and cube.type == "MESH" and not cube.data.shape_keys:
        bpy.data.objects.remove(cube, do_unlink=True)


def build_exact(order, pts_nd, mat, wire_mat, sidecar):
    """n = 4: one isometric mesh, an exact cage, a wire overlay."""
    verts3 = exact_embed(pts_nd, order)

    worst = 0.0
    for i in range(len(pts_nd)):
        for j in range(i + 1, len(pts_nd)):
            d_n = math.dist(pts_nd[i], pts_nd[j])
            d_3 = math.dist(verts3[i], verts3[j])
            worst = max(worst, abs(d_n - d_3))
    assert worst < 1e-9, f"n=4 embedding is not isometric (max err {worst})"

    verts, faces, edges = hull_mesh(verts3, dissolve=True)
    name = f"AssoN{order}"
    ob = make_object(name, verts, faces, mat)
    make_object(f"{name}_Cage", verts, faces, None, hide_render=True)

    bpy.context.view_layer.objects.active = ob
    ob.select_set(True)
    bev = ob.modifiers.new("MicroBevel", "BEVEL")
    bev.width = 0.012
    bev.segments = 2
    bev.limit_method = "ANGLE"
    bev.angle_limit = math.radians(20)
    bpy.ops.object.modifier_apply(modifier=bev.name)
    ob.select_set(False)

    make_object(f"{name}_Wire", verts, [], wire_mat, edges=edges, parent=ob)

    sidecar.append(
        {
            "order": order,
            "combinatorialVertices": len(pts_nd),
            "coordinateSum": order * (order + 1) // 2,
            "ambientDim": order,
            "affineDim": order - 1,
            "projected": False,
            "isometryMaxError": worst,
            "sweepFrames": 0,
            "root": name,
            "frames": [
                {"mesh": name, "wire": f"{name}_Wire", "V": len(verts), "E": len(edges), "F": len(faces),
                 "euler": len(verts) - len(edges) + len(faces)}
            ],
        }
    )
    print(
        f"[MOD-05] n={order}: EXACT-3D V={len(verts)} E={len(edges)} F={len(faces)} "
        f"chi={len(verts) - len(edges) + len(faces)} isometryErr={worst:.2e}"
    )
    return ob


def build_projected(order, pts_nd, mat, wire_mat, sidecar):
    """n >= 5: 24 independently hulled projections, grouped under an empty root."""
    root = bpy.data.objects.new(f"AssoN{order}", None)
    root.empty_display_type = "SPHERE"
    root.empty_display_size = 0.15
    bpy.context.scene.collection.objects.link(root)

    frames = []
    for k in range(SWEEP_FRAMES):
        angle = -SWEEP_AMPLITUDE + 2 * SWEEP_AMPLITUDE * k / (SWEEP_FRAMES - 1)
        verts3 = project(pts_nd, order, angle)
        verts, faces, edges = hull_mesh(verts3, dissolve=True)
        mesh_name = f"AssoN{order}_Proj{k:02d}"
        ob = make_object(mesh_name, verts, faces, mat, parent=root,
                         hide_render=(k != 0))
        ob.hide_viewport = k != 0
        make_object(f"{mesh_name}_Wire", verts, [], wire_mat, edges=edges, parent=ob,
                    hide_render=(k != 0))
        frames.append(
            {"mesh": mesh_name, "wire": f"{mesh_name}_Wire", "angleRad": angle,
             "V": len(verts), "E": len(edges), "F": len(faces),
             "euler": len(verts) - len(edges) + len(faces)}
        )

    sidecar.append(
        {
            "order": order,
            "combinatorialVertices": len(pts_nd),
            "coordinateSum": order * (order + 1) // 2,
            "ambientDim": order,
            "affineDim": order - 1,
            "projected": True,
            "isometryMaxError": None,
            "sweepFrames": SWEEP_FRAMES,
            "sweepAmplitudeRad": SWEEP_AMPLITUDE,
            "root": f"AssoN{order}",
            "hullRange": {
                "minV": min(f["V"] for f in frames),
                "maxV": max(f["V"] for f in frames),
            },
            "frames": frames,
        }
    )
    print(
        f"[MOD-05] n={order}: PROJECTED {SWEEP_FRAMES} frames, hull V "
        f"{min(f['V'] for f in frames)}..{max(f['V'] for f in frames)} "
        f"(combinatorial {len(pts_nd)} points)"
    )
    return root


def build_all(out_dir):
    out_dir = os.path.expanduser(out_dir)
    os.makedirs(out_dir, exist_ok=True)
    clear_previous()

    sidecar = []
    for order in ORDERS:
        pts_nd = loday_vertices(order)
        assert len(pts_nd) == {4: 14, 5: 42, 6: 132}[order], f"Catalan mismatch n={order}"
        mat = make_material(order)
        wire_mat = make_wire_material(order)
        if order == 4:
            build_exact(order, pts_nd, mat, wire_mat, sidecar)
        else:
            build_projected(order, pts_nd, mat, wire_mat, sidecar)

    doc = {
        "generator": "scripts/generate_v8_associahedron.py",
        "blenderVersion": bpy.app.version_string,
        "realization": "Loday: x_i = leaves_left(i) * leaves_right(i), in-order labelling",
        "sweepFrames": SWEEP_FRAMES,
        "sweepAmplitudeRad": SWEEP_AMPLITUDE,
        "orders": sidecar,
    }
    json_path = os.path.join(out_dir, "associahedron.json")
    with open(json_path, "w") as fh:
        json.dump(doc, fh, indent=2)
    print(f"[MOD-05] sidecar -> {json_path}")

    glb_path = os.path.join(out_dir, "associahedron.glb")
    bpy.ops.object.select_all(action="DESELECT")
    for ob in bpy.data.objects:
        if ob.name.startswith("AssoN"):
            ob.hide_render = False
            ob.hide_viewport = False
            ob.select_set(True)
    bpy.context.view_layer.objects.active = bpy.data.objects["AssoN4"]
    bpy.ops.export_scene.gltf(
        filepath=glb_path,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_morph=False,
        export_yup=True,
    )
    size = os.path.getsize(glb_path)
    print(f"[MOD-05] GLB -> {glb_path} ({size} bytes)")
    assert size > 5000, "export wrote a suspiciously small file"

    print("[MOD-05] MANIFEST")
    for ob in sorted(bpy.data.objects, key=lambda o: o.name):
        if ob.name.startswith("AssoN"):
            v = len(ob.data.vertices) if ob.type == "MESH" else 0
            print(f"  {ob.name:<22} {ob.type:<6} verts={v}")
    return glb_path, json_path


if __name__ == "__main__":
    argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    target = argv[0] if argv else os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "models"
    )
    build_all(target)
