/* Shared studio presentation behavior; RAY keeps its own rendering runtime. */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [
    ...root.querySelectorAll(selector),
  ];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");

  // A new design preference avoids inheriting incompatible legacy page themes.
  const themeButton = $(".studio-theme");
  let light = false;
  try {
    light = localStorage.getItem("kazeyami-studio-display-v2") === "light";
  } catch {}
  function renderTheme() {
    document.body.classList.toggle("studio-light", light);
    const logo = $(".studio-brand img");
    if (logo)
      logo.src =
        "assets/" +
        (light && !document.body.matches(".page-index")
          ? "kazeyami-logo.png"
          : "kazeyami-logo-white.png");
    if (themeButton) {
      themeButton.textContent = light ? "Display: light ◑" : "Display: dark ◐";
      themeButton.setAttribute(
        "aria-label",
        light ? "Switch to dark theme" : "Switch to light theme",
      );
    }
  }
  renderTheme();
  themeButton?.addEventListener("click", () => {
    light = !light;
    try {
      localStorage.setItem(
        "kazeyami-studio-display-v2",
        light ? "light" : "dark",
      );
    } catch {}
    renderTheme();
  });

  const menu = $("#studio-menu"),
    menuToggle = $(".studio-menu-toggle");
  menuToggle?.addEventListener("click", () => {
    menu.showModal();
    menuToggle.setAttribute("aria-expanded", "true");
  });
  $("[data-close-menu]")?.addEventListener("click", () => menu.close());
  menu?.addEventListener("close", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.focus();
  });

  const reel = $("#studio-reel"),
    reelButton = $(".reel-toggle");
  if (reel && reelButton) {
    let wantsPlayback = !reduce.matches && !navigator.connection?.saveData;
    let resume = false;
    function labels() {
      reelButton.setAttribute(
        "aria-label",
        reel.paused ? "Play background film" : "Pause background film",
      );
      $(".play-state", reelButton).textContent = reel.paused ? "▷" : "Ⅱ";
    }
    function loadFilm(source, play) {
      if (reel.getAttribute("src") !== source) {
        reel.src = source;
        reel.load();
      }
      if (play) reel.play().catch(labels);
    }
    reel.addEventListener("play", labels);
    reel.addEventListener("pause", labels);
    reel.addEventListener("timeupdate", () => {
      const s = Math.floor(reel.currentTime);
      $("#film-time").textContent =
        String(Math.floor(s / 60)).padStart(2, "0") +
        ":" +
        String(s % 60).padStart(2, "0");
      $("#reel-progress").style.width =
        (reel.duration
          ? Math.min(100, (reel.currentTime / reel.duration) * 100)
          : 0) + "%";
    });
    reelButton.addEventListener("click", () => {
      wantsPlayback = reel.paused;
      if (wantsPlayback) loadFilm(reel.dataset.initialVideo, true);
      else reel.pause();
    });
    const channels = $$(".channel-button");
    channels.forEach((button, index) =>
      button.addEventListener("click", () => {
        channels.forEach((c) =>
          c.setAttribute("aria-pressed", String(c === button)),
        );
        reel.pause();
        reel.poster = button.dataset.poster;
        reel.dataset.initialVideo = button.dataset.video;
        $("#channel-number").textContent = "/ 0" + (index + 1);
        $("#channel-title").textContent = button.dataset.title;
        $("#channel-description").textContent = button.dataset.description;
        $("#channel-link").href = button.dataset.link;
        $("#film-time").textContent = "00:00";
        $("#reel-progress").style.width = "0%";
        loadFilm(button.dataset.video, wantsPlayback);
      }),
    );
    reduce.addEventListener("change", (event) => {
      if (event.matches) {
        wantsPlayback = false;
        reel.pause();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        resume = wantsPlayback && !reel.paused;
        reel.pause();
      } else if (resume && wantsPlayback) reel.play().catch(labels);
    });
    if (wantsPlayback) loadFilm(reel.dataset.initialVideo, true);
    labels();
    const oldRoutes = {
      studio: "about.html",
      process: "about.html#process",
      services: "services.html",
      contact: "connect.html",
      faq: "connect.html#faq",
      ray: "ray.html",
      "three-d": "3d.html",
      work: "3d.html#work",
      design: "design.html",
      products: "products.html",
    };
    const destination = oldRoutes[location.hash.slice(1)];
    if (destination) location.replace(destination);
  }

  const entries = $$("[data-category]"),
    filters = $$("[data-filter]");
  filters.forEach((button) =>
    button.addEventListener("click", () => {
      let count = 0;
      entries.forEach((entry) => {
        entry.hidden =
          button.dataset.filter !== "all" &&
          entry.dataset.category !== button.dataset.filter;
        if (!entry.hidden) count++;
      });
      filters.forEach((filter) =>
        filter.setAttribute("aria-pressed", String(filter === button)),
      );
      $("#work-status").textContent =
        "Showing " +
        count +
        " work and practice " +
        (count === 1 ? "entry." : "entries.");
    }),
  );

  const films = {
    medical: {
      title: "AMD — Medical explainer",
      video: "assets/amd-medical-explainer.mp4",
      poster: "assets/studio/amd-preview.webp",
      description:
        "3D modeling and animation make the sequence easier to follow. Explore the project’s process, review approach and deliverables.",
    },
    miniature: {
      title: "Mario — Miniature",
      video: "assets/mario-miniature.mp4",
      poster: "assets/studio/mario-preview.webp",
      description:
        "A character sculpt developed with printable form and separated components in mind. Explore the modeling and preparation process.",
    },
  };
  const filmDialog = $("#studio-film"),
    filmPlayer = filmDialog && $("video", filmDialog);
  $$("[data-film]").forEach((button) =>
    button.addEventListener("click", () => {
      const film = films[button.dataset.film];
      $("#studio-film-title").textContent = film.title;
      $("#studio-film-description").textContent = film.description;
      filmPlayer.poster = film.poster;
      filmPlayer.src = film.video;
      filmDialog.showModal();
      filmPlayer.play().catch(() => {});
    }),
  );
  $("[data-close-film]")?.addEventListener("click", () => filmDialog.close());
  filmDialog?.addEventListener("close", () => filmPlayer.pause());

  // The roster is the source of truth; content is rendered with textContent.
  const roster = $$(".roster-person");
  roster.forEach((button, index) =>
    button.addEventListener("click", () => {
      roster.forEach((person) =>
        person.setAttribute("aria-pressed", String(person === button)),
      );
      const data = button.dataset;
      const portrait = $("#selected-portrait");
      portrait.src = "assets/studio/" + data.id + ".webp";
      portrait.alt = "Original fictional anime avatar for " + data.name;
      $("#selected-name").textContent = data.name;
      $("#selected-role").textContent = data.role;
      $("#selected-tag").textContent = data.tag;
      $("#selected-focus").textContent = data.focus;
      $("#selected-link").href = data.link;
      $("#selected-link").textContent = data.cta + " ↗";
      $("#selected-index").textContent = String(index + 1).padStart(2, "0");
      $(".character-big-index").textContent = String(index + 1).padStart(
        2,
        "0",
      );
      $("#cast-status").textContent =
        "Selected " + data.name + ", " + data.role + ".";
    }),
  );

  const study = $(".design-canvas");
  $$("[data-study-palette]").forEach((button) =>
    button.addEventListener("click", () => {
      study.dataset.palette = button.dataset.studyPalette;
      $$("[data-study-palette]").forEach((b) =>
        b.setAttribute("aria-pressed", String(b === button)),
      );
      $("#study-status").textContent =
        "Palette changed to " + button.textContent + ".";
    }),
  );
  $$("[data-study-layout]").forEach((button) =>
    button.addEventListener("click", () => {
      study.dataset.layout = button.dataset.studyLayout;
      $$("[data-study-layout]").forEach((b) =>
        b.setAttribute("aria-pressed", String(b === button)),
      );
      $("#study-status").textContent =
        "Layout changed to " + button.textContent + ".";
    }),
  );

  $(".copy-email")?.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText("hr@kazeyami.com");
      $("#copy-status").textContent = "Email copied.";
    } catch {
      $("#copy-status").textContent = "Select hr@kazeyami.com above to copy.";
    }
  });
  $("#studio-brief")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const link = document.createElement("a");
    link.href = window.StudioBrief.build(values);
    link.click();
    $("#brief-status").textContent =
      "Draft requested. Review it in your email app before sending, or write directly to hr@kazeyami.com.";
  });
})();
