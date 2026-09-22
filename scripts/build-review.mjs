import { spawnSync } from "node:child_process";
import { cpSync, statSync, writeFileSync } from "node:fs";
import { basename } from "node:path";

// This is a read-only public review bundle, separate from the full application.
const result = spawnSync(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "build",
    "--base=/",
    "--outDir=review-dist",
  ],
  { stdio: "inherit", env: { ...process.env, VITE_PUBLIC_PREVIEW: "true" } },
);
if (result.status !== 0) process.exit(result.status ?? 1);
// The review must remain crawl-blocked without needing a running API or DB.
writeFileSync("review-dist/robots.txt", "User-agent: *\nDisallow: /\n");
// Keep existing program and contest pages, with their relative static assets.
cpSync("legacy", "review-dist/archive", {
  recursive: true,
  filter(source) {
    const name = basename(source);
    if (name.startsWith(".") || ["robots.txt", "sitemap.xml"].includes(name))
      return false;
    return (
      statSync(source).isDirectory() ||
      /\.(?:html?|css|js|svg|png|jpe?g|webp|gif|ico|avif|woff2?|ttf|otf)$/i.test(
        name,
      )
    );
  },
});
