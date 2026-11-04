/* Work films load only after a visitor chooses a project. */
(() => {
  "use strict";
  const gallery = document.querySelector(".work-portfolio");
  if (!gallery) return;
  const dialog = gallery.querySelector("#project-film-dialog");
  const player = gallery.querySelector("#project-film-player");
  const title = gallery.querySelector("#film-title");
  const close = gallery.querySelector("#film-close");
  const details = gallery.querySelector("#project-case-study");
  const projects = {
    architecture: {
      category: "NEXIV / ARCHITECTURAL FILM",
      intro: "Experience Center presents an immersive architectural display through a studio film, exploring interiors, spatial atmosphere and moving-image presentation.",
      demonstrates: "Architectural visualization, interior presentation, composition and a camera sequence through the experience center.",
      scope: "For a new commission, we agree the design references, camera sequence, film duration, resolution and final display format before production."
    },
    interior: {
      category: "NEXIV / ARCHITECTURAL INTERIOR FILM",
      intro: "Interior / Natural Light is a 59-second film exploring a contemporary living, dining and kitchen space through daylight, warm timber, marble and sculptural lighting.",
      demonstrates: "Architectural interior visualization, material detail, lighting, composition and movement through connected living spaces.",
      scope: "This showcase is supplied in Full HD (1920 × 1080). For a new commission, camera views, duration, resolution, review rounds, soundtrack and delivery versions are agreed in scope."
    }
  };
  function element(tag, text, className) {
    const node = document.createElement(tag);
    node.textContent = text;
    if (className) node.className = className;
    return node;
  }
  function openFilm(card) {
    const project = projects[card.dataset.case];
    if (!project) return;
    document.querySelectorAll("video").forEach(video => video.pause());
    title.textContent = card.dataset.title;
    player.poster = card.dataset.poster;
    details.replaceChildren(element("p", project.category, "case-category"), element("p", project.intro, "case-intro"));
    for (const [heading, copy] of [["What it demonstrates", project.demonstrates], ["Scope & delivery", project.scope]]) {
      const section = document.createElement("section");
      section.append(element("h4", heading), element("p", copy));
      details.append(section);
    }
    const enquiry = element("a", "Discuss a similar project", "case-enquiry");
    enquiry.href = "services.html?service=Architectural%20visualization#contact";
    details.append(enquiry);
    player.src = card.dataset.video;
    dialog.showModal();
    document.body.classList.add("film-open");
    dialog.scrollTop = 0;
    close.focus({ preventScroll: true });
    player.play().catch(() => {});
  }
  gallery.querySelectorAll("button.project-card[data-video]").forEach(card => card.addEventListener("click", () => openFilm(card)));
  close.addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", () => {
    document.body.classList.remove("film-open");
    player.pause();
    player.removeAttribute("src");
    player.load();
  });
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  document.addEventListener("visibilitychange", () => { if (document.hidden) player.pause(); });
})();
