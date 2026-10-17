"""Validate structure, local routes, team facts and retained content."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote
import json

ROOT = Path(__file__).resolve().parents[2]
pages = [
    "index.html",
    "about.html",
    "portfolio.html",
    "services.html",
    "team.html",
    "connect.html",
    "nexiv.html",
    "3d.html",
    "design.html",
    "products.html",
    "ray.html",
]


class Document(HTMLParser):
    def __init__(self, source):
        super().__init__()
        self.ids = set()
        self.links = []
        self.h1 = 0
        self.alts = []
        self.meta = False
        self.feed(source)

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if a.get("id"):
            assert a["id"] not in self.ids, "Duplicate ID: " + a["id"]
            self.ids.add(a["id"])
        if tag == "h1":
            self.h1 += 1
        if tag == "meta" and a.get("name") == "description":
            self.meta = bool(a.get("content"))
        for key in ["src", "href", "poster"]:
            if a.get(key):
                self.links.append(a[key])
        if tag == "img":
            self.alts.append("alt" in a)


documents = {}
for name in pages:
    source = (ROOT / name).read_text(encoding="utf8")
    doc = documents[name] = Document(source)
    assert doc.h1 == 1, f"{name}: needs one page title"
    assert doc.meta and all(doc.alts), f"{name}: missing description or alt"
    assert "studio-menu" in doc.ids and "assets/site.js" not in source
    assert (
        "assets/studio/studio.css" in source and "assets/studio/studio.js" in source
    ), f"{name}: missing shared shell assets"
    assert "assets/site.css" not in source, f"{name}: legacy style collision"
    assert "studio-site" in source, f"{name}: missing studio body class"
for name, doc in documents.items():
    for link in doc.links:
        parts = urlsplit(link)
        if parts.scheme or parts.netloc:
            continue
        target = ROOT / unquote(parts.path) if parts.path else ROOT / name
        assert target.exists(), f"{name}: broken resource {link}"
        if parts.fragment and target.name in documents:
            assert (
                unquote(parts.fragment) in documents[target.name].ids
            ), f"{name}: broken anchor {link}"
home_source = (ROOT / "index.html").read_text(encoding="utf8")
for section in ["work", "studio", "nexiv", "services", "team", "connect"]:
    assert section in documents["index.html"].ids, f"Missing home section: {section}"
assert "home-gallery.js" in home_source and "gallery.css" in home_source
assert home_source.count('class="home-person"') == 7
assert "{{HOME_CAST}}" not in home_source and "{{ROSTER}}" not in home_source
team = json.loads((ROOT / "tools/site/team.json").read_text(encoding="utf8"))
version = json.loads((ROOT / "tools/site/version.json").read_text(encoding="utf8"))["version"]
for name in pages:
    assert f'data-studio-version="{version}"' in (ROOT / name).read_text(encoding="utf8")
    assert (ROOT / "tools/site/templates" / name).exists(), f"Missing editable template: {name}"
expected = {
    "Siya Baranwal": "UI/UX Artist",
    "Pragati Saxena": "HR",
    "DK": "Developer",
    "Deepraj": "Senior Developer",
    "Shayan Ansari": "Technical Artist",
    "Akash Singh": "3D Artist",
    "Hammer": "Unreal Artist",
}
assert {a["name"]: a["role"] for a in team} == expected
team_html = (ROOT / "team.html").read_text(encoding="utf8")
for artist in team:
    assert f'data-name="{artist["name"]}"' in team_html
    assert (ROOT / "assets/studio" / (artist["id"] + ".webp")).stat().st_size < 300000
for category in ["3d", "nexiv", "design", "products"]:
    assert f'data-category="{category}"' in (ROOT / "portfolio.html").read_text(encoding="utf8")
assert "ray-experience.html" in (ROOT / "nexiv.html").read_text(encoding="utf8")
assert "NEXIV" in (ROOT / "ray.html").read_text(encoding="utf8")
for name, text in [
    ("about.html", "logo-playground"),
    ("about.html", 'id="process"'),
    ("connect.html", 'id="faq"'),
    ("3d.html", "project-film-dialog"),
    ("3d.html", "image-flow.js"),
    ("products.html", "Mock Yatra"),
    ("products.html", "Kazeyami Tools"),
]:
    assert text in (ROOT / name).read_text(
        encoding="utf8"
    ), f"Retained content missing: {name}/{text}"
print(
    "Pass: 11 page structures, internal resources/anchors, 7 exact team names/roles, retained work/interactive logo/process/FAQ, NEXIV to RAY."
)
