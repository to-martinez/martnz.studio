import {
  loadPortfolioData,
  localize,
  projectImage,
  projectUrl
} from "./data.js";
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
    en: "Logo/Branding",
    hr: "Logotip/Brendiranje"
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
  },
  vehicle: {
    en: "Vehicle Livery",
    hr: "Vozila"
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
    "hero.intro": "Independent graphic designer and photographer based in Croatia.",
    "hero.cta": "Explore selected work",
    "featured.eyebrow": "Featured projects",
    "featured.title": "A few projects worth starting with.",
    "featured.viewAll": "View all work",
    "work.eyebrow": "Selected work",
    "work.title": "Design across formats and industries.",
    "photo.eyebrow": "Photography",
    "photo.title": "Photographs that feel like memories.",
    "photo.wedding": "Wedding",
    "photo.street": "Street & portrait",
    "photo.open": "Open image",
    "about.eyebrow": "About me",
    "about.title": "Hi, I'm Tomislav!",
    "about.placeholder": "I'm a passionate graphic designer and photographer based in Croatia. I'm driven by creativity, attention to detail, and a desire to create intriguing and unique work.",
    "about.placeholder2": "As a fast learner and problem-solver, I thrive in dynamic environments and enjoy tackling complex challenges.",
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
    "photo.title": "Fotografije koje izgledaju kao sjećanja",
    "photo.wedding": "Vjenčanje",
    "photo.street": "Ulična i portretna",
    "photo.open": "Otvori fotografiju",
    "about.eyebrow": "O meni",
    "about.title": "Bok, ja sam Tomislav!",
    "about.placeholder": "Strastveni sam grafički dizajner i fotograf iz Hrvatske. Pokreće me kreativnost, pažnja prema detaljima i želja za stvaranjem intrigantnih i jedinstvenih radova.",
    "about.placeholder2": "Brzo učim i volim rješavati probleme, stoga uživam u dinamičnim okruženjima i volim se upuštati u složene izazove.",
    "contact.eyebrow": "Kontakt",
    "contact.title": "Imaš projekt na umu?",
    "contact.copy": "Slobodno se javi za suradnju, freelance projekte ili samo da kažeš bok. Uvijek sam otvoren za razgovor o novim projektima i idejama!",
    "contact.cta": "Pošalji mi poruku",
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
let photoGalleries = [];

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

function setupImageFadeIn(root = document) {
  root.querySelectorAll("img:not(.is-loaded)").forEach(image => {
    const reveal = () => {
      image.classList.add("is-loaded");
    };

    if (image.complete && image.naturalWidth > 0) {
      reveal();
    } else {
      image.addEventListener("load", reveal, { once: true });
      image.addEventListener("error", reveal, { once: true });
    }
  });
}

function applyLanguage() {
  document.documentElement.lang = state.language;
  document.querySelectorAll("[data-i18n]").forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelector("[data-current-language]").textContent = state.language.toUpperCase();
  updateHomepageSeo();
  renderProjects();
  renderPhotography();
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

  setupImageFadeIn();
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

const PHOTO_PREVIEW_LIMIT = 5;

function renderPhotography() {
  const container = document.querySelector("[data-photo-galleries]");

  if (!container) return;

  const galleryElements = photoGalleries
    .filter(gallery => gallery.images?.some(image => image?.src))
    .map(createPhotoGallery);

  container.replaceChildren(...galleryElements);

  setupImageFadeIn(container);
  observeReveals();
}

function createPhotoGallery(gallery) {
  const images = gallery.images.filter(image => image?.src);
  const galleryTitle = localized(gallery.title) || gallery.id;

  let selectedIndex = Math.min(
    Math.max(gallery.coverIndex ?? 0, 0),
    images.length - 1
  );

  const article = document.createElement("article");
  article.className = "photo-gallery reveal";

  const mainButton = document.createElement("button");
  mainButton.className = "photo-gallery-main";
  mainButton.type = "button";

  const mainImage = document.createElement("img");
  mainImage.loading = "lazy";

  mainButton.append(mainImage);

  const thumbnailStrip = document.createElement("div");
  thumbnailStrip.className = "photo-gallery-thumbnails";
  thumbnailStrip.setAttribute("role", "group");
  thumbnailStrip.setAttribute(
    "aria-label",
    `${galleryTitle} previews`
  );

  const visibleImages = images.slice(0, PHOTO_PREVIEW_LIMIT);
  const remainingCount = Math.max(
    images.length - PHOTO_PREVIEW_LIMIT,
    0
  );

  const thumbnailButtons = visibleImages.map((image, index) => {
    const button = document.createElement("button");
    button.className = "photo-gallery-thumbnail";
    button.type = "button";
    button.setAttribute("aria-pressed", "false");

    const thumbnail = document.createElement("img");
    thumbnail.src = image.src;
    thumbnail.alt = "";
    thumbnail.loading = "lazy";

    if (image.position) {
      thumbnail.style.objectPosition = image.position;
    }

    button.append(thumbnail);

    const isLastPreview =
      index === PHOTO_PREVIEW_LIMIT - 1 &&
      remainingCount > 0;

    if (isLastPreview) {
      const remainingLabel = document.createElement("span");
      remainingLabel.className = "photo-gallery-more";
      remainingLabel.textContent = `+${remainingCount}`;
      remainingLabel.setAttribute("aria-hidden", "true");

      button.append(remainingLabel);
    }

    button.setAttribute(
      "aria-label",
      isLastPreview
        ? `${localized({
            en: "Open all photographs",
            hr: "Otvori sve fotografije"
          })}: ${galleryTitle}`
        : `${galleryTitle}, ${
            localized({
              en: "preview",
              hr: "pregled"
            })
          } ${index + 1}`
    );

    button.addEventListener("click", () => {
      if (isLastPreview) {
        openPhotoLightbox(
          images,
          PHOTO_PREVIEW_LIMIT,
          galleryTitle
        );
        return;
      }

      selectImage(index);
    });

    if (window.matchMedia("(hover: hover)").matches) {
      button.addEventListener("mouseenter", () => {
        selectImage(index);
      });
    }

    thumbnailStrip.append(button);

    return button;
  });

  const meta = document.createElement("div");
  meta.className = "photo-gallery-meta";

  const textGroup = document.createElement("div");

  const title = document.createElement("h3");
  title.className = "photo-gallery-title";
  title.textContent = galleryTitle;

  const count = document.createElement("p");
  count.className = "photo-gallery-count";
  count.textContent = formatPhotoCount(images.length);

  textGroup.append(title, count);

  const openButton = document.createElement("button");
  openButton.className = "text-link photo-gallery-open";
  openButton.type = "button";

  const openText = document.createElement("span");
  openText.textContent = localized({
    en: "View gallery",
    hr: "Otvori galeriju"
  });

  const openArrow = document.createElement("span");
  openArrow.textContent = "↗";
  openArrow.setAttribute("aria-hidden", "true");

  openButton.append(openText, openArrow);

  function selectImage(index) {
    selectedIndex = index;

    const image = images[index];
    const imageAlt =
      localized(image.alt) ||
      `${galleryTitle}, photograph ${index + 1}`;

    mainImage.src = image.src;
    mainImage.alt = imageAlt;
    mainImage.style.objectPosition = image.position || "center";

    mainButton.setAttribute(
      "aria-label",
      `${localized({
        en: "Open gallery",
        hr: "Otvori galeriju"
      })}: ${galleryTitle}, ${index + 1} / ${images.length}`
    );

    thumbnailButtons.forEach((button, buttonIndex) => {
      const isActive = buttonIndex === index;

      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  }

  function openGallery() {
    openPhotoLightbox(images, selectedIndex, galleryTitle);
  }

  mainButton.addEventListener("click", openGallery);
  openButton.addEventListener("click", openGallery);

  selectImage(selectedIndex);

  meta.append(textGroup, openButton);
  article.append(mainButton, thumbnailStrip, meta);

  return article;
}

function formatPhotoCount(count) {
  const language = document.documentElement.lang || "en";

  if (language.startsWith("hr")) {
    if (count === 1) {
      return "1 fotografija";
    }

    const finalDigit = count % 10;
    const finalTwoDigits = count % 100;

    const usesFotografije =
      finalDigit >= 2 &&
      finalDigit <= 4 &&
      !(finalTwoDigits >= 12 && finalTwoDigits <= 14);

    return `${count} ${
      usesFotografije ? "fotografije" : "fotografija"
    }`;
  }

  return `${count} ${
    count === 1 ? "photograph" : "photographs"
  }`;
}


let activeLightboxImages = [];
let activeLightboxIndex = 0;
let activeLightboxGalleryTitle = "";
let photoLightbox = null;

function setupPhotoLightbox() {
  if (photoLightbox) return;

  const dialog = document.querySelector("[data-lightbox]");
  const image = document.querySelector("[data-lightbox-image]");
  const caption = document.querySelector("[data-lightbox-caption]");
  const counter = document.querySelector("[data-lightbox-counter]");
  const closeButton = document.querySelector("[data-lightbox-close]");
  const previousButton = document.querySelector("[data-lightbox-previous]");
  const nextButton = document.querySelector("[data-lightbox-next]");

  if (
    !dialog ||
    !image ||
    !caption ||
    !counter ||
    !closeButton ||
    !previousButton ||
    !nextButton
  ) {
    return;
  }

  photoLightbox = {
    dialog,
    image,
    caption,
    counter,
    previousButton,
    nextButton
  };

  closeButton.addEventListener("click", () => {
    dialog.close();
  });

  previousButton.addEventListener("click", () => {
    movePhotoLightbox(-1);
  });

  nextButton.addEventListener("click", () => {
    movePhotoLightbox(1);
  });

  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      movePhotoLightbox(-1);
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      movePhotoLightbox(1);
    }
  });

  dialog.addEventListener("click", event => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener("close", () => {
    activeLightboxImages = [];
    activeLightboxIndex = 0;
    activeLightboxGalleryTitle = "";
    image.src = "";
    image.alt = "";
    caption.textContent = "";
    counter.textContent = "";
  });
}

function openPhotoLightbox(images, startingIndex, galleryTitle) {
  setupPhotoLightbox();

  if (!photoLightbox || !images.length) return;

  activeLightboxImages = images;
  activeLightboxIndex = startingIndex;
  activeLightboxGalleryTitle = galleryTitle;

  renderPhotoLightbox();

  if (!photoLightbox.dialog.open) {
    photoLightbox.dialog.showModal();
  }
}

function movePhotoLightbox(direction) {
  if (!activeLightboxImages.length) return;

  activeLightboxIndex =
    (
      activeLightboxIndex +
      direction +
      activeLightboxImages.length
    ) % activeLightboxImages.length;

  renderPhotoLightbox();
}

function renderPhotoLightbox() {
  if (!photoLightbox || !activeLightboxImages.length) return;

  const currentPhoto = activeLightboxImages[activeLightboxIndex];

  const alt =
    localized(currentPhoto.alt) ||
    `${activeLightboxGalleryTitle}, photograph ${activeLightboxIndex + 1}`;

  photoLightbox.image.src = currentPhoto.src;
  photoLightbox.image.alt = alt;
  photoLightbox.image.style.objectPosition =
    currentPhoto.position || "center";

  photoLightbox.caption.textContent =
    localized(currentPhoto.caption) || alt;

  photoLightbox.counter.textContent =
    `${activeLightboxIndex + 1} / ${activeLightboxImages.length}`;

  const hasMultipleImages = activeLightboxImages.length > 1;

  photoLightbox.previousButton.hidden = !hasMultipleImages;
  photoLightbox.nextButton.hidden = !hasMultipleImages;
  photoLightbox.counter.hidden = !hasMultipleImages;
}

async function init() {
  ({ site, projects, featuredProjects, photoGalleries } = await loadPortfolioData());
  document.querySelector("[data-current-year]").textContent = new Date().getFullYear();
  applyTheme();
  setupHeader();
  setupControls();
  setupPhotoLightbox();
  setupSiteData();
  applyLanguage();
  observeReveals();
}

init().catch(showError);
