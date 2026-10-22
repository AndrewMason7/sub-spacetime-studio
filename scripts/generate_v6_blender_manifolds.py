import bpy
import bmesh
import math
import os
from pathlib import Path

# Resolve output path: prefer repo's public/models, fallback to /tmp
REPO_ROOT = Path(__file__).resolve().parent.parent if "__file__" in locals() else Path.cwd()
OUTPUT_DIR = REPO_ROOT / "public" / "models"
if not OUTPUT_DIR.parent.exists():
    OUTPUT_DIR = Path("/tmp")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
print(f"Exporting manifolds to: {OUTPUT_DIR}")

def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)

def make_pbr_mat(name, base_color, emissive_color, emissive_strength=1.2, metallic=0.88, roughness=0.18):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = (*base_color, 1.0)
        bsdf.inputs["Metallic"].default_value = metallic
        bsdf.inputs["Roughness"].default_value = roughness
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (*emissive_color, 1.0)
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = emissive_strength
    return mat

def smooth_obj(obj):
    bpy.context.view_layer.objects.active = obj
    for poly in obj.data.polygons:
        poly.use_smooth = True

def add_curve_tube(name, points, bevel_depth=0.028, closed=True, mat=None):
    curve_data = bpy.data.curves.new(name=name + "_Curve", type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.resolution_u = 2
    curve_data.bevel_depth = bevel_depth
    curve_data.bevel_resolution = 4

    spline = curve_data.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for idx, pt in enumerate(points):
        spline.points[idx].co = (pt[0], pt[1], pt[2], 1.0)
    spline.use_cyclic_u = closed

    obj = bpy.data.objects.new(name, curve_data)
    bpy.context.collection.objects.link(obj)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.convert(target='MESH')
    smooth_obj(obj)
    if mat:
        obj.data.materials.append(mat)
    obj.select_set(False)
    return obj

# 1. M01: F348 EINSTEIN 4-MANIFOLD SADDLE + CLIFFORD TORUS + 5 HOPF FIBRATION RINGS
clear_scene()
mat_clifford = make_pbr_mat("CliffordMat", (0.06, 0.22, 0.38), (0.08, 0.55, 0.88), 0.9)
mat_hopf_cyan = make_pbr_mat("HopfCyanMat", (0.2, 0.85, 1.0), (0.35, 0.88, 1.0), 1.6)
mat_hopf_violet = make_pbr_mat("HopfVioletMat", (0.58, 0.32, 0.98), (0.65, 0.38, 1.0), 1.4)

mesh_core = bpy.data.meshes.new("CliffordCoreMesh")
obj_core = bpy.data.objects.new("CliffordCore", mesh_core)
bpy.context.collection.objects.link(obj_core)
bm = bmesh.new()
U, V = 96, 64
eta = math.pi / 4.0
verts = []
for i in range(U):
    u = (i / U) * 2.0 * math.pi
    row = []
    for j in range(V):
        v = (j / V) * 2.0 * math.pi
        x1 = math.sin(eta) * math.cos(u)
        x2 = math.sin(eta) * math.sin(u)
        x3 = math.cos(eta) * math.cos(v)
        x4 = math.cos(eta) * math.sin(v)
        denom = max(0.35, 1.25 - x4 * 0.68)
        px = (x1 / denom) * 1.38
        py = (x2 / denom) * 1.38
        pz = (x3 / denom) * 1.38 + 0.14 * math.sin(2*u - 2*v)
        row.append(bm.verts.new((px, py, pz)))
    verts.append(row)
for i in range(U):
    inext = (i + 1) % U
    for j in range(V):
        jnext = (j + 1) % V
        bm.faces.new((verts[i][j], verts[inext][j], verts[inext][jnext], verts[i][jnext]))
bm.to_mesh(mesh_core)
bm.free()
smooth_obj(obj_core)
obj_core.data.materials.append(mat_clifford)

for k in range(5):
    phi_base = (k / 5.0) * 2.0 * math.pi
    theta_tilt = 0.52 + 0.22 * math.sin(k * 1.3)
    pts = []
    N = 140
    for s in range(N):
        t = (s / N) * 2.0 * math.pi
        x1 = math.cos(theta_tilt) * math.cos(t)
        x2 = math.cos(theta_tilt) * math.sin(t)
        x3 = math.sin(theta_tilt) * math.cos(t + phi_base)
        x4 = math.sin(theta_tilt) * math.sin(t + phi_base)
        d = max(0.38, 1.18 - x4 * 0.65)
        pts.append(((x1 / d) * 1.62, (x2 / d) * 1.62, (x3 / d) * 1.62))
    m = mat_hopf_cyan if k % 2 == 0 else mat_hopf_violet
    add_curve_tube(f"HopfFiberRing_{k}", pts, bevel_depth=0.026, closed=True, mat=m)

bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT_DIR / "einstein_saddle.glb"),
    export_format='GLB',
    export_apply=True
)

