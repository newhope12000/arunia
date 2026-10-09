import { test } from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { homePage } from "../renewal/feature-pages.mjs";
import { renderPage } from "../renewal/layout.mjs";
import { renderOfficialHome } from "../renewal/official-home.mjs";
import {
  extractContest,
  renderOfficialPrograms,
} from "../renewal/official-programs.mjs";
import { contentPages } from "../renewal/content-pages.mjs";
import { NEWS } from "../renewal/news-data.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const origin = "https://www.arunia.co.kr";
const config = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));

function filesBelow(directory, prefix = "") {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const name = join(prefix, entry.name);
    return entry.isDirectory()
      ? filesBelow(join(directory, entry.name), name)
      : [name];
  });
}

function outputFile(output, pathname) {
  const rewritten = config.rewrites.find((rule) => rule.source === pathname);
  const contentRoute = /^\/(news|notices)\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(pathname);
  const contentRewrite = contentRoute
    ? config.rewrites.find((rule) => rule.source === `/${contentRoute[1]}/:slug`)
    : undefined;
  return join(
    output,
    rewritten?.destination ??
      contentRewrite?.destination.replace(":slug", contentRoute[2]) ??
      (pathname.endsWith("/") ? `${pathname}index.html` : pathname),
  );
}

function verifyPublicLinks(html, output, pathname) {
  const sources = new Set(NEWS.map((record) => record.sourceUrl));
  const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(([, href]) =>
    href.replaceAll("&amp;", "&"),
  );
  const pageIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
  assert.equal(
    new Set(pageIds).size,
    pageIds.length,
    `Duplicate element ID on ${pathname}`,
  );
  for (const href of hrefs) {
    if (/^(?:mailto:|tel:)/i.test(href)) continue;
    const target = new URL(href, `${origin}${pathname}`);
    if (target.origin !== origin) {
      assert.ok(
        sources.has(target.href),
        `Unexpected external link on ${pathname}: ${href}`,
      );
      continue;
    }
    assert.doesNotMatch(target.pathname, /^\/(?:v0_1|preview)(?:\/|$)/);
    const file = outputFile(output, target.pathname);
    assert.ok(
      existsSync(file),
      `Destination missing from ${pathname}: ${href}`,
    );
    if (target.hash) {
      const targetHtml = readFileSync(file, "utf8");
      const ids = [...targetHtml.matchAll(/\bid="([^"]+)"/g)].map(
        ([, id]) => id,
      );
      assert.ok(
        ids.includes(decodeURIComponent(target.hash.slice(1))),
        `Destination anchor missing from ${pathname}: ${href}`,
      );
    }
  }
  return hrefs;
}

function verifyPageAssets(html, output, pathname) {
  const assets = [
    ...[
      ...html.matchAll(/<(?:img|script|link)\b[^>]*(?:src|href)="([^"]+)"/g),
    ].map(([, path]) => path),
    ...[...html.matchAll(/\bsrcset="([^"]+)"/g)].flatMap(([, value]) =>
      value.split(",").map((candidate) => candidate.trim().split(/\s+/)[0]),
    ),
  ];
  for (const path of assets) {
    const target = new URL(path, `${origin}${pathname}`);
    if (target.origin !== origin) continue;
    // Canonical links are page addresses, while the other tags refer to assets.
    const file = outputFile(output, target.pathname);
    assert.ok(existsSync(file), `Asset missing from ${pathname}: ${path}`);
  }
}

