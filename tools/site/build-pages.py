"""Build the presentation pages. RAY's 3D runtime stays independent."""

from pathlib import Path
import re
import json
from html import escape

ROOT = Path(__file__).resolve().parents[2]
PAGES = [
    ("index.html", "Home", "The first impression"),
    ("about.html", "About", "A little about us"),
    ("portfolio.html", "Portfolio", "Ideas out in the world"),
    ("services.html", "Services", "What we bring"),
    ("team.html", "Team", "Different minds, shared curiosity"),
    ("connect.html", "Connect", "The start of something"),
]


def header(active):
    logo = (
        "kazeyami-logo-white.png" if active in ["index.html", "nexiv.html"] else "kazeyami-logo.png"
    )
    links = "".join(
        '<a href="'
        + url
        + '" '
        + ('aria-current="page"' if url == active else "")
        + '><span class="menu-index">0'
        + str(i)
        + "</span><span>"
        + label
        + "</span><small>"
        + note
        + '</small><b aria-hidden="true">↗</b></a>'
        for i, (url, label, note) in enumerate(PAGES, 1)
    )
    return f"""<header class="studio-header"><a class="studio-brand" href="index.html" aria-label="Kazeyami Innovations home"><img src="assets/{logo}" alt="Kazeyami Innovations" width="2665" height="760"></a><a class="header-note" href="about.html">INDEPENDENT MINDS.<br>CONNECTED POSSIBILITIES.</a><div class="studio-header-actions"><a class="header-work" href="portfolio.html">Selected work ↗</a><button class="studio-menu-toggle" aria-haspopup="dialog" aria-controls="studio-menu" aria-expanded="false">Menu <span class="menu-glyph" aria-hidden="true"><i></i><i></i></span></button></div></header>
<dialog id="studio-menu" class="studio-menu" aria-labelledby="menu-title"><div class="menu-top"><span id="menu-title">KAZEYAMI / A WAY IN</span><button data-close-menu aria-label="Close navigation">Close <span aria-hidden="true">×</span></button></div><nav aria-label="Main navigation">{links}</nav><div class="menu-bottom"><a href="mailto:hr@kazeyami.com">hr@kazeyami.com ↗</a><span>LUCKNOW, INDIA / OPEN TO THE WORLD</span></div></dialog>"""


def footer(compact=False):
    invitation = (
        ""
        if compact
        else '<a class="footer-invitation" href="connect.html"><span>Have something in mind?</span><strong>Let’s make it real.</strong><b aria-hidden="true">↗</b></a>'
    )
    return f"""<footer class="studio-footer {'compact-footer' if compact else ''}">{invitation}<div class="footer-info"><a href="index.html" class="footer-name">KAZEYAMI<br><span>INNOVATIONS</span></a><p>Design & technology innovation studio.<br>Lucknow, Uttar Pradesh · India · 226012</p><div><a href="mailto:hr@kazeyami.com">hr@kazeyami.com ↗</a><a href="https://www.linkedin.com/company/kazeyami" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a></div></div><div class="footer-base"><span>© 2026 Kazeyami Innovations Pvt. Ltd.</span><a href="portfolio.html">3D / NEXIV / BRAND & UI/UX</a><button class="studio-theme" type="button" aria-label="Switch to dark theme">Display: day ◐</button></div></footer>"""


def page(name, title, description, content, theme="paper", scripts="", compact=False):
    document = f"""<!doctype html><html lang="en" data-studio-version="1.0.0"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#111211"><title>{title} | Kazeyami Innovations</title><meta name="description" content="{description}"><link rel="preload" href="assets/studio/manrope-variable.ttf" as="font" type="font/ttf" crossorigin><link rel="stylesheet" href="assets/studio/studio.css"><script src="assets/studio/enquiry.js" defer></script><script src="assets/studio/studio.js" defer></script>{scripts}</head><body class="studio-site {theme}" id="top"><a href="#main" class="studio-skip">Skip to content</a>{header(name)}<main id="main">{content}</main>{footer(compact)}</body></html>"""
    (ROOT / name).write_text(document, encoding="utf8")


