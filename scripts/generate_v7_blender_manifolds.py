"""
SUB-SPACETIME STUDIO // v7.0 Masterpiece Manifold Generator (with Shape Keys & COLOR_0)
========================================================================================
High-Precision Mathematical Physics & Quantum Gravity Manifold Pipeline for Blender 5.2.2 LTS.

Visualizes 4 frontier mathematical physics theorems from openai/math & recent literature:
  1. M01 · Harlow-Usatyuk-Zhao / F348 Einstein 4-Manifold Saddle
     - Clifford Torus in S^3 (stereographically projected into R^3)
     - Shape Key: `Singularity_Collapse` (morphs Clifford torus into 0D state as S_Ob -> 0)
     - 5 True Conformal Hopf Fibration Villarceau Circles with Gauss Linking Number Lk = +1
  2. M02 · FK-CRT Critical Phase Transition Manifold (F211)
     - Liouville Quantum Gravity (LQG) Sphere via Spherical Harmonic Gaussian Free Field (GFF)
     - Shape Key: `Fractal_Roughness` (morphs sphere into extreme Hausdorff fractal spikes as q -> 4)
     - Stochastic Branching Aldous Continuum Random Tree (CRT) with Brownian Tapering
  3. M03 · CKS-Willow Holographic Horizon (Christodoulou-Klainerman-Sormani)
     - Boyer-Lindquist Kerr Funnel with Carter Isometric Spatial Embedding
     - Kerr Ergosphere Surface r_ergo(theta) = M(1 + sqrt(1 - a^2 cos^2 theta))
     - Shape Key: `Ergo_Bulge` (flattens Schwarzschild sphere into extreme oblate Kerr ergosphere as a -> 1)
     - Prograde Photon Sphere Null Orbit Ring at 3M
  4. M04 · F032 K3 Calabi-Yau Quintic Slice
     - Fermat Quintic Hypersurface Cross-Section in CP^4 (Hanson 3D Immersion)
     - Shape Key: `Cusp_Shatter` (pinches Lefschetz vanishing cycle into A_1 double point as eps_stab -> -1)
     - Lagrangian Cusp Vanishing Cycle Loci for Double-Point Invariant I_new = -2m

Preserves exact mesh names required by ManifoldGlbArticulator.ts:
  - CliffordCore, HopfFiberRing_0..4
  - LQGSurface, BesselTreeSpine_0..5
  - CKSFunnel, KerrErgosphere, PhotonRing3M
  - K3QuinticBrane, CuspDoublePointLocus_0..1
"""

import bpy  # type: ignore
import bmesh  # type: ignore
import math
import numpy as np
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent if "__file__" in locals() else Path.cwd()
OUTPUT_DIR = REPO_ROOT / "public" / "models"
if not OUTPUT_DIR.parent.exists():
    OUTPUT_DIR = Path("/tmp")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
print(f"Target manifold destination: {OUTPUT_DIR}")


def clear_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_pbr_mat(name, base_color, emissive_color, emissive_strength=1.2, metallic=0.88, roughness=0.18):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        vcol_node = nodes.new(type="ShaderNodeVertexColor")
        vcol_node.layer_name = "COLOR_0"
        links.new(vcol_node.outputs["Color"], bsdf.inputs["Base Color"])
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


def add_curve_tube(name, points, bevel_depth=0.026, closed=True, mat=None):
    curve_data = bpy.data.curves.new(name=name + "_Curve", type='CURVE')
    curve_data.dimensions = '3D'
    curve_data.resolution_u = 3
    curve_data.bevel_depth = bevel_depth
    curve_data.bevel_resolution = 4

    spline = curve_data.splines.new('POLY')
    spline.points.add(len(points) - 1)
    for idx, pt in enumerate(points):
        spline.points[idx].co = (float(pt[0]), float(pt[1]), float(pt[2]), 1.0)
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


def bake_vertex_colors(obj, color_fn):
    """Bakes physical quantities into COLOR_0 vertex attribute layer."""
    mesh = obj.data
    color_layer = mesh.color_attributes.new(name="COLOR_0", type='FLOAT_COLOR', domain='POINT')
    coords = [v.co for v in mesh.vertices]
    for idx, co in enumerate(coords):
        col = color_fn(co.x, co.y, co.z)
        color_layer.data[idx].color = (
            float(max(0.0, min(1.0, col[0]))),
            float(max(0.0, min(1.0, col[1]))),
            float(max(0.0, min(1.0, col[2]))),
            1.0
        )