test("homepage promotion publishes a usable official root and preserves events, archives and preview assets", () => {
  // Exercise the actual packaging order without rebuilding the unrelated React
  // preview. This catches a later legacy copy accidentally restoring the old home.
  const fixture = mkdtempSync(join(tmpdir(), "arunia-official-home-"));
  // Use one instant for packaging and comparison, even at a reception deadline.
  const now = Date.now();
  const previewFixture =
    '<!doctype html><html><head><meta charset="utf-8"><style>body { font-family: serif; }</style></head><body><main id="preview-fixture">preview-fixture</main></body></html>';
  try {
    for (const name of ["legacy", "renewal"])
      cpSync(join(root, name), join(fixture, name), { recursive: true });
    const vite = join(fixture, "node_modules/vite/bin/vite.js");
    mkdirSync(dirname(vite), { recursive: true });
    writeFileSync(
      vite,
      `const fs = require("node:fs"); fs.mkdirSync("review-dist/preview", { recursive: true }); fs.writeFileSync("review-dist/preview/index.html", ${JSON.stringify(previewFixture)});`,
    );
    execFileSync(
      process.execPath,
      [
        "--import",
        `data:text/javascript,${encodeURIComponent(`Date.now = () => ${now};`)}`,
        join(root, "scripts/build-review.mjs"),
      ],
      { cwd: fixture, stdio: "pipe" },
    );

    const output = join(fixture, "review-dist");
    const html = readFileSync(join(output, "index.html"), "utf8");
    assert.equal(html, renderOfficialHome());
    assert.notEqual(
      html,
      readFileSync(join(root, "legacy/index.html"), "utf8"),
    );
    assert.match(
      html,
      /<link\b[^>]*rel="canonical"[^>]*href="https:\/\/www\.arunia\.co\.kr\/"/,
    );
    assert.match(
      html,
      /<meta\b[^>]*property="og:url"[^>]*content="https:\/\/www\.arunia\.co\.kr\/"/,
    );
    assert.doesNotMatch(
      html,
      /<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/,
    );

    const programs = readFileSync(join(output, "programs.html"), "utf8");
    const legacyPrograms = readFileSync(
      join(root, "legacy/programs.html"),
      "utf8",
    );
    assert.equal(
      programs,
      renderOfficialPrograms(extractContest(legacyPrograms), undefined, now),
    );
    assert.notEqual(
      programs,
      legacyPrograms,
      "The public program catalog must replace the old list",
    );
    assert.match(
      programs,
      /<link\b[^>]*rel="canonical"[^>]*href="https:\/\/www\.arunia\.co\.kr\/programs\.html"/,
    );
    assert.match(
      programs,
      /<meta\b[^>]*property="og:url"[^>]*content="https:\/\/www\.arunia\.co\.kr\/programs\.html"/,
    );
    assert.doesNotMatch(
      programs,
      /name="robots" content="[^"]*noindex|class="review-ribbon"/,
    );
    assert.ok(
      programs.includes(extractContest(legacyPrograms)),
      "The past contest details and announcement must be preserved",
    );
    verifyPublicLinks(programs, output, "/programs.html");
    verifyPageAssets(programs, output, "/programs.html");
    assert.doesNotMatch(
      html,
      /class="review-ribbon"|arunia-career-core-up\.[^"<\s]+|arunia-silk\.vercel\.app/,
    );

    const preview = readFileSync(join(output, "v0_1/index.html"), "utf8");
    assert.equal(preview, renderPage(homePage));
    assert.match(preview, /name="robots" content="noindex,nofollow"/);
    const previewPrograms = contentPages.find(
      (page) => page.slug === "programs.html",
    );
    assert.equal(
      readFileSync(join(output, "v0_1/programs.html"), "utf8"),
      renderPage(previewPrograms),
      "Public catalog generation must preserve the separate program preview",
    );
    const counselingPreview = readFileSync(
      join(output, "preview/index.html"),
      "utf8",
    );
    assert.ok(
      counselingPreview.includes(
        '<main id="preview-fixture">preview-fixture</main>',
      ),
      "Font injection must preserve the built preview content",
    );
    const previewFontLinks = [
      ...counselingPreview.matchAll(
        /<link\b[^>]*href="\/assets\/pretendard\.css"[^>]*>/g,
      ),
    ];
    assert.equal(
      previewFontLinks.length,
      1,
      "The actual preview packaging must inject one common font link",
    );
    assert.ok(
      previewFontLinks[0].index > counselingPreview.indexOf("</style>"),
    );
    assert.ok(previewFontLinks[0].index < counselingPreview.indexOf("</head>"));
    const robots = readFileSync(join(output, "robots.txt"), "utf8");
    assert.match(robots, /Allow: \/(?:\r?\n|$)/);
    assert.match(robots, /Disallow: \/v0_1/);
    assert.doesNotMatch(robots, /Disallow: \/(?:\r?\n|$)/);
    assert.ok(
      !config.headers.some(
        (rule) =>
          ["/", "/index.html", "/:path*"].includes(rule.source) &&
          rule.headers.some(
            (header) =>
              header.key.toLowerCase() === "x-robots-tag" &&
              /noindex/i.test(header.value),
          ),
      ),
    );

    const hrefs = verifyPublicLinks(html, output, "/");
    for (const required of [
      "/hunmin",
      "/career-core-up",
      "/programs.html#contest",
      "/notices",
      "/notices/mandu-contest-winners",
      "/notices/hunmin-acrostic-winners",
      "/growth_1.html",
      "/growth_2.html",
      "/growth.html",
      "/leadership1.html",
    ])
      assert.ok(
        hrefs.includes(required),
        `Homepage lost its event or archive destination: ${required}`,
      );

    // Promote the main page and catalog. Existing consent, intake and detail
    // pages retain their actual deployed bytes, rather than preview substitutes.
    for (const file of filesBelow(join(root, "legacy")).filter(
      (name) =>
        /\.html?$/i.test(name) &&
        !["index.html", "programs.html"].includes(name),
    )) {
      assert.deepEqual(
        readFileSync(join(output, file)),
        readFileSync(join(root, "legacy", file)),
        `Legacy page changed while promoting the homepage: ${file}`,
      );
    }
    for (const file of filesBelow(join(root, "renewal/assets/images"))) {
      const source = readFileSync(join(root, "renewal/assets/images", file));
      assert.deepEqual(
        readFileSync(join(output, "assets/renewal/images", file)),
        source,
        `Public image differs from the requested source: ${file}`,
      );
      assert.deepEqual(
        readFileSync(join(output, "v0_1/assets/images", file)),
        source,
        `Preview image changed: ${file}`,
      );
    }
    for (const file of filesBelow(join(root, "legacy/assets/fonts"))) {
      assert.deepEqual(
        readFileSync(join(output, "assets/fonts", file)),
        readFileSync(join(root, "legacy/assets/fonts", file)),
        `Font or font license missing or changed in the build: ${file}`,
      );
    }
    for (const file of ["pretendard.css", "hunmin-typography.css"]) {
      assert.deepEqual(
        readFileSync(join(output, "assets", file)),
        readFileSync(join(root, "legacy/assets", file)),
        `Font stylesheet missing or changed in the build: ${file}`,
      );
    }
    const assets = [
      ...[...html.matchAll(/(?:src|href)="(\/assets\/[^"?#]+)"/g)].map(
        ([, path]) => path,
      ),
      ...[...html.matchAll(/\bsrcset="([^"]+)"/g)].flatMap(([, value]) =>
        value.split(",").map((candidate) => candidate.trim().split(/\s+/)[0]),
      ),
    ];
    assert.ok(
      assets.some((path) => path.startsWith("/assets/renewal/images/")),
      "Promoted homepage omitted the renewal imagery",
    );
    for (const path of assets)
      assert.ok(
        existsSync(join(output, path)),
        `Homepage asset missing from the build: ${path}`,
      );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
