// Temporary public demo: built assets only, isolated database, no live keys.
import { createApp, configuration } from "./app.js";
import express from "express";
import { mkdir, writeFile, access } from "node:fs/promises";
import path from "node:path";
const origin = new URL(process.argv[2] || "");
if (
  origin.protocol !== "https:" ||
  !origin.hostname.endsWith(".trycloudflare.com") ||
  origin.pathname !== "/"
) {
  throw new Error(
    "Pass the exact HTTPS origin printed by the temporary Cloudflare tunnel.",
  );
}
const root = path.resolve(".data/shared-preview");
await mkdir(root, { recursive: true });
await access(path.resolve("dist/index.html"));
const config = configuration({
  NODE_ENV: "development",
  APP_DEMO: "true",
  PAYMENT_MODE: "mock",
  OPERATIONS_READY: "false",
  APP_ORIGIN: origin.origin,
  DATABASE_URL: "file:" + path.join(root, "preview.db"),
  TOSS_CLIENT_KEY: "",
  TOSS_SECRET_KEY: "",
});
const { app } = await createApp({ config });
app.get("/robots.txt", (req, res) =>
  res.type("text/plain").send("User-agent: *\nDisallow: /\n"),
);
app.use((req, res, next) => {
  res.set("X-Robots-Tag", "noindex, nofollow");
  next();
});
app.use(express.static(path.resolve("dist"), { dotfiles: "deny" }));
// Unknown file/API/source paths must not fall through to a file server.
app.get("/{*path}", (req, res) => {
  if (
    req.path.includes(".") ||
    req.path.startsWith("/src/") ||
    req.path.startsWith("/server/") ||
    req.path.startsWith("/node_modules/")
  )
    return res.status(404).end();
  res.sendFile(path.resolve("dist/index.html"));
});
const server = app.listen(4180, "127.0.0.1", async () => {
  await writeFile(
    path.join(root, "share.json"),
    JSON.stringify(
      {
        url: origin.origin,
        port: 4180,
        pid: process.pid,
        startedAt: new Date().toISOString(),
      },
      null,
      2,
    ) + "\n",
  );
  console.log("Temporary public demo is ready at " + origin.origin);
});
process.on("SIGTERM", () => server.close(() => process.exit(0)));
process.on("SIGINT", () => server.close(() => process.exit(0)));