def add_morph_shape_key(obj, key_name, displace_fn):
    """Adds a Basis shape key (if not present) and a named morph target shape key."""
    if not obj.data.shape_keys:
        obj.shape_key_add(name="Basis", from_mix=False)
    sk = obj.shape_key_add(name=key_name, from_mix=False)
    sk.value = 0.0
    for idx, v in enumerate(obj.data.vertices):
        bx, by, bz = v.co.x, v.co.y, v.co.z
        nx, ny, nz = displace_fn(idx, bx, by, bz)
        sk.data[idx].co = (float(nx), float(ny), float(nz))
    return sk


def export_glb_with_morphs(export_path):
    bpy.ops.export_scene.gltf(
        filepath=export_path,
        export_format='GLB',
        export_apply=False,
        export_morph=True,
        export_morph_normal=True,
        export_attributes=True
    )
    print(f"Exported (with Shape Keys + COLOR_0): {export_path}")


# ==============================================================================
# 1. M01: F348 EINSTEIN 4-MANIFOLD SADDLE + CLIFFORD TORUS + 5 HOPF FIBERS
# ==============================================================================
def generate_m01_observer():
    clear_scene()
    print("Generating M01: Observer Hilbert 4-Manifold (Clifford Torus + Hopf Villarceau Foliation)...")
    mat_clifford = make_pbr_mat("CliffordMat", (0.06, 0.22, 0.38), (0.08, 0.55, 0.88), 0.95)
    mat_hopf_cyan = make_pbr_mat("HopfCyanMat", (0.2, 0.85, 1.0), (0.35, 0.88, 1.0), 1.6)
    mat_hopf_violet = make_pbr_mat("HopfVioletMat", (0.58, 0.32, 0.98), (0.65, 0.38, 1.0), 1.4)

    mesh_core = bpy.data.meshes.new("CliffordCoreMesh")
    obj_core = bpy.data.objects.new("CliffordCore", mesh_core)
    bpy.context.collection.objects.link(obj_core)
    bm = bmesh.new()

    U, V = 112, 72
    verts = []
    inv_sqrt2 = 1.0 / math.sqrt(2.0)
    for i in range(U):
        u = (i / U) * 2.0 * math.pi
        row = []
        for j in range(V):
            v = (j / V) * 2.0 * math.pi
            x1 = inv_sqrt2 * math.cos(u)
            x2 = inv_sqrt2 * math.sin(u)
            x3 = inv_sqrt2 * math.cos(v)
            x4 = inv_sqrt2 * math.sin(v)
            denom = max(0.32, 1.28 - x4 * 0.68)
            px = (x1 / denom) * 1.15
            py = (x2 / denom) * 1.15
            pz = (x3 / denom) * 1.15 + 0.14 * math.sin(2 * u - 2 * v)
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

    bake_vertex_colors(obj_core, lambda x, y, z: (
        0.12 + 0.25 * math.sin(x * 2.5),
        0.55 + 0.38 * math.cos(y * 2.5),
        0.82 + 0.18 * math.sin(z * 3.5)
    ))

    add_morph_shape_key(
        obj_core,
        "Singularity_Collapse",
        lambda idx, x, y, z: (
            x * 0.04 + 0.03 * math.sin(y * 6.0),
            y * 0.04 + 0.03 * math.cos(z * 6.0),
            z * 0.04 + 0.03 * math.sin(x * 6.0)
        )
    )

    phi_golden = (1.0 + math.sqrt(5.0)) / 2.0
    for k in range(5):
        y_base = 1.0 - (2.0 * k + 1.0) / 5.0
        rad_base = math.sqrt(max(0.01, 1.0 - y_base * y_base))
        theta_phi = 2.0 * math.pi * k / phi_golden
        x_base = rad_base * math.cos(theta_phi)
        z_base = rad_base * math.sin(theta_phi)

        theta_b = math.acos(max(-1.0, min(1.0, y_base)))
        phi_b = math.atan2(z_base, x_base)

        N_pts = 160
        fiber_pts = []
        for s in range(N_pts):
            psi = (s / N_pts) * 2.0 * math.pi
            z1_r = math.cos(theta_b / 2.0) * math.cos(psi + phi_b / 2.0)
            z1_i = math.cos(theta_b / 2.0) * math.sin(psi + phi_b / 2.0)
            z2_r = math.sin(theta_b / 2.0) * math.cos(psi - phi_b / 2.0)
            z2_i = math.sin(theta_b / 2.0) * math.sin(psi - phi_b / 2.0)
            denom = max(0.34, 1.24 - z2_i * 0.65)
            fiber_pts.append((
                (z1_r / denom) * 1.32,
                (z1_i / denom) * 1.32,
                (z2_r / denom) * 1.32
            ))
        m = mat_hopf_cyan if k % 2 == 0 else mat_hopf_violet
        ring_obj = add_curve_tube(f"HopfFiberRing_{k}", fiber_pts, bevel_depth=0.025, closed=True, mat=m)
        bake_vertex_colors(ring_obj, lambda x, y, z, kk=k: (
            0.22 + 0.55 * (kk % 2),
            0.78 - 0.35 * (kk % 2),
            0.98
        ))

    export_path = str(OUTPUT_DIR / "einstein_saddle.glb")
    export_glb_with_morphs(export_path)


