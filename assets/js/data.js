const JSON_OPTIONS = { cache: "no-cache" };

async function fetchJson(path) {
  const url = new URL(path, document.baseURI);
  const response = await fetch(url, JSON_OPTIONS);
  if (!response.ok) {
    throw new Error(`Could not load ${path} (${response.status})`);
  }
  return response.json();
}

export async function loadPortfolioData() {
  const [site, projects, photoGalleries] = await Promise.all([
    fetchJson("data/site.json"),
    fetchJson("data/projects.json"),
    fetchJson("data/photography.json")
  ]);

  if (!Array.isArray(projects)) {
    throw new TypeError(
      "data/projects.json must contain an array of projects."
    );
  }

  if (!Array.isArray(photoGalleries)) {
    throw new TypeError(
      "data/photography.json must contain an array of galleries."
    );
  }

  const publishedProjects = projects.filter(
    project => project.published !== false
  );

  const orderedProjects = [...publishedProjects].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );

  const featuredProjects = publishedProjects
    .filter(project => project.featured === true)
    .sort(
      (a, b) =>
        (b.featuredPriority ?? b.priority ?? 0) -
        (a.featuredPriority ?? a.priority ?? 0)
    );

  const orderedPhotoGalleries = photoGalleries
    .filter(gallery => gallery.published !== false)
    .filter(gallery => Array.isArray(gallery.images))
    .filter(gallery => gallery.images.length > 0)
    .sort(
      (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
    );

  return {
    site,
    projects: orderedProjects,
    featuredProjects,
    photoGalleries: orderedPhotoGalleries
  };
}

export function localize(value, language = "en") {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value;
  return value?.[language] ?? value?.en ?? "";
}

export function projectUrl(project) {
  return `projects/${encodeURIComponent(project.id)}/`;
}

export function projectImage(project, type = "thumbnail") {
  const image = project.images?.[type];
  if (typeof image === "string") return { src: image, alt: project.title };
  return image ?? project.images?.hero ?? project.images?.thumbnail ?? { src: "", alt: "" };
}

export function automaticRelatedProjects(project, projects, limit = 3) {
  const explicit = Array.isArray(project.related)
    ? project.related
        .map(id => projects.find(candidate => candidate.id === id))
        .filter(Boolean)
    : [];

  const alreadyIncluded = new Set([project.id, ...explicit.map(item => item.id)]);
  const sameCategory = projects.filter(candidate =>
    !alreadyIncluded.has(candidate.id) && candidate.category === project.category
  );
  sameCategory.forEach(item => alreadyIncluded.add(item.id));

  const remaining = projects.filter(candidate => !alreadyIncluded.has(candidate.id));
  return [...explicit, ...sameCategory, ...remaining].slice(0, limit);
}
