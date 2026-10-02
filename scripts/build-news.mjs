import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { NEWS, getNews } from "../renewal/news-data.mjs";
import { renderNewsArticle, renderNewsIndex } from "../renewal/news-pages.mjs";

export function buildNews(outputRoot = "review-dist", records = NEWS) {
  const news = getNews(records);
  const output = join(outputRoot, "news");
  mkdirSync(output, { recursive: true });
  writeFileSync(join(output, "index.html"), renderNewsIndex(news));
  for (const article of news)
    writeFileSync(
      join(output, `${article.slug}.html`),
      renderNewsArticle(article, news),
    );
  const sitemapPath = join(outputRoot, "sitemap.xml");
  if (existsSync(sitemapPath)) {
    const sitemap = readFileSync(sitemapPath, "utf8");
    const urls = [
      "https://www.arunia.co.kr/news",
      ...news.map((article) => `https://www.arunia.co.kr/news/${article.slug}`),
    ];
    const entries = urls
      .filter((url) => !sitemap.includes(`<loc>${url}</loc>`))
      .map(
        (url) =>
          `  <url><loc>${url}</loc><changefreq>monthly</changefreq><priority>0.6</priority></url>`,
      )
      .join("\n");
    if (entries)
      writeFileSync(
        sitemapPath,
        sitemap.replace("</urlset>", `${entries}\n</urlset>`),
      );
  }
  console.log(`Built the news index and ${news.length} article pages.`);
}
