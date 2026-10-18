/* A short, pixel-sampled cursor wake. It never captures or blocks input. */
(() => {
  if (!document.body.classList.contains('katana-site')) return;
  const allowed = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  const canvas = document.createElement('canvas');
  canvas.className = 'home-pixel-cursor'; canvas.setAttribute('aria-hidden','true');
  const ctx = canvas.getContext('2d');
  const sample = document.createElement('canvas');sample.width=6;sample.height=6;
  const sampleCtx=sample.getContext('2d',{willReadFrequently:true});
  const video=document.querySelector('#opening-work-video');
  let particles=[],frame=0,lastPoint=null,lastStamp=0,width=0,height=0;
  function size(){width=innerWidth;height=innerHeight;canvas.width=width;canvas.height=height;}
  function stop(){cancelAnimationFrame(frame);frame=0;particles=[];lastPoint=null;ctx.clearRect(0,0,width,height);}
  function setup(){
    if(allowed.matches){if(!canvas.isConnected)document.body.append(canvas);size();}
    else {stop();canvas.remove();}
  }
  function stamp(x,y,now){
    let colors=null;
    if(video.readyState>=2&&video.getBoundingClientRect().bottom>0){
      try {
        const scale=Math.max(width/video.videoWidth,height/video.videoHeight);
        const sx=(x+(video.videoWidth*scale-width)/2)/scale;
        const sy=(y+(video.videoHeight*scale-height)/2)/scale;
        sampleCtx.drawImage(video,Math.max(0,sx-12/scale),Math.max(0,sy-12/scale),24/scale,24/scale,0,0,6,6);
        colors=sampleCtx.getImageData(0,0,6,6).data;
      }catch{}
    }
    for(let i=0;i<5;i++){
      const gx=Math.round(x/7)+(i%3)-1,gy=Math.round(y/7)+Math.floor(i/3)-1;
      const n=(i*7%36)*4;
      const color=colors?`rgb(${colors[n]},${colors[n+1]},${colors[n+2]})`:i%3?'#d9d6d0':'#b96b50';
      particles.push({x:gx*7,y:gy*7,born:now,color});
    }
    if(particles.length>100)particles.splice(0,particles.length-100);
    if(!frame)frame=requestAnimationFrame(paint);
  }
  function paint(now){
    frame=0;ctx.clearRect(0,0,width,height);
    particles=particles.filter(p=>now-p.born<520);
    for(const p of particles){const age=(now-p.born)/520;ctx.globalAlpha=(1-age)*.55;ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,7,7);}
    ctx.globalAlpha=1;
    if(particles.length)frame=requestAnimationFrame(paint);
  }
  document.addEventListener('pointermove',e=>{
    if(!allowed.matches||e.pointerType!=='mouse'||document.hidden||e.target.closest('input,textarea,select')||document.body.classList.contains('menu-open'))return;
    const now=performance.now();
    if(now-lastStamp<18)return;
    if(!lastPoint||Math.hypot(e.clientX-lastPoint.x,e.clientY-lastPoint.y)>8){stamp(e.clientX,e.clientY,now);lastPoint={x:e.clientX,y:e.clientY};lastStamp=now;}
  },{passive:true});
  document.addEventListener('pointerleave',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
  addEventListener('resize',()=>{stop();size();});allowed.addEventListener('change',setup);setup();
})();
