# ADR 0032: Rebuild the loopback control panel on Tabler

- Status: Accepted (implemented)
- Date: 2026-08-15

## Context

Two audits of the shipped panel found it was not merely untidy. It was
substantially broken, in ways a reskin would have preserved:

- **The seven-step site wizard never read steps 2–6.** The Next handler
  incremented a counter and re-rendered without touching the DOM, so every
  choice — object cache, Let's Encrypt mode, DNS provider, notifications,
  backups and retention, SFTP, admin user and email — was discarded. The Review
  screen rendered from the untouched state object and was therefore guaranteed
  to show defaults, and the POST sent them. Step 1's Next button had two
  competing click handlers; the first detached the node, so the second threw and
  its domain-required check never gated anything.
- **Six destructive actions fired with no confirmation of any kind**, including
  file delete. Six more used native `confirm()`. Six different idioms existed
  for one concept, while the two purpose-built helpers, `confirmDialog` and
  `typedConfirm`, had zero call sites.
- **Six `refresh*` functions had no post-`await` domain guard.** Switching site
  mid-flight rendered site A's data under site B, and the apply handlers then
  read `currentDomain` at click time and wrote A's values to B. The database
  drop path was worst: the typed-confirm keyword could be A's database name
  while the DELETE went to B.
- `/admin/services` and "Close site detail" both rendered a blank page. Backup
  and restore — the longest-running and most destructive operations in the
  product — were the only major operations without job tracking, while
  sub-second password rotation had one. Seven of ten admin pages were
  placeholder text.

The panel is the surface a non-CLI operator is handed. A component library on
top of that logic would have made the defects better looking.

## Decision

Rebuild the client from scratch on [Tabler](https://github.com/tabler/core)
1.4.0, vendored, with a matching pass over the panel API.

**Vendoring.** `tabler.min.css` and `tabler.min.js` (which bundles Bootstrap
5.3.7 and Popper) ship flat in `panel_static/` beside `tabler.LICENSE` and
`tabler.PROVENANCE.md`, following the existing `qrcode.min.js` convention. Two
constraints drove this rather than a CDN or a build step:

- The panel CSP is `default-src 'self'`. A remote `<script>` is dead code that
  looks like a feature, and a wpfy box may have no outbound HTTPS at all.
- `pyproject.toml`'s `package-data = ["panel_static/*"]` is **not** recursive. A
  `vendor/` subdirectory works in a source checkout and vanishes silently from
  the built wheel.

Tabler 1.4.0 was verified byte-wise before adoption: zero `@font-face`, three
`url()` references all `data:`, no network APIs in the JS. It passes the
existing CSP unmodified. Icons are not the font package — `@tabler/icons`
ships 11k individual SVGs and no prebuilt sprite, and `_STATIC_TYPES` serves no
font types anyway, so the eighteen icons in use are an inline `<symbol>` sprite
in `index.html`.

**Information architecture.** Site detail goes from fourteen tabs to five:
Overview, Settings, Data, Access, Automation. Five of the old tabs — PHP, Cache,
Vhost, Security, Config — were the same job repeated with five sets of
near-identical refresh/preview/apply plumbing; they become five sections of one
form behind one preview/apply bar. `TAB_ALIASES` (21 aliases onto 14 tabs) was
itself an admission that the names did not match the mental model, and is
deleted; the old paths redirect for one release so existing bookmarks and the
links in `commands/panel.md` do not 404.

**Every long operation is a job.** Backups, restore, config apply, wp-cli and
the Traefik restart join site creation in returning `202 {job_id}`. The client
gets one progress primitive instead of three. Running operations live in a
header popover rather than a page, so an operation started from a site stays
visible when the operator navigates away — the previous behaviour lost sight of
it entirely. The bar is indeterminate by construction: `panel_jobs` appends
step strings and never declares a total, so a percentage would have to invent
its own denominator.

**One event stream.** `GET /api/stream` replaces three leaking pollers (jobs
tray, file-manager status, file-manager lease). It uses `fetch` plus
`ReadableStream`, never `EventSource`, which cannot set an `Authorization`
header — moving the token to the query string would write the credential into
every access log.

**Host port management is new domain work.** `firewall_ports.py` wraps `ufw`
with two lockout guards, because a rule set that drops SSH cannot be repaired
from a panel reached over that connection: `enable()` allows the detected SSH
port before turning the firewall on, and deny/delete refuse the SSH port unless
the caller passes a typed confirmation. `wpfy` never installs `ufw` itself;
`install.sh` keeps its opt-in flag and a host without it reports the fact.

## Consequences

- The client is ~3,800 lines of one file replaced by a core plus per-page ES
  modules loaded on first visit. Every page gets a per-navigation
  `AbortController`, an `onLeave` teardown list and a generation counter, which
  is the structural fix for the stale-response and timer-leak classes rather
  than a per-call-site patch.
- Three test gates now hold the line: every shipped `.js` must parse under
  `node --check` (a previous stage shipped a page with one missing `)` that
  every substring test passed while the router reported it as "not built yet");
  every module that issues a destructive request must load the confirmation
  helper; and the riskiest four must use a typed keyword.
- Secrets stay write-only, and blank means keep. `PUT /api/backup/remote` and
  `PUT /api/notifications/smtp` used to demand the secret on every write while
  no read path returns it, so changing a prefix forced re-typing an S3 key and a
  client sending `""` silently replaced a working credential with an empty one —
  failing first at the next scheduled upload, quietly, at night.
- The 12-character password minimum moves into `panel_auth._validate_password`,
  the one validator every write path already calls. It was previously enforced
  only by the first-run setup form, so the admin made to pick a strong password
  could create a site-manager with a one-character one.
- Deliberately **not** done: `panel_jobs` remains an in-memory dict, so a panel
  restart still loses in-flight jobs. The client reports that honestly (a 404
  during polling says the panel restarted and points at Events) rather than
  spinning forever, but durable job state is separate work.
- Hetzner is dropped from the navigation.
