import bpy,math,argparse,sys
parser=argparse.ArgumentParser()
parser.add_argument("--out",required=True)
args=parser.parse_args(sys.argv[sys.argv.index("--")+1:])
from mathutils import Vector
from pathlib import Path
s=bpy.context.scene;s.frame_set(1)
s.render.engine='CYCLES';s.cycles.samples=96;s.cycles.use_denoising=True
s.render.resolution_x=1600;s.render.resolution_y=900;s.render.resolution_percentage=100
s.render.image_settings.file_format='PNG';s.render.filepath=args.out
s.cycles.max_bounces=7;s.cycles.diffuse_bounces=3;s.cycles.glossy_bounces=4;s.cycles.transmission_bounces=6
s.cycles.use_adaptive_sampling=True;s.cycles.adaptive_threshold=.03
try:
 prefs=bpy.context.preferences.addons['cycles'].preferences;prefs.compute_device_type='OPTIX';prefs.get_devices()
 for d in prefs.devices:d.use=d.type=='OPTIX'
 s.cycles.device='GPU'
except Exception: s.cycles.device='CPU'
s.view_settings.view_transform='AgX'
for look in ['AgX - Medium Low Contrast','AgX - None','None']:
 try:s.view_settings.look=look;break
 except TypeError:pass
s.view_settings.exposure=-.25;s.view_settings.gamma=1
world=bpy.data.worlds.new('RAY natural dawn still');s.world=world;world.use_nodes=True
nodes=world.node_tree.nodes;nodes.clear();sky=nodes.new('ShaderNodeTexSky');sky.sky_type='MULTIPLE_SCATTERING';sky.sun_elevation=math.radians(2);sky.sun_rotation=math.atan2(-.995,.1);sky.sun_size=math.radians(.65);sky.sun_intensity=.4;sky.air_density=1;
for key,value in {'dust_density':.4,'ozone_density':1,'aerosol_density':.4}.items():
 if hasattr(sky,key):setattr(sky,key,value)
bg=nodes.new('ShaderNodeBackground');bg.inputs['Strength'].default_value=.5
out=nodes.new('ShaderNodeOutputWorld');world.node_tree.links.new(sky.outputs[0],bg.inputs['Color']);world.node_tree.links.new(bg.outputs[0],out.inputs['Surface'])
for obj in bpy.data.objects:
 if obj.type=='LIGHT':
  obj.animation_data_clear()
  if obj.data.type=='SUN':
   obj.data.animation_data_clear();obj.data.energy=1.2;obj.data.color=(1,.94,.84);obj.data.angle=math.radians(2)
   obj.rotation_euler=Vector((-.1,.995,-.035)).to_track_quat('-Z','Y').to_euler()
  else:obj.data.energy=0
cam=s.camera;cam.animation_data_clear();cam.location=(-115,260,82);target=Vector((0,-4,38));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.lens=42;cam.data.dof.use_dof=False
# Use a dielectric water surface; the exported clearcoat produced a harsh white streak.
for material in bpy.data.materials:
 if 'Native ocean' in material.name:
  bs=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
  bs.inputs['Metallic'].default_value=0;bs.inputs['Coat Weight'].default_value=0;bs.inputs['Roughness'].default_value=.20
# A small physical disc gives the dawn sun a readable position on the sea horizon.
bpy.ops.mesh.primitive_uv_sphere_add(segments=48,ring_count=24,radius=30,location=(632,-5461,192))
disc=bpy.context.object;disc.name='Dawn sun disc / still only'
mat=bpy.data.materials.new('Dawn disc');mat.use_nodes=True
nt=mat.node_tree;nt.nodes.clear();em=nt.nodes.new('ShaderNodeEmission');em.inputs['Color'].default_value=(1,.79,.53,1);em.inputs['Strength'].default_value=2.2
out=nt.nodes.new('ShaderNodeOutputMaterial');nt.links.new(em.outputs[0],out.inputs['Surface']);disc.data.materials.append(mat)
s.render.film_transparent=False;s.use_nodes=False
bpy.ops.render.render(write_still=True)
