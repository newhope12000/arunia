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
const mandu = NOTICES.find((notice) => notice.slug === "mandu-contest-winners");
const hunmin = NOTICES.find((notice) => notice.slug === "hunmin-acrostic-winners");
const fullMoon = NOTICES.find(
  (notice) => notice.slug === "full-moon-acrostic-winners",
);

test("the latest full moon notice preserves 33 winners, digit zero masks, original order and the corrected final name", () => {
  assert.equal(getNotices()[0], fullMoon);
  assert.equal(
    fullMoon.title,
    "[공지] 제1회 '보름달 3행시' 공모전 최종 당선자 발표",
  );
  assert.equal(fullMoon.category, "공모전");
  assert.equal(fullMoon.published, "2026-10-11");
  const awards = fullMoon.sections.flatMap((section) => section.awards ?? []);
  assert.deepEqual(
    awards.map(({ label, count, unit }) => [label, count, unit]),
    [["대상", 1, "팀/명"], ["우수상", 2, "팀/명"], ["장려상", 30, "팀/명"]],
  );
  const expectedGroups = [
    ["김0은"],
    ["박0현", "고0정"],
    [
      "장0영", "김0경", "도0서", "백0윤", "나0미",
      "유0희", "채0무", "김0빈", "강0훈", "윤0우",
      "최0원", "오0민", "성0현", "송0율", "한0아",
      "황0준", "권0은", "임0우", "장0하", "서0진",
      "배0연", "정0호", "문0서", "안0수", "하0은",
      "고0범", "주0솔", "전0훈", "남0현", "강0연",
    ],
  ];
  assert.deepEqual(awards.map((award) => award.names), expectedGroups);
  const names = awards.flatMap((award) => award.names);
  assert.equal(names.length, 33);
  assert.ok(names.every((name) => /^[가-힣]0[가-힣]$/.test(name)));
  assert.equal(names.at(-1), "강0연");
  assert.ok(!names.includes("신0유"));

  const html = renderNoticeArticle(fullMoon);
  const renderedGroups = [
    ...html.matchAll(/<ul class="notices-names"[^>]*>([^]*?)<\/ul>/g),
  ].map(([, group]) =>
    [...group.matchAll(/<li>([^]*?)<\/li>/g)].map(([, name]) => name),
  );
  assert.deepEqual(renderedGroups, expectedGroups);
  for (const [label, count] of [["대상", 1], ["우수상", 2], ["장려상", 30]])
    assert.ok(html.includes(`${label} <span>(${count}팀/명)</span>`));
  assert.doesNotMatch(html, /신0유|\(1팀\)|\(2팀\)|\(30팀\)/);
  for (const text of [
    ...fullMoon.intro,
    ...fullMoon.sections.flatMap((section) => [
      ...(section.paragraphs ?? []),
      ...(section.items ?? []),
    ]),
    ...fullMoon.closing,
  ])
    assert.ok(html.includes(esc(text)), `Missing original notice text: ${text}`);
  assert.ok(html.includes("순차적으로 개별 연락 드렸습니다."));
  assert.equal(canonical(html), `${origin}/notices/full-moon-acrostic-winners`);
  assert.match(html, /<time datetime="2026-10-11">2026\. 10\. 11<\/time>/);
  const contactData = fullMoon.sections.find((section) => section.contact).contact;
  assert.equal(contactData.email, "contact@arunia.co.kr");
  assert.equal(contactData.url, undefined);
  const contactHtml = /<div class="notices-contact">([^]*?)<\/div>/.exec(html)?.[1];
  assert.deepEqual(links(contactHtml), ["mailto:contact@arunia.co.kr"]);
  assert.doesNotMatch(contactHtml, /문의하기|undefined|https:\/\//);
});

test("the mandu notice preserves the exact award counts, masked names and original order", () => {
  const notice = mandu;
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
  const notice = mandu;
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
  assert.match(html, /대상 <span>\(1팀\)<\/span>/);
  assert.doesNotMatch(
    html,
    /name="robots" content="noindex|class="review-ribbon"|arunia-silk\.vercel\.app/,
  );
});

test("the hunmin notice preserves all 42 winners, uppercase O masks, repeated names and original order", () => {
  assert.ok(getNotices().includes(hunmin));
  assert.equal(
    hunmin.title,
    "[당선자 발표] 2026 한글날 기념 제1회 훈민정음 4행시 공모전",
  );
  assert.equal(hunmin.category, "공모전");
  assert.equal(hunmin.published, "2026-10-09");
  const awards = hunmin.sections.flatMap((section) => section.awards ?? []);
  assert.deepEqual(
    awards.map(({ label, count, unit }) => [label, count, unit]),
    [["수석", 2, "명"], ["차석", 10, "명"], ["장려상", 30, "명"]],
  );
  const expectedGroups = [
    ["이O진", "엄O희"],
    ["김O연", "최O림", "박O태", "한O재", "홍O연", "이O빈", "박O원", "이O경", "이O석", "박O헌"],
    [
      "박O미", "신O호", "노O영", "김O성", "김O진",
      "김O희", "정O훈", "강O모", "최O진", "오O나",
      "이O협", "최O예", "강O후", "박O현", "고O준",
      "김O빈", "박O택", "김O원", "성O준", "신O원",
      "박O은", "서O경", "고O연", "김O야", "김O연",
      "김O경", "한O혁", "박O택", "민O진", "이O미",
    ],
  ];
  assert.deepEqual(awards.map((award) => award.names), expectedGroups);
  const names = awards.flatMap((award) => award.names);
  assert.equal(names.length, 42);
  assert.ok(names.every((name) => /^[가-힣]O[가-힣]$/.test(name)));
  assert.equal(names.filter((name) => name === "김O연").length, 2);
  assert.equal(names.filter((name) => name === "박O택").length, 2);
  const html = renderNoticeArticle(hunmin);
  const renderedGroups = [
    ...html.matchAll(/<ul class="notices-names"[^>]*>([^]*?)<\/ul>/g),
  ].map(([, group]) =>
    [...group.matchAll(/<li>([^]*?)<\/li>/g)].map(([, name]) => name),
  );
  assert.deepEqual(renderedGroups, expectedGroups);
  for (const heading of ["수석 | 2명", "차석 | 10명", "장려상 | 30명"])
    assert.equal(html.split(`>${heading}</h2>`).length - 1, 1);
  assert.doesNotMatch(html, /\(2팀\)|\(10팀\)|\(30팀\)|최종 당선자 명단/);
  assert.equal(canonical(html), `${origin}/notices/hunmin-acrostic-winners`);
  assert.match(html, /<time datetime="2026-10-09">2026\. 10\. 09<\/time>/);
});

test("the hunmin detail preserves every supplied paragraph and its email-only contact section", () => {
  const html = renderNoticeArticle(hunmin);
  const suppliedParagraphs = [
    "안녕하세요.",
    "훈민정음 4행시 공모전 운영사무국입니다.",
    "2026년 한글날을 기념하여 개최된 「제1회 훈민정음 4행시 공모전」에 참여해 주신 모든 분께 진심으로 감사드립니다.",
    "우리말과 한글에 대한 관심을 바탕으로 창의적인 아이디어와 정성을 담아 작품을 출품해 주신 참가자 여러분께 깊은 감사의 말씀을 전합니다.",
    "전문 심사위원단의 신중하고 공정한 심사를 거쳐 선정된 최종 당선자를 아래와 같이 발표합니다.",
    "※ 개인정보 보호를 위해 당선자 성명의 일부를 비공개 처리하였습니다.",
    "※ 당선자에게는 상장 수여 및 상품 지급에 관한 사항을 순차적으로 개별 안내드렸습니다.",
    "현재 수상작을 대상으로 타 공모전 중복 수상 여부, 표절 여부, 저작권 및 작품 이용에 관한 최종 확인 절차를 진행하고 있습니다.",
    "수상작 및 출품작은 참가자의 창작 아이디어와 권익을 보호하기 위해 관련 검증과 필요한 동의 절차가 완료된 후, 공개 여부 및 일정을 별도로 안내드릴 예정입니다.",
    "공정한 공모전 운영과 참가자의 권익 보호를 위한 절차인 만큼 너른 양해 부탁드립니다.",
    "이번 공모전에 관심을 가지고 참여해 주신 모든 분께 다시 한번 감사드립니다.",
    "수상의 영예를 안으신 분들께 진심으로 축하의 말씀을 전하며, 아쉽게 수상하지 못하신 참가자 여러분께도 소중한 작품을 보내주신 것에 대해 깊이 감사드립니다.",
    "앞으로도 우리말과 한글의 가치를 함께 나누고, 창의적인 생각을 펼칠 수 있는 뜻깊은 기회를 마련하도록 노력하겠습니다.",
    "감사합니다.",
    "훈민정음 4행시 공모전 운영사무국 드림",
  ];
  const actualParagraphs = [
    ...hunmin.intro,
    ...hunmin.sections.flatMap((section) => section.paragraphs ?? []),
    ...hunmin.closing,
  ];
  assert.deepEqual(actualParagraphs, suppliedParagraphs);
  for (const text of suppliedParagraphs)
    assert.ok(html.includes(`<p>${esc(text)}</p>`), `Missing supplied paragraph: ${text}`);
  assert.equal(hunmin.sections.at(-1).contact.url, undefined);
  const contact = /<div class="notices-contact">([^]*?)<\/div>/.exec(html)?.[1];
  assert.ok(contact.includes("훈민정음 4행시 공모전 운영사무국"));
  assert.deepEqual(links(contact), ["mailto:contact@arunia.co.kr"]);
  assert.doesNotMatch(contact, /문의하기|undefined|https:\/\//);
  assert.doesNotMatch(html, /발표가 지연|사과드립니다|개별 안내드릴|hwajeongup@gmail\.com/);
});

test("unsafe slugs, invalid publication dates and inconsistent award counts fail before rendering", () => {
  const base = mandu;
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
  for (const unit of [null, "", "팀명", "people", "<img src=x onerror=alert(1)>"])
    assert.throws(
      () => getNotices([{
        ...base,
        sections: [{ title: "수상자", awards: [{ label: "수석", count: 1, unit, names: ["이O진"] }] }],
      }]),
      /unit/,
    );
  const individualAward = {
    ...base,
    sections: [{ title: "수상자", awards: [{ label: "수석", count: 1, unit: "명", names: ["이O진"] }] }],
  };
  assert.match(renderNoticeArticle(individualAward), /수석 <span>\(1명\)<\/span>/);
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
    "",
    null,
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
    const expectedLatestRoutes = [
      "/notices/full-moon-acrostic-winners",
      "/notices/hunmin-acrostic-winners",
      "/notices/mandu-contest-winners",
    ];
    for (const html of [index, renderNoticesSection()])
      assert.deepEqual(
        [...html.matchAll(/href="(\/notices\/[^\"]+)" class="notices-card-link"/g)].map(([, route]) => route),
        expectedLatestRoutes,
        "The list and homepage section must show all three notices newest first",
      );
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
      ...NOTICES.map((notice) => `${origin}/notices/${notice.slug}`),
    ])
      assert.equal(
        sitemap.split(`<loc>${url}</loc>`).length - 1,
        1,
        "A rebuild must not repeat a notice URL",
      );
    assert.match(sitemap, /<lastmod>2026-10-08<\/lastmod>/);
    assert.match(sitemap, /<lastmod>2026-10-09<\/lastmod>/);
    assert.match(sitemap, /<lastmod>2026-10-11<\/lastmod>/);
    const sitemapEntries = [...sitemap.matchAll(/<url>([^]*?)<\/url>/g)].map(([, entry]) => entry);
    for (const notice of NOTICES) {
      const entry = sitemapEntries.find((value) => value.includes(`<loc>${origin}/notices/${notice.slug}</loc>`));
      assert.ok(entry.includes(`<lastmod>${notice.published}</lastmod>`));
    }
    assert.equal(NOTICES.length, 3);
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
    published: "2026-10-12",
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
  assert.equal(NOTICES.length, 3);
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
    assert.ok(existsSync(join(output, "notices/hunmin-acrostic-winners.html")));
    assert.ok(existsSync(join(output, "notices/full-moon-acrostic-winners.html")));
  } finally {
    rmSync(output, { recursive: true, force: true });
  }
  assert.match(renderNoticesIndex([]), /등록된 공지사항이 없습니다/);
});
