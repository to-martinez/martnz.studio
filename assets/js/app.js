import {
  loadPortfolioData,
  localize,
  projectImage,
  projectUrl
} from "./data.js";
import { createLightbox, itemsFromTriggers } from "./lightbox.js";
import { updatePersonSchema, updateSeo } from "./seo.js";

const state = {
  language: localStorage.getItem("portfolio-language") || "en",
  theme: localStorage.getItem("portfolio-theme") ||
    (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"),
  filter: "all"
};

const categoryLabels = {
  print: {
    en: "Print",
    hr: "Tisak"
  },
  editorial: {
    en: "Editorial",
    hr: "Uredništvo"
  },
  branding: {
    en: "Branding",
    hr: "Brendiranje"
  },
  web: {
    en: "Web Design",
    hr: "Web dizajn"
  },
  photography: {
    en: "Photography",
    hr: "Fotografija"
  },
  packaging: {
    en: "Packaging",
    hr: "Ambalaža"
  },
  social: {
    en: "Social Media",
    hr: "Društvene mreže"
  }
};

const translations = {
  en: {
    "nav.work": "Work",
    "nav.photography": "Photography",
    "nav.about": "About",
    "nav.contact": "Contact",
    "hero.eyebrow": "Independent creative portfolio",
    "hero.role": "Graphic Designer & Photographer",
    "hero.intro": "Selected visual identities, web design work, digital work, print design and photography."
,
    "hero.cta": "Explore selected work",
    "featured.eyebrow": "Featured projects",
    "featured.title": "A few projects worth starting with.",
    "featured.viewAll": "View all work",
    "work.eyebrow": "Selected work",
    "work.title": "Design across formats and industries.",
    "photo.eyebrow": "Photography",
    "photo.title": "People, atmosphere and honest moments.",
    "photo.cta": "View photography",
    "photo.wedding": "Wedding",
    "photo.street": "Street & portrait",
    "photo.open": "Open image",
    "about.eyebrow": "About",
    "about.title": "A short introduction will live here.",
    "about.placeholder": "This section is intentionally left simple until the final text is ready.",
    "contact.eyebrow": "Contact",
    "contact.title": "Have a project in mind?",
    "contact.copy": "Feel free to reach out for collaborations, freelance work, or just to say hi. I’m always open to discussing new projects and ideas!",
    "contact.cta": "Get in touch",
    "footer.back": "Back to top",
    "card.view": "View case study",
    "card.visit": "Visit website",
    "card.live": "Live website",
    "filters.all": "All",
    "error.title": "The portfolio data could not be loaded.",
    "error.copy": "Open the site through the included preview server rather than double-clicking index.html."
  },
  hr: {
    "nav.work": "Radovi",
    "nav.photography": "Fotografija",
    "nav.about": "O meni",
    "nav.contact": "Kontakt",
    "hero.eyebrow": "Samostalni kreativni portfolio",
    "hero.role": "Grafički dizajner i fotograf",
    "hero.intro": "Odabrani vizualni identiteti, digitalni projekti, tiskani materijali i fotografija.",
    "hero.cta": "Istraži odabrane radove",
    "featured.eyebrow": "Istaknuti projekti",
    "featured.title": "Nekoliko projekata za početak.",
    "featured.viewAll": "Pogledaj sve radove",
    "work.eyebrow": "Odabrani radovi",
    "work.title": "Dizajn kroz različite formate i industrije.",
    "photo.eyebrow": "Fotografija",
    "photo.title": "Ljudi, atmosfera i iskreni trenuci.",
    "photo.cta": "Pogledaj fotografije",
    "photo.wedding": "Vjenčanje",
    "photo.street": "Ulična i portretna",
    "photo.open": "Otvori fotografiju",
    "about.eyebrow": "O meni",
    "about.title": "Ovdje će doći kratko predstavljanje.",
    "about.placeholder": "Ovaj je odjeljak namjerno jednostavan dok završni tekst ne bude spreman.",
    "contact.eyebrow": "Kontakt",
    "contact.title": "Imaš projekt na umu?",
    "contact.copy": "Slobodno se javi za suradnju, freelance projekte ili samo da kažeš bok. Uvijek sam otvoren za razgovor o novim projektima i idejama!",
    "contact.cta": "Javi se",
    "footer.back": "Povratak na vrh",
    "card.view": "Otvori projekt",
    "card.visit": "Posjeti web stranicu",
    "card.live": "Aktivna stranica",
    "filters.all": "Sve",
    "error.title": "Podaci portfolija nisu se mogli učitati.",
    "error.copy": "Otvori stranicu kroz priloženi lokalni server umjesto dvostrukim klikom na index.html."
  }
};

let site;
let projects = [];
let featuredProjects = [];
let observer;

const t = key => translations[state.language][key] ?? key;
const localized = value => localize(value, state.language);

function applyTheme() {
  document.documentElement.dataset.theme = state.theme;
  localStorage.setItem("portfolio-theme", state.theme);
}

function updateHomepageSeo() {
  const title = state.language === "hr"
    ? `${site.name} — ${site.title?.hr || "Grafički dizajner i fotograf"}`
    : `${site.name} — ${site.title?.en || "Graphic Designer & Photographer"}`;
  const description = localized(site.description) || localized(site.title);

  updateSeo({
    title,
    description,
    image: site.ogImage,
    url: site.url,
    siteUrl: site.url,
    language: state.language
  });
  updatePersonSchema(site, state.language);
}

function applyLanguage() {
  document.documentElement.lang = state.language;
  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelector("[data-current-language]").textContent = state.language.toUpperCase();
  updateHomepageSeo();
  renderProjects();
  renderFilters();
}

function createFeaturedCard(project) {
  const image = projectImage(project, "thumbnail");
  const caseStudyUrl = projectUrl(project);
  const liveUrl = project.liveUrl?.trim();

  const categories = (
    Array.isArray(project.categories)
      ? project.categories
      : project.category
        ? [project.category]
        : []
  )
    .map(category => String(category).trim())
    .filter(Boolean);

  const categoryText = categories
    .map(category => {
      const label = categoryLabels[category];
      return label ? localized(label) : category;
    })
    .join(" · ");

  const article = document.createElement("article");

  article.className = "project-card reveal";
  article.style.setProperty(
    "--card-accent",
    project.accent || "currentColor"
  );

  article.dataset.categories = categories.join(" ");

  article.innerHTML = `
    <a
      class="project-card-image-link"
      href="${caseStudyUrl}"
      aria-label="${localized(project.title)}"
    >
      <div class="project-card-image">
        <img
          src="${image.src}"
          alt="${localized(image.alt)}"
          loading="lazy"
          decoding="async"
        >
      </div>
    </a>

    <div class="project-card-content">
      <div class="project-card-meta">
        <div>
          ${categoryText ? `<span>${categoryText}</span>` : ""}
          <span>${project.year}</span>
        </div>

        ${
          liveUrl
            ? `<span class="live-site-badge">${t("card.live")}</span>`
            : ""
        }
      </div>

      <h3>
        <a href="${caseStudyUrl}">
          ${localized(project.title)}
        </a>
      </h3>

      <p class="project-card-description">
        ${localized(project.summary)}
      </p>

      <div class="project-card-actions">
        <a class="card-link-label" href="${caseStudyUrl}">
          <span>${t("card.view")}</span>
          <span aria-hidden="true">↗</span>
        </a>

        ${
          liveUrl
            ? `
              <a
                class="card-link-label card-link-external"
                href="${liveUrl}"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span>${t("card.visit")}</span>
                <span aria-hidden="true">↗</span>
              </a>
            `
            : ""
        }
      </div>
    </div>
  `;

  return article;
}

function createWorkCard(project) {
  const image = projectImage(project, "thumbnail");
  const caseStudyUrl = projectUrl(project);
  const liveUrl = project.liveUrl?.trim();

  const categories = Array.isArray(project.categories)
    ? project.categories
    : project.category
      ? [project.category]
      : [];

  const categoryText = categories
    .map(category => {
      const label = categoryLabels[category];
      return label ? localized(label) : category;
    })
    .join(" · ");

  const article = document.createElement("article");

  article.className = "work-card reveal";
  article.style.setProperty(
    "--card-accent",
    project.accent || "currentColor"
  );

  article.dataset.categories = categories.join(" ");

  article.innerHTML = `
    <a
      class="work-card-main-link"
      href="${caseStudyUrl}"
      aria-label="${localized(project.title)}"
    >
      <div class="work-card-media">
        <img
          src="${image.src}"
          alt="${localized(image.alt)}"
          loading="lazy"
          decoding="async"
        >
      </div>
    </a>

    <div class="work-card-copy">
      <div>
        <h3>
          <a href="${caseStudyUrl}">
            ${localized(project.title)}
          </a>
        </h3>

        <p class="work-card-meta">
          ${categoryText} · ${project.year}
        </p>

        <div class="work-card-actions">
          <a class="small-text-link" href="${caseStudyUrl}">
            <span>${t("card.view")}</span>
            <span aria-hidden="true">↗</span>
          </a>

          ${
            liveUrl
              ? `
                <a
                  class="small-text-link is-external"
                  href="${liveUrl}"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span>${t("card.visit")}</span>
                  <span aria-hidden="true">↗</span>
                </a>
              `
              : ""
          }
        </div>
      </div>

      <a
        class="work-card-arrow"
        href="${caseStudyUrl}"
        aria-label="${t("card.view")}"
      >
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  `;

  article.hidden =
    state.filter !== "all" &&
    !categories.includes(state.filter);

  return article;
}

function renderProjects() {
  const featuredGrid = document.querySelector("[data-featured-grid]");
  const projectGrid = document.querySelector("[data-project-grid]");

  featuredGrid.replaceChildren(
    ...featuredProjects
      .slice(0, 5)
      .map(createFeaturedCard)
  );

  projectGrid.replaceChildren(
    ...projects.map(createWorkCard)
  );

  observeReveals();
}

function getFilters() {
  const categories = new Map();

  projects.forEach(project => {
    const projectCategories = (
      Array.isArray(project.categories)
        ? project.categories
        : project.category
          ? [project.category]
          : []
    )
      .map(category => String(category).trim())
      .filter(Boolean);

    projectCategories.forEach(category => {
      if (!categories.has(category)) {
        categories.set(
          category,
          categoryLabels[category] || {
            en: category,
            hr: category
          }
        );
      }
    });
  });

  return [
    {
      id: "all",
      label: {
        en: "All",
        hr: "Sve"
      }
    },
    ...[...categories].map(([id, label]) => ({
      id,
      label
    }))
  ];
}

function renderFilters() {
  const bar = document.querySelector("[data-filter-bar]");
  bar.replaceChildren(...getFilters().map(filter => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `filter-button${state.filter === filter.id ? " is-active" : ""}`;
    button.dataset.filter = filter.id;
    button.textContent = localized(filter.label);
    button.addEventListener("click", () => {
      state.filter = filter.id;
      renderFilters();
      renderProjects();
    });
    return button;
  }));
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

function setupHeader() {
  const header = document.querySelector("[data-header]");
  const update = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
  update();
  window.addEventListener("scroll", update, { passive: true });

  const menuButton = document.querySelector(".menu-toggle");
  const menuLabel = menuButton.querySelector(".sr-only");

  const setMenuOpen = open => {
    document.body.classList.toggle("menu-open", open);
    menuButton.setAttribute("aria-expanded", String(open));
    menuLabel.textContent = open ? "Close navigation" : "Open navigation";
  };

  menuButton.addEventListener("click", () => {
    setMenuOpen(!document.body.classList.contains("menu-open"));
  });

  document.querySelectorAll(".site-nav a").forEach(link => {
    link.addEventListener("click", () => setMenuOpen(false));
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && document.body.classList.contains("menu-open")) {
      setMenuOpen(false);
      menuButton.focus();
    }
  });

  window.matchMedia("(min-width: 901px)").addEventListener("change", event => {
    if (event.matches) setMenuOpen(false);
  });
}