page(
    "index.html",
    "Ideas beyond the ordinary",
    "Kazeyami Innovations is a design and technology studio in Lucknow. Explore 3D, NEXIV and RAY, branding and digital experiences.",
    """
<section class="home-cinema" aria-labelledby="home-title"><video id="studio-reel" muted loop playsinline preload="metadata" poster="assets/experience-center-poster.jpg" aria-label="Kazeyami experience center architectural film"><source src="assets/experience-center.mp4" type="video/mp4"></video><div class="cinema-shade" aria-hidden="true"></div><div class="home-topline"><span class="live-dot">DESIGN. TECHNOLOGY. A LITTLE CURIOSITY.</span><span>LUCKNOW, INDIA ↗</span></div><div class="home-title"><p class="kicker">WE ARE KAZEYAMI INNOVATIONS</p><h1 id="home-title">Ideas, beyond<br>the <em>ordinary.</em></h1><a class="circle-link light-link" href="about.html"><span class="circle-arrow" aria-hidden="true">↗</span><span>Enter the studio</span></a></div><a class="home-focus" href="nexiv.html"><span>IN FOCUS / OUR PRODUCT WORLD</span><strong>NEXIV <i>→</i> RAY</strong><small>Architecture, experienced. ↗</small></a><div class="film-controls"><span>01 / EXPERIENCE CENTER</span><div><span id="film-time" aria-hidden="true">00:00</span><button class="reel-toggle" aria-controls="studio-reel" aria-label="Play background film"><span class="play-state" aria-hidden="true">▷</span><span class="reel-label">Play film</span></button></div></div></section><section class="home-ribbon"><p>Spaces. Stories. Interfaces.<br><span>Different mediums. The same curiosity.</span></p><a href="portfolio.html">Explore our work <span aria-hidden="true">↗</span></a></section>""",
    theme="cinematic",
    compact=True,
    scripts="""<script>const oldRoutes={studio:'about.html',process:'about.html#process',services:'services.html',contact:'connect.html',faq:'connect.html#faq',ray:'ray.html','three-d':'3d.html',work:'3d.html#work',design:'design.html',products:'products.html'};if(oldRoutes[location.hash.slice(1)])location.replace(oldRoutes[location.hash.slice(1)]);</script>""",
)

page(
    "about.html",
    "A studio built on curiosity",
    "Meet Kazeyami Innovations: connecting architectural visualization, 3D craft, branding and digital experiences.",
    """
<section class="editorial-hero content-pad"><div class="page-rail"><span>02 / ABOUT THE STUDIO</span><span>AN IDEA IS ONLY THE BEGINNING</span></div><h1>Curiosity is our<br><em>common ground.</em><span class="accent-star" aria-hidden="true">✳</span></h1><div class="intro-split"><span class="micro">DESIGN × TECHNOLOGY</span><p>We connect design, 3D craft and technology to turn an idea into something people can explore, understand and remember.</p></div></section>
<section class="about-statement content-pad"><h2>Imagined with purpose.<br>Built to be experienced.</h2><div><p>From an architectural world in RAY to a digital product, each direction begins with the experience we want to create. We bring visual thinking and technical decisions into the same conversation.</p><p>Based in Lucknow, Kazeyami Innovations works across architectural visualization, 3D, design, branding and technology solutions. Different disciplines, connected by a shared interest in what comes next.</p><a class="underline-link" href="services.html">Find your direction ↗</a></div></section>
<section class="about-playground content-pad"><div class="section-rail"><span>THE STUDIO, IN PLAY</span><span>MOVE. SCATTER. MAKE SOMETHING DIFFERENT.</span></div><div id="logo-playground" class="new-logo-playground"><canvas aria-hidden="true"></canvas><div class="playground-copy"><span class="live-dot">CURIOSITY IS CONTAGIOUS</span><h2>A little room<br>for <em>play.</em></h2><p>Good ideas rarely stay in one shape.</p></div><div class="scene-controls"><button class="scene-action">Change color & scatter ↗</button><span class="scene-status" role="status">Move through the shapes · click to scatter</span></div></div></section>
<section id="process" class="process-block content-pad"><div class="section-rail"><span>HOW WE WORK</span><span>FROM BRIEF TO EXPERIENCE</span></div><h2>A clear path.<br>An open mind.</h2><div class="process-grid"><article><span>01 / DEFINE</span><h3>Find the essential idea.</h3><p>Your audience, purpose, plans and references help us establish the scope and creative direction.</p></article><article><span>02 / DEVELOP</span><h3>Make it tangible.</h3><p>Review the work as it develops, from composition and materials to motion and interaction.</p></article><article><span>03 / DELIVER</span><h3>Prepare it for people.</h3><p>Refine the final outcome and prepare the agreed deliverables for your presentation, launch or digital experience.</p></article></div></section>""",
    scripts='<script src="assets/three.min.js" defer></script><script src="assets/logo-scene.js" defer></script>',
)

