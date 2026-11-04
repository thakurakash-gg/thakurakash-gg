/* Pause chosen films when they leave the page; never restart with sound. */
(() => {
  const videos = [...document.querySelectorAll('video[controls]')];
  if (videos.length) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (!entry.isIntersecting) entry.target.pause();
    }, { threshold: 0.01 });
    videos.forEach(video => {
      observer.observe(video);
      video.addEventListener('play', () => {
        document.querySelectorAll('video').forEach(other => { if (other !== video) other.pause(); });
      });
    });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) videos.forEach(video => video.pause());
    });
  }
})();
