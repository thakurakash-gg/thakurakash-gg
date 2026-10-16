"""Move all conflicting context trees onto green ground, preserving count and species."""

import json
import math
from planting_geometry import ROOT, PlantingSpace, canopy_radius, green_ground, read_data
import shapely

data = read_data()
extra_path = ROOT / "assets/ray/data/extra-trees.js"
extra = json.loads(extra_path.read_text(encoding="utf8").split("window.RayExtraTrees=", 1)[1].strip().rstrip(";"))
trees = data["trees"] + extra
green = green_ground(data)
space = PlantingSpace(green)
occupied = {}


def cell(x, z):
    return math.floor(x / 4), math.floor(z / 4)


def reserve(tree):
    occupied.setdefault(cell(*tree[:2]), []).append(tree[:2])


def crowded(x, z):
    a, b = cell(x, z)
    return any(
        (x - px) ** 2 + (z - pz) ** 2 < 4 ** 2
        for i in range(a - 1, a + 2)
        for j in range(b - 1, b + 2)
        for px, pz in occupied.get((i, j), [])
    )


invalid = []
for index, tree in enumerate(trees):
    allowed, _ = space.allowed(tree)
    if shapely.contains_xy(allowed, *tree[:2]):
        reserve(tree)
    else:
        invalid.append(index)

changes = []
for index in invalid:
    tree = trees[index]
    _, candidates = space.allowed(tree)
    distance = (candidates[:, 0] - tree[0]) ** 2 + (candidates[:, 1] - tree[1]) ** 2
    # Visit the nearest candidates first; reserve valid existing trees before relocating others.
    for candidate in candidates[distance.argsort()]:
        x, z = map(float, candidate)
        if not crowded(x, z):
            changes.append({"index": index, "from": tree[:2], "to": [x, z], "distance": round(math.hypot(x-tree[0], z-tree[1]), 2)})
            tree[:2] = [x, z]
            reserve(tree)
            break
    else:
        raise RuntimeError(f"No green-ground location for tree {index}")

assert len(trees) == 5693
assert all(shapely.contains_xy(space.allowed(tree)[0], *tree[:2]) for tree in trees)
data["trees"] = trees[:len(data["trees"])]
data["treePlacement"] = {
    "version": "rendered-surfaces-v1",
    "count": len(trees),
    "relocated": len(changes),
    "roadAndPavingMeshChecked": True,
    "trunkRoadClearance_m": 3.5,
    "trunkPavingClearance_m": 1.65,
    "greenGroundRadius_m": 1.0,
    "maximumMove_m": max(c["distance"] for c in changes),
}
(ROOT / "assets/ray/data/neighborhood.js").write_text("window.RayMapData=" + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf8")
extra_path.write_text("/* Baked green-ground trees; shared foliage batches. */\nwindow.RayExtraTrees=" + json.dumps(trees[len(data["trees"]):], separators=(",", ":")) + ";\n", encoding="utf8")
report = ROOT / "docs/ray/tree-placement-report.json"
report.write_text(json.dumps({**data["treePlacement"], "moves": changes}, indent=2) + "\n", encoding="utf8")
print(json.dumps(data["treePlacement"]), flush=True)
