import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { join } from "node:path";
import { NOTICES, getNotices } from "../renewal/notice-data.mjs";
import {
  renderNoticeArticle,
  renderNoticesIndex,
} from "../renewal/notice-pages.mjs";

export function buildNotices(outputRoot = "review-dist", records = NOTICES) {
  const notices = getNotices(records);
  const output = join(outputRoot, "notices");
  mkdirSync(output, { recursive: true });
  writeFileSync(join(output, "index.html"), renderNoticesIndex(notices));
  for (const notice of notices)
    writeFileSync(
      join(output, `${notice.slug}.html`),
      renderNoticeArticle(notice, notices),
    );
  const assets = join(outputRoot, "assets/renewal");
  mkdirSync(assets, { recursive: true });
  cpSync(
    new URL("../renewal/notices.css", import.meta.url),
    join(assets, "notices.css"),
  );

  const sitemapPath = join(outputRoot, "sitemap.xml");
  if (existsSync(sitemapPath)) {
    const sitemap = readFileSync(sitemapPath, "utf8");
    if (!sitemap.includes("</urlset>"))
      throw new Error("Invalid sitemap for notices");
    const entries = [
      { url: "https://www.arunia.co.kr/notices" },
      ...notices.map((notice) => ({
        url: `https://www.arunia.co.kr/notices/${notice.slug}`,
        published: notice.published,
      })),
    ]
      .filter(({ url }) => !sitemap.includes(`<loc>${url}</loc>`))
      .map(
        ({ url, published }) =>
          `  <url><loc>${url}</loc>${published ? `<lastmod>${published}</lastmod>` : ""}<changefreq>monthly</changefreq><priority>0.6</priority></url>`,
      )
      .join("\n");
    if (entries)
      writeFileSync(
        sitemapPath,
        sitemap.replace("</urlset>", `${entries}\n</urlset>`),
      );
  }
  console.log(`Built the notices index and ${notices.length} notice pages.`);
}
