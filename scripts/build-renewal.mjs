import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homePage, cohortPage } from "../renewal/feature-pages.mjs";
import { contentPages } from "../renewal/content-pages.mjs";
import { renderPage } from "../renewal/layout.mjs";

export function buildRenewal(outputRoot = "review-dist") {
  const output = join(outputRoot, "v0_1");
  mkdirSync(join(output, "assets"), { recursive: true });
  const pages = [homePage, cohortPage, ...contentPages];
  const slugs = new Set();
  for (const page of pages) {
    if (!/^[a-z0-9_]+\.html$/.test(page.slug) || slugs.has(page.slug)) {
      throw new Error(`Invalid or duplicate renewal page: ${page.slug}`);
    }
    slugs.add(page.slug);
    writeFileSync(join(output, page.slug), renderPage(page));
  }
  cpSync("renewal/assets/images", join(output, "assets/images"), {
    recursive: true,
  });
  for (const name of ["style.css", "site.js", "contact.mjs"])
    cpSync(`renewal/${name}`, join(output, "assets", name));
  cpSync("renewal/availability.mjs", join(output, "assets/availability.js"));
  cpSync("renewal/assets/brand", join(output, "assets/brand"), {
    recursive: true,
  });
  writeFileSync(join(output, "robots.txt"), "User-agent: *\nDisallow: /\n");
  console.log(`Built ${pages.length} renewal pages at /v0_1/.`);
}
