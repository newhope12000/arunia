// Add a notice here to publish its list entry and detail page together.
// Keep the supplied announcement text and masked names unchanged.
export const NOTICES = [
  {
    slug: "mandu-contest-winners",
    title: "[공지] 제1회 '그만둘만두' 공모전 최종 당선자 발표",
    published: "2026-10-08",
    category: "공모전",
    excerpt:
      "제1회 '그만둘만두' 공모전의 최종 당선자와 수상작·출품작 게시 관련 안내를 확인하세요.",
    intro: [
      "안녕하세요, 공모전 운영사무국입니다.",
      "먼저 이번 그만둘만두 공모전에 빛나는 아이디어와 정성을 담아 참여해 주신 모든 참가자 여러분께 진심으로 감사의 말씀을 드립니다.",
      "아울러 제출해 주신 작품 하나하나를 보다 공정하고 엄격하게 심사하는 과정에서 당초 예정보다 발표가 지연된 점 머리 숙여 사과드립니다.",
      "긴 시간 동안 설레는 마음으로 결과를 기다려 주신 모든 참가자 여러분의 깊은 양해를 부탁드립니다.",
      "전문 심사위원단의 신중하고 공정한 심사를 거쳐 선정된 최종 당선자를 다음과 같이 발표합니다.",
    ],
    sections: [
      {
        title: "최종 당선자 명단",
        awards: [
          { label: "대상", count: 1, names: ["차0현"] },
          { label: "우수상", count: 2, names: ["박0진", "최0원"] },
          {
            label: "장려상",
            count: 30,
            names: [
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
            ],
          },
        ],
        paragraphs: [
          "(※ 당선되신 분들께는 상금 지급 및 상장 수여 안내를 위해 순차적으로 개별 연락 드렸습니다.)",
        ],
      },
      {
        title: "안내 사항 및 향후 일정",
        subtitle: "수상작 및 출품작 게시 관련 안내",
        items: [
          "현재 수상작에 대한 타 공모전 중복 수상 여부 확인, 표절 검증 및 저작권·이용권 최종 확인 절차가 진행 중입니다.",
          "출품작의 아이디어 보호 및 개인정보 보호 규정에 따라, 관련 검증 절차 및 참가자 동의 확인이 완료된 후 별도 안내해 드릴 예정입니다.",
        ],
        contact: {
          title: "문의처",
          label: "공모전 운영사무국",
          email: "contact@arunia.co.kr",
          url: "https://www.arunia.co.kr/contact",
        },
      },
    ],
    closing: [
      "다시 한번 발표를 기다려 주시고 만두 공모전에 함께해 주신 모든 분께 깊이 감사드리며, 앞으로도 많은 관심과 성원 부탁드립니다.",
      "감사합니다.",
      "공모전 운영사무국 드림",
    ],
  },
];

function requireText(value, field, slug) {
  if (typeof value !== "string" || !value.trim())
    throw new Error(`Missing notice ${field}: ${slug}`);
}

function requireTextList(value, field, slug, required = false) {
  if (value === undefined && !required) return;
  if (!Array.isArray(value) || (required && !value.length))
    throw new Error(`Invalid notice ${field}: ${slug}`);
  for (const text of value) requireText(text, field, slug);
}

export function getNotices(records = NOTICES) {
  if (!Array.isArray(records)) throw new Error("Invalid notice records");
  const slugs = new Set();
  for (const record of records) {
    if (
      !record ||
      typeof record.slug !== "string" ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.slug) ||
      record.slug === "index" ||
      slugs.has(record.slug)
    )
      throw new Error(`Invalid or duplicate notice slug: ${record?.slug}`);
    slugs.add(record.slug);
    for (const field of ["title", "category", "excerpt"])
      requireText(record[field], field, record.slug);
    if (
      typeof record.published !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(record.published) ||
      !Number.isFinite(Date.parse(record.published)) ||
      new Date(record.published).toISOString().slice(0, 10) !== record.published
    )
      throw new Error(`Invalid notice date: ${record.slug}`);
    requireTextList(record.intro, "intro", record.slug, true);
    requireTextList(record.closing, "closing", record.slug);
    if (record.sections !== undefined && !Array.isArray(record.sections))
      throw new Error(`Invalid notice sections: ${record.slug}`);
    for (const section of record.sections ?? []) {
      if (!section || typeof section !== "object")
        throw new Error(`Invalid notice section: ${record.slug}`);
      requireText(section.title, "section title", record.slug);
      if (section.subtitle !== undefined)
        requireText(section.subtitle, "section subtitle", record.slug);
      requireTextList(section.paragraphs, "section paragraphs", record.slug);
      requireTextList(section.items, "section items", record.slug);
      if (section.awards !== undefined) {
        if (!Array.isArray(section.awards) || !section.awards.length)
          throw new Error(`Invalid notice awards: ${record.slug}`);
        for (const award of section.awards) {
          requireText(award?.label, "award label", record.slug);
          requireTextList(award.names, "award names", record.slug, true);
          if (
            !Number.isSafeInteger(award.count) ||
            award.count < 1 ||
            award.count !== award.names.length
          )
            throw new Error(`Invalid notice award count: ${record.slug}`);
        }
      }
      if (section.contact !== undefined) {
        const contact = section.contact;
        requireText(contact?.title, "contact title", record.slug);
        requireText(contact.label, "contact label", record.slug);
        if (
          typeof contact.email !== "string" ||
          !/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9]+(?:[.-][a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/.test(
            contact.email,
          )
        )
          throw new Error(`Invalid notice contact email: ${record.slug}`);
        if (contact.url !== "https://www.arunia.co.kr/contact")
          throw new Error(`Invalid notice contact URL: ${record.slug}`);
      }
      if (
        !section.awards?.length &&
        !section.paragraphs?.length &&
        !section.items?.length &&
        !section.contact
      )
        throw new Error(`Empty notice section: ${record.slug}`);
    }
  }
  return [...records].sort(
    (a, b) =>
      b.published.localeCompare(a.published) || a.slug.localeCompare(b.slug),
  );
}
