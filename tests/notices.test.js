import { test } from "node:test";
import assert from "node:assert/strict";
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { NOTICES, getNotices } from "../renewal/notice-data.mjs";
import {
  NOTICE_STYLESHEET,
  renderNoticesSection,
  renderNoticesIndex,
  renderNoticeArticle,
  withNoticeStyles,
} from "../renewal/notice-pages.mjs";
import { buildNotices } from "../scripts/build-notices.mjs";
import { esc } from "../renewal/shared.mjs";

const origin = "https://www.arunia.co.kr";
const links = (html) =>
  [...html.matchAll(/<a\b[^>]*href="([^"]+)"/g)].map(([, href]) => href);
const canonical = (html) =>
  /<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"/.exec(html)?.[1];
const config = JSON.parse(
  readFileSync(new URL("../vercel.json", import.meta.url), "utf8"),
);

test("the first notice preserves the exact award counts, masked names and original order", () => {
  const [notice] = getNotices();
  assert.equal(notice.slug, "mandu-contest-winners");
  assert.equal(
    notice.title,
    "[공지] 제1회 '그만둘만두' 공모전 최종 당선자 발표",
  );
  assert.equal(notice.category, "공모전");
  assert.equal(notice.published, "2026-10-08");
  const awards = notice.sections[0].awards;
  assert.deepEqual(
    awards.map(({ label, count }) => [label, count]),
    [
      ["대상", 1],
      ["우수상", 2],
      ["장려상", 30],
    ],
  );
  assert.deepEqual(awards[0].names, ["차0현"]);
  assert.deepEqual(awards[1].names, ["박0진", "최0원"]);
  assert.deepEqual(awards[2].names, [
    "김0빈",
    "이0나",
    "김0지",
    "김0서",
    "김0경",
    "박0연",
    "신0려",
    "진0주",
    "조0아",
    "이0라",
    "노0진",
    "김0정",
    "강0훈",
    "윤0우",
    "최0원",
    "오0민",
    "성0현",
    "송0율",
    "한0아",
    "유0진",
    "황0준",
    "권0은",
    "임0우",
    "장0하",
    "전0현",
    "문0영",
    "최0솜",
    "박0진",
    "이0호",
    "이0언",
  ]);
  const names = awards.flatMap((award) => award.names);
  assert.equal(names.length, 33);
  assert.ok(
    names.every((name) => /^[가-힣]0[가-힣]$/.test(name)),
    "Masks use the digit 0, preserving the supplied names",
  );
  assert.equal(
    names.filter((name) => name === "박0진").length,
    2,
    "Repeated masked names in separate awards must not be deduplicated",
  );
  assert.equal(names.filter((name) => name === "최0원").length, 2);
});

test("the detail preserves the supplied announcement, completed contact wording and publication checks", () => {
  const notice = NOTICES[0];
  const html = renderNoticeArticle(notice);
  for (const text of [
    ...notice.intro,
    ...notice.closing,
    ...notice.sections.flatMap((section) => [
      ...(section.paragraphs ?? []),
      ...(section.items ?? []),
    ]),
  ])
    assert.ok(
      html.includes(esc(text)),
      `Missing original notice text: ${text}`,
    );
  assert.ok(html.includes("순차적으로 개별 연락 드렸습니다."));
  for (const text of [
    "타 공모전 중복 수상 여부 확인",
    "표절 검증",
    "저작권·이용권 최종 확인",
    "참가자 동의 확인이 완료된 후 별도 안내",
  ])
    assert.ok(html.includes(text));
  assert.ok(links(html).includes("mailto:contact@arunia.co.kr"));
  assert.ok(links(html).includes("/contact"));
  assert.ok(html.includes("https://www.arunia.co.kr/contact"));
  assert.doesNotMatch(
    html,
    /hwajeongup@gmail\.com|메일 연결.*미확인|메일.*활성화.*필요|개별 연락 드릴/,
  );
  assert.equal(canonical(html), `${origin}/notices/mandu-contest-winners`);
  assert.equal([...html.matchAll(/<h1\b/g)].length, 1);
  assert.equal(/<h1>([^]*?)<\/h1>/.exec(html)?.[1], esc(notice.title));
  assert.equal(
    /<title>([^]*?)<\/title>/.exec(html)?.[1],
    `${esc(notice.title)} — 어른이아`,
  );
  assert.match(html, /<time datetime="2026-10-08">2026\. 10\. 08<\/time>/);
  const renderedGroups = [
    ...html.matchAll(/<ul class="notices-names"[^>]*>([^]*?)<\/ul>/g),
  ].map(([, group]) =>
    [...group.matchAll(/<li>([^]*?)<\/li>/g)].map(([, name]) => name),
  );
  assert.deepEqual(
    renderedGroups,
    notice.sections[0].awards.map((award) => award.names),
  );
  assert.ok(links(html).includes("/notices"));
  assert.ok(links(html).includes("/"));
  assert.doesNotMatch(
    html,
    /name="robots" content="noindex|class="review-ribbon"|arunia-silk\.vercel\.app/,
  );
});

