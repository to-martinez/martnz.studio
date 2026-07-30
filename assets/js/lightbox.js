export function createLightbox(dialog, { getLanguage = () => "en" } = {}) {
  if (!dialog) return null;

  const image = dialog.querySelector("[data-lightbox-image]");
  const caption = dialog.querySelector("[data-lightbox-caption]");
  const counter = dialog.querySelector("[data-lightbox-counter]");
  const previousButton = dialog.querySelector("[data-lightbox-previous]");
  const nextButton = dialog.querySelector("[data-lightbox-next]");
  const closeButton = dialog.querySelector("[data-lightbox-close]");

  let items = [];
  let currentIndex = 0;
  let swipeStartX = null;

  const localized = value => {
    const language = getLanguage();
    return typeof value === "string" ? value : value?.[language] ?? value?.en ?? "";
  };

  function render() {
    const item = items[currentIndex];
    if (!item) return;
    image.src = item.src;
    image.alt = localized(item.alt);
    caption.textContent = localized(item.caption || item.alt);
    counter.textContent = `${currentIndex + 1} / ${items.length}`;
    const multiple = items.length > 1;
    previousButton.hidden = !multiple;
    nextButton.hidden = !multiple;
    counter.hidden = !multiple;
  }

  function open(nextItems, index = 0) {
    items = nextItems.filter(item => item?.src);
    currentIndex = Math.min(Math.max(index, 0), Math.max(items.length - 1, 0));
    render();
    if (!dialog.open) dialog.showModal();
  }

  function move(direction) {
    if (items.length < 2) return;
    currentIndex = (currentIndex + direction + items.length) % items.length;
    render();
  }

  previousButton?.addEventListener("click", () => move(-1));
  nextButton?.addEventListener("click", () => move(1));
  closeButton?.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });

  dialog.addEventListener("keydown", event => {
    if (event.key === "ArrowLeft") move(-1);
    if (event.key === "ArrowRight") move(1);
  });

  dialog.addEventListener("pointerdown", event => {
    swipeStartX = event.clientX;
  });
  dialog.addEventListener("pointerup", event => {
    if (swipeStartX === null) return;
    const distance = event.clientX - swipeStartX;
    swipeStartX = null;
    if (Math.abs(distance) < 55) return;
    move(distance > 0 ? -1 : 1);
  });

  return { open };
}

export function itemsFromTriggers(triggers) {
  return [...triggers].map(trigger => ({
    src: trigger.dataset.lightboxSrc,
    alt: {
      en: trigger.dataset.lightboxAltEn || "",
      hr: trigger.dataset.lightboxAltHr || trigger.dataset.lightboxAltEn || ""
    },
    caption: {
      en: trigger.dataset.lightboxCaptionEn || trigger.dataset.lightboxAltEn || "",
      hr: trigger.dataset.lightboxCaptionHr || trigger.dataset.lightboxAltHr || trigger.dataset.lightboxAltEn || ""
    }
  }));
}
