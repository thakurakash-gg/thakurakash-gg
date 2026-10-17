"""Build the studio's 11 pages from readable templates and shared components."""

from pathlib import Path
from html import escape
import json

ROOT = Path(__file__).resolve().parents[2]
TEMPLATES = ROOT / "tools/site/templates"
RELEASE = json.loads((ROOT / "tools/site/version.json").read_text(encoding="utf8"))
NAV = [
    ("index.html", "Home"),
    ("about.html", "About"),
    ("portfolio.html", "Portfolio"),
    ("services.html", "Services"),
    ("team.html", "Team"),
    ("connect.html", "Connect"),
]
PAGES = {
    "index": (
        "3D, design & digital experiences",
        "Kazeyami Innovations is an independent design and technology studio in Lucknow. Explore our architecture, animation, brands and digital work.",
        '<script src="assets/studio/home-gallery.js" defer></script>',
    ),
    "about": (
        "The studio",
        "Get to know Kazeyami Innovations: our creative disciplines, how we work, and the people connecting art and technology.",
        '<script src="assets/three.min.js" defer></script><script src="assets/logo-scene.js" defer></script>',
    ),
    "portfolio": (
        "Selected work",
        "Explore RAY by NEXIV, our AMD medical animation, Mario miniature project, and the studio’s design practice.",
        "",
    ),
    "services": (
        "What we make",
        "Architectural visualization, 3D animation, game assets, UI/UX, branding, film and technology services by Kazeyami.",
        "",
    ),
    "team": (
        "Meet the studio",
        "Seven real people. Seven original anime alter egos. Meet Kazeyami’s artists, developers and studio team.",
        "",
    ),
    "connect": (
        "Contact the studio",
        "Discuss your project with Kazeyami Innovations in Lucknow. Share a brief for 3D, architecture, branding or a digital experience.",
        "",
    ),
    "nexiv": (
        "NEXIV — Home to RAY",
        "NEXIV is a Kazeyami Innovations product brand. Discover its RAY architectural visualization platform and interactive exterior demo.",
        "",
    ),
    "ray": (
        "RAY by NEXIV — Architecture you can explore",
        "Experience RAY, NEXIV’s archviz platform. Explore the real-time waterfront exterior prototype and our architectural visualization practice.",
        '<script src="assets/image-flow.js" defer></script>',
    ),
    "3d": (
        "3D — Form, motion and worlds",
        "Explore Kazeyami’s AMD medical explainer and Mario miniature project, with project films, process and deliverables.",
        '<script src="assets/portfolio.js" defer></script><script src="assets/image-flow.js" defer></script>',
    ),
    "design": (
        "Design with a point of view",
        "Brand identities, UI/UX and motion design by Kazeyami Innovations. Explore an interactive studio design study.",
        "",
    ),
    "products": (
        "Ideas we’re building",
        "Explore NEXIV and RAY, Kazeyami Tools and Mock Yatra: product brands and independent ventures connected to Kazeyami.",
        "",
    ),
}


def home_url(url):
    return {
        "index.html": "#top",
        "about.html": "#studio",
        "portfolio.html": "#work",
        "services.html": "#services",
        "team.html": "#team",
        "connect.html": "#connect",
    }.get(url, url)


def header(active):
    desktop = "".join(
        f'<a href="{home_url(url) if active == "index.html" else url}"'
        + (' aria-current="page"' if url == active else "")
        + f">{label}</a>"
        for url, label in NAV[:-1]
    )
    mobile = "".join(
        f'<a href="{home_url(url) if active == "index.html" else url}">{label}</a>'
        for i, (url, label) in enumerate(NAV, 1)
    )
    return f"""
<header class="studio-header">
  <a class="studio-brand" href="index.html" aria-label="Kazeyami Innovations home"><img src="assets/kazeyami-logo.png" alt="Kazeyami Innovations" width="2665" height="760"></a>
  <nav class="desktop-nav" aria-label="Main navigation">{desktop}</nav>
  <a class="header-connect" href="{home_url("connect.html") if active == "index.html" else "connect.html"}">Let’s connect</a>
  <button class="studio-menu-toggle" aria-haspopup="dialog" aria-controls="studio-menu" aria-expanded="false" aria-label="Open navigation">Menu</button>
</header>
<dialog id="studio-menu" class="studio-menu" aria-labelledby="menu-title">
  <div class="dialog-bar"><span id="menu-title">EXPLORE KAZEYAMI</span><button data-close-menu aria-label="Close navigation">Close</button></div>
  <nav aria-label="Mobile navigation">{mobile}</nav>
  <a class="menu-email" href="mailto:hr@kazeyami.com">hr@kazeyami.com</a>
</dialog>"""