test("unsafe slugs, invalid publication dates and inconsistent award counts fail before rendering", () => {
  const base = NOTICES[0];
  for (const slug of [
    "../outside",
    "nested/path",
    "index",
    "Mixed-Case",
    "space here",
    "",
  ])
    assert.throws(() => getNotices([{ ...base, slug }]), /slug/);
  assert.throws(() => getNotices([base, { ...base }]), /duplicate/);
  for (const published of [
    "2026-02-30",
    "2026-13-01",
    "08-10-2026",
    "not-a-date",
    null,
  ])
    assert.throws(() => getNotices([{ ...base, published }]), /date/);
  for (const field of ["title", "category", "excerpt"])
    assert.throws(
      () => getNotices([{ ...base, [field]: " " }]),
      new RegExp(field),
    );
  for (const intro of [[], [42], [""]])
    assert.throws(() => getNotices([{ ...base, intro }]), /intro/);
  for (const count of [0, 2, 1.5])
    assert.throws(
      () =>
        getNotices([
          {
            ...base,
            sections: [
              {
                title: "수상자",
                awards: [{ label: "대상", count, names: ["차0현"] }],
              },
            ],
          },
        ]),
      /count/,
    );
  const contact = base.sections[1].contact;
  for (const email of [
    "not-an-email",
    'contact@arunia.co.kr" onclick="alert(1)',
    "mailto:contact@arunia.co.kr",
  ])
    assert.throws(
      () =>
        getNotices([
          {
            ...base,
            sections: [{ title: "문의", contact: { ...contact, email } }],
          },
        ]),
      /email/,
    );
  for (const url of [
    "javascript:alert(1)",
    "https://example.com/contact",
    "//example.com",
  ])
    assert.throws(
      () =>
        getNotices([
          {
            ...base,
            sections: [{ title: "문의", contact: { ...contact, url } }],
          },
        ]),
      /URL/,
    );
  assert.throws(
    () => getNotices([{ ...base, sections: [{ title: "내용 없음" }] }]),
    /Empty/,
  );
});

