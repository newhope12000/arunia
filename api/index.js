import { createApp } from "../server/app.js";
let instance;
export default async function handler(req, res) {
  try {
    instance ||= createApp();
    const { app } = await instance;
    return app(req, res);
  } catch {
    instance = undefined;
    return res.status(503).json({ error: "서버 운영 설정이 필요합니다." });
  }
}
