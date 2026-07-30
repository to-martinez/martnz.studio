# Tomislav Martinez Portfolio

A static, bilingual portfolio built with plain HTML, CSS and JavaScript. Project content lives in one file: `data/projects.json`.

## The normal workflow

### 1. Preview the site

Install a current version of Node.js, open Terminal in this folder and run:

```bash
npm run preview
```

Then open:

```text
http://localhost:8000
```

The preview command automatically rebuilds every project page before starting the local server. Press `Control + C` to stop it.

Do not double-click `index.html`: browsers block JSON loading from `file://` pages.

### 2. Replace the site details

Edit `data/site.json` and replace:

- `https://your-domain.com`
- `hello@example.com`
- social links
- the default sharing image

The real domain is important because it is used for canonical URLs, Open Graph previews and the sitemap.

### 3. Add project images

Duplicate:

```text
assets/images/projects/_template/
```

Rename the copied folder to match the project's `id`, for example:

```text
assets/images/projects/coffee-brand/
```

Recommended files:

```text
thumbnail.webp
hero.webp
social.webp
01.webp
02.webp
03.webp
```

Suggested exports:

- `thumbnail.webp`: about 1600 × 1200 px
- `hero.webp`: about 2400 px wide
- `social.webp`: 1200 × 630 px
- gallery images: about 2000–2400 px wide

### 4. Add the project to JSON

Open `data/project-template.json`, copy the complete object and paste it into the array in `data/projects.json`.

Important JSON rules:

- Separate project objects with commas.
- Do not leave a comma after the final object.
- Use double quotes, not single quotes.
- JSON does not allow comments.

Then replace the template text and image paths with your content.

### 5. Rebuild

Run:

```bash
npm run build
```

This creates a real page at:

```text
projects/project-name/index.html
```

`npm run preview` also runs the build automatically.

## What happens automatically

One object in `data/projects.json` creates:

- a homepage card
- a Work-section card
- its category filter
- a complete case-study page
- project accent styling
- browser title and description
- Open Graph and Twitter metadata
- a clean `/projects/project-id/` URL
- related projects
- sitemap entries after the real domain is added

No project-specific HTML or JavaScript is required.

## Useful project fields

### `id`

The permanent URL name. Use lowercase letters, numbers and hyphens only:

```json
"id": "coffee-brand"
```

### `published`

Set to `false` to keep a project in JSON without displaying it:

```json
"published": false
```

### `featured`

Controls whether the project appears in the large Featured Projects section:

```json
"featured": true
```

### `priority`

Higher numbers appear first everywhere:

```json
"priority": 80
```

### `accent`

Controls subtle arrows, highlights and case-study details:

```json
"accent": "#8a5a44"
```

### `related`

This field is optional. When omitted, related projects are selected automatically, prioritizing the same category.

To curate them manually:

```json
"related": ["project-two", "project-three"]
```

### Gallery sizes

Use `wide` for a full-width image and `half` for a two-column image:

```json
"size": "wide"
```

Project gallery images open in the fullscreen viewer. It supports previous/next buttons, keyboard arrows and horizontal swipe gestures.

## GitHub Pages

The included workflow at `.github/workflows/pages.yml` builds and deploys the site whenever the `main` branch is updated.

In GitHub, set:

```text
Repository → Settings → Pages → Source → GitHub Actions
```

Then connect the Cloudflare domain to the GitHub Pages address and put that final domain in `data/site.json`.

## Main files

```text
data/projects.json          All project content
data/project-template.json  Copyable project template
data/site.json              Name, domain, email and social links
assets/images/projects/     Real project images
assets/js/                  Rendering, SEO and image-viewer logic
scripts/build.mjs            Generates static project pages
```

Once your real projects are added, the code should only need changes when you intentionally want a new feature.


A clean copyable template is available at:

```text
data/website-project-template.json
```

When a project contains:

```json
"type": "website",
"liveUrl": "https://the-real-website.com"
```

its homepage card, Work card and case-study page automatically show a bilingual **Visit website ↗** link. Removing `liveUrl` hides all live-site links without any HTML or CSS edits.

Recommended image folder:

```text
assets/images/projects/website-project-name/
├── thumbnail.webp
├── hero.webp
├── social.webp
├── 01-desktop.webp
├── 02-mobile.webp
└── 03-detail.webp
```