page(
    "portfolio.html",
    "Selected work & product worlds",
    "Explore Kazeyami's 3D work, NEXIV and its RAY archviz platform, brand and UI/UX practice, and independent products.",
    """
<section class="portfolio-heading content-pad"><div class="page-rail"><span>03 / SELECTED WORK</span><span>FORM / FEELING / FUNCTION</span></div><h1>Ideas out<br><em>in the world.</em><span class="title-arrow" aria-hidden="true">↘</span></h1><div class="portfolio-toolbar"><p>A few ways our curiosity takes shape.</p><div class="work-filters" role="group" aria-label="Filter portfolio"><button data-filter="all" aria-pressed="true">All work <small>05</small></button><button data-filter="3d" aria-pressed="false">3D</button><button data-filter="nexiv" aria-pressed="false">NEXIV</button><button data-filter="design" aria-pressed="false">Brand / UI/UX</button><button data-filter="products" aria-pressed="false">Ventures</button></div></div><p id="work-status" class="sr-only" role="status">Showing all 5 portfolio entries</p></section>
<section class="work-grid content-pad" aria-label="Portfolio entries"><article class="work-entry nexiv-entry" data-category="nexiv"><a class="nexiv-visual" href="nexiv.html"><img src="assets/ray/media/ray-platform-preview.webp" alt="RAY's interactive waterfront prototype with orbit and lighting controls" width="1280" height="720" fetchpriority="high"><div class="nexiv-visual-top"><span>A KAZEYAMI BRAND</span><span>PRODUCT / REAL-TIME 3D</span></div><strong>NEXIV<span>→ RAY</span></strong><span class="image-arrow" aria-hidden="true">↗</span></a><div class="work-caption"><div><span>01 / NEXIV</span><h2>Worlds worth stepping into.</h2></div><p>Our product brand. Home to RAY, the architectural visualization platform.</p></div></article>
<article class="work-entry" data-category="3d"><button class="work-image medical-image" data-film="medical" aria-label="Watch AMD medical explainer"><img src="assets/amd-medical-poster.png" alt="AMD medical visualization showing an eye examination" width="1920" height="1080" loading="lazy"><span class="image-tag">PLAY PROJECT FILM</span><span class="image-arrow" aria-hidden="true">↗</span></button><div class="work-caption"><div><span>02 / 3D · MEDICAL EXPLAINER</span><h2>Make the complex clear.</h2></div><a href="3d.html#work" class="small-link">Explore AMD ↗</a></div></article>
<article class="work-entry" data-category="3d"><button class="work-image" data-film="miniature" aria-label="Watch Mario miniature project"><img src="assets/studio/mario-preview.webp" alt="Mario miniature sculpt and separated components for 3D printing" width="1440" height="810" loading="lazy"><span class="image-tag">PLAY PROJECT FILM</span><span class="image-arrow" aria-hidden="true">↗</span></button><div class="work-caption"><div><span>03 / 3D · MINIATURE & PRINT DESIGN</span><h2>Personality, in every detail.</h2></div><a href="3d.html#work" class="small-link">Explore Mario ↗</a></div></article>
<article class="work-entry design-entry" data-category="design"><a class="design-visual" href="design.html"><div class="design-types"><span>Aa</span><span class="design-cursor" aria-hidden="true">↖</span><div class="design-swatch"></div><div class="design-outline">ab</div></div><span class="image-tag">DESIGN & COMMUNICATION</span><span class="image-arrow" aria-hidden="true">↗</span></a><div class="work-caption"><div><span>04 / BRAND · UI/UX · MOTION</span><h2>Clarity with character.</h2></div><p>Explore the practice.<br>Selected case studies are in preparation.</p></div></article>
<article class="work-entry ventures-entry" data-category="products"><a href="products.html"><span class="micro">05 / PRODUCTS & VENTURES</span><h2>Independent ideas.<br><em>Distinct worlds.</em></h2><p>Kazeyami Tools / Mock Yatra</p><span class="circle-arrow" aria-hidden="true">↗</span></a></article></section>
<dialog id="studio-film" class="studio-film" aria-labelledby="studio-film-title"><div class="film-dialog-heading"><h2 id="studio-film-title">Project film</h2><button data-close-film aria-label="Close project film">Close ×</button></div><video controls playsinline preload="none"></video><div class="film-dialog-copy"><p id="studio-film-description"></p><a href="3d.html#work" class="underline-link">Explore the project & process ↗</a></div></dialog>""",
)