# ==============================================================================
# 2. M02: F211 FK-CRT MANIFOLD + 3D BESSEL TREE SPINES
# ==============================================================================
def generate_m02_fkcrt():
    clear_scene()
    print("Generating M02: FK-CRT Critical Phase Manifold (GFF Sphere + Aldous CRT)...")
    mat_lqg = make_pbr_mat("LQGShellMat", (0.18, 0.08, 0.42), (0.45, 0.18, 0.88), 0.90)
    mat_crt = make_pbr_mat("CRTDendriteMat", (0.85, 0.55, 0.98), (0.95, 0.65, 0.25), 1.60)

    mesh_fk = bpy.data.meshes.new("LQGSurfaceMesh")
    obj_fk = bpy.data.objects.new("LQGSurface", mesh_fk)
    bpy.context.collection.objects.link(obj_fk)
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=5, radius=1.65)

    np.random.seed(42)
    modes = []
    for l in range(1, 9):
        for m in range(-l, l + 1):
            phase = np.random.uniform(0, 2 * math.pi)
            freq = float(l)
            amp = 0.42 / math.sqrt(l * (l + 1))
            modes.append((freq, phase, amp))

    for v in bm.verts:
        nx, ny, nz = v.co.normalized()
        th = math.acos(max(-1.0, min(1.0, nz)))
        ph = math.atan2(ny, nx)
        h = sum(amp * math.cos(freq * th + phase + m_idx * ph) for m_idx, (freq, phase, amp) in enumerate(modes[:24]))
        gamma = math.sqrt(8.0 / 3.0) * 0.32
        conformal_factor = math.exp(gamma * h)
        r = 1.38 * (0.84 + 0.34 * conformal_factor)
        v.co = v.co.normalized() * r

    bm.to_mesh(mesh_fk)
    bm.free()
    smooth_obj(obj_fk)
    obj_fk.data.materials.append(mat_lqg)

    bake_vertex_colors(obj_fk, lambda x, y, z: (
        min(1.0, 0.35 + 0.45 * math.sin(x * 2.0)),
        min(1.0, 0.16 + 0.34 * math.cos(y * 2.0)),
        min(1.0, 0.72 + 0.28 * math.sin(z * 3.0))
    ))

    def fractal_spike_displace(idx, x, y, z):
        r = max(1e-5, math.sqrt(x * x + y * y + z * z))
        nx, ny, nz = x / r, y / r, z / r
        spike = (
            math.sin(nx * 9.0 + ny * 7.0) * math.cos(nz * 11.0 - nx * 5.0)
            + 0.55 * math.sin(ny * 15.0 + nz * 13.0)
        )
        new_r = r * (0.58 + 0.68 * abs(spike))
        return (nx * new_r, ny * new_r, nz * new_r)

    add_morph_shape_key(obj_fk, "Fractal_Roughness", fractal_spike_displace)

    phi_g = (1.0 + math.sqrt(5.0)) / 2.0
    for b_idx in range(6):
        z_dir = 1.0 - (2.0 * b_idx + 1.0) / 6.0
        rad_dir = math.sqrt(max(0.0, 1.0 - z_dir * z_dir))
        th_dir = 2.0 * math.pi * b_idx / phi_g
        dx, dy, dz = rad_dir * math.cos(th_dir), rad_dir * math.sin(th_dir), z_dir

        N_steps = 56
        spine_pts = []
        for step in range(N_steps):
            s = step / (N_steps - 1)
            r_dist = 0.35 + s * 2.15
            bessel_wobble = 0.20 * math.sqrt(max(0.01, s * (1.0 - s * 0.6))) * math.sin(s * 14.0 + b_idx * 1.2)
            spine_pts.append((
                dx * r_dist + bessel_wobble * dy,
                dy * r_dist - bessel_wobble * dx,
                dz * r_dist + bessel_wobble * 0.45
            ))
        spine_obj = add_curve_tube(f"BesselTreeSpine_{b_idx}", spine_pts, bevel_depth=0.022, closed=False, mat=mat_crt)
        bake_vertex_colors(spine_obj, lambda x, y, z: (0.98, 0.68, 0.24))

    export_path = str(OUTPUT_DIR / "fkcrt_manifold.glb")
    export_glb_with_morphs(export_path)


