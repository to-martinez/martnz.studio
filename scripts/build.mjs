import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const projectsPath = path.join(root, "data", "projects.json");
const sitePath = path.join(root, "data", "site.json");
const templatePath = path.join(root, "project.html");
const outputDirectory = path.join(root, "projects");

const [projects, site, template] = await Promise.all([
  readJson(projectsPath),
  readJson(sitePath),
  fs.readFile(templatePath, "utf8")
]);

validateProjects(projects);
await fs.rm(outputDirectory, { recursive: true, force: true });
await fs.mkdir(outputDirectory, { recursive: true });

const published = projects
  .filter(project => project.published !== false)
  .sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0));

for (const project of published) {
  const projectDirectory = path.join(outputDirectory, project.id);
  await fs.mkdir(projectDirectory, { recursive: true });
  await fs.writeFile(path.join(projectDirectory, "index.html"), renderProjectPage(template, project, site));
}

await updateHomepageMetadata(site);
await createSitemap(site, published);
console.log(`Built ${published.length} project page${published.length === 1 ? "" : "s"}.`);

async function readJson(file) {
  try {
    return JSON.parse(await fs.readFile(file, "utf8"));
  } catch (error) {
    throw new Error(`Could not read ${path.relative(root, file)}: ${error.message}`);
  }
}

function validateProjects(items) {
  if (!Array.isArray(items)) {
    throw new Error("data/projects.json must contain a JSON array.");
  }

  const ids = new Set();

  for (const [index, project] of items.entries()) {
    const label = project.id || `project at index ${index}`;

    for (const field of ["id", "title", "categories", "summary", "images"]) {
      if (!project[field]) {
        throw new Error(`${label} is missing required field: ${field}`);
      }
    }

    if (
      !Array.isArray(project.categories) ||
      project.categories.length === 0
    ) {
      throw new Error(
        `${label}: categories must be a non-empty array.`
      );
    }

    if (
      project.categories.some(
        category =>
          typeof category !== "string" ||
          category.trim() === ""
      )
    ) {
      throw new Error(
        `${label}: every category must be a non-empty string.`
      );
    }

    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.id)) {
      throw new Error(
        `${label}: id must use lowercase letters, numbers and hyphens only.`
      );
    }

    if (ids.has(project.id)) {
      throw new Error(`Duplicate project id: ${project.id}`);
    }

    ids.add(project.id);

    if (!project.images.thumbnail?.src) {
      throw new Error(`${label} is missing images.thumbnail.src`);
    }

    if (!project.images.hero?.src) {
      throw new Error(`${label} is missing images.hero.src`);
    }
  }
}

