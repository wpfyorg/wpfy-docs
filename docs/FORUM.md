# wpfy Community Forum

The wpfy community forum at **https://forum.wpfy.org** is the source of truth for the forum's structure, branding, and moderation policy. The live state lives in NodeBB's database; this document describes what was configured and why.

## Host

- NodeBB v4.13.2, Harmony theme, Node v24.16.0, Redis backend
- Docker Compose at `/opt/stacks/nodebb` on `150.136.45.72`
- Edge: Caddy terminates TLS for `forum.wpfy.org`
- Internal: `nodebb` container on the `proxy` network, port 4567; `nodebb-redis` on an internal network

## Branding

Branding is applied via the NodeBB Admin Control Panel's Custom CSS, Custom Header, and Custom JS (stored in the `config` Redis hash), **not** a theme fork. This keeps the change fully reversible.

- **Custom Header HTML** loads IBM Plex Mono + Inter from Google Fonts (same fonts as the marketing site and KB).
- **Custom CSS** ports the MotherDuck design tokens verbatim and restyles Harmony v4 components using the correct v4 selectors: brand (`[component="siteTitle"] h1`), left sidebar (`#main-nav`), cards, topic rows, composer, modals, buttons, code blocks, badges, pagination, alerts, inputs, footer. Dark mode uses a `html.wpfy-dark` class (synced by the customJS observer, since Harmony v4 uses skin classes, not `data-bs-theme`). Includes a `prefers-reduced-motion` kill-switch.
- **Custom JS** (`useCustomJS`) injects the activity-first chrome: fixes the brand wordmark to "wpfy", adds Docs/GitHub/wpfy.org links to the sidebar nav, renders a dismissible welcome banner (headline + "Start a topic" CTA + "Read the docs") on the home route, and renders a row of 8 colored category pills (fetched from the API) below the banner. The banner dismiss is session-scoped (`sessionStorage`).
- **Home route** is set to `recent` (activity feed), not the category directory.

### Reversing branding

```bash
docker exec nodebb-redis redis-cli -a "$RPW" --no-auth-warning \
  HDEL config useCustomCSS useCustomHTML useCustomJS customCSS renderedCustomCSS customHTML customJS
docker exec nodebb-redis redis-cli -a "$RPW" --no-auth-warning HSET config siteTitle NodeBB homePageRoute categories
cd /opt/stacks/nodebb && docker compose restart nodebb
```

## Category structure

Eight categories mirror the KB taxonomy so discussion and documentation stay 1:1.

| # | Category | cid | Icon | Color | Maps to KB |
|---|----------|-----|------|-------|-----------|
| 1 | Announcements | 6 | `fa-bullhorn` | yellow | CHANGELOG / releases |
| 2 | Getting Started | 7 | `fa-rocket` | blue | `kb/getting-started/` |
| 3 | Site Management | 8 | `fa-cube` | teal | `kb/site-commands/` + `kb/sftp/` |
| 4 | Stack & Infrastructure | 9 | `fa-server` | blue-deep | `kb/stack-commands/` + `kb/reference/` |
| 5 | Operations & Troubleshooting | 10 | `fa-wrench` | red | `kb/operations/` |
| 6 | Feature Requests & Roadmap | 11 | `fa-lightbulb` | yellow | `ROADMAP.md` |
| 7 | Showcase & Community | 12 | `fa-comments` | teal | — |
| 8 | Forum Rules & Meta | 13 | `fa-shield-halved` | ink | — |

Each category description links to its matching KB section on `docs.wpfy.org`.

## Seed topics

Four pinned topics (posted 2026-06-25):

| tid | Title | Category |
|-----|-------|----------|
| 2 | Community Rules & Code of Conduct | Forum Rules & Meta |
| 3 | How to ask a good wpfy support question | Forum Rules & Meta |
| 4 | Welcome to the wpfy forum | Announcements |
| 5 | Read first: install + first WordPress site | Getting Started |

Four FAQ/seed topics (unpinned):

| tid | Title | Category |
|-----|-------|----------|
| 6 | FAQ: SSL, DNS/IP preflight, backup & restore | Site Management |
| 7 | FAQ: wpfy debug — what to include when asking for help | Operations & Troubleshooting |
| 8 | FAQ: Traefik edge proxy | Stack & Infrastructure |
| 9 | Roadmap: what's deferred and why | Feature Requests & Roadmap |
| 10 | Welcome to the Showcase — share your wpfy setups | Showcase & Community |

All topic bodies are written in wpfy's voice (technical, security-conscious, concise) and reference the KB and the project security policy. Topic bodies can be edited in the ACP.

## Moderation policy

- **Registration:** email confirmation required.
- **New users:** first posts go through the post queue (`postQueue`, `newbiePostQueueThreshold = 3`) for moderator approval.
- **Guests:** read-only (cannot create topics or reply).
- **Category creation:** locked to admins (`allowCategoryCreate = 0`).
- **Announcements:** mod-only posting. `registered-users` and `fediverse` have `topics:create` and `topics:reply` revoked; the `Moderators` and `Global Moderators` groups retain full privileges.
- **Roles:** a `Moderators` group exists with full per-category powers. Admin nominates accounts to add.
- **Secrets:** the Code of Conduct forbids pasting secrets (database passwords, API tokens, `.env` contents, SSH keys, ACME keys). The support-question template instructs redaction with `<redacted>`.

## API access

The forum uses the NodeBB Write API with a master bearer token. Content seeding and privilege management use `POST/PUT/DELETE /api/v3/categories`, `/api/v3/topics`, `/api/v3/posts`, `/api/v3/groups`, and `/api/v3/categories/:cid/privileges/:privilege`. The token is not stored in this repo.