page(
    "nexiv.html",
    "NEXIV — Home to RAY",
    "NEXIV is a Kazeyami Innovations brand. Discover RAY, its architectural visualization platform, and explore the browser-based waterfront prototype.",
    """
<section class="nexiv-hero content-pad"><div class="page-rail"><a href="portfolio.html">PORTFOLIO / NEXIV</a><span>A BRAND BY KAZEYAMI INNOVATIONS</span></div><h1>NEXIV<span class="nexiv-dot" aria-hidden="true">.</span></h1><div class="intro-split"><span class="micro">THE BRAND BEHIND RAY</span><p>A home for experiences that bring architecture closer.</p></div></section>
<section class="nexiv-product content-pad"><div class="brand-family"><span>KAZEYAMI INNOVATIONS</span><span aria-hidden="true">→</span><strong>NEXIV</strong><span aria-hidden="true">→</span><strong>RAY</strong></div><a class="ray-browser" href="ray-experience.html"><div class="browser-bar"><span class="browser-dots" aria-hidden="true">● ● ●</span><span>RAY / INTERACTIVE EXTERIOR PROTOTYPE</span><span>↗</span></div><img src="assets/ray/media/ray-platform-preview.webp" alt="Launch RAY's real 3D waterfront web experience with camera and lighting controls" width="1280" height="720" loading="lazy"><span class="launch-pill">Enter the web experience ↗</span></a><div class="nexiv-product-copy"><div><span class="micro">THE ARCHVIZ PLATFORM / BY NEXIV</span><h2>This is <em>RAY.</em></h2></div><div><p>Move beyond the plan and into the place. RAY brings architectural vision into an experience people can explore, with real-time views, materials and presentation.</p><p class="muted">Try the waterfront exterior prototype: orbit the building, change the daylight and discover the site from your own point of view.</p><a class="underline-link" href="ray.html">Discover the RAY platform ↗</a></div></div></section>""",
    theme="ink-page",
)

