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
  const newsSlug = /^\/news\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(pathname)?.[1];
  const newsRewrite = newsSlug
    ? config.rewrites.find((rule) => rule.source === "/news/:slug")
    : undefined;
  return join(
    output,
    rewritten?.destination ??
      newsRewrite?.destination.replace(":slug", newsSlug) ??
      (pathname.endsWith("/") ? `${pathname}index.html` : pathname),
  );
}

test("homepage promotion publishes a usable official root and preserves events, archives and preview assets", () => {
  // Exercise the actual packaging order without rebuilding the unrelated React
  // preview. This catches a later legacy copy accidentally restoring the old home.
  const fixture = mkdtempSync(join(tmpdir(), "arunia-official-home-"));
  try {
    for (const name of ["legacy", "renewal"])
      cpSync(join(root, name), join(fixture, name), { recursive: true });
    const vite = join(fixture, "node_modules/vite/bin/vite.js");
    mkdirSync(dirname(vite), { recursive: true });
    writeFileSync(
      vite,
      'const fs = require("node:fs"); fs.mkdirSync("review-dist/preview", { recursive: true }); fs.writeFileSync("review-dist/preview/index.html", "preview-fixture");',
    );
    execFileSync(process.execPath, [join(root, "scripts/build-review.mjs")], {
      cwd: fixture,
      stdio: "pipe",
    });

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
    assert.doesNotMatch(
      html,
      /class="review-ribbon"|arunia-career-core-up\.[^"<\s]+|arunia-silk\.vercel\.app/,
    );

    const preview = readFileSync(join(output, "v0_1/index.html"), "utf8");
    assert.equal(preview, renderPage(homePage));
    assert.match(preview, /name="robots" content="noindex,nofollow"/);
    assert.equal(
      readFileSync(join(output, "preview/index.html"), "utf8"),
      "preview-fixture",
    );
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

    const hrefs = [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(
      ([, href]) => href,
    );
    for (const required of [
      "/hunmin",
      "/career-core-up",
      "/programs.html#contest",
      "/growth_1.html",
      "/growth_2.html",
      "/growth.html",
      "/leadership1.html",
    ])
      assert.ok(
        hrefs.includes(required),
        `Homepage lost its event or archive destination: ${required}`,
      );

    const homeIds = [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
    assert.equal(
      new Set(homeIds).size,
      homeIds.length,
      "Duplicate homepage element ID",
    );
    for (const href of hrefs) {
      if (/^(?:mailto:|tel:)/i.test(href)) continue;
      const target = new URL(href, `${origin}/`);
      assert.equal(
        target.origin,
        origin,
        `Homepage escaped the official site: ${href}`,
      );
      assert.doesNotMatch(target.pathname, /^\/(?:v0_1|preview)(?:\/|$)/);
      const file = outputFile(output, target.pathname);
      assert.ok(
        existsSync(file),
        `Homepage destination missing from the build: ${href}`,
      );
      if (target.hash) {
        const targetHtml = readFileSync(file, "utf8");
        const ids = [...targetHtml.matchAll(/\bid="([^"]+)"/g)].map(
          ([, id]) => id,
        );
        assert.ok(
          ids.includes(decodeURIComponent(target.hash.slice(1))),
          `Homepage destination anchor missing: ${href}`,
        );
      }
    }

    // Promote only the main page. Existing consent, intake and announcement
    // pages retain their actual deployed bytes, rather than preview substitutes.
    for (const file of filesBelow(join(root, "legacy")).filter(
      (name) => /\.html?$/i.test(name) && name !== "index.html",
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
