"""Bake additional trees in verified open land; requires Shapely. No runtime placement work."""

import json, math, random, sys
from pathlib import Path

root = Path(__file__).resolve().parents[2]
try:
    import shapely
except ImportError:
    sys.path.insert(0, str(root.parents[2] / "work/map-tools"))
from shapely.geometry import Polygon, Point
from shapely.ops import unary_union
from shapely.prepared import prep
from planting_geometry import green_ground

data = json.loads(
    (root / "assets/ray/data/neighborhood.js").read_text(encoding="utf8").split("=", 1)[1].strip().rstrip(";")
)


def shape(rings):
    return Polygon([p[:2] for p in rings[0]], [[p[:2] for p in r] for r in rings[1:]]).buffer(0)


# Include graded meshes and leave room for trunks inside green ground.
allowed = prep(green_ground(data).buffer(-1))
rng = random.Random(26120)
grid = {}


def cell(x, z):
    return math.floor(x / 8), math.floor(z / 8)


def insert(x, z):
    grid.setdefault(cell(x, z), []).append((x, z))


for x, z, *_ in data["trees"]:
    insert(x, z)
extra = []
for _ in range(200000):
    x, z = round(rng.uniform(-1075, 1075), 2), round(rng.uniform(-1075, 1075), 2)
    if math.hypot(x, z) > 1070 or not allowed.contains(Point(x, z)):
        continue
    a, b = cell(x, z)
    if any(
        (x - px) ** 2 + (z - pz) ** 2 < 8**2
        for i in range(a - 1, a + 2)
        for j in range(b - 1, b + 2)
        for px, pz in grid.get((i, j), [])
    ):
        continue
    extra.append(
        [round(x, 2), round(z, 2), round(rng.uniform(6.7, 10.3), 2), int(rng.random() < 0.06)]
    )
    insert(x, z)
    if len(extra) == 1400:
        break
assert len(extra) == 1400, len(extra)
assert all(allowed.contains(Point(x, z)) for x, z, *_ in extra)
(root / "assets/ray/data/extra-trees.js").write_text(
    "/* Baked open-land trees; shared existing foliage batches. */\nwindow.RayExtraTrees="
    + json.dumps(extra, separators=(",", ":"))
    + ";\n"
)
print(
    f"Validated {len(extra)} additional trees, avoiding buildings, roads, sidewalks, pools and the project plot."
)