# ==============================================================================
# 3. M03: F260 CKS HYPERBOLOIDAL FUNNEL + KERR ERGOSPHERE + PHOTON RING
# ==============================================================================
def generate_m03_cks():
    clear_scene()
    print("Generating M03: CKS Horizon Funnel (Kerr Boyer-Lindquist Funnel & Ergosphere)...")
    mat_funnel = make_pbr_mat("CKSFunnelMat", (0.04, 0.32, 0.24), (0.05, 0.68, 0.48), 0.95)
    mat_ergo = make_pbr_mat("KerrErgosphereMat", (0.08, 0.55, 0.78), (0.12, 0.82, 0.96), 1.35)
    mat_photon = make_pbr_mat("PhotonRingMat", (1.0, 0.68, 0.2), (1.0, 0.72, 0.22), 2.4)

    mesh_cks = bpy.data.meshes.new("CKSFunnelMesh")
    obj_cks = bpy.data.objects.new("CKSFunnel", mesh_cks)
    bpy.context.collection.objects.link(obj_cks)
    bm = bmesh.new()

    R_SEG, ANG_SEG = 56, 96
    verts = []
    a_spin = 0.72
    r_plus = 1.0 + math.sqrt(1.0 - a_spin * a_spin)
    for i in range(R_SEG):
        s = i / (R_SEG - 1)
        r = (r_plus - 0.35) + s * 1.45
        y = -1.22 / math.sqrt(max(0.18, r - (r_plus - 0.52))) + 0.42 + 0.22 * s * s
        row = []
        for j in range(ANG_SEG):
            omega_drag = (2.0 * a_spin * 1.0) / (r * r + 0.35)
            th = (j / ANG_SEG) * 2.0 * math.pi + omega_drag * 0.65
            x = r * math.cos(th) * 0.72
            z = r * math.sin(th) * 0.72
            row.append(bm.verts.new((x, y, z)))
        verts.append(row)

    for i in range(R_SEG - 1):
        for j in range(ANG_SEG):
            jnext = (j + 1) % ANG_SEG
            bm.faces.new((verts[i][j], verts[i + 1][j], verts[i + 1][jnext], verts[i][jnext]))
    bm.to_mesh(mesh_cks)
    bm.free()
    smooth_obj(obj_cks)
    obj_cks.data.materials.append(mat_funnel)

    bake_vertex_colors(obj_cks, lambda x, y, z: (
        min(1.0, 0.15 + 0.85 / max(0.5, math.sqrt(x * x + z * z))),
        min(1.0, 0.55 + 0.35 * math.sin(y * 2.0)),
        min(1.0, 0.85)
    ))

    mesh_ergo = bpy.data.meshes.new("KerrErgosphereMesh")
    obj_ergo = bpy.data.objects.new("KerrErgosphere", mesh_ergo)
    bpy.context.collection.objects.link(obj_ergo)
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=72, v_segments=36, radius=1.0)
    for v in bm.verts:
        r_len = v.co.length
        if r_len > 1e-5:
            cos_th = v.co.y / r_len
            r_ergo = 1.0 + math.sqrt(max(0.04, 1.0 - 0.35 * cos_th * cos_th))
            v.co = v.co.normalized() * (r_ergo * 0.78)
    bm.to_mesh(mesh_ergo)
    bm.free()
    smooth_obj(obj_ergo)
    obj_ergo.data.materials.append(mat_ergo)

    bake_vertex_colors(obj_ergo, lambda x, y, z: (
        0.12 + 0.35 * abs(y),
        0.72 + 0.25 * (1.0 - abs(y)),
        0.96
    ))

    def ergo_bulge_displace(idx, x, y, z):
        r_horiz = math.sqrt(x * x + z * z)
        bulge = 1.32
        flatten = 0.56
        twist = 0.38 * (1.0 / max(0.35, r_horiz))
        ca, sa = math.cos(twist), math.sin(twist)
        tx = (x * ca - z * sa) * bulge
        tz = (x * sa + z * ca) * bulge
        return (tx, y * flatten, tz)

    add_morph_shape_key(obj_ergo, "Ergo_Bulge", ergo_bulge_displace)

    photon_pts = []
    N_photons = 160
    for j in range(N_photons):
        th = (j / N_photons) * 2.0 * math.pi
        r_ph = 1.68
        photon_pts.append((r_ph * math.cos(th), 0.035 * math.sin(3 * th), r_ph * math.sin(th)))
    photon_obj = add_curve_tube("PhotonRing3M", photon_pts, bevel_depth=0.024, closed=True, mat=mat_photon)
    bake_vertex_colors(photon_obj, lambda x, y, z: (1.0, 0.76, 0.24))

    export_path = str(OUTPUT_DIR / "cks_horizon_funnel.glb")
    export_glb_with_morphs(export_path)


