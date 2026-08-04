import {
  automaticRelatedProjects,
  loadPortfolioData,
  localize,
  projectImage,
  projectUrl
} from "./data.js";
import { createLightbox } from "./lightbox.js";
import { updateSeo } from "./seo.js";

function getInitialLanguage() {
  const savedLanguage = localStorage.getItem("portfolio-language");

  if (savedLanguage === "en" || savedLanguage === "hr") {
    return savedLanguage;
  }

  const browserLanguages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  return browserLanguages.some(language =>
    language?.toLowerCase().startsWith("hr")
  )
    ? "hr"
    : "en";
}

const state = {
  language: getInitialLanguage(),
  theme: localStorage.getItem("portfolio-theme") ||
    (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark")
};

const translations = {
  en: {
    "nav.work": "Work",
    "nav.photography": "Photography",
    "nav.about": "About",
    "nav.contact": "Contact",
    "project.back": "Back to work",
    "project.overview": "Overview",
    "project.client": "Client",
    "project.role": "Role",
    "project.services": "Services",
    "project.challenge": "Challenge",
    "project.solution": "Solution",
    "project.next": "Continue exploring",
    "project.related": "Related projects",
    "project.all": "All work",
    "project.visit": "Visit website",
    "project.live": "Live website",
    "project.liveCopy": "See the complete experience online."
  },
  hr: {
    "nav.work": "Radovi",
    "nav.photography": "Fotografija",
    "nav.about": "O meni",
    "nav.contact": "Kontakt",
    "project.back": "Povratak na radove",
    "project.overview": "Pregled",
    "project.client": "Klijent",
    "project.role": "Uloga",
    "project.services": "Usluge",
    "project.challenge": "Izazov",
    "project.solution": "Rješenje",
    "project.next": "Nastavi istraživati",
    "project.related": "Povezani projekti",
    "project.all": "Svi radovi",
    "project.visit": "Posjeti web stranicu",
    "project.live": "Aktivna web stranica",
    "project.liveCopy": "Pogledaj potpuno iskustvo na internetu."
  }
};

let site;
let projects = [];
let project;
let observer;
let lightbox;

const t = key => translations[state.language][key] ?? key;
const localized = value => localize(value, state.language);

function getProjectId() {
  return document.body.dataset.projectId || new URLSearchParams(location.search).get("id") || "";
}

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  localStorage.setItem("portfolio-theme", state.theme);
}

function updateLanguageControl() {
  const button = document.querySelector("[data-language-toggle]");
  const targetLabel = document.querySelector("[data-language-target]");
  const legacyLabel = document.querySelector("[data-current-language]");

  if (!button) return;

  const targetLanguage = state.language === "hr" ? "en" : "hr";
  const accessibleLabel = targetLanguage === "hr"
    ? "Prebaci na hrvatski"
    : "Switch to English";

  if (targetLabel) {
    targetLabel.textContent = targetLanguage.toUpperCase();
  }

  // Keeps older project-page HTML working until its button markup is updated.
  if (legacyLabel) {
    legacyLabel.textContent = targetLanguage.toUpperCase();
  }

  button.setAttribute("aria-label", accessibleLabel);
  button.title = accessibleLabel;
  button.lang = targetLanguage;
}

function updateProjectSeo() {
  const title = `${localized(project.title)} — ${site.name}`;
  const hero = projectImage(project, "social");
  updateSeo({
    title,
    description: localized(project.summary),
    image: typeof hero === "string" ? hero : hero.src,
    url: site.url ? `${site.url.replace(/\/$/, "")}/${projectUrl(project)}` : location.href,
    type: "article",
    language: state.language,
    siteUrl: site.url
  });
}