# 2. M02: F211 FK-CRT MANIFOLD + 3D BESSEL BRIDGE DENDRITE SPINES
clear_scene()
mat_lqg = make_pbr_mat("LQGShellMat", (0.18, 0.08, 0.42), (0.45, 0.18, 0.88), 0.85)
mat_crt = make_pbr_mat("CRTDendriteMat", (0.85, 0.55, 0.98), (0.95, 0.65, 0.25), 1.55)

mesh_fk = bpy.data.meshes.new("LQGSurfaceMesh")
obj_fk = bpy.data.objects.new("LQGSurface", mesh_fk)
bpy.context.collection.objects.link(obj_fk)
bm = bmesh.new()
bmesh.ops.create_icosphere(bm, subdivisions=5, radius=1.85)
for v in bm.verts:
    nx, ny, nz = v.co.normalized()
    excursion = (
        math.sin(nx * 5.0) * math.cos(ny * 5.0) * 0.22 +
        math.sin(ny * 9.0 + nz * 7.0) * 0.11 +
        abs(math.sin(nx * 3.0) * math.sin(ny * 3.0) * math.sin(nz * 3.0)) * 0.45
    )
    v.co = v.co.normalized() * (1.75 + excursion)
bm.to_mesh(mesh_fk)
bm.free()
smooth_obj(obj_fk)
obj_fk.data.materials.append(mat_lqg)

phi_g = (1 + math.sqrt(5)) / 2
for b_idx in range(6):
    z = 1 - (2 * b_idx + 1) / 6.0
    rad = math.sqrt(max(0.0, 1 - z * z))
    th = 2 * math.pi * b_idx / phi_g
    dx, dy, dz = rad * math.cos(th), rad * math.sin(th), z
    spine_pts = []
    for step in range(48):
        s = step / 47.0
        r = 0.2 + s * 2.55
        wobble = 0.18 * math.sin(s * 12.0 + b_idx)
        spine_pts.append((
            dx * r + wobble * dy,
            dy * r - wobble * dx,
            dz * r + wobble * 0.5
        ))
    add_curve_tube(f"BesselTreeSpine_{b_idx}", spine_pts, bevel_depth=0.022, closed=False, mat=mat_crt)

bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT_DIR / "fkcrt_manifold.glb"),
    export_format='GLB',
    export_apply=True
)

# 3. M03: F260 CKS HYPERBOLOIDAL FUNNEL + KERR ERGOSPHERE + PHOTON RING
clear_scene()
mat_funnel = make_pbr_mat("CKSFunnelMat", (0.04, 0.32, 0.24), (0.05, 0.68, 0.48), 0.9)
mat_ergo = make_pbr_mat("KerrErgosphereMat", (0.08, 0.55, 0.78), (0.12, 0.82, 0.96), 1.3)
mat_photon = make_pbr_mat("PhotonRingMat", (1.0, 0.68, 0.2), (1.0, 0.72, 0.22), 2.2)

mesh_cks = bpy.data.meshes.new("CKSFunnelMesh")
obj_cks = bpy.data.objects.new("CKSFunnel", mesh_cks)
bpy.context.collection.objects.link(obj_cks)
bm = bmesh.new()
R_SEG, ANG_SEG = 56, 96
verts = []
for i in range(R_SEG):
    s = i / (R_SEG - 1)
    r = 0.68 + s * 3.25
    y = -1.65 / math.sqrt(r - 0.42) + 0.24 * s * s
    row = []
    for j in range(ANG_SEG):
        th = (j / ANG_SEG) * 2.0 * math.pi + (0.55 / r)
        x = r * math.cos(th)
        z = r * math.sin(th)
        row.append(bm.verts.new((x, y, z)))
    verts.append(row)