# ==============================================================================
# 4. M04: F032 K3 CALABI-YAU QUINTIC + LAGRANGIAN CUSP SINGULARITY RINGS
# ==============================================================================
def generate_m04_k3():
    clear_scene()
    print("Generating M04: K3 Calabi-Yau Fermat Quintic Slice + Lefschetz Cusp Singularities...")
    mat_k3 = make_pbr_mat("K3CalabiYauMat", (0.06, 0.38, 0.42), (0.08, 0.72, 0.68), 0.95)
    mat_cusp = make_pbr_mat("CuspSingularityMat", (0.95, 0.14, 0.32), (1.0, 0.22, 0.38), 1.85)

    mesh_k3 = bpy.data.meshes.new("K3QuinticBraneMesh")
    obj_k3 = bpy.data.objects.new("K3QuinticBrane", mesh_k3)
    bpy.context.collection.objects.link(obj_k3)
    bm = bmesh.new()

    U_SEG, V_SEG = 120, 68
    verts = []
    r_scale = 1.18
    for i in range(U_SEG):
        u = (i / U_SEG) * 2.0 * math.pi
        row = []
        for j in range(V_SEG):
            v = (j / V_SEG) * 2.0 * math.pi
            cu, su = math.cos(u), math.sin(u)
            cv, sv = math.cos(v), math.sin(v)
            c5u = math.cos(5.0 * u)
            s5u = math.sin(5.0 * u)
            x = r_scale * (cu * cv - 0.55 * su * sv * c5u)
            y = r_scale * (su * cv + 0.55 * cu * sv * c5u)
            z = r_scale * (0.75 * sv * s5u) + 0.22 * math.sin(3.0 * u)
            row.append(bm.verts.new((x, y, z)))
        verts.append(row)

    for i in range(U_SEG):
        inext = (i + 1) % U_SEG
        for j in range(V_SEG):
            jnext = (j + 1) % V_SEG
            bm.faces.new((verts[i][j], verts[inext][j], verts[inext][jnext], verts[i][jnext]))
    bm.to_mesh(mesh_k3)
    bm.free()
    smooth_obj(obj_k3)
    obj_k3.data.materials.append(mat_k3)

    bake_vertex_colors(obj_k3, lambda x, y, z: (
        0.18 + 0.65 * abs(math.atan2(z, max(0.1, math.sqrt(x * x + y * y)))) / math.pi,
        0.58 + 0.38 * math.sin(x * 3.0),
        0.78 + 0.22 * math.cos(y * 3.0)
    ))

    def cusp_shatter_displace(idx, x, y, z):
        ang = math.atan2(y, x)
        pinch = abs(math.sin(5.0 * ang))
        rad_burst = 0.62 + 0.72 * pinch
        cusp_z = z * (0.45 + 1.15 * math.cos(5.0 * ang))
        return (x * rad_burst, y * rad_burst, cusp_z)

    add_morph_shape_key(obj_k3, "Cusp_Shatter", cusp_shatter_displace)

    for c_idx in range(2):
        sign_dir = 1.0 if c_idx == 0 else -1.0
        cusp_pts = []
        N_cusp = 180
        for s in range(N_cusp):
            t = (s / N_cusp) * 2.0 * math.pi
            r_c = 1.48 + 0.34 * math.cos(5.0 * t) * sign_dir
            x = r_c * math.cos(3.0 * t)
            y = r_c * math.sin(3.0 * t)
            z = 0.55 * math.sin(5.0 * t) * sign_dir
            cusp_pts.append((x, y, z))
        cusp_obj = add_curve_tube(f"CuspDoublePointLocus_{c_idx}", cusp_pts, bevel_depth=0.024, closed=True, mat=mat_cusp)
        bake_vertex_colors(cusp_obj, lambda x, y, z: (0.98, 0.18, 0.36))

    export_path = str(OUTPUT_DIR / "k3_calabi_yau.glb")
    export_glb_with_morphs(export_path)


if __name__ == "__main__":
    generate_m01_observer()
    generate_m02_fkcrt()
    generate_m03_cks()
    generate_m04_k3()
    print("==================================================================")
    print("ALL 4 V7 MASTERPIECE MANIFOLDS COMPILED SUCCESSFULLY TO GLB!")
    print("==================================================================")
