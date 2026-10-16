"""Round only the inlet peninsula corners; keep the original mapped outline nearby.
Requires numpy, Shapely and Pillow for the shoreline-distance bake.
"""

import json, math, sys
from pathlib import Path

root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root.parents[2] / "work/map-tools"))
import numpy as np
import shapely
from shapely.geometry import Polygon, Point
from shapely.ops import unary_union
from PIL import Image

p = root / "assets/ray/data/neighborhood.js"
data = json.loads(p.read_text(encoding="utf8").split("=", 1)[1].strip().rstrip(";"))
if data.get("shorelineSmoothing"):
    print("Inlet corners are already rounded.")
    sys.exit(0)


def land(polygons):
    return unary_union([Polygon(r[0], r[1:]).buffer(0) for r in polygons])


before = land(data["land"])
count = 0


def rounded(ring):
    global count
    points = ring[:-1] if ring[0] == ring[-1] else ring
    output = []
    for i, point in enumerate(points):
        x, z = point
        if not (85 < x < 162 and 33 < z < 76):
            output.append(point)
            continue
        previous = points[i - 1]
        following = points[(i + 1) % len(points)]
        a = math.dist(previous, point)
        b = math.dist(following, point)
        cutoff = min(5.0, a * 0.32, b * 0.32)
        if cutoff < 0.35:
            output.append(point)
            continue
        start = [point[k] + (previous[k] - point[k]) * cutoff / a for k in (0, 1)]
        end = [point[k] + (following[k] - point[k]) * cutoff / b for k in (0, 1)]
        for t in np.linspace(0, 1, 9):
            output.append(
                [
                    round((1 - t) ** 2 * start[k] + 2 * (1 - t) * t * point[k] + t * t * end[k], 4)
                    for k in (0, 1)
                ]
            )
        count += 1
    return output + [output[0]]


for key in ["land", "groundSurfaces"]:
    data[key] = [[rounded(ring) for ring in polygon] for polygon in data[key]]
after = land(data["land"])
assert after.is_valid
assert after.boundary.hausdorff_distance(before.boundary) < 3
assert after.symmetric_difference(before).area < 100
assert all(not after.covers(Point(x, z)) for x, z in [(108, 40), (108, 52), (110, 34)])
data["shorelineSmoothing"] = {
    "area": "inlet peninsula",
    "cornerCutback_m": 5,
    "maximumDisplacement_m": round(after.boundary.hausdorff_distance(before.boundary), 3),
    "curves": count,
    "areaChange_m2": round(after.symmetric_difference(before).area, 3),
}
p.write_text(
    "window.RayMapData=" + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf8"
)
# Keep the wave-distance field aligned to the revised coastline.
size = 768
extent = 1900
axis = np.linspace(-extent, extent, size)
gx, gz = np.meshgrid(axis, axis)
distance = shapely.distance(shapely.points(gx.ravel(), gz.ravel()), after.boundary).reshape(
    size, size
)
inside = shapely.contains_xy(after, gx, gz)
signed = np.where(inside, -distance, distance)
dz, dx = np.gradient(signed, 2 * extent / (size - 1))
length = np.hypot(dx, dz) + 1e-6
rgb = np.empty((size, size, 3), np.uint8)
rgb[:, :, 0] = np.clip(distance / 200 * 255, 0, 255)
rgb[:, :, 1] = np.clip((dx / length * 0.5 + 0.5) * 255, 0, 255)
rgb[:, :, 2] = np.clip((dz / length * 0.5 + 0.5) * 255, 0, 255)
Image.fromarray(rgb).save(root / "assets/ray/textures/shore-distance.png")
print(json.dumps(data["shorelineSmoothing"]))