SERVICES = [
    (
        "Architectural visualization",
        "Make a place felt before it is built.",
        "Images, architectural films, 360° tours and RAY experiences that communicate materials, atmosphere, layout and scale.",
        [
            "Interior & exterior renders",
            "Walkthroughs & films",
            "360° virtual tours",
            "RAY interactive experiences",
        ],
        "ray.html",
        "Explore RAY",
    ),
    (
        "3D & interactive worlds",
        "Give the unseen a dimension.",
        "From medical explanations to miniature characters, game assets and interactive environments, we bring form and motion together around the story.",
        [
            "Medical & explainer animation",
            "Miniatures & 3D-print design",
            "Game assets & environments",
            "Game development",
        ],
        "3d.html",
        "Explore 3D Studio",
    ),
    (
        "UI / UX design",
        "Make every next step feel natural.",
        "Interfaces shaped around a product’s purpose, the people using it and the moments that make an experience feel intuitive.",
        [
            "User journeys",
            "Interface design",
            "Interaction & prototypes",
            "Digital product experiences",
        ],
        "design.html",
        "Explore design",
    ),
    (
        "Branding & communication",
        "Give the idea a character of its own.",
        "Identity and communication work together so an organization’s character carries across the places people meet it.",
        ["Visual identity", "Brand language", "Communication design", "Digital brand experiences"],
        "design.html",
        "Explore the practice",
    ),
    (
        "Film & motion",
        "Let a story unfold.",
        "Rhythm, movement and visual storytelling turn a message into a sequence. From editing to motion, the idea guides the creative direction.",
        ["Video editing", "Motion graphics", "3D animation", "Architectural & product films"],
        "portfolio.html",
        "Watch selected work",
    ),
    (
        "Products & technology",
        "Build what the idea needs.",
        "Creative direction and technology meet in digital products, prototypes and independent ideas. We establish the right scope around your audience and purpose.",
        [
            "Product design",
            "Interactive prototypes",
            "Technology solutions",
            "Independent ventures",
        ],
        "products.html",
        "Explore products & ventures",
    ),
]
rows = "".join(
    f'<details class="service-row" {"open" if i==1 else ""}><summary><span class="service-number">0{i}</span><h2>{title}</h2><span class="service-plus" aria-hidden="true">+</span></summary><div class="service-content"><h3>{lead}</h3><div><p>{copy}</p><ul>'
    + "".join(f"<li>{item}</li>" for item in items)
    + f'</ul><a class="underline-link" href="{link}">{cta} ↗</a></div></div></details>'
    for i, (title, lead, copy, items, link, cta) in enumerate(SERVICES, 1)
)
page(
    "services.html",
    "Different disciplines, one studio",
    "Architectural visualization, 3D animation, miniatures, game assets, UI/UX, branding, film and technology solutions by Kazeyami Innovations.",
    """
<section class="editorial-hero services-hero content-pad"><div class="page-rail"><span>04 / WHAT WE BRING</span><span>THINK WIDE. MAKE WITH INTENT.</span></div><h1>Different tools.<br><em>One curious studio.</em></h1><div class="intro-split"><span class="micro">IDEA → EXPERIENCE</span><p>Sometimes a project needs one discipline. Sometimes it needs the space between them.</p></div></section><section class="service-list content-pad" aria-label="Our services">"""
    + rows
    + """</section><section class="service-end content-pad"><span class="micro">A COMBINATION IS WELCOME</span><p>You bring the ambition.<br>We’ll find the right way in.</p><a class="circle-link" href="connect.html"><span class="circle-arrow" aria-hidden="true">↗</span><span>Tell us what you’re imagining</span></a></section>""",
)


team = json.loads((ROOT / "tools/site/team.json").read_text(encoding="utf8"))
cards = ""
for i, artist in enumerate(team, 1):
    attrs = " ".join(
        "data-" + key + '="' + escape(artist[key], quote=True) + '"'
        for key in ["name", "role", "tag", "focus", "link", "cta"]
    )
    cards += f"""<button class="artist-card" {attrs} aria-haspopup="dialog" aria-label="Meet {artist['name']}, {artist['role']}"><span class="artist-image"><img src="assets/studio/{artist['id']}.webp" alt="Original fictional anime avatar for {artist['name']}" width="1122" height="1402" loading="lazy"><span class="artist-number">0{i}</span><span class="artist-tag">{artist['tag']}</span></span><span class="artist-caption"><strong>{artist['name']}</strong><span>{artist['role']}<b aria-hidden="true">↗</b></span></span></button>"""
