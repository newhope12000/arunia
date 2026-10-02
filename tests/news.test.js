import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { NEWS, getNews } from "../renewal/news-data.mjs";
import {
  renderNewsSection,
  renderNewsIndex,
  renderNewsArticle,
} from "../renewal/news-pages.mjs";
import { renderOfficialHome } from "../renewal/official-home.mjs";
import { buildNews } from "../scripts/build-news.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
const origin = "https://www.arunia.co.kr";
const config = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const links = (html) => [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(([, href]) => href);
const decodeAttribute = (value) => value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");
const escapeText = (value) => String(value).replace(/[&<>"']/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
})[character]);

function canonical(html) {
  const values = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/g)].map(([, href]) => decodeAttribute(href));
  assert.equal(values.length, 1, "Each news page needs one canonical URL");
  return values[0];
}

function routedFile(output, pathname) {
  const exact = config.rewrites.find((rule) => rule.source === pathname);
  if (exact) return join(output, exact.destination);
  const slug = /^\/news\/([a-z0-9]+(?:-[a-z0-9]+)*)$/.exec(pathname)?.[1];
  const route = config.rewrites.find((rule) => rule.source === "/news/:slug");
  assert.ok(slug && route, `Missing news route: ${pathname}`);
  return join(output, route.destination.replace(":slug", slug));
}

test("the two current news records link the original publishers rather than Google share links", () => {
  const records = getNews();
  assert.equal(records.length, 2);
  assert.deepEqual(new Set(records.map((record) => record.publisher)), new Set(["대학저널", "공감신문"]));
  const publishers = new Map([
    ["대학저널", "www.dhnews.co.kr"],
    ["공감신문", "www.gokorea.kr"],
  ]);
  for (const record of records) {
    const source = new URL(record.sourceUrl);
    assert.equal(source.hostname, publishers.get(record.publisher));
    assert.equal(source.protocol, "https:");
    assert.doesNotMatch(source.hostname, /(?:^|\.)(?:share\.google|goo\.gl|bit\.ly)$/i);
    assert.ok(record.paragraphs.length > 0);
  }
});

test("invalid news records fail validation before they can create misleading or unsafe pages", () => {
  const base = NEWS[0];
  for (const slug of ["../outside", "nested/path", "index", "Mixed-Case", "missing space"]) {
    assert.throws(() => getNews([{ ...base, slug }]), /slug/);
  }
  assert.throws(() => getNews([base, { ...base }]), /duplicate/);
  for (const published of ["2026-02-30", "2026-13-01", "23-09-2026", "not-a-date"]) {
    assert.throws(() => getNews([{ ...base, published }]), /date/);
  }
  for (const sourceUrl of ["http://example.com/article", "javascript:alert(1)", "https://user:password@example.com/article", "not-a-url"]) {
    assert.throws(() => getNews([{ ...base, sourceUrl }]));
  }
  for (const field of ["title", "sourceTitle", "publisher", "author", "excerpt"]) {
    assert.throws(() => getNews([{ ...base, [field]: " " }]), new RegExp(field));
  }
  for (const paragraphs of [[], [""], [42]]) {
    assert.throws(() => getNews([{ ...base, paragraphs }]), /summary/);
  }
});