function localized(value, language = "en") {
  if (typeof value === "string") return value;
  return value?.[language] ?? value?.en ?? "";
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function absoluteUrl(value, siteUrl) {
  if (!value) return "";
  try {
    return new URL(value, ensureTrailingSlash(siteUrl)).href;
  } catch {
    return value;
  }
}

function ensureTrailingSlash(value = "") {
  return value.endsWith("/") ? value : `${value}/`;
}

function replaceMeta(html, selectorType, selectorValue, content) {
  const escaped = escapeHtml(content);
  const expression = new RegExp(`<meta\\s+${selectorType}="${selectorValue}"\\s+content="[^"]*"\\s*\/?>`, "i");
  const replacement = `<meta ${selectorType}="${selectorValue}" content="${escaped}">`;
  return expression.test(html) ? html.replace(expression, replacement) : html.replace("</head>", `  ${replacement}\n</head>`);
}

function replaceCanonical(html, url) {
  const replacement = `<link rel="canonical" href="${escapeHtml(url)}">`;
  return /<link\s+rel="canonical"[^>]*>/i.test(html)
    ? html.replace(/<link\s+rel="canonical"[^>]*>/i, replacement)
    : html.replace("</head>", `  ${replacement}\n</head>`);
}

function renderProjectPage(source, project, site) {
  const title = `${localized(project.title)} — ${site.name}`;
  const description = localized(project.summary);
  const projectUrl = site.url
    ? `${site.url.replace(/\/$/, "")}/projects/${project.id}/`
    : `projects/${project.id}/`;
  const socialImage = absoluteUrl(project.images.social || project.images.hero.src, site.url);

  let html = source;
  html = html.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <base href="../../">');
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = html.replace('data-project-id=""', `data-project-id="${escapeHtml(project.id)}"`);
  html = replaceMeta(html, "name", "description", description);
  html = replaceMeta(html, "property", "og:title", title);
  html = replaceMeta(html, "property", "og:description", description);
  html = replaceMeta(html, "property", "og:type", "article");
  html = replaceMeta(html, "property", "og:image", socialImage);
  html = replaceMeta(html, "property", "og:url", projectUrl);
  html = replaceMeta(html, "property", "og:locale", "en_US");
  html = replaceMeta(html, "name", "twitter:card", "summary_large_image");
  html = replaceMeta(html, "name", "twitter:title", title);
  html = replaceMeta(html, "name", "twitter:description", description);
  html = replaceMeta(html, "name", "twitter:image", socialImage);
  html = replaceCanonical(html, projectUrl);
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: localized(project.title),
    description,
    url: projectUrl,
    image: socialImage,
    sameAs: project.liveUrl || undefined,
    dateCreated: String(project.year || ""),
    creator: {
      "@type": "Person",
      name: site.name,
      url: site.url || undefined
    }
  };
  html = html.replace("</head>", `  <script type="application/ld+json">${JSON.stringify(structuredData).replaceAll("<", "\\u003c")}</script>\n</head>`);
  return html;
}

async function updateHomepageMetadata(site) {
  const homepagePath = path.join(root, "index.html");
  let html = await fs.readFile(homepagePath, "utf8");
  const title = `${site.name} — ${localized(site.title)}`;
  const description = localized(site.description) || localized(site.title);
  const socialImage = absoluteUrl(site.ogImage, site.url);
  const homepageUrl = site.url ? ensureTrailingSlash(site.url) : "";

  html = html.replace(/<title>[^<]*<\/title>/, `<title>${escapeHtml(title)}</title>`);
  html = replaceMeta(html, "name", "description", description);
  html = replaceMeta(html, "property", "og:title", title);
  html = replaceMeta(html, "property", "og:description", description);
  html = replaceMeta(html, "property", "og:type", "website");
  html = replaceMeta(html, "property", "og:image", socialImage);
  html = replaceMeta(html, "property", "og:url", homepageUrl);
  html = replaceMeta(html, "property", "og:locale", "en_US");
  html = replaceMeta(html, "name", "twitter:card", "summary_large_image");
  html = replaceMeta(html, "name", "twitter:title", title);
  html = replaceMeta(html, "name", "twitter:description", description);
  html = replaceMeta(html, "name", "twitter:image", socialImage);
  if (homepageUrl) html = replaceCanonical(html, homepageUrl);
  html = html.replace(/\n?\s*<script type="application\/ld\+json" data-build-schema>.*?<\/script>/s, "");
  const personSchema = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    url: site.url || undefined,
    jobTitle: localized(site.title),
    email: site.email ? `mailto:${site.email}` : undefined,
    sameAs: Object.values(site.social || {}).filter(Boolean)
  };
  html = html.replace("</head>", `  <script type="application/ld+json" data-build-schema>${JSON.stringify(personSchema).replaceAll("<", "\\u003c")}</script>\n</head>`);
  await fs.writeFile(homepagePath, html);
}

async function createSitemap(site, items) {
  const destination = path.join(root, "sitemap.xml");
  const robotsDestination = path.join(root, "robots.txt");
  if (!site.url || site.url.includes("your-domain.com")) {
    await fs.rm(destination, { force: true });
    await fs.rm(robotsDestination, { force: true });
    return;
  }

  const base = site.url.replace(/\/$/, "");
  const urls = [
    `${base}/`,
    ...items.map(project => `${base}/projects/${project.id}/`)
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${escapeHtml(url)}</loc></url>`).join("\n")}\n</urlset>\n`;
  await fs.writeFile(destination, xml);
  await fs.writeFile(robotsDestination, `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`);
}
