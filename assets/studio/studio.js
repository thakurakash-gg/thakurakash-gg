/* Shared presentation behavior. The RAY renderer is not loaded on studio pages. */
(() => {
  "use strict";
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const themeButton = $(".studio-theme");
  const themeEligible = document.body.matches(".paper, .legacy-page");
  let night = false;
  try {
    night = localStorage.getItem("kazeyami-theme") === "dark";
  } catch {}
  function updateTheme() {
    document.body.classList.toggle("studio-night", night && themeEligible);
    const brand = $(".studio-brand img");
    if (brand)
      brand.src =
        "assets/" +
        ((night && themeEligible) || document.body.matches(".cinematic, .ink-page")
          ? "kazeyami-logo-white.png"
          : "kazeyami-logo.png");
    if (themeButton) {
      themeButton.textContent = night ? "Display: night ◑" : "Display: day ◐";
      themeButton.setAttribute(
        "aria-label",
        night ? "Switch to light theme" : "Switch to dark theme",
      );
    }
  }
  themeButton?.addEventListener("click", () => {
    night = !night;
    try {
      localStorage.setItem("kazeyami-theme", night ? "dark" : "light");
    } catch {}
    updateTheme();
  });
  updateTheme();

  const menu = $("#studio-menu");
  const menuToggle = $(".studio-menu-toggle");
  menuToggle?.addEventListener("click", () => {
    menu.showModal();
    menuToggle.setAttribute("aria-expanded", "true");
  });
  $("[data-close-menu]")?.addEventListener("click", () => menu.close());
  menu?.addEventListener("close", () => {
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.focus();
  });

  // One intentional background film; respect reduced motion and data-saving settings.
  const reel = $("#studio-reel") || $("#hero-video");
  const reelButton = $(".reel-toggle") || $(".video-toggle");
  if (reel && reelButton) {
    let wanted = !reducedMotion.matches && !navigator.connection?.saveData;
    let resumeWhenVisible = false;
    const updateLabel = () => {
      const label = reel.paused ? "Play background film" : "Pause background film";
      reelButton.setAttribute("aria-label", label);
      if ($(".reel-label", reelButton)) {
        $(".reel-label", reelButton).textContent = reel.paused ? "Play film" : "Pause film";
        $(".play-state", reelButton).textContent = reel.paused ? "▷" : "Ⅱ";
      } else reelButton.textContent = reel.paused ? "Play video" : "Pause video";
    };
    reel.addEventListener("play", updateLabel);
    reel.addEventListener("pause", updateLabel);
    reel.addEventListener("timeupdate", () => {
      const display = $("#film-time");
      if (display) {
        const seconds = Math.floor(reel.currentTime);
        display.textContent =
          String(Math.floor(seconds / 60)).padStart(2, "0") +
          ":" +
          String(seconds % 60).padStart(2, "0");
      }
    });
    reelButton.addEventListener("click", () => {
      wanted = reel.paused;
      if (wanted) reel.play().catch(updateLabel);
      else reel.pause();
    });
    reducedMotion.addEventListener("change", (event) => {
      if (event.matches) {
        wanted = false;
        reel.pause();
      }
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        resumeWhenVisible = wanted && !reel.paused;
        reel.pause();
      } else if (resumeWhenVisible && wanted) reel.play().catch(updateLabel);
    });
    if (wanted) reel.play().catch(updateLabel);
    updateLabel();
  }

  const filters = $$("[data-filter]");
  const entries = $$("[data-category]");
  function applyFilter(value) {
    let count = 0;
    entries.forEach((entry) => {
      entry.hidden = value !== "all" && entry.dataset.category !== value;
      if (!entry.hidden) count++;
    });
    filters.forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.filter === value)),
    );
    const status = $("#work-status");
    if (status)
      status.textContent = "Showing " + count + " portfolio " + (count === 1 ? "entry" : "entries");
  }
  filters.forEach((button) =>
    button.addEventListener("click", () => applyFilter(button.dataset.filter)),
  );

  const films = {
    medical: {
      title: "AMD — Medical explainer",
      video: "assets/amd-medical-explainer.mp4",
      poster: "assets/amd-medical-poster.png",
      description:
        "Medical and anatomical visualization, clear pacing and a carefully composed explanation. Explore the full project for services, process and delivery details.",
    },
    miniature: {
      title: "Mario — Miniature toy",
      video: "assets/mario-miniature.mp4",
      poster: "assets/studio/mario-preview.webp",
      description:
        "Character form, sculpted details and separated components for 3D-print design. Explore the full project for the modeling and preparation process.",
    },
  };
  const filmDialog = $("#studio-film");
  const filmPlayer = filmDialog && $("video", filmDialog);
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
  filmDialog?.addEventListener("click", (event) => {
    if (event.target === filmDialog) {
      const bounds = filmDialog.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        filmDialog.close();
    }
  });

  const artists = $$(".artist-card");
  const artistDialog = $("#artist-dialog");
  artists.forEach((button) =>
    button.addEventListener("click", () => {
      const image = $("img", button);
      $(".artist-dialog-image").src = image.src;
      $(".artist-dialog-image").alt = image.alt;
      $("#artist-name").textContent = button.dataset.name;
      $("#artist-role").textContent = button.dataset.role;
      $("#artist-tag").textContent = button.dataset.tag;
      $("#artist-focus").textContent = button.dataset.focus;
      $("#artist-link").href = button.dataset.link;
      $("#artist-link").textContent = button.dataset.cta + " ↗";
      artistDialog.showModal();
    }),
  );
  $("[data-close-artist]")?.addEventListener("click", () => artistDialog.close());
  $(".cast-shuffle")?.addEventListener("click", () => {
    const shuffled = [...artists];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const grid = $(".cast-grid");
    shuffled.forEach((card) => grid.insertBefore(card, $(".cast-signoff")));
    $("#cast-status").textContent = "Cast remixed. All seven studio members are here.";
  });

  $(".copy-email")?.addEventListener("click", async () => {
    const status = $("#copy-status");
    try {
      await navigator.clipboard.writeText("hr@kazeyami.com");
      status.textContent = "Email copied.";
    } catch {
      status.textContent = "hr@kazeyami.com — select the email above to copy.";
    }
  });
  $("#studio-brief")?.addEventListener("submit", (event) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const draft = window.StudioBrief.build(values);
    const link = document.createElement("a");
    link.href = draft;
    link.click();
    $("#brief-status").textContent =
      "Email draft requested. Review it in your email app before sending. You can also write directly to hr@kazeyami.com.";
  });
})();
