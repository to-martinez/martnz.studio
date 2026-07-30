function upsertMeta(selector, attributes) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.append(element);
  }
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

function upsertLink(rel, href) {
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.rel = rel;
    document.head.append(element);
  }
  element.href = href;
}

function absoluteUrl(value, siteUrl = "") {
  if (!value) return "";
  try {
    return new URL(value, siteUrl || document.baseURI).href;
  } catch {
    return value;
  }
}

export function updateSeo({
  title,
  description,
  image,
  url,
  type = "website",
  language = "en",
  siteUrl = ""
}) {
  document.title = title;
  document.documentElement.lang = language;

  upsertMeta('meta[name="description"]', { name: "description", content: description });
  upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
  upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
  upsertMeta('meta[property="og:type"]', { property: "og:type", content: type });
  upsertMeta('meta[property="og:locale"]', {
    property: "og:locale",
    content: language === "hr" ? "hr_HR" : "en_US"
  });
  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });

  const resolvedUrl = absoluteUrl(url || location.href, siteUrl);
  if (resolvedUrl) {
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: resolvedUrl });
    upsertLink("canonical", resolvedUrl);
  }

  const resolvedImage = absoluteUrl(image, siteUrl);
  if (resolvedImage) {
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: resolvedImage });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: resolvedImage });
  }
}

export function updatePersonSchema(site, language = "en") {
  let script = document.head.querySelector('script[data-person-schema]');
  if (!script) {
    script = document.createElement("script");
    script.type = "application/ld+json";
    script.dataset.personSchema = "";
    document.head.append(script);
  }

  const sameAs = Object.values(site.social || {}).filter(Boolean);
  script.textContent = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url || location.href,
    jobTitle: site.title?.[language] || site.title?.en || "Graphic Designer & Photographer",
    email: site.email ? `mailto:${site.email}` : undefined,
    sameAs: sameAs.length ? sameAs : undefined
  });
}
