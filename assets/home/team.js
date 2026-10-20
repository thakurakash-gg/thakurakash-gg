(() => {
  "use strict";
  const section = document.querySelector(".team-cast");
  if (!section) return;
  const members = [
    { name: "Siya Baranwal", role: "UI/UX Artist", description: "Interface layouts, user journeys and visual details that help people find their way." },
    { name: "Pragati Saxena", role: "HR", description: "People, communication and coordination behind the studio's everyday work." },
    { name: "DK", role: "Developer", description: "Turning interface designs and ideas into working digital experiences." },
    { name: "Deepraj", role: "Senior Developer", description: "Development direction, application structure and the technical details that keep a project working." },
    { name: "Shayan Ansari", role: "Technical Artist", description: "Connecting art and technology through production tools, materials and real-time workflows." },
    { name: "Akash Singh", role: "3D Artist", description: "Shape, surface and composition for 3D objects, environments and visual assets." },
    { name: "Hammer", role: "Unreal Artist", description: "Real-time scenes, materials and lighting built in Unreal Engine." }
  ];
  const buttons = [...section.querySelectorAll(".team-cast__member")];
  const portrait = section.querySelector(".team-cast__portrait--large");
  const name = section.querySelector("[data-cast-name]");
  const role = section.querySelector("[data-cast-role]");
  const description = section.querySelector("[data-cast-description]");
  const number = section.querySelector("[data-cast-number]");
  if (!portrait || !name || !role || !description || !number) return;

  function choose(index) {
    const member = members[index];
    if (!member) return;
    buttons.forEach((button, position) => button.setAttribute("aria-pressed", String(position === index)));
    portrait.dataset.character = String(index);
    portrait.setAttribute("aria-label", `Original anime character representing ${member.name}, ${member.role}`);
    name.textContent = member.name;
    role.textContent = member.role;
    description.textContent = member.description;
    number.textContent = `${String(index + 1).padStart(2, "0")} / 07`;
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
      buttons[next].focus();
      choose(next);
    });
  });

  let requested = false;
  function loadArt() {
    if (requested || !section.dataset.crewImage) return;
    requested = true;
    const art = new Image();
    art.decoding = "async";
    art.onload = () => {
      section.style.setProperty("--crew-art", `url("${art.src.replaceAll('"', '%22')}")`);
      section.classList.add("is-art-ready");
    };
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