def footer(compact):
    invitation = (
        ""
        if compact
        else '<a class="footer-invitation" href="connect.html"><span class="eyebrow">HAVE A PROJECT IN MIND?</span><strong>Tell us about your project.</strong></a>'
    )
    return f"""
<footer class="studio-footer">{invitation}
  <div class="footer-main">
    <a class="footer-wordmark" href="index.html">KAZEYAMI<span>INNOVATIONS</span></a>
    <p>3D, design & digital experiences.<br>Lucknow, Uttar Pradesh · India · 226012</p>
    <div class="footer-links"><a href="mailto:hr@kazeyami.com">hr@kazeyami.com</a><a href="https://www.linkedin.com/company/kazeyami" target="_blank" rel="noopener noreferrer">LinkedIn</a></div>
  </div>
  <div class="footer-base"><span>© 2026 Kazeyami Innovations Pvt. Ltd.</span><a href="products.html">Products & ventures</a><a href="about.html">About the studio</a></div>
</footer>"""


def roster():
    team = json.loads((ROOT / "tools/site/team.json").read_text(encoding="utf8"))
    result = []
    for i, person in enumerate(team, 1):
        attrs = " ".join(
            f'data-{key}="{escape(value, quote=True)}"' for key, value in person.items()
        )
        result.append(
            f"""<button class="roster-person" {attrs} aria-pressed="{'true' if i==1 else 'false'}" aria-label="Select {person['name']}, {person['role']}">
<img src="assets/studio/{person['id']}.webp" alt="" width="1122" height="1402" loading="lazy">
<span class="roster-number">0{i}</span><span><strong>{person['name']}</strong><small>{person['role']}</small></span><span class="roster-cross" aria-hidden="true">↗</span></button>"""
        )
    return "\n".join(result)


def home_cast():
    team = json.loads((ROOT / "tools/site/team.json").read_text(encoding="utf8"))
    return "\n".join(
        f'<a href="team.html?member={p["id"]}" class="home-person"><span class="home-person-image"><img src="assets/studio/{p["id"]}.webp" alt="Anime alter ego for {p["name"]}" width="1122" height="1402" loading="lazy"></span><strong>{p["name"]}</strong><small>{p["role"]}</small></a>'
        for p in team
    )


for slug, (title, description, scripts) in PAGES.items():
    filename = slug + ".html"
    active = filename if filename in dict(NAV) else "portfolio.html"
    content = (
        (TEMPLATES / filename)
        .read_text(encoding="utf8")
        .replace("{{ROSTER}}", roster())
        .replace("{{HOME_CAST}}", home_cast())
    )
    document = f"""<!doctype html>
<html lang="en" data-studio-version="{RELEASE['version']}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="theme-color" content="#f3f1ec">
<title>{escape(title)} | Kazeyami Innovations</title>
<meta name="description" content="{escape(description, quote=True)}">
<link rel="preload" href="assets/studio/manrope-variable.ttf" as="font" type="font/ttf" crossorigin>
<link rel="stylesheet" href="assets/studio/studio.css">
<link rel="stylesheet" href="assets/studio/gallery.css">
<script src="assets/studio/enquiry.js" defer></script>
<script src="assets/studio/studio.js" defer></script>
{scripts}
</head>
<body class="studio-site page-{slug}" id="top">
<a href="#main" class="studio-skip">Skip to content</a>
{header(active)}
<main id="main">{content}</main>
{footer(slug in ['index', 'connect'])}
</body></html>
"""
    (ROOT / filename).write_text(document, encoding="utf8")
print("Built 11 studio pages from templates. RAY runtime unchanged.")
