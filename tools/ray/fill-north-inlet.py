"""Extend only the marked north-inlet bank; rebake its wave-distance field."""
import json, math, sys
from pathlib import Path
root = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(root.parents[2] / "work/map-tools"))
import numpy as np
import shapely
from shapely.geometry import Polygon, Point, box
from shapely.ops import unary_union
from PIL import Image
source = root / "assets/ray/data/neighborhood.js"
data = json.loads(source.read_text(encoding="utf8").split("=",1)[1].strip().rstrip(";"))
if data.get("northInletFill"):
    print("North inlet is already filled.")
    raise SystemExit(0)

def region(polygons):
    return unary_union([shapely.make_valid(Polygon(r[0],r[1:])) for r in polygons])
before = region(data["land"])
old_ground = region(data["groundSurfaces"])
# Join the tower-side bank to the existing coast before the roadside point.
segments = [
    [[104.586,25.814],[116,26],[126,27],[137,23]],
    [[137,23],[149,18],[153,12],[163,12]],
    [[163,12],[174,12],[180,8],[184,13.5656]],
]
curve = []
for segment in segments:
    for i in range(13):
        if curve and i == 0: continue
        t=i/12
        curve.append([round(sum(segment[j][k]*[ (1-t)**3,3*(1-t)**2*t,3*(1-t)*t*t,t**3 ][j] for j in range(4)),6) for k in (0,1)])
curve.append([189.7,21.5])
changes=[]
for key in ["land","groundSurfaces"]:
    for polygon_index,rings in enumerate(data[key]):
        for ring_index,ring in enumerate(rings):
            starts=[i for i,p in enumerate(ring) if math.dist(p[:2],[103.83,7.49])<.02]
            ends=[i for i,p in enumerate(ring) if math.dist(p[:2],[189.7,21.5])<.02]
            if not starts or not ends: continue
            start,end=starts[0],ends[0]
            assert start<end, "Unexpected coastal ring direction"
            replacement=curve[1:] if math.dist(ring[start-1][:2],curve[0])<.02 else curve
            rings[ring_index]=ring[:start]+replacement+ring[end+1:]
            changes.append({"surface":key,"polygon":polygon_index,"ring":ring_index,"addedVertices":len(replacement)-(end-start+1)})
assert len(changes)==2, changes
assert all(Polygon(r[0],r[1:]).is_valid for r in data["groundSurfaces"])
after=region(data["land"])
new_ground=region(data["groundSurfaces"])
added=after.difference(before)
assert after.is_valid and added.area>500
assert before.difference(after).area<.01, "Existing land must not be removed"
assert added.difference(box(103,-2,191,28)).area<.01, "Fill must stay inside the marked bank"
assert added.difference(new_ground).area<.01, "Every new bank needs a ground cap"
assert new_ground.difference(old_ground).symmetric_difference(added).area<.1
for x,z in [(114,18),(140,13),(163,8),(178,8)]:
    assert after.covers(Point(x,z)) and new_ground.covers(Point(x,z)), (x,z)
for x,z in [(108,40),(130,44),(165,50),(200,65)]:
    assert not after.covers(Point(x,z)), "The inlet and marina must remain open"
data["northInletFill"]={"version":"north-inlet-land-v1","area_m2":round(added.area,3),"bounds":list(added.bounds),"curves":segments,"changes":changes}
source.write_text("window.RayMapData="+json.dumps(data,separators=(",",":"))+";\n",encoding="utf8")
# Same signed-distance convention and world extent as the existing ocean.
size=768;extent=1900
axis=np.linspace(-extent,extent,size);gx,gz=np.meshgrid(axis,axis)
distance=shapely.distance(shapely.points(gx.ravel(),gz.ravel()),after.boundary).reshape(size,size)
inside=shapely.contains_xy(after,gx,gz)
signed=np.where(inside,-distance,distance)
dz,dx=np.gradient(signed,2*extent/(size-1));length=np.hypot(dx,dz)+1e-6
rgb=np.empty((size,size,3),np.uint8)
rgb[:,:,0]=np.clip(distance/200*255,0,255)
rgb[:,:,1]=np.clip((dx/length*.5+.5)*255,0,255)
rgb[:,:,2]=np.clip((dz/length*.5+.5)*255,0,255)
Image.fromarray(rgb).save(root/"assets/ray/textures/shore-distance.png")
print(json.dumps(data["northInletFill"]))
