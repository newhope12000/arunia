import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homePage, cohortPage } from "../renewal/feature-pages.mjs";
import { contentPages } from "../renewal/content-pages.mjs";
import { renderPage } from "../renewal/layout.mjs";
import { renderOfficialHome } from "../renewal/official-home.mjs";
import {
  extractContest,
  renderOfficialPrograms,
} from "../renewal/official-programs.mjs";
import { NEWS } from "../renewal/news-data.mjs";
import { renderNewsArticle, renderNewsIndex } from "../renewal/news-pages.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");
const fontHref = "/assets/pretendard.css";

function htmlFiles(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(prefix, entry.name);
    return entry.isDirectory()
      ? htmlFiles(join(directory, entry.name), path)
      : /\.html?$/i.test(entry.name)
        ? [path]
        : [];
  });
}

function stylesheets(html) {
  return [...html.matchAll(/<link\b[^>]*>/gi)]
    .filter(([tag]) => /\brel=["']stylesheet["']/i.test(tag))
    .map(([tag]) => ({
      tag,
      href: /\bhref=["']([^"']+)["']/i.exec(tag)?.[1],
      index: html.indexOf(tag),
    }));
}

function verifyCommonFontLink(html, page) {
  const links = stylesheets(html).filter((link) => link.href === fontHref);
  assert.equal(
    links.length,
    1,
    `${page} must load the common font stylesheet exactly once`,
  );
  const headStart = html.indexOf("<head");
  const headEnd = html.indexOf("</head>");
  assert.ok(
    links[0].index > headStart && links[0].index < headEnd,
    `${page} font link belongs in the document head`,
  );
  const lastInlineStyle = html.slice(0, headEnd).lastIndexOf("</style>");
  assert.ok(
    links[0].index > lastInlineStyle,
    `${page} must load its font override after existing inline styles`,
  );
}

function verifyWoff2(path) {
  const buffer = readFileSync(path);
  assert.ok(
    buffer.length >= 48,
    `${path} must contain a WOFF2 header and data`,
  );
  assert.equal(
    buffer.toString("ascii", 0, 4),
    "wOF2",
    `${path} must be an actual WOFF2 font`,
  );
  assert.equal(
    buffer.readUInt32BE(8),
    buffer.length,
    `${path} WOFF2 declared length must match the stored file`,
  );
  assert.ok(
    buffer.readUInt32BE(16) > 0,
    `${path} must declare an uncompressed font size`,
  );
}

function selectorList(value) {
  const text = value.replace(/\/\*[^]*?\*\//g, "");
  const selectors = [];
  let depth = 0;
  let start = 0;
  for (let index = 0; index < text.length; index++) {
    if (text[index] === "(") depth++;
    if (text[index] === ")") depth--;
    if (text[index] === "," && depth === 0) {
      selectors.push(text.slice(start, index).trim());
      start = index + 1;
    }
  }
  selectors.push(text.slice(start).trim());
  return selectors;
}

test("every existing public page and generated page loads one shared Pretendard stylesheet", () => {
  const files = htmlFiles(join(root, "legacy"));
  assert.ok(files.length > 0);
  for (const file of files) verifyCommonFontLink(read(`legacy/${file}`), file);
  const generated = new Map([
    ["/", renderOfficialHome()],
    [
      "/programs.html",
      renderOfficialPrograms(extractContest(read("legacy/programs.html"))),
    ],
    ["/news", renderNewsIndex()],
    ...NEWS.map((record) => [
      `/news/${record.slug}`,
      renderNewsArticle(record),
    ]),
    ...[homePage, cohortPage, ...contentPages].map((page) => [
      `/v0_1/${page.slug}`,
      renderPage(page),
    ]),
  ]);
  for (const [page, html] of generated) verifyCommonFontLink(html, page);
});

test("the shared font is a self-hosted WOFF2 with its license and overrides descendant fonts", () => {
  const css = read("legacy/assets/pretendard.css");
  const face = css.match(/@font-face\s*\{([^}]+)\}/)?.[1];
  assert.ok(face, "The font stylesheet must declare a real font face");
  assert.match(face, /font-family:\s*["']Pretendard Variable["']/);
  assert.match(face, /font-weight:\s*45\s+920\s*;/);
  assert.match(face, /font-display:\s*swap\s*;/);
  const urls = [...face.matchAll(/url\(["']?([^"')]+)["']?\)/g)].map(
    ([, path]) => path,
  );
  assert.equal(urls.length, 1, "The variable font has one self-hosted source");
  assert.doesNotMatch(
    urls[0],
    /^(?:https?:|\/\/|data:)/i,
    "Font loading must not depend on an external CDN",
  );
  const file = join(root, "legacy/assets", urls[0]);
  assert.ok(existsSync(file));
  verifyWoff2(file);
  const license = join(dirname(file), "LICENSE");
  assert.ok(existsSync(license), "The shipped font must include its license");
  assert.match(
    readFileSync(license, "utf8"),
    /SIL OPEN FONT LICENSE Version 1\.1/,
  );
  assert.match(readFileSync(license, "utf8"), /Pretendard/);

  const override = [...css.matchAll(/([^{}]+)\{([^{}]+)\}/g)].find(
    ([, , declarations]) =>
      /font-family:[^;]*Pretendard Variable[^;]*!important/s.test(declarations),
  );
  assert.ok(
    override,
    "Common typography must override older page-specific font families",
  );
  const selectors = selectorList(override[1]);
  for (const selector of [
    "html",
    "body",
    "body *",
    "body *::before",
    "body *::after",
    "body *::placeholder",
  ])
    assert.ok(
      selectors.includes(selector),
      `Common typography must cover ${selector}`,
    );
  // body * includes paragraphs, links, buttons and form inputs even when their
  // old component styles explicitly chose another font or a font shorthand.
  assert.doesNotMatch(
    override[2],
    /(?:font-size|line-height):/,
    "A font-family change must preserve existing component sizes and spacing",
  );
});

test("Hunmin pages keep readable Pretendard body and controls while scoping MaruBuri to display text", () => {
  const exceptionHref = "/assets/hunmin-typography.css";
  for (const file of ["index.html", "apply.html", "thanks.html"]) {
    const html = read(`legacy/hunmin/${file}`);
    verifyCommonFontLink(html, `/hunmin/${file}`);
    assert.match(
      html,
      /<body\b[^>]*\bclass=["'][^"']*\bhunmin-theme\b[^"']*["']/i,
      "The exception must be limited to a Hunmin body class",
    );
    const links = stylesheets(html);
    const exceptions = links.filter((link) => link.href === exceptionHref);
    assert.equal(
      exceptions.length,
      1,
      "Each Hunmin page needs its typography exception once",
    );
    assert.ok(
      exceptions[0].index > links.find((link) => link.href === fontHref).index,
      "Hunmin typography must load after the shared face",
    );
    assert.ok(exceptions[0].index < html.indexOf("</head>"));
  }

  const css = read("legacy/assets/hunmin-typography.css");
  const faces = [...css.matchAll(/@font-face\s*\{([^}]+)\}/g)].map(
    ([, declarations]) => declarations,
  );
  assert.equal(
    faces.length,
    2,
    "Hunmin display typography must ship its two declared font weights",
  );
  const weights = new Set();
  for (const face of faces) {
    assert.match(face, /font-family:\s*["']MaruBuri["']/);
    assert.match(face, /font-display:\s*swap\s*;/);
    weights.add(/font-weight:\s*(\d+)\s*;/.exec(face)?.[1]);
    const source = /url\(["']?([^"')]+)["']?\)/.exec(face)?.[1];
    assert.ok(source, "MaruBuri needs a font source");
    assert.doesNotMatch(
      source,
      /^(?:https?:|\/\/|data:)/i,
      "The Hunmin font must also be self-hosted",
    );
    const path = join(root, "legacy/assets", source);
    verifyWoff2(path);
    const license = join(dirname(path), "LICENSE");
    assert.ok(
      existsSync(license),
      "MaruBuri must include its font license in the shipped directory",
    );
    assert.match(readFileSync(license, "utf8"), /SIL OPEN FONT LICENSE/i);
  }
  assert.deepEqual(weights, new Set(["600", "700"]));

  const rules = [...css.matchAll(/([^{}]+)\{([^{}]+)\}/g)].filter(
    ([, , declarations]) =>
      /font-family:[^;]*MaruBuri[^;]*!important/s.test(declarations),
  );
  assert.ok(
    rules.length > 0,
    "Display text needs an explicit exception to the common override",
  );
  const selectors = rules.flatMap(([, value]) => selectorList(value));
  for (const selector of selectors) {
    assert.match(
      selector,
      /^body\.hunmin-theme\s+/,
      "The decorative font must not escape Hunmin pages",
    );
    assert.doesNotMatch(
      selector,
      /\b(?:input|select|textarea|button|nav|p)\b|\.btn\b|\.apply-button\b|\.apply-top\b|\.back-link\b/,
      "Hunmin paragraphs and controls must retain the common body font",
    );
    if (selector.includes("*"))
      assert.match(
        selector,
        /^body\.hunmin-theme\s+:is\(h1,\s*h2,\s*h3,\s*h4\)\s+\*$/,
        "Only descendants of display headings may receive a universal exception",
      );
  }
  assert.ok(
    selectors.some((selector) => /\bh1\b|\.page-head\s+h1/.test(selector)),
    "Hunmin page titles need the display font",
  );
  assert.ok(
    selectors.some(
      (selector) =>
        selector.includes(".section-title") ||
        selector === "body.hunmin-theme h2",
    ),
    "Hunmin section titles need the display font",
  );
  assert.ok(
    selectors.some((selector) => selector.includes(".medal")),
    "Award labels may use the display font",
  );
});
