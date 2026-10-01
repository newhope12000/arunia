import { test } from "node:test";
import assert from "node:assert/strict";
import { recruitmentState } from "../renewal/availability.mjs";
import { COHORT } from "../renewal/shared.mjs";
import { homePage, cohortPage } from "../renewal/feature-pages.mjs";
import { contentPages } from "../renewal/content-pages.mjs";
import { renderPage } from "../renewal/layout.mjs";

test("CORE-UP recruitment is open through September 30 Korea time and closes at midnight", () => {
  const status = (now) => recruitmentState(now, COHORT.start, COHORT.end);
  assert.equal(status("2026-09-06T23:59:59+09:00"), "upcoming");
  assert.equal(status("2026-09-07T00:00:00+09:00"), "open");
  assert.equal(status("2026-09-30T14:59:59Z"), "open");
  assert.equal(status("2026-09-30T15:00:00Z"), "closed");
  assert.equal(status("invalid"), "closed");
});

test("all renewal navigation stays in v0_1, resolves to a page and preserves valid anchors", () => {
  const pages = [homePage, cohortPage, ...contentPages];
  const rendered = new Map(pages.map((page) => [page.slug, renderPage(page)]));
  assert.equal(rendered.size, 14);
  for (const [slug, html] of rendered) {
    assert.match(html, /name="robots" content="noindex,nofollow"/);
    for (const [, href] of html.matchAll(/<a\b[^>]*href="([^"]+)"/g)) {
      if (href.startsWith("https://")) {
        assert.ok(
          [COHORT.application, "https://formsubmit.co/privacy.pdf"].includes(href),
          `${slug}: unexpected external destination`,
        );
        continue;
      }
      if (href.startsWith("#")) {
        assert.ok(
          html.includes(`id="${href.slice(1)}"`),
          `${slug}: missing anchor ${href}`,
        );
        continue;
      }
      assert.ok(
        href.startsWith("/v0_1/"),
        `${slug}: link escaped review: ${href}`,
      );
      const [path, anchor] = href.slice("/v0_1/".length).split("#");
      const target = rendered.get(path || "index.html");
      assert.ok(target, `${slug}: missing page ${href}`);
      if (anchor)
        assert.ok(
          target.includes(`id="${anchor}"`),
          `${slug}: missing destination anchor ${href}`,
        );
    }
  }
});
