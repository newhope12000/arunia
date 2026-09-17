import { createApp } from "./app.js";
import express from "express";
import { createServer as createHttpServer } from "node:http";
import path from "node:path";
const { app } = await createApp();
const httpServer = createHttpServer(app);
if (process.env.NODE_ENV === "production") {
  app.use(express.static("dist"));
  app.get("/{*path}", (req, res) =>
    res.sendFile(path.resolve("dist/index.html")),
  );
} else {
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: {
      middlewareMode: true,
      hmr: { server: httpServer },
      host: "127.0.0.1",
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
httpServer.listen(Number(process.env.PORT) || 4173, "127.0.0.1", () =>
  console.log(
    "어른이아 preview: http://localhost:" + (process.env.PORT || 4173),
  ),
);
