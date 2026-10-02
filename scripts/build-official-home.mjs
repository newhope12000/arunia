import { cpSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { renderOfficialHome } from "../renewal/official-home.mjs";

export function buildOfficialHome(outputRoot = "review-dist") {
  const assets = join(outputRoot, "assets/renewal");
  mkdirSync(assets, { recursive: true });
  for (const name of ["style.css", "site.js", "contact.mjs"])
    cpSync(`renewal/${name}`, join(assets, name));
  cpSync("renewal/availability.mjs", join(assets, "availability.js"));
  for (const directory of ["brand", "images"])
    cpSync(`renewal/assets/${directory}`, join(assets, directory), {
      recursive: true,
    });
  writeFileSync(join(outputRoot, "index.html"), renderOfficialHome());
  console.log("Built the official renewal homepage at /.");
}