test("the news build provides a complete home to list to article to publisher reader flow", () => {
  const output = mkdtempSync(join(tmpdir(), "arunia-news-"));
  try {
    buildNews(output);
    const indexPath = routedFile(output, "/news");
    assert.ok(existsSync(indexPath), "News list route must resolve to a published file");
    const index = readFileSync(indexPath, "utf8");
    assert.equal(index, renderNewsIndex());
    assert.equal(canonical(index), `${origin}/news`);
    const home = renderOfficialHome();
    assert.ok(links(home).includes("/news"), "Homepage must offer the full news list");
    const canonicalUrls = new Set([canonical(index)]);
    for (const record of getNews()) {
      const articlePath = `/news/${record.slug}`;
      assert.ok(links(home).includes(articlePath), `Homepage omitted ${articlePath}`);
      assert.ok(links(index).includes(articlePath), `News list omitted ${articlePath}`);
      const article = readFileSync(routedFile(output, articlePath), "utf8");
      assert.equal(article, renderNewsArticle(record));
      const canonicalUrl = canonical(article);
      assert.equal(canonicalUrl, `${origin}${articlePath}`);
      assert.ok(!canonicalUrls.has(canonicalUrl), "News canonical URLs must be unique");
      canonicalUrls.add(canonicalUrl);
      assert.equal([...article.matchAll(/<h1\b/g)].length, 1, "News detail needs one main heading");
      assert.ok(article.includes(escapeText(record.sourceTitle)), "The original article title must be attributed");
      assert.ok(links(article).some((href) => decodeAttribute(href) === record.sourceUrl), "Article needs a readable source link");
      assert.ok(links(article).includes("/news"), "Article needs a return link to the news list");
      assert.ok(links(article).includes("/"), "Article needs a return link to the official homepage");
      assert.doesNotMatch(article, /class="review-ribbon"|name="robots" content="noindex|arunia-silk\.vercel\.app/);
    }
    assert.ok(!existsSync(routedFile(output, "/news/nonexistent-article")), "Unknown article slugs must not silently display the news list");
    const indexRedirect = config.redirects.find((rule) => rule.source === "/news/index.html");
    assert.equal(indexRedirect?.destination, "/news");
    const detailRedirect = config.redirects.find((rule) => rule.source === "/news/:slug.html");
    assert.equal(detailRedirect?.destination, "/news/:slug");
    for (const path of ["/news/", "/news/:slug/"]) {
      const redirect = config.redirects.find((rule) => rule.source === path);
      assert.equal(redirect?.destination, path.slice(0, -1));
    }
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});

test("a third record reaches the homepage, list and its own detail without page code edits and escapes its text", () => {
  const additional = {
    slug: "next-program-report",
    title: '추가 소식 <b>제목</b> & "인용"',
    sourceTitle: '원문 <em>제목</em> & "표현"',
    publisher: "새 매체 <mark>이름</mark> & 소식",
    author: "새 기자 <i>이름</i> & 작성자",
    published: "2026-10-01",
    sourceUrl: "https://example.com/article?id=3&edition=news",
    excerpt: "후속 보도 <strong>소개</strong> & 안내",
    paragraphs: ['내용 <script>alert("news")</script> & \'인용\'', "다음 문단 <img src=x onerror=alert(1)> & 설명"],
  };
  const records = [...NEWS, additional];
  assert.equal(getNews(records)[0].slug, additional.slug, "Latest news must sort first");
  assert.equal(NEWS.length, 2, "Rendering a future record must not mutate current data");
  const route = `/news/${additional.slug}`;
  const section = renderNewsSection(records);
  const index = renderNewsIndex(records);
  const home = renderOfficialHome(records);
  const article = renderNewsArticle(additional, records);
  for (const html of [section, index, home]) {
    assert.ok(links(html).includes(route), "Adding data must publish its new card automatically");
    for (const field of ["title", "publisher", "excerpt"])
      assert.ok(html.includes(escapeText(additional[field])), `News card must escape its ${field} text`);
    assert.doesNotMatch(html, /<b>제목<\/b>|<mark>이름<\/mark>|<strong>소개<\/strong>/);
  }
  for (const field of ["title", "sourceTitle", "publisher", "author", ...additional.paragraphs.map((_, index) => index)]) {
    const value = typeof field === "number" ? additional.paragraphs[field] : additional[field];
    assert.ok(article.includes(escapeText(value)), `News detail must escape its ${field} text`);
  }
  assert.ok(links(article).some((href) => decodeAttribute(href) === additional.sourceUrl));
  assert.doesNotMatch(article, /<script>alert|<img src=x onerror|<em>제목<\/em>|<mark>이름<\/mark>|<i>이름<\/i>/);
  const output = mkdtempSync(join(tmpdir(), "arunia-future-news-"));
  try {
    buildNews(output, records);
    assert.equal(readFileSync(routedFile(output, "/news"), "utf8"), index);
    assert.equal(readFileSync(routedFile(output, route), "utf8"), article);
    for (const record of NEWS) assert.ok(existsSync(routedFile(output, `/news/${record.slug}`)));
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});
