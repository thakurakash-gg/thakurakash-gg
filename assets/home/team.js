(() => {
  "use strict";
  const section = document.querySelector(".team-cast");
  if (!section) return;
  const members = [
    { name: "Siya Baranwal", role: "UI/UX Artist", description: "Shapes interfaces and user journeys, from the first wireframe to the finishing visual details." },
    { name: "Pragati Saxena", role: "HR", description: "Keeps people connected through communication, coordination and the day-to-day life of the studio." },
    { name: "DK", role: "Developer", description: "Turns designs into working websites and applications, connecting the interface to what happens behind it." },
    { name: "Deepraj", role: "Senior Developer", description: "Guides application structure and development, bringing the moving parts of a digital project together." },
    { name: "Shayan Ansari", role: "Technical Artist", description: "Bridges art and engineering through production tools, materials and real-time workflows." },
    { name: "Akash Singh", role: "3D Artist", description: "Builds the shapes, surfaces and compositions behind our 3D objects, environments and visual assets." },
    { name: "Hammer", role: "Unreal Artist", description: "Builds real-time worlds in Unreal Engine, working across scene assembly, lighting and materials." }
  ];
  const buttons = [...section.querySelectorAll(".team-cast__member")];
  const name = section.querySelector("[data-cast-name]");
  const role = section.querySelector("[data-cast-role]");
  const description = section.querySelector("[data-cast-description]");
  if (buttons.length === members.length && name && role && description) {
    function choose(index) {
      const member = members[index];
      if (!member) return;
      buttons.forEach((button, position) => button.setAttribute("aria-pressed", String(position === index)));
      name.textContent = member.name;
      role.textContent = member.role;
      description.textContent = member.description;
    }
    buttons.forEach((button, index) => {
      button.addEventListener("click", () => choose(index));
      button.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "ArrowRight") next = (index + 1) % buttons.length;
        else if (event.key === "ArrowLeft") next = (index - 1 + buttons.length) % buttons.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = buttons.length - 1;
        else return;
        event.preventDefault();
        choose(next);
        buttons[next].focus();
      });
    });
  }

  let requested = false;
  function loadArt() {
    if (requested || !section.dataset.crewImage) return;
    requested = true;
    const art = new Image();
    art.decoding = "async";
    art.onload = () => {
      section.style.setProperty("--crew-art", `url("${art.src.replaceAll('"', "%22")}")`);
      section.classList.add("is-art-ready");
    };
    art.onerror = () => section.classList.add("is-art-unavailable");
    art.src = section.dataset.crewImage;
  }
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        loadArt();
        observer.disconnect();
      }
    }, { rootMargin: "450px 0px" });
    observer.observe(section);
  } else loadArt();
})();
