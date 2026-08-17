# CSA site + Content Studio — setup & handbook

A self-owned, **free** publishing setup for csa.global:

- **Eleventy (11ty)** turns the hand-coded HTML + Markdown content into a static site.
- **Sveltia CMS** (`/admin`) is the WordPress-like editor — writers sign in with GitHub and publish.
- **GitHub Actions → GitHub Pages** rebuilds and deploys automatically on every change.
- The design is untouched: the raw `styles.css` / `script.js` and every existing page are preserved.

---

## 1. How your team publishes (day-to-day — no tools needed)

1. Go to **https://csa.global/admin**
2. Sign in with your **GitHub account**.
3. **The Wire → New Article**, fill in the fields (title, author, date, lead image + **alt text**, standfirst, body, tags, SEO description).
4. Click **Publish**.
5. ~30–60 seconds later it's live at `csa.global/the-wire/your-article/`, and it automatically appears on the Wire archive and in "More from The Wire".

That's the whole loop. No code, no local software for writers.

---

## 2. Local development (only for design/template changes)

Needed by whoever edits the templates or CSS (i.e. the director / dev), **not** writers.

```bash
# one-time
# install Node 20+ (https://nodejs.org)  — the director likely already has it
npm install

# work locally with live reload
npm run dev          # → http://localhost:8080

# produce the final static site (what gets deployed)
npm run build        # → outputs to _site/
```

**Project layout**

```
src/
  *.html                     hand-coded pages (home, about, services…) — pass through unchanged
  the-wire.njk               the Wire archive (auto-lists articles)
  the-wire/*.md              ← ARTICLES (one Markdown file = one article)
  _includes/base.njk         page shell (head, SEO, nav, footer)
  _includes/article.njk      article layout
  _includes/nav.njk, footer.njk
  _data/site.js              site name, url, default SEO
  admin/                     the CMS (index.html + config.yml)
styles.css, script.js, brand/, logos/, …   design + assets (root, passed through)
.eleventy.js                 build config
.github/workflows/deploy.yml auto-deploy
uploads/                     images uploaded via the CMS land here
CNAME                        custom domain (csa.global)
```

---

## 3. One-time "go live" setup (director)

### 3.1 Create the repo & push
1. On the CSA GitHub account, create a **public** repository (e.g. `csa-site`).
2. From this folder:
   ```bash
   git remote add origin https://github.com/<CSA-ORG>/csa-site.git
   git branch -M main
   git push -u origin main
   ```

### 3.2 Turn on GitHub Pages
Repo → **Settings → Pages → Build and deployment → Source: GitHub Actions**.
The included workflow (`.github/workflows/deploy.yml`) then builds and deploys on every push. First deploy gives you a `…github.io` URL to confirm it works.

### 3.3 Point csa.global (GoDaddy DNS)
In GoDaddy → **Domains → csa.global → DNS**, add:

| Type | Name | Value |
|------|------|-------|
| A | @ | `185.199.108.153` |
| A | @ | `185.199.109.153` |
| A | @ | `185.199.110.153` |
| A | @ | `185.199.111.153` |
| CNAME | www | `<CSA-ORG>.github.io` |

Then repo → **Settings → Pages → Custom domain → `csa.global`**, and tick **Enforce HTTPS** (free, automatic). The `CNAME` file in the repo already declares the domain.

### 3.4 Turn on CMS logins (GitHub OAuth)
Because we host on GitHub Pages, the CMS needs a tiny free auth relay. One-time:

1. **GitHub OAuth App** — GitHub → *Settings → Developer settings → OAuth Apps → New*:
   - Homepage URL: `https://csa.global`
   - Callback URL: `https://<your-worker>.workers.dev/callback`
   - Note the **Client ID** and **Client Secret**.
2. **Deploy the auth worker** (free Cloudflare account) — use the open-source
   `sveltia-cms-auth` worker (one-click template in its repo). Set its variables:
   `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `ALLOWED_DOMAINS=csa.global`.
3. **Edit `src/admin/config.yml`** — set:
   - `backend.repo: <CSA-ORG>/csa-site`
   - `backend.base_url: https://<your-worker>.workers.dev`
   Push the change.

> Prefer zero Cloudflare setup? You can instead manage content via the free hosted
> **Pages CMS** (pagescms.org) pointed at this repo — same GitHub logins, nothing to deploy.
> We can switch to that anytime.

### 3.5 Add your team
Repo → **Settings → Collaborators** (or a GitHub Team). Give writers **Write** access.
Everyone signs in at `csa.global/admin` with their GitHub account.

---

## 4. SEO & accessibility — what's already handled

- **Per-article SEO**: meta description field, Open Graph + Twitter cards, canonical URLs, and `Article` + `Organization` JSON-LD structured data.
- **Alt text is required** on every lead image (enforced in the CMS) — good for accessibility and image SEO.
- **`sitemap.xml`** and **`robots.txt`** are generated automatically and update as content is added.
- Clean, shareable URLs (`/the-wire/<slug>/`).

**Readability:** there's no live Yoast-style score (that's a WordPress feature). If you want it, we can add a build-time reading-ease check that flags overly dense drafts — tell me and I'll wire it in.

---

## 5. What's next (not yet built)

1. **Case Studies** — same system as The Wire (there's a commented-out collection in `config.yml` ready to enable). This gives Selected Work its own CMS-managed pages that auto-populate the service pages.
2. **Migrate the static pages** (home/about/services) onto the shared `base.njk` layout so nav/footer are edited in one place. Optional — they work as-is today.
3. **A dedicated 1200×630 OG share image** (currently defaults to a case-study still).

Say the word and I'll do 1–3.
