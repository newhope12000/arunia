import { spawnSync } from "node:child_process";

// This is a read-only public review bundle, separate from the full application.
const result = spawnSync(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "build",
    "--base=/counseling-preview/",
    "--outDir=review-dist",
  ],
  { stdio: "inherit", env: { ...process.env, VITE_PUBLIC_PREVIEW: "true" } },
);
process.exit(result.status ?? 1);
