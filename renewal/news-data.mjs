// Add a record here to publish its list entry and /news/<slug> detail together.
// Summaries are written for Arunia; source articles are linked, not reproduced.
export const NEWS = [
  {
    slug: "first-story-contest",
    title: "‘그만둘 만두’ 공모전, 대학저널에 소개",
    sourceTitle:
      "어른이아, 청년 실패·성공 경험 담는 첫 공모전 ‘그만둘 만두’ 개최",
    publisher: "대학저널",
    author: "임춘성 기자",
    published: "2026-09-23",
    sourceUrl: "https://www.dhnews.co.kr/news/view/1065575982846629",
    excerpt:
      "청년의 실패와 성공 경험을 나누는 어른이아의 첫 공모전이 소개됐습니다.",
    paragraphs: [
      "대학저널은 어른이아가 개최한 첫 공모전 ‘그만둘 만두’를 소개했습니다. 청년들이 각자의 실패와 성공 경험을 돌아보고, 당시의 생각과 대응 과정을 나누는 공모전입니다.",
      "어른이아는 접수된 사례를 통해 청년들의 필요를 살펴보고, 삶과 일에서 활용할 수 있는 후속 프로그램을 구체화할 계획이라고 밝혔습니다.",
    ],
  },
  {
    slug: "career-programs-1-2",
    title: "커리어 지원 프로그램 1·2기 운영 성과 보도",
    sourceTitle: "어른이아, 청년 커리어 지원 프로그램 1·2기 성료",
    publisher: "공감신문",
    author: "최선은 기자",
    published: "2026-08-24",
    sourceUrl: "https://www.gokorea.kr/news/articleView.html?idxno=876053",
    excerpt:
      "현직자 멘토링과 커리어 성장 프로젝트의 운영 결과를 공감신문이 전했습니다.",
    paragraphs: [
      "공감신문은 어른이아의 현직자 멘토링 프로젝트 1기와 청년 커리어 성장 프로젝트 2기의 운영 결과를 보도했습니다.",
      "1기는 강점·성향 분석, 커리어 로드맵과 현직자 멘토링으로 구성됐습니다. 2기는 커리어 진단, 라이프 방향 설정, 현직자 미팅과 이력서 제작으로 이어졌습니다. 기사에서는 두 기수의 수료자 총 58명과 평균 만족도 4.85점을 소개했습니다.",
    ],
  },
];

export function getNews(records = NEWS) {
  const slugs = new Set();
  for (const record of records) {
    if (
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug) ||
      record.slug === "index" ||
      slugs.has(record.slug)
    )
      throw new Error(`Invalid or duplicate news slug: ${record.slug}`);
    slugs.add(record.slug);
    for (const field of [
      "title",
      "sourceTitle",
      "publisher",
      "author",
      "excerpt",
    ])
      if (typeof record[field] !== "string" || !record[field].trim())
        throw new Error(`Missing news ${field}: ${record.slug}`);
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(record.published) ||
      !Number.isFinite(Date.parse(record.published)) ||
      new Date(record.published).toISOString().slice(0, 10) !== record.published
    )
      throw new Error(`Invalid news date: ${record.slug}`);
    const source = new URL(record.sourceUrl);
    if (source.protocol !== "https:" || source.username || source.password)
      throw new Error(`Invalid news source: ${record.slug}`);
    if (
      !Array.isArray(record.paragraphs) ||
      !record.paragraphs.length ||
      record.paragraphs.some((text) => typeof text !== "string" || !text.trim())
    )
      throw new Error(`Missing news summary: ${record.slug}`);
  }
  return [...records].sort(
    (a, b) =>
      b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug),
  );
}
