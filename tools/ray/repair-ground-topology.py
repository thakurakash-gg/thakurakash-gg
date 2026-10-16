"""Remove self-intersecting top contours that make Earcut bridge across the shoreline."""

import json
from planting_geometry import ROOT, read_data
import shapely
from shapely.geometry import Polygon

data = read_data()
repairs = []
for key in ["groundSurfaces", "projectGround"]:
    clean = []
    for index, rings in enumerate(data[key]):
        source = Polygon(rings[0], rings[1:])
        valid = shapely.make_valid(source)
        parts = [valid] if valid.geom_type == "Polygon" else list(getattr(valid, "geoms", []))
        for part in parts:
            if part.geom_type != "Polygon" or part.area < 0.005:
                continue
            part = shapely.orient_polygons(part, exterior_cw=True)
            # Keep full precision at near-coincident clip vertices to avoid recreating crossings.
            clean.append(
                [list(map(list, part.exterior.coords))]
                + [list(map(list, r.coords)) for r in part.interiors]
            )
        if not source.is_valid:
            repairs.append(
                {"surface": key, "index": index, "reason": shapely.is_valid_reason(source)}
            )
    data[key] = clean
assert all(
    Polygon(r[0], r[1:]).is_valid for key in ["groundSurfaces", "projectGround"] for r in data[key]
)
data["groundTopology"] = {"version": "valid-coastal-contours-v1", "repaired": repairs}
(ROOT / "assets/ray/data/neighborhood.js").write_text(
    "window.RayMapData=" + json.dumps(data, separators=(",", ":")) + ";\n", encoding="utf8"
)
print(json.dumps(data["groundTopology"]))
