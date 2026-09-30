// Builds public/landing-pages/complete-shelf-v2.html from ThreeUI's authored
// "Working Volumes" page (MIT, @designcodeio/threeui 1.2.0) for College Value Lab.
//
// The renderer, covers, motion and interaction stay exactly as published. Only the
// seven volumes' words change: each book becomes an elite university from our data,
// the collection is renamed "The Elite Shelf", and choosing a book posts the college
// id to the parent page (same origin) so the site can open that college.
//
// Run: node scripts/build-college-shelf.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const SRC = "node_modules/@designcodeio/threeui/lib-dist/assets/landing-pages/complete-shelf-v2.html";
const OUT = "public/landing-pages/complete-shelf-v2.html";

// Order matches the authored covers (I..VII). Words only: no figures are invented here;
// the real numbers appear on the college page this links to.
const UNIVERSITIES = [
  { id: "codex", college: "yale", title: "Yale", discipline: "Private · New Haven, CT", note: "Residential colleges, generous grants, and a long view." },
  { id: "claude-code", college: "princeton", title: "Princeton", discipline: "Private · Princeton, NJ", note: "A small campus with no-loan aid at its heart." },
  { id: "cursor", college: "uchicago", title: "UChicago", discipline: "Private · Chicago, IL", note: "The Core, the quadrangles, and a question for everything." },
  { id: "antigravity", college: "columbia", title: "Columbia", discipline: "Private · New York, NY", note: "A city for a campus, and a core curriculum at its centre." },
  { id: "figma", college: "harvard", title: "Harvard", discipline: "Private · Cambridge, MA", note: "The oldest name on the shelf, and the most asked about." },
  { id: "framer", college: "stanford", title: "Stanford", discipline: "Private · Stanford, CA", note: "Sunlit quads beside the valley that builds things." },
  { id: "xcode", college: "mit", title: "MIT", discipline: "Private · Cambridge, MA", note: "Mind and hand: problem sets, labs and making." },
];

function replaceOnce(s, from, to) {
  if (!s.includes(from)) throw new Error(`build-college-shelf: could not find ${JSON.stringify(from.slice(0, 80))}`);
  return s.replace(from, to);
}

let html = readFileSync(SRC, "utf8");

// --- each volume: swap the words inside its BOOKS entry, keep colours, covers and seeds
for (const u of UNIVERSITIES) {
  const start = html.indexOf(`id: "${u.id}",`);
  if (start < 0) throw new Error(`build-college-shelf: book ${u.id} not found`);
  const end = html.indexOf("seed:", start);
  let entry = html.slice(start, end);
  const set = (key, value) => {
    const re = new RegExp(`${key}: "[^"]*"`);
    if (!re.test(entry)) throw new Error(`build-college-shelf: ${u.id}.${key} not found`);
    entry = entry.replace(re, `${key}: ${JSON.stringify(value)}`);
  };
  set("title", u.title);
  set("discipline", u.discipline);
  set("note", u.note);
  set("deck", `${u.note} Close this volume to see ${u.title}'s figures below, then open its full numbers: the net price after grants, the likely debt, typical pay by major, and when it pays for itself.`);
  set("theme", `${u.title} · cost, debt and payoff`);
  entry = entry.replace(/chapters: \[[^\]]*\]/, 'chapters: ["Net cost", "Debt", "Payoff"]');
  entry = entry.replace(`id: "${u.id}",`, `id: "${u.id}",\n        collegeId: ${JSON.stringify(u.college)},`);
  html = html.slice(0, start) + entry + html.slice(end);
}

// --- collection naming
html = replaceOnce(html, "<title>Working Volumes — Seven Tools for Making</title>", "<title>The Elite Shelf — College Value Lab</title>");
html = html.replace(/content="Working Volumes is an original interactive Three\.js library[^"]*"/, 'content="The Elite Shelf: seven elite universities as tactile volumes. Choose one to see what that college path really costs."');
html = replaceOnce(html, "<strong>Working Volumes</strong>", "<strong>The Elite Shelf</strong>");
html = replaceOnce(html, "<span>Seven field guides for making</span>", "<span>Seven universities, priced honestly</span>");
html = replaceOnce(html, "<span>Edition 02 · 2026</span>", "<span>College Value Lab · Sample data</span>");
html = replaceOnce(html, "Working Volumes · Static catalog", "The Elite Shelf · Static catalog");
html = replaceOnce(html, "Seven tools for making.", "Seven universities, priced honestly.");
html = html.replaceAll("WORKING VOLUMES  /", "THE ELITE SHELF  /");
html = html.replaceAll("Conceived as an original editorial study for Working Volumes.", "A volume of The Elite Shelf by College Value Lab.");

// --- tell the parent page which university is chosen (same-origin frame)
html = replaceOnce(
  html,
  "      if (announce) {\n        liveRegion.textContent = `Selected volume ${selectedIndex + 1} of ${BOOKS.length}: ${book.title}. ${book.note}`;\n      }",
  "      if (announce) {\n        liveRegion.textContent = `Selected volume ${selectedIndex + 1} of ${BOOKS.length}: ${book.title}. ${book.note}`;\n      }\n      try { window.parent.postMessage({ cvlShelf: { collegeId: book.collegeId, title: book.title, index: selectedIndex } }, window.location.origin); } catch (error) {}",
);

mkdirSync("public/landing-pages", { recursive: true });
writeFileSync(OUT, html);
console.log(`wrote ${OUT} (${html.length} bytes)`);
