import { spawnSync } from "node:child_process";
import {
  cpSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename } from "node:path";
import { buildRenewal } from "./build-renewal.mjs";
import { buildOfficialHome } from "./build-official-home.mjs";
import { buildNews } from "./build-news.mjs";
import { buildOfficialPrograms } from "./build-official-programs.mjs";
import { buildNotices } from "./build-notices.mjs";

// Publish the official homepage and keep the counseling review at /preview/.
rmSync("review-dist", { recursive: true, force: true });
mkdirSync("review-dist", { recursive: true });
const result = spawnSync(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "build",
    "--base=/preview/",
    "--outDir=review-dist/preview",
  ],
  { stdio: "inherit", env: { ...process.env, VITE_PUBLIC_PREVIEW: "true" } },
);
if (result.status !== 0) process.exit(result.status ?? 1);
const previewFile = "review-dist/preview/index.html";
let previewHtml = readFileSync(previewFile, "utf8").replace(
  /<link\b[^>]*href=["']https:\/\/fonts\.(?:googleapis|gstatic)\.com[^"']*["'][^>]*>/gi,
  "",
);
if (!previewHtml.includes('href="/assets/pretendard.css"'))
  previewHtml = previewHtml.replace(
    "</head>",
    '<link rel="stylesheet" href="/assets/pretendard.css">\n</head>',
  );
writeFileSync(previewFile, previewHtml);
// Keep existing detail pages, event intakes and their assets at the original URLs.
cpSync("legacy", "review-dist", {
  recursive: true,
  filter(source) {
    const name = basename(source);
    if (name.startsWith(".")) return false;
    return (
      statSync(source).isDirectory() ||
      ["robots.txt", "sitemap.xml", "LICENSE"].includes(name) ||
      /\.(?:html?|css|js|svg|png|jpe?g|webp|gif|ico|avif|woff2?|ttf|otf)$/i.test(
        name,
      )
    );
  },
});
// Preserve the original site's indexing policy while excluding the review and API.
const robots = readFileSync("legacy/robots.txt", "utf8").replace(
  /User-agent:\s*\*[^\S\r\n]*(?:\r?\n|$)/i,
  "$&Disallow: /preview\nDisallow: /v0_1\nDisallow: /api/\n",
);
writeFileSync("review-dist/robots.txt", robots);
buildRenewal();
// Publish the requested home and catalog; keep existing event detail/intake pages.
buildOfficialHome();
buildOfficialPrograms();
buildNews();
buildNotices();