page(
    "team.html",
    "Meet the main characters",
    "Meet the real Kazeyami team through original anime alter egos: artists, developers, HR and creative technologists.",
    """
<section class="team-heading content-pad"><div class="page-rail"><span>05 / THE PEOPLE BEHIND THE PIXELS</span><span>07 CHARACTERS / ONE STUDIO</span></div><h1>Meet the<br><em>main characters.</em><span class="accent-star" aria-hidden="true">✳</span></h1><p>A fictional cast. A real creative team.<br>Different personalities, shared curiosity and a little main-character energy.</p></section>
<section class="team-cast content-pad" aria-label="Kazeyami team"><div class="cast-rail"><span>OUR STUDIO, IN ANOTHER UNIVERSE</span><button class="cast-shuffle">Remix the cast ↻</button></div><div class="cast-grid">"""
    + cards
    + """<div class="cast-signoff"><p>Good chemistry.<br>Great possibilities.<span>THE KAZEYAMI MIX ✳</span></p></div></div><p class="cast-note">Original fictional anime avatars, created for our studio. Tap a character to meet the real person and their role.</p><span class="sr-only" id="cast-status" role="status"></span></section>
<dialog id="artist-dialog" class="artist-dialog" aria-labelledby="artist-name"><div class="artist-dialog-grid"><img class="artist-dialog-image" alt=""><div class="artist-dialog-copy"><button data-close-artist aria-label="Close team profile">Close ×</button><span class="micro">KAZEYAMI / CHARACTER FILE</span><h2 id="artist-name"></h2><p id="artist-role" class="artist-dialog-role"></p><span id="artist-tag" class="artist-tag"></span><p id="artist-focus" class="artist-dialog-note"></p><a id="artist-link" class="underline-link" href="portfolio.html">Explore the studio ↗</a></div></div></dialog>
<section class="team-outro content-pad"><span class="micro">THE CONNECTING THREAD</span><h2>No single lens<br>sees the <em>whole picture.</em></h2><p>We bring different perspectives to the same table: design, technology, 3D and the people who connect it all. That’s where the interesting work begins.</p><a class="circle-link" href="connect.html"><span class="circle-arrow" aria-hidden="true">↗</span><span>Make something with us</span></a></section>""",
)

page(
    "connect.html",
    "Let's make something happen",
    "Connect with Kazeyami Innovations in Lucknow to discuss architectural visualization, design, 3D, branding or technology.",
    """
<section class="connect-hero content-pad"><div class="page-rail"><span>06 / LET’S CONNECT</span><span>THE START OF SOMETHING</span></div><h1>Good things start<br>with a <em>hello.</em><span aria-hidden="true">↗</span></h1><div class="connect-first"><p>A half-formed idea. A detailed brief.<br>A question worth asking. We’re listening.</p><a href="mailto:hr@kazeyami.com">hr@kazeyami.com</a><button class="copy-email" aria-label="Copy studio email address">Copy email ↗</button><span id="copy-status" role="status"></span></div></section>
<section class="enquiry-section content-pad"><div class="enquiry-intro"><span class="micro">LET’S MAKE IT CONCRETE</span><h2>What are you<br>imagining?</h2><p>Share a little context. The form prepares an email draft for you to review and send.</p><div class="contact-address"><span class="micro">FIND OUR STUDIO</span><p>Lucknow, Uttar Pradesh<br>India · 226012</p><a href="https://www.linkedin.com/company/kazeyami" target="_blank" rel="noopener noreferrer" class="underline-link">Find us on LinkedIn ↗</a></div></div>
<form id="studio-brief" class="studio-brief"><div><label for="name">Your name *</label><input id="name" name="name" autocomplete="name" placeholder="What should we call you?" required maxlength="120"></div><div><label for="company">Company</label><input id="company" name="company" autocomplete="organization" placeholder="Your company / studio" maxlength="160"></div><div><label for="email">Email address *</label><input id="email" name="email" type="email" autocomplete="email" placeholder="you@company.com" required maxlength="200"></div><div><label for="phone">Phone / WhatsApp</label><input id="phone" name="phone" type="tel" autocomplete="tel" placeholder="+91 · Your number" maxlength="50"></div><div><label for="country">Country</label><input id="country" name="country" autocomplete="country-name" value="India" maxlength="100"></div><div><label for="service">A direction in mind?</label><select id="service" name="service"><option>Architectural visualization</option><option>RAY / NEXIV experience</option><option>3D animation & miniatures</option><option>UI / UX design</option><option>Branding & communication</option><option>Film & motion</option><option>Products & technology</option><option>A combination</option></select></div><div class="full-field"><label for="message">A little about your project *</label><textarea id="message" name="message" rows="4" required maxlength="3000" placeholder="The idea, who it’s for, what you need and when…"></textarea></div><div class="full-field brief-bottom"><button class="circle-link" type="submit"><span class="circle-arrow" aria-hidden="true">↗</span><span>Prepare my enquiry</span></button><p id="brief-status" role="status">Your email app opens a draft. Nothing is sent automatically.</p></div></form></section>
<section id="faq" class="connect-faq content-pad"><div class="section-rail"><span>BEFORE WE BEGIN</span><span>A FEW USEFUL ANSWERS</span></div><h2>A little clarity.</h2><details><summary>What should I include in my brief?<span aria-hidden="true">+</span></summary><p>Tell us about the project, its audience and how you plan to use the work. Include plans or models if available, references, the deliverables you need and your target date.</p></details><details><summary>Which visualization format fits my project?<span aria-hidden="true">+</span></summary><p>Still images communicate key views. Films show a space through motion. A 360° tour connects fixed viewpoints, while RAY offers an interactive way to explore. We can discuss the right format for your brief.</p></details><details><summary>How do pricing and timelines work?<span aria-hidden="true">+</span></summary><p>They depend on scope, complexity, available source material and required deliverables. Share your brief so we can discuss an appropriate quotation and schedule.</p></details><details><summary>Can my project combine different services?<span aria-hidden="true">+</span></summary><p>Yes. Kazeyami connects design, branding, technology, 3D and architectural visualization. Tell us what you are planning and we can explore the scope together.</p></details></section>""",
    compact=True,
)