test("notice routes, styles and sitemap entries are generated together without duplicates", () => {
  const output = mkdtempSync(join(tmpdir(), "arunia-notices-"));
  try {
    const sitemapPath = join(output, "sitemap.xml");
    const originalEntry =
      "<url><loc>https://www.arunia.co.kr/programs.html</loc></url>";
    writeFileSync(
      sitemapPath,
      `<?xml version="1.0"?><urlset>${originalEntry}</urlset>`,
    );
    buildNotices(output);
    const index = readFileSync(join(output, "notices/index.html"), "utf8");
    assert.equal(
      config.rewrites.find((rule) => rule.source === "/notices")?.destination,
      "/notices/index.html",
    );
    assert.equal(
      config.rewrites.find((rule) => rule.source === "/notices/:slug")
        ?.destination,
      "/notices/:slug.html",
    );
    assert.equal(
      config.rewrites.find((rule) => rule.source === "/contact")?.destination,
      "/contact.html",
    );
    for (const [source, destination] of [
      ["/notices/index.html", "/notices"],
      ["/notices/", "/notices"],
      ["/notices/:slug.html", "/notices/:slug"],
      ["/notices/:slug/", "/notices/:slug"],
    ])
      assert.equal(
        config.redirects.find((rule) => rule.source === source)?.destination,
        destination,
      );
    assert.equal(index, renderNoticesIndex());
    assert.equal(canonical(index), `${origin}/notices`);
    assert.equal([...index.matchAll(/<h1\b/g)].length, 1);
    for (const notice of NOTICES) {
      const route = `/notices/${notice.slug}`;
      assert.ok(links(index).includes(route));
      assert.ok(links(renderNoticesSection()).includes(route));
      const detailPath = join(output, `notices/${notice.slug}.html`);
      assert.equal(
        readFileSync(detailPath, "utf8"),
        renderNoticeArticle(notice),
      );
    }
    assert.ok(links(renderNoticesSection()).includes("/notices"));
    assert.ok(existsSync(join(output, NOTICE_STYLESHEET)));
    assert.equal(
      readFileSync(join(output, NOTICE_STYLESHEET), "utf8"),
      readFileSync(new URL("../renewal/notices.css", import.meta.url), "utf8"),
    );
    assert.match(
      index,
      /<link rel="stylesheet" href="\/assets\/renewal\/style\.css">/,
    );
    assert.match(
      index,
      /<link rel="stylesheet" href="\/assets\/renewal\/notices\.css">/,
    );
    assert.equal(
      withNoticeStyles(index),
      index,
      "Shared styles can be added to the homepage without duplicate links",
    );
    assert.equal(
      withNoticeStyles("<html><head></head><body></body></html>"),
      `<html><head><link rel="stylesheet" href="${NOTICE_STYLESHEET}"></head><body></body></html>`,
    );
    buildNotices(output);
    const sitemap = readFileSync(sitemapPath, "utf8");
    assert.ok(sitemap.includes(originalEntry));
    for (const url of [
      `${origin}/notices`,
      `${origin}/notices/mandu-contest-winners`,
    ])
      assert.equal(
        sitemap.split(`<loc>${url}</loc>`).length - 1,
        1,
        "A rebuild must not repeat a notice URL",
      );
    assert.match(sitemap, /<lastmod>2026-10-08<\/lastmod>/);
    assert.equal(
      existsSync(join(output, "notices/missing-notice.html")),
      false,
    );
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
});

test("adding an ordinary notice publishes its latest list entry and detail without page code changes", () => {
  const additional = {
    slug: "next-program-notice",
    title: '프로그램 <b>안내</b> & "공지"',
    published: "2026-10-09",
    category: "운영 <mark>안내</mark>",
    excerpt: "다음 안내 <strong>소개</strong>",
    intro: ['다음 소식 <script>alert("notice")</script> & 안내'],
    sections: [
      {
        title: "일정 <em>안내</em>",
        paragraphs: ["참여 안내 <img src=x onerror=alert(1)>"],
        items: ["확인 <b>사항</b>"],
      },
    ],
    closing: ["운영팀 <i>드림</i>"],
  };
  const records = [...NOTICES, additional];
  assert.equal(getNotices(records)[0].slug, additional.slug);
  assert.equal(
    records[0],
    NOTICES[0],
    "Sorting must not mutate the input order",
  );
  assert.equal(NOTICES.length, 1);
  const route = `/notices/${additional.slug}`;
  const index = renderNoticesIndex(records);
  const section = renderNoticesSection(records);
  const article = renderNoticeArticle(additional, records);
  for (const html of [index, section]) {
    assert.ok(links(html).includes(route));
    for (const field of ["title", "category", "excerpt"])
      assert.ok(html.includes(esc(additional[field])));
    assert.doesNotMatch(
      html,
      /<b>안내<\/b>|<mark>안내<\/mark>|<strong>소개<\/strong>/,
    );
  }
  for (const text of [
    ...additional.intro,
    ...additional.closing,
    additional.sections[0].title,
    ...additional.sections[0].paragraphs,
    ...additional.sections[0].items,
  ])
    assert.ok(article.includes(esc(text)));
  assert.doesNotMatch(
    article,
    /<script>alert|<img src=x onerror|<em>안내<\/em>|<i>드림<\/i>/,
  );
  assert.equal(canonical(article), `${origin}${route}`);
  assert.ok(links(article).includes("/notices/mandu-contest-winners"));
  const output = mkdtempSync(join(tmpdir(), "arunia-future-notices-"));
  try {
    buildNotices(output, records);
    assert.equal(
      readFileSync(join(output, "notices/index.html"), "utf8"),
      index,
    );
    assert.equal(
      readFileSync(join(output, `notices/${additional.slug}.html`), "utf8"),
      article,
    );
    assert.ok(existsSync(join(output, "notices/mandu-contest-winners.html")));
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
  assert.match(renderNoticesIndex([]), /등록된 공지사항이 없습니다/);
});