function renderProject() {
  document.documentElement.lang = state.language;
  document.documentElement.dataset.language = state.language;
  document.documentElement.style.setProperty("--project-accent", project.accent || "#8f6fe8");

  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });

  updateLanguageControl();
  updateProjectSeo();
  document.querySelector("[data-project-title]").textContent = localized(project.title);
  document.querySelector("[data-project-category]").textContent = localized(project.categoryLabel);
  document.querySelector("[data-project-year]").textContent = project.year;
  document.querySelector("[data-project-intro]").textContent = localized(project.intro);
  document.querySelector("[data-project-summary]").textContent = localized(project.summary);
  document.querySelector("[data-project-client]").textContent = localized(project.client);
  document.querySelector("[data-project-role]").textContent = localized(project.role);
  document.querySelector("[data-project-services]").textContent =
    (project.services?.[state.language] || project.services?.en || []).join(", ");

  const liveUrl = project.liveUrl?.trim();
  const liveHero = document.querySelector("[data-project-live-hero]");
  const liveFooter = document.querySelector("[data-project-live-footer]");
  const liveSection = document.querySelector("[data-project-live-section]");
  liveHero.hidden = !liveUrl;
  liveSection.hidden = !liveUrl;
  if (liveUrl) {
    liveHero.href = liveUrl;
    liveFooter.href = liveUrl;
  }

  const problem = localized(project.problem);
  const solution = localized(project.solution);
  const problemBlock = document.querySelector("[data-project-problem]").closest("article");
  const solutionBlock = document.querySelector("[data-project-solution]").closest("article");
  problemBlock.hidden = !problem;
  solutionBlock.hidden = !solution;
  document.querySelector("[data-project-problem]").textContent = problem;
  document.querySelector("[data-project-solution]").textContent = solution;
  document.querySelector(".project-story").hidden = !problem && !solution;

  const hero = projectImage(project, "hero");
  const cover = document.querySelector("[data-project-cover]");
  cover.src = hero.src;
  cover.alt = localized(hero.alt);

  renderGallery();
  renderRelated();
  observeReveals();
}

function renderGallery() {
  const galleryItems = project.images?.gallery || [];
  const gallery = document.querySelector("[data-project-gallery]");
  gallery.closest("section").hidden = galleryItems.length === 0;
  const lightboxItems = galleryItems.map(item => ({
    src: item.src,
    alt: item.alt,
    caption: item.caption || item.alt
  }));

  gallery.replaceChildren(...galleryItems.map((item, index) => {
    const figure = document.createElement("figure");
    figure.className = `gallery-item reveal${item.size === "wide" ? " is-wide" : ""}`;
    const button = document.createElement("button");
    button.className = "gallery-button";
    button.type = "button";
    button.setAttribute("aria-label", localized(item.alt));
    button.innerHTML = `<img src="${item.src}" alt="${localized(item.alt)}" loading="lazy" decoding="async">`;
    button.addEventListener("click", () => lightbox?.open(lightboxItems, index));
    figure.append(button);
    return figure;
  }));
}

function renderRelated(categoryLabels) {
  const related = document.querySelector("[data-related-projects]");
  const relatedProjects = automaticRelatedProjects(project, projects);

  related.replaceChildren(
    ...relatedProjects.map(item => {
      const image = projectImage(item, "thumbnail");

      const categories = Array.isArray(item.categories)
        ? item.categories
        : item.category
          ? [item.category]
          : [];

      const categoryText = categories
        .map(category => {
          const label = site.categories?.[category];
          return label ? localized(label) : category;
        })
        .join(" · ");

      const article = document.createElement("article");
      article.className = "related-card reveal";

      article.innerHTML = `
        <a href="${projectUrl(item)}">
          <div class="related-card-media">
            <img
              src="${image.src}"
              alt="${localized(image.alt)}"
              loading="lazy"
              decoding="async"
            >
          </div>

          <div class="related-card-copy">
            <div>
              <h3>${localized(item.title)}</h3>

              <p>
                ${categoryText}${categoryText ? " · " : ""}${item.year}
              </p>
            </div>

            <span class="related-arrow" aria-hidden="true">↗</span>
          </div>
        </a>
      `;

      return article;
    })
  );
}

function observeReveals() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    document.querySelectorAll(".reveal").forEach(element => element.classList.add("is-visible"));
    return;
  }
  observer?.disconnect();
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: .12 });
  document.querySelectorAll(".reveal:not(.is-visible)").forEach(element => observer.observe(element));
}

function setupControls() {
  document.querySelector("[data-language-toggle]").addEventListener("click", () => {
    state.language = state.language === "en" ? "hr" : "en";
    localStorage.setItem("portfolio-language", state.language);
    renderProject();
  });

  document.querySelector("[data-theme-toggle]").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
  });
}

function showMissingProject() {
  document.querySelector("[data-project-root]").innerHTML = `
    <section class="section error-state">
      <div class="container">
        <p class="eyebrow">404</p>
        <h1>Project not found.</h1>
        <a class="text-link" href="index.html#work"><span>Back to work</span><span aria-hidden="true">↗</span></a>
      </div>
    </section>`;
}

async function init() {
  ({ site, projects } = await loadPortfolioData());
  project = projects.find(item => item.id === getProjectId());
  if (!project) {
    showMissingProject();
    return;
  }

  document.querySelector("[data-current-year]").textContent = new Date().getFullYear();
  applyTheme();
  setupControls();
  lightbox = createLightbox(document.querySelector("[data-lightbox]"), {
    getLanguage: () => state.language
  });
  renderProject();
}

init().catch(error => {
  console.error(error);
  showMissingProject();
});
