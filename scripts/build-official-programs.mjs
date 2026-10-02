import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  extractContest,
  renderOfficialPrograms,
} from "../renewal/official-programs.mjs";

export function buildOfficialPrograms(outputRoot = "review-dist") {
  const legacyHtml = readFileSync("legacy/programs.html", "utf8");
  writeFileSync(
    join(outputRoot, "programs.html"),
    renderOfficialPrograms(extractContest(legacyHtml)),
  );
  console.log("Built the official program catalog at /programs.html.");
}
