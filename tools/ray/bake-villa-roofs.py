"""Bake planar hip/valley faces rather than a square height grid.

Authoring dependencies: Shapely 2.1+, py_straight_skeleton 0.1.0 (BSD-3-Clause).
Algorithm and face API: https://github.com/iconbuild/py_straight_skeleton
These dependencies are not shipped to the browser.
"""

import json
import math
import sys
from pathlib import Path
from planting_geometry import ROOT, read_data
import shapely
from shapely.geometry import Polygon
from shapely.affinity import affine_transform

sys.path.insert(0, str(ROOT.parents[2] / "work/ray-roof-tools"))
from py_straight_skeleton import compute_skeleton


def straighten_survey_corners(polygon, tolerance=0.15):
    """Align nearly shared local axes in noisy survey outlines (at most 15 cm)."""
    points = list(polygon.exterior.coords)[:-1]
    axes = []
    for axis in range(2):
        groups = []
        for value in sorted(p[axis] for p in points):
            if not groups or value - groups[-1][0] > tolerance:
                groups.append([value])
            else:
                groups[-1].append(value)
        axes.append({value: sum(group) / len(group) for group in groups for value in group})
    cleaned = Polygon([(axes[0][x], axes[1][z]) for x, z in points])
    assert cleaned.is_valid and polygon.hausdorff_distance(cleaned) < tolerance
    return cleaned


def solve_roof(roof, seed):
    skeleton = compute_skeleton(
        list(roof.exterior.coords)[:-1], [list(h.coords)[:-1] for h in roof.interiors]
    )
    nodes = skeleton.nodes
    pitch = min(0.24 + 0.015 * (seed % 4), 2.8 / max(node.time for node in nodes))
    vertices, indices, planes, projected = [], [], [], []
    lookup = {}
    edges = list(zip(list(roof.exterior.coords), list(roof.exterior.coords)[1:]))
    for face, (a, b) in zip(skeleton.get_faces(), edges, strict=True):
        points = [(nodes[i].position.x, nodes[i].position.y) for i in face]
        polygon = Polygon(points).buffer(0)
        if polygon.is_empty or polygon.area < 1e-7:
            continue
        length = math.dist(a, b)
        nx, nz = -(b[1] - a[1]) / length, (b[0] - a[0]) / length
        normal_length = math.sqrt(1 + pitch * pitch)
        normal = [-nx * pitch / normal_length, 1 / normal_length, -nz * pitch / normal_length]
        triangles = list(shapely.constrained_delaunay_triangles(polygon).geoms)
        face_start = len(indices)
        for triangle in triangles:
            ids = []
            for x, z in list(triangle.exterior.coords)[:3]:
                nearest = min(
                    nodes, key=lambda node: (node.position.x - x) ** 2 + (node.position.y - z) ** 2
                )
                assert math.hypot(nearest.position.x - x, nearest.position.y - z) < 1e-5
                height = 0.06 + pitch * nearest.time
                key = (round(x * 1000), round(z * 1000), round(height * 1000))
                if key not in lookup:
                    lookup[key] = len(vertices) // 3
                    vertices.extend(key)
                ids.append(lookup[key])
            if len(set(ids)) < 3:
                continue
            ta, tb, tc = [vertices[j * 3 : j * 3 + 3] for j in ids]
            ny = (tb[1] - ta[1]) * (tc[0] - ta[0]) - (tb[0] - ta[0]) * (tc[1] - ta[1])
            if not ny:
                continue
            indices.extend(ids if ny > 0 else ids[::-1])
            projected.append(triangle)
        if len(indices) == face_start:
            continue
        origin = vertices[indices[face_start] * 3 : indices[face_start] * 3 + 3]
        for idx in indices[face_start:]:
            p = vertices[idx * 3 : idx * 3 + 3]
            error = (
                abs(
                    (p[0] - origin[0]) * normal[0]
                    + (p[2] - origin[2]) * normal[1]
                    + (p[1] - origin[1]) * normal[2]
                )
                / 1000
            )
            assert error < 0.0025, "Survey corners prevent a planar roof slope"
        planes.append([len(indices), *[round(q, 7) for q in normal]])
    coverage = shapely.union_all(projected)
    assert coverage.symmetric_difference(roof).area < 0.005, "Incomplete roof coverage"
    assert indices and all(
        vertices[i] >= -1 for i in range(2, len(vertices), 3)
    ), "Invalid roof heights"
    return dict(roof=vertices, tri=indices, roofScale=1000, roofHeightScale=1000, roofPlanes=planes)


data = read_data()
errors = []
count = before = after = straightened = 0
for index, building in enumerate(data["buildings"]):
    villa = building.get("v")
    if not villa or villa["style"] == 4:
        continue
    before += len(villa["tri"]) // 3
    cx, cz = building["c"]
    angle = building["r"][2]
    c, s = math.cos(angle), math.sin(angle)
    source = Polygon(building["p"]).buffer(0)
    local = affine_transform(source, [c, -s, s, c, -cx * c + cz * s, -cx * s - cz * c])
    try:
        roof = shapely.orient_polygons(
            local.buffer(0.4, join_style=2).simplify(0.12), exterior_cw=False
        )
        try:
            result = solve_roof(roof, building["s"])
        except AssertionError:
            # Some near-orthogonal centimetre-scale survey errors confuse the
            # straight-skeleton event solver. Repair the outline, never split ridges.
            clean = straighten_survey_corners(local)
            roof = shapely.orient_polygons(
                clean.buffer(0.4, join_style=2).simplify(0.12), exterior_cw=False
            )
            result = solve_roof(roof, building["s"])
            straightened += 1
        villa.update(result)
        count += 1
        after += len(result["tri"]) // 3
    except Exception as error:
        errors.append({"building": index, "error": str(error)[:250]})
    if count and count % 250 == 0:
        print(f"Baked {count} sharp roofs", flush=True)

if errors:
    print(json.dumps({"errors": errors, "successful": count}), flush=True)
    raise SystemExit("Roof bake not saved: resolve unsupported contours first.")

data["villaSummary"]["roofTriangles"] = sum(
    len(b["v"]["tri"]) // 3 for b in data["buildings"] if b.get("v")
)
data["villaSummary"]["roofTopology"] = "planar-straight-skeleton-v1"
(ROOT / "assets/ray/data/neighborhood.js").write_text(
    "window.RayMapData=" + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf8"
)
print(
    json.dumps(
        {
            "roofs": count,
            "beforeTriangles": before,
            "afterTriangles": after,
            "surveyOutlinesStraightened": straightened,
            "flatRoofsPreserved": data["villaSummary"]["count"] - count,
        }
    ),
    flush=True,
)