def update_detail_shell(name):
    path = ROOT / name
    source = path.read_text(encoding="utf8")
    if 'class="studio-header"' in source:
        return
    source = re.sub(r"<script>\s*try\s*\{.*?kazeyami-theme.*?</script>", "", source, flags=re.S)
    source = source.replace(
        '</head>',
        '<link rel="stylesheet" href="assets/studio/studio.css"><script src="assets/studio/enquiry.js" defer></script><script src="assets/studio/studio.js" defer></script></head>',
    )
    source = re.sub(r'<body\b[^>]*>', '<body id="top" class="studio-site legacy-page subpage">', source, count=1)
    start, end = source.index("<header"), source.index("<main")
    source = source[:start] + header("portfolio.html") + source[end:]
    source = re.sub(r'<nav class="page-navigation".*?</nav>', "", source, flags=re.S)
    source = re.sub(
        r'<section\b(?=[^>]*\bid="contact")[^>]*>.*?</section>', "", source, flags=re.S
    )
    source = re.sub(r"<footer.*?</footer>", footer(), source, flags=re.S)
    source = source.replace('<script src="assets/site.js"></script>', "")
    source = source.replace('href="#contact"', 'href="connect.html"').replace(
        'href="index.html#contact"', 'href="connect.html"'
    )
    if name == "ray.html":
        source = source.replace(
            "RAY — Architectural Visualization |", "RAY by NEXIV — Architectural Visualization |"
        )
        source = source.replace(
            '<main id="main" class="wrap">',
            '<main id="main" class="wrap"><div class="detail-family"><a href="portfolio.html">PORTFOLIO</a> / <a href="nexiv.html">NEXIV</a> / RAY</div>',
        )
        source = source.replace("(02 / OUR PLATFORM)", "(NEXIV / OUR ARCHVIZ PLATFORM)")
    source = re.sub(
        r"<h2>(.*?)</h2>", r'<h1 class="detail-title">\1</h1>', source, count=1, flags=re.S
    )
    path.write_text(source, encoding="utf8")


for detail in ["3d.html", "design.html", "products.html", "ray.html"]:
    update_detail_shell(detail)
print("Built six studio pages, NEXIV brand page and retained detail navigation.")
