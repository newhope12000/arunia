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

// Keep the existing public site at / and isolate the counseling review at /preview/.
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
// Restore the original HTML pages and their relative assets at their original URLs.
cpSync("legacy", "review-dist", {
  recursive: true,
  filter(source) {
    const name = basename(source);
    if (name.startsWith(".")) return false;
    return (
      statSync(source).isDirectory() ||
      ["robots.txt", "sitemap.xml"].includes(name) ||
      /\.(?:html?|css|js|svg|png|jpe?g|webp|gif|ico|avif|woff2?|ttf|otf)$/i.test(
        name,
      )
    );
  },
});
// Preserve the original site's indexing policy while excluding the review and API.
const robots = readFileSync("legacy/robots.txt", "utf8").replace(
  /User-agent:\s*\*[^\S\r\n]*(?:\r?\n|$)/i,
  "$&Disallow: /preview\nDisallow: /api/\n",
);
writeFileSync("review-dist/robots.txt", robots);
