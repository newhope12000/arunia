import { test } from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { renderOfficialHome } from "../renewal/official-home.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const read = (path) => readFileSync(join(root, path), "utf8");
const config = JSON.parse(read("vercel.json"));
const eventRoutes = new Map([
  ["/hunmin", "/hunmin/index.html"],
  ["/hunmin/apply", "/hunmin/apply.html"],
  ["/hunmin/thanks", "/hunmin/thanks.html"],
  ["/career-core-up", "/career-core-up/index.html"],
  ["/career-core-up/thanks", "/career-core-up/thanks.html"],
]);
const assets = [
  "arunia-logo-new.svg",
  "career-growth-project-4-poster-v26.png",
  "application.js",
  "hunmin-contest.css",
  "hunmin-contest-poster-20261002.png",
  "hunmin-contest-poster-20261002-v2.jpg",
  "hunmin-navigation.js",
  "hunmin-application.js",
  "hunmin/character-rail.png",
  "hunmin/hunmin-title.png",
];

function tagById(html, id) {
  const tag = Array.from(html.matchAll(/<[a-z][^>]*>/gi))
    .map(([value]) => value)
    .find((value) => new RegExp(`\\bid="${id}"`).test(value));
  assert.ok(tag, `Missing form element: ${id}`);
  return tag;
}

test("clean event URLs resolve to dedicated pages without changing legacy or review routes", () => {
  assert.equal(config.buildCommand, "npm run build:review");
  assert.equal(config.outputDirectory, "review-dist");
  assert.equal(config.cleanUrls, undefined);
  assert.deepEqual(
    config.rewrites.find((rule) => rule.source === "/api/:path*"),
    { source: "/api/:path*", destination: "/api" },
  );
  assert.deepEqual(
    config.rewrites.find((rule) => rule.source === "/preview/:path*"),
    { source: "/preview/:path*", destination: "/preview/index.html" },
  );
  assert.ok(config.headers.some((rule) => rule.source === "/v0_1/:path*"));
  for (const [route, file] of eventRoutes) {
    assert.deepEqual(
      config.rewrites.find((rule) => rule.source === route),
      { source: route, destination: file },
    );
    for (const source of [file, `${route}/`]) {
      assert.deepEqual(
        config.redirects.find((rule) => rule.source === source),
        { source, destination: route, permanent: true },
      );
    }
  }
  assert.ok(config.redirects.some((rule) => rule.source === "/archive/:path*"));
});

test("event pages use the official domain and resolve every local asset reference", () => {
  for (const [route, file] of eventRoutes) {
    const html = read(`legacy${file}`);
    assert.ok(
      html.includes(
        `<link rel="canonical" href="https://www.arunia.co.kr${route}">`,
      ),
    );
    assert.ok(
      html.includes(
        `<meta property="og:url" content="https://www.arunia.co.kr${route}">`,
      ),
    );
    assert.doesNotMatch(html, /arunia-silk\.vercel\.app/);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(([, id]) => id);
    assert.equal(
      new Set(ids).size,
      ids.length,
      `${route}: duplicate element ID`,
    );
    for (const [, reference] of html.matchAll(
      /(?:src|href)="(\/assets\/[^"?#]+)"/g,
    )) {
      assert.ok(
        existsSync(join(root, "legacy", reference)),
        `${route}: missing ${reference}`,
      );
    }
    assert.match(html, /href="\/"[^>]*|<a[^>]*href="\/"/);
  }
  for (const file of assets)
    assert.ok(existsSync(join(root, "legacy/assets", file)));
  for (const file of ["hunmin/thanks.html", "career-core-up/thanks.html"]) {
    assert.match(read(`legacy/${file}`), /name="robots" content="noindex"/);
  }
});

test("migration keeps approved intake, duplicate retry and five-digit receipt scripts unchanged", () => {
  const approvedDigests = {
    "application.js":
      "270d2fb621b919895e1e68f6c424c0bfe6d87bcd903d4818e4efb7adf702e97e",
    "hunmin-application.js":
      "1c3ad42d1248cb6e88d921b521c089b4e55b3caabb5efb92a3193ac027e3fc98",
    "hunmin-navigation.js":
      "51d1c170dbb4c377376b7873dba65e621f298028d45af00dfb6d8f9130dde687",
  };
  for (const [file, digest] of Object.entries(approvedDigests)) {
    assert.equal(
      createHash("sha256")
        .update(read(`legacy/assets/${file}`))
        .digest("hex"),
      digest,
    );
  }
});

