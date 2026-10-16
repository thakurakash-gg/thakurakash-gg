"""Offline planting constraints derived from the surfaces the viewer actually renders."""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
try:
    import shapely
except ImportError:
    sys.path.insert(0, str(ROOT.parents[2] / "work/map-tools"))
    import shapely
import numpy as np
from shapely.geometry import Polygon


def read_data():
    return json.loads(
        (ROOT / "assets/ray/data/neighborhood.js")
        .read_text(encoding="utf8")
        .split("=", 1)[1]
        .strip()
        .rstrip(";")
    )


def polygon(rings):
    return Polygon([p[:2] for p in rings[0]], [[p[:2] for p in ring] for ring in rings[1:]]).buffer(
        0
    )


def mesh_footprint(mesh):
    vertices = np.asarray(mesh["vertices"]).reshape(-1, 3)[:, :2]
    triangles = vertices[np.asarray(mesh["indices"]).reshape(-1, 3)]
    return shapely.union_all(shapely.polygons(triangles))


def green_ground(data):
    ground = shapely.union_all(
        [polygon(r) for r in data["groundSurfaces"] + data.get("gardenBeds", [])]
    )
    obstacles = [
        polygon(r) for key in ["buildingAprons", "projectGroundOutline"] for r in data.get(key, [])
    ]
    # Allow natural canopy overhang while keeping trunks well outside carriageways.
    obstacles += [polygon(r).buffer(2.5) for r in data["roadSurfaces"]]
    obstacles += [polygon(r).buffer(0.65) for r in data["pavingSurfaces"]]
    obstacles += [mesh_footprint(data["roadMesh"]).buffer(2.5)]
    obstacles += [mesh_footprint(data["pavingMesh"]).buffer(0.65)]
    obstacles += [Polygon(b["p"]).buffer(0) for b in data["buildings"]]
    obstacles += [polygon(r) for r in data["neighborPool"]["deck"]]
    for building in data["buildings"]:
        villa = building.get("v", {})
        obstacles += [polygon(r) for r in villa.get("drive", [])]
        if villa.get("pool"):
            obstacles.append(polygon(villa["pool"]["water"]))
    return ground.difference(shapely.union_all(obstacles)).buffer(0)


class PlantingSpace:
    def __init__(self, green):
        self.green = green
        self.cache = {}
        axis = np.arange(-1100, 1101, 4, dtype=float)
        x, z = np.meshgrid(axis, axis)
        self.grid = np.column_stack([x.ravel(), z.ravel()])
        self.grid = self.grid[np.hypot(self.grid[:, 0], self.grid[:, 1]) < 1099]

    def allowed(self, tree):
        # A one-metre ground footprint includes the trunk and planting clearance.
        radius = 1.0
        if radius not in self.cache:
            area = self.green.buffer(-radius)
            shapely.prepare(area)
            valid = shapely.contains_xy(area, self.grid[:, 0], self.grid[:, 1])
            self.cache[radius] = area, self.grid[valid]
        return self.cache[radius]
