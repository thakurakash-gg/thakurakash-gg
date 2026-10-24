// Native media loads only when a visitor starts playback.
document.querySelectorAll('.dmx-showcase video').forEach(video=>{
  video.addEventListener('play',()=>document.querySelectorAll('.dmx-showcase video').forEach(other=>{if(other!==video)other.pause()}));
});