test("Hunmin form retains participant validation, residence fields, consent and confirmation controls", () => {
  const html = read("legacy/hunmin/apply.html");
  const endpoint =
    "https://applications-collection.vercel.app/api/arunia-hunmin-apply/";
  assert.ok(tagById(html, "hunminForm").includes(`action="${endpoint}"`));
  assert.match(tagById(html, "hunminForm"), /method="post"/);
  assert.match(tagById(html, "hunminFields"), /\bdisabled\b/);
  const age = tagById(html, "age");
  for (const constraint of [
    'name="age"',
    'type="number"',
    'min="20"',
    'max="27"',
    'step="1"',
    "required",
  ]) {
    assert.ok(
      age.includes(constraint),
      `Age constraint missing: ${constraint}`,
    );
  }
  for (const id of [
    "name",
    "phone",
    "residenceSido",
    "residenceSigungu",
    "residenceDong",
    "consent",
  ]) {
    const tag = tagById(html, id);
    assert.ok(tag.includes(`name="${id}"`));
    assert.match(tag, /\brequired\b/);
    if (id.startsWith("residence"))
      assert.doesNotMatch(tag, /예[:)]|화정동|고양시/);
  }
  for (const id of ["lineHun", "lineMin", "lineJeong", "lineEum"]) {
    const tag = tagById(html, id);
    assert.match(tag, /^<textarea\b/);
    assert.ok(tag.includes(`name="${id}"`));
    assert.match(tag, /maxlength="200"/);
    assert.match(tag, /\brequired\b/);
  }
  assert.match(tagById(html, "hunminPreview"), /type="submit"/);
  for (const id of ["hunminConfirm", "hunminEdit", "hunminRetry"]) {
    assert.match(tagById(html, id), /type="button"/);
  }
  assert.match(tagById(html, "hunminReview"), /\bhidden\b/);
  assert.match(tagById(html, "bot-field"), /tabindex="-1"/);
  assert.match(tagById(html, "bot-field"), /autocomplete="off"/);
  for (const id of [
    "previewResidence",
    "previewAge",
    "previewHun",
    "previewMin",
    "previewJeong",
    "previewEum",
  ])
    tagById(html, id);
});

test("CORE-UP form continues to use the existing collector and birth, consent and retry contract", () => {
  const html = read("legacy/career-core-up/index.html");
  assert.ok(
    tagById(html, "applicationForm").includes(
      'action="https://applications-collection.vercel.app/api/arunia-apply/"',
    ),
  );
  assert.match(tagById(html, "applicationFields"), /\bdisabled\b/);
  for (const id of ["birthYear", "birthMonth", "birthDay"])
    assert.match(tagById(html, id), /\brequired\b/);
  assert.match(tagById(html, "birth"), /type="hidden"/);
  assert.match(tagById(html, "applicationRetry"), /type="button"/);
  assert.match(tagById(html, "applicationSubmit"), /type="submit"/);
  assert.match(html, /<input[^>]*name="consent"[^>]*required/);
  assert.match(html, /<input[^>]*name="bot-field"[^>]*tabindex="-1"/);
});

test("campaign tracking and former direct-form links survive the official clean routes", () => {
  const source = read("legacy/assets/hunmin-navigation.js");
  for (const pathname of ["/hunmin", "/hunmin/apply"]) {
    const search = "?utm_source=telegram&utm_content=poster%26button";
    const links = ["/hunmin", "/hunmin/apply"].map((href) => ({
      href,
      getAttribute() {
        return this.href;
      },
      setAttribute(_name, value) {
        this.href = value;
      },
    }));
    const redirects = [];
    vm.runInNewContext(source, {
      window: {
        location: {
          pathname,
          search,
          hash: "",
          replace: (value) => redirects.push(value),
        },
      },
      document: { querySelectorAll: () => links },
    });
    assert.deepEqual(
      links.map((link) => link.href),
      [`/hunmin${search}`, `/hunmin/apply${search}`],
    );
    assert.deepEqual(redirects, []);
  }
  const redirects = [];
  vm.runInNewContext(source, {
    window: {
      location: {
        pathname: "/hunmin",
        search: "?utm_source=test",
        hash: "#hunminForm",
        replace: (value) => redirects.push(value),
      },
    },
    document: { querySelectorAll: () => [] },
  });
  assert.deepEqual(redirects, ["/hunmin/apply?utm_source=test#hunminForm"]);
});

test("review build publishes nested event pages and assets alongside the renewed root, preview and v0_1", () => {
  // Isolate the static packaging check. The main production build separately
  // validates the TypeScript and Vite bundles; this stub only supplies /preview.
  const fixture = mkdtempSync(join(tmpdir(), "arunia-official-events-"));
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
    assert.equal(
      readFileSync(join(output, "index.html"), "utf8"),
      renderOfficialHome(),
    );
    assert.equal(
      readFileSync(join(output, "preview/index.html"), "utf8"),
      "preview-fixture",
    );
    assert.ok(existsSync(join(output, "v0_1/index.html")));
    for (const file of eventRoutes.values()) {
      assert.equal(
        readFileSync(join(output, file), "utf8"),
        read(`legacy${file}`),
      );
    }
    for (const file of assets) {
      assert.deepEqual(
        readFileSync(join(output, "assets", file)),
        readFileSync(join(root, "legacy/assets", file)),
      );
    }
    assert.match(
      readFileSync(join(output, "robots.txt"), "utf8"),
      /Disallow: \/preview/,
    );
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
});
