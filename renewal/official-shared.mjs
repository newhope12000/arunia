import { BASE, arrow, esc, picture } from "./shared.mjs";

export const asset = (path) =>
  `/assets/renewal/${path.replace(/^assets\//, "")}`;

// Keep public navigation on the current operational detail pages.
export function url(path = "") {
  if (!path || path === "index.html") return "/";
  if (path === "programs.html#open-programs") return "/programs.html#events";
  if (path === "growth_4.html") return "/career-core-up";
  const [page] = path.split("#");
  if (page === "pricing.html") return `/${page}`;
  return `/${path}`;
}

export function link(path, text, cls = "text-link") {
  return `<a class="${esc(cls)}" href="${esc(url(path))}">${text}${arrow}</a>`;
}

export function image(name, alt, options) {
  return picture(name, alt, options).replaceAll(
    `${BASE}assets/`,
    "/assets/renewal/",
  );
}

export const officialPageOptions = { official: true, url, asset, link };