function setupLightbox() {
  const triggers = document.querySelectorAll("[data-lightbox-src]");
  const items = itemsFromTriggers(triggers);
  const lightbox = createLightbox(document.querySelector("[data-lightbox]"), {
    getLanguage: () => state.language
  });
  triggers.forEach((trigger, index) => trigger.addEventListener("click", () => lightbox?.open(items, index)));
}

function setupSiteData() {
  const email = document.querySelector("[data-contact-email]");
  email.href = `mailto:${site.email}`;
}

function setupControls() {
  document.querySelector("[data-language-toggle]").addEventListener("click", () => {
    state.language = state.language === "en" ? "hr" : "en";
    localStorage.setItem("portfolio-language", state.language);
    applyLanguage();
  });

  document.querySelector("[data-theme-toggle]").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    applyTheme();
  });
}

function showError(error) {
  console.error(error);
  const main = document.querySelector("main");
  main.innerHTML = `
    <section class="section error-state">
      <div class="container">
        <p class="eyebrow">Error</p>
        <h1>${t("error.title")}</h1>
        <p>${t("error.copy")}</p>
        <pre>${error.message}</pre>
      </div>
    </section>`;
}

async function init() {
  ({ site, projects, featuredProjects } = await loadPortfolioData());
  document.querySelector("[data-current-year]").textContent = new Date().getFullYear();
  applyTheme();
  setupHeader();
  setupControls();
  setupLightbox();
  setupSiteData();
  applyLanguage();
  observeReveals();
}

init().catch(showError);
