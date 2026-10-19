"""Render matching water-side afternoon/night views from the private RAY blend.

Usage: blender -b scene.blend -P render-ray-thumbnail.py -- --output DIR [--draft]
The source .blend is never overwritten. Both exposures use the same camera.
"""

import argparse
import json
import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector

parser = argparse.ArgumentParser()
parser.add_argument("--output", type=Path, required=True)
parser.add_argument("--draft", action="store_true")
args = parser.parse_args(sys.argv[sys.argv.index("--") + 1 :])
args.output.mkdir(parents=True, exist_ok=True)
scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 32 if args.draft else 256
scene.cycles.use_denoising = True
scene.cycles.use_adaptive_sampling = True
scene.cycles.adaptive_threshold = 0.035 if args.draft else 0.012
scene.cycles.max_bounces = 8
scene.cycles.transmission_bounces = 6
scene.cycles.glossy_bounces = 4
scene.render.resolution_x = 800 if args.draft else 2048
scene.render.resolution_y = 450 if args.draft else 1152
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGB"
scene.render.film_transparent = False
scene.use_nodes = False
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Medium High Contrast"
scene.view_settings.exposure = 0
scene.view_settings.gamma = 1

prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.get_devices()
for device in prefs.devices:
    device.use = device.type == "OPTIX"
scene.cycles.device = "GPU"

camera = scene.camera
camera.animation_data_clear()
camera.location = (145, -390, 152)
target = Vector((0, 12, 26))
camera.rotation_euler = (target - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.lens = 46
camera.data.dof.use_dof = False

# Dielectric water retains broad sky reflections without a metallic white streak.
for material in bpy.data.materials:
    if "Native ocean" in material.name:
        shader = next(n for n in material.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
        shader.inputs["Metallic"].default_value = 0
        shader.inputs["Coat Weight"].default_value = 0
        shader.inputs["Roughness"].default_value = 0.19

for label, frame in [("afternoon", 80), ("night", 240)]:
    scene.frame_set(frame)
    sun = next(o for o in bpy.data.objects if o.type == "LIGHT" and o.data.type == "SUN")
    background = next(n for n in scene.world.node_tree.nodes if n.type == "BACKGROUND")
    if label == "afternoon":
        scene.view_settings.exposure = -0.3
        background.inputs["Strength"].default_value = 0.16
        sun.data.energy = 3.0
        sun.data.angle = math.radians(1.2)
        sun.rotation_euler = Vector((120, 200, -250)).to_track_quat("-Z", "Y").to_euler()
    else:
        scene.view_settings.exposure = 0.6
        for link in list(background.inputs["Color"].links):
            scene.world.node_tree.links.remove(link)
        background.inputs["Color"].default_value = (0.055, 0.09, 0.18, 1)
        background.inputs["Strength"].default_value = 0.3
        sun.data.energy = 0.22
        sun.data.color = (0.52, 0.67, 1)
        # Broad, restrained facade lights illuminate the podium and landscaping.
        for x in [-65, -22, 22, 65]:
            data = bpy.data.lights.new(f"Thumbnail waterfront uplight {x}", "AREA")
            data.energy = 1100
            data.color = (1, 0.76, 0.5)
            data.shape = "DISK"
            data.size = 10
            light = bpy.data.objects.new(data.name, data)
            scene.collection.objects.link(light)
            light.location = (x, -88, 9)
            light.rotation_euler = (Vector((x, -24, 32)) - light.location).to_track_quat("-Z", "Y").to_euler()
    scene.render.filepath = str(args.output / f"ray-waterfront-{label}.png")
    print("RAY_THUMBNAIL_RENDER", label, flush=True)
    bpy.ops.render.render(write_still=True)

(args.output / "render-settings.json").write_text(
    json.dumps({"source": bpy.data.filepath, "camera": list(camera.location),
                "target": list(target), "lens_mm": camera.data.lens,
                "frames": {"afternoon": 80, "night": 240},
                "samples": scene.cycles.samples,
                "resolution": [scene.render.resolution_x, scene.render.resolution_y]}, indent=2)
)

# Composite the two genuine renders through an orthographic, unlit Blender scene.
# Shared UVs preserve alignment at the diagonal; no building pixels are invented.
composite = bpy.data.scenes.new("RAY afternoon-night diagonal thumbnail")
composite.render.engine = "CYCLES"
composite.cycles.samples = 1
composite.cycles.use_denoising = False
composite.render.resolution_x = scene.render.resolution_x
composite.render.resolution_y = scene.render.resolution_y
composite.render.resolution_percentage = 100
composite.render.image_settings.file_format = "PNG"
composite.render.image_settings.color_mode = "RGB"
composite.view_settings.view_transform = "Standard"
composite.view_settings.look = "None"
height = 9 / 8
bottom, top = -height / 2, height / 2
for label, polygon in [
    ("afternoon", [(-1, bottom), (-0.16, bottom), (0.16, top), (-1, top)]),
    ("night", [(-0.16, bottom), (1, bottom), (1, top), (0.16, top)]),
]:
    mesh = bpy.data.meshes.new(f"{label} diagonal half")
    mesh.from_pydata([(x, y, 0) for x, y in polygon], [], [(0, 1, 2, 3)])
    uv = mesh.uv_layers.new()
    for loop in mesh.loops:
        x, y = polygon[loop.vertex_index]
        uv.data[loop.index].uv = ((x + 1) / 2, (y - bottom) / height)
    material = bpy.data.materials.new(f"{label} original render")
    material.use_nodes = True
    nodes = material.node_tree.nodes
    nodes.clear()
    texture = nodes.new("ShaderNodeTexImage")
    texture.image = bpy.data.images.load(str(args.output / f"ray-waterfront-{label}.png"))
    emission = nodes.new("ShaderNodeEmission")
    output = nodes.new("ShaderNodeOutputMaterial")
    material.node_tree.links.new(texture.outputs["Color"], emission.inputs["Color"])
    material.node_tree.links.new(emission.outputs[0], output.inputs["Surface"])
    mesh.materials.append(material)
    composite.collection.objects.link(bpy.data.objects.new(mesh.name, mesh))
camera_data = bpy.data.cameras.new("Matched thumbnail compositor")
camera_data.type = "ORTHO"
camera_data.ortho_scale = 2
composite.camera = bpy.data.objects.new(camera_data.name, camera_data)
composite.camera.location = (0, 0, 5)
composite.collection.objects.link(composite.camera)
composite.render.filepath = str(args.output / "ray-waterfront-day-night.png")
bpy.ops.render.render(scene=composite.name, write_still=True)
