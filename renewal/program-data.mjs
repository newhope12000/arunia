import { COHORT, PROGRAMS } from "./shared.mjs";
import { recruitmentState } from "./availability.mjs";

// Public summaries share a catalog; campaign forms keep their existing routes.
export const PROGRAM_CATALOG = [
  {
    id: "career-core-up-4",
    group: "career",
    category: "커리어",
    name: COHORT.name,
    text: "커리어 진단부터 현직자 멘토링, 이력서 피드백까지 직무 방향을 단계적으로 정리하는 프로젝트입니다.",
    detail: "최종 30명 선발 · 결과 10월 12일 개별 안내 예정",
    period: "2026. 09. 07 — 09. 30",
    start: COHORT.start,
    end: COHORT.end,
    href: "/career-core-up",
    linkLabel: "프로젝트 안내",
  },
  ...PROGRAMS.map((program, index) => ({
    id: program.id,
    group: "everyday",
    category: ["콘텐츠", "모임", "클래스"][index],
    name: program.name,
    text: program.text,
    detail: program.price,
    href: index === 2 ? "/contact.html" : "/pricing.html",
    linkLabel: index === 2 ? "클래스 문의" : "구독 안내",
  })),
  {
    id: "hunmin-contest",
    group: "events",
    category: "공모전",
    name: "훈민정음 4행시 공모전",
    text: "훈·민·정·음으로 나만의 생각과 기준을 담은 4행시를 작성하는 공모전입니다.",
    detail: "20~27세 청년",
    benefits: [
      "수석 2명 · 각 100만 원",
      "차석 10명 · 각 50만 원 + 1회 컨설팅권",
      "장려상 30명 · 1회 컨설팅권",
    ],
    period: "2026. 10. 06(화) 18시까지",
    end: "2026-10-06T18:00:00+09:00",
    href: "/hunmin",
    linkLabel: "공모전 안내",
  },
  {
    id: "mandu-contest",
    group: "events",
    category: "공모전",
    name: "그만둘만두 이야기 공모전",
    text: "무엇을 그만두었는지, 그 뒤에 새롭게 알게 된 나의 이야기를 나누는 공모전입니다.",
    detail: "최종 수상자 발표 · 2026년 10월 7일(수)",
    period: "2026. 09. 01 — 09. 22",
    start: "2026-09-01T00:00:00+09:00",
    end: "2026-09-23T00:00:00+09:00",
    href: "/programs.html#contest",
    linkLabel: "지난 공모전 안내",
  },
];

export const PROGRAM_GROUPS = [
  { id: "career", name: "커리어 프로그램" },
  { id: "everyday", name: "콘텐츠·모임·클래스" },
  { id: "events", name: "공모전·이벤트" },
];

export const PROGRAM_ARCHIVES = [
  { name: "현직자 멘토링 프로젝트 1기", href: "/growth_1.html" },
  { name: "청년 커리어 성장 프로젝트 2기", href: "/growth_2.html" },
  { name: "청년 커리어 성장 프로젝트 3기", href: "/growth.html" },
  { name: "리더십 프로젝트 1기", href: "/leadership1.html" },
];

export function programState(record, now = Date.now()) {
  if (!record.end) return null;
  return recruitmentState(
    now,
    record.start ?? "1970-01-01T00:00:00Z",
    record.end,
  );
}

export function getPrograms(records = PROGRAM_CATALOG) {
  const ids = new Set();
  for (const record of records) {
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(record.id) || ids.has(record.id))
      throw new Error(`Invalid or duplicate program id: ${record.id}`);
    ids.add(record.id);
    if (!PROGRAM_GROUPS.some((group) => group.id === record.group))
      throw new Error(`Invalid program group: ${record.id}`);
    for (const field of [
      "category",
      "name",
      "text",
      "detail",
      "href",
      "linkLabel",
    ])
      if (typeof record[field] !== "string" || !record[field].trim())
        throw new Error(`Missing program ${field}: ${record.id}`);
    if (!/^\/(?!\/)[a-z0-9/_-]+(?:\.html)?(?:#[a-z0-9-]+)?$/.test(record.href))
      throw new Error(`Invalid program link: ${record.id}`);
    for (const field of ["start", "end"])
      if (
        record[field] &&
        (!/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(record[field]) ||
          !Number.isFinite(Date.parse(record[field])))
      )
        throw new Error(`Invalid program ${field}: ${record.id}`);
    if (
      record.benefits &&
      (!Array.isArray(record.benefits) ||
        record.benefits.some(
          (text) => typeof text !== "string" || !text.trim(),
        ))
    )
      throw new Error(`Invalid program benefits: ${record.id}`);
    if (
      record.end &&
      (!record.period ||
        (record.start && Date.parse(record.start) >= Date.parse(record.end)))
    )
      throw new Error(`Invalid program period: ${record.id}`);
  }
  return [...records];
}
