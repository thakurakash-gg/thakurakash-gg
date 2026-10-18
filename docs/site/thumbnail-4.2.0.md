# RAY thumbnail, website 4.2.0

The preview is a real render of the private full-detail `RAY-Waterfront-Full-Scene-26.3.2.blend`, using its existing geometry, packed textures and landscaping. The Blender file is not changed or included in the website. The rejected generated image is not used.

Render with Blender 5.1: `blender --factory-startup -b SCENE.blend --python tools/site/render-ray-thumbnail.py -- --out OUTPUT.png`.

The render uses Cycles, 96 samples, denoising, AgX Medium Low Contrast and restrained dawn lighting. The camera is recorded in the render script. Native platform HTML/CSS supplies the visible controls; `prepare-ray-thumbnail.mjs` prepares a local capture page after a format-only conversion to `__ray-raw.webp`. Capture at 1600 x 900, then encode WebP. Neither temporary capture file is published. The map is hidden only for this still; the interactive platform is unchanged.

Home reuses the existing studio film. The cursor trail runs only while fine-pointer particles are active, with at most 100 cells. It is disabled for coarse pointers, reduced motion and form inputs. Real Android hardware performance has not been measured in this change.
