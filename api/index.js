import { createApp } from "../server/app.js";
let instance;
export default async function handler(req, res) {
  // Public review deployments never initialize the database or accept intake,
  // even if the Vercel project already contains live server credentials.
  if (process.env.ARUNIA_REVIEW_ONLY === "true") {
    return res.status(503).json({
      error: "구성 검토 페이지에서는 회원가입·상담 신청·결제를 받지 않습니다.",
      code: "REVIEW_ONLY",
    });
  }
  try {
    instance ||= createApp();
    const { app } = await instance;
    return app(req, res);
  } catch {
    instance = undefined;
    return res.status(503).json({ error: "서버 운영 설정이 필요합니다." });
  }
}