for i in range(R_SEG - 1):
    for j in range(ANG_SEG):
        jnext = (j + 1) % ANG_SEG
        bm.faces.new((verts[i][j], verts[i+1][j], verts[i+1][jnext], verts[i][jnext]))
bm.to_mesh(mesh_cks)
bm.free()
smooth_obj(obj_cks)
obj_cks.data.materials.append(mat_funnel)

mesh_ergo = bpy.data.meshes.new("KerrErgosphereMesh")
obj_ergo = bpy.data.objects.new("KerrErgosphere", mesh_ergo)
bpy.context.collection.objects.link(obj_ergo)
bm = bmesh.new()
bmesh.ops.create_uvsphere(bm, u_segments=64, v_segments=32, radius=1.0)
for v in bm.verts:
    r_len = v.co.length
    if r_len > 1e-5:
        cos_th = v.co.y / r_len
        r_ergo = 0.68 + math.sqrt(max(0.05, 0.46 - 0.34 * cos_th * cos_th))
        v.co = v.co.normalized() * r_ergo
bm.to_mesh(mesh_ergo)
bm.free()
smooth_obj(obj_ergo)
obj_ergo.data.materials.append(mat_ergo)

photon_pts = []
for j in range(128):
    th = (j / 128.0) * 2.0 * math.pi
    photon_pts.append((1.65 * math.cos(th), 0.04 * math.sin(3*th), 1.65 * math.sin(th)))
add_curve_tube("PhotonRing3M", photon_pts, bevel_depth=0.024, closed=True, mat=mat_photon)

bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT_DIR / "cks_horizon_funnel.glb"),
    export_format='GLB',
    export_apply=True
)

# 4. M04: F032 K3 CALABI-YAU QUINTIC + LAGRANGIAN CUSP SINGULARITY RINGS
clear_scene()
mat_k3 = make_pbr_mat("K3CalabiYauMat", (0.06, 0.38, 0.42), (0.08, 0.72, 0.68), 0.95)
mat_cusp = make_pbr_mat("CuspSingularityMat", (0.95, 0.14, 0.32), (1.0, 0.22, 0.38), 1.85)

mesh_k3 = bpy.data.meshes.new("K3QuinticBraneMesh")
obj_k3 = bpy.data.objects.new("K3QuinticBrane", mesh_k3)
bpy.context.collection.objects.link(obj_k3)
bm = bmesh.new()
U, V = 112, 64
verts = []
for i in range(U):
    u = (i / U) * 2.0 * math.pi
    row = []
    for j in range(V):
        v = (j / V) * 2.0 * math.pi
        R = 1.62 + 0.36 * math.cos(3 * u + 2 * v)
        r = 0.56 + 0.18 * math.sin(5 * u - 3 * v)
        x = (R + r * math.cos(v)) * math.cos(u)
        y = (R + r * math.cos(v)) * math.sin(u)
        z = r * math.sin(v) + 0.32 * math.sin(3 * u)
        row.append(bm.verts.new((x, y, z)))
    verts.append(row)
for i in range(U):
    inext = (i + 1) % U
    for j in range(V):
        jnext = (j + 1) % V
        bm.faces.new((verts[i][j], verts[inext][j], verts[inext][jnext], verts[i][jnext]))
bm.to_mesh(mesh_k3)
bm.free()
smooth_obj(obj_k3)
obj_k3.data.materials.append(mat_k3)

for c_idx in range(2):
    sign_dir = 1 if c_idx == 0 else -1
    cusp_pts = []
    for s in range(160):
        t = (s / 160.0) * 2.0 * math.pi
        r_c = 1.68 + 0.45 * math.cos(5 * t) * sign_dir
        x = r_c * math.cos(3 * t)
        y = r_c * math.sin(3 * t)
        z = 0.68 * math.sin(5 * t) * sign_dir
        cusp_pts.append((x, y, z))
    add_curve_tube(f"CuspDoublePointLocus_{c_idx}", cusp_pts, bevel_depth=0.025, closed=True, mat=mat_cusp)

bpy.ops.export_scene.gltf(
    filepath=str(OUTPUT_DIR / "k3_calabi_yau.glb"),
    export_format='GLB',
    export_apply=True
)
print("ALL 4 V6 MULTI-PART GLB MANIFOLDS GENERATED SUCCESSFULLY!")
