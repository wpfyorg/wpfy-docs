# Handoff

## Read First
- `docs/MEMORY.md`
- `docs/CHANGELOG.md`
- `docs/DECISION-LOG.md`
- Relevant ADRs in `docs/adr/`
- Relevant command docs in `docs/commands/`

## Current State
- 2026-09-01 IPv6 validation day completed (validation owner: parent; ADR 0036
  amended): clean install from the WPFY HEAD `b74eb51` archive (wpfy 1.0.0rc8,
  Ubuntu 24.04, Docker 29.7.2, Box A 13.207.69.203 + Box B 3.110.143.170,
  dual-stack edge networks, real Let's Encrypt certificates over both address
  families with strict external verify=0). Claims 1 (organic IPv6 ban blocks a
  real external v6 client, chain counter 0→2, v4 unaffected) and 2 (real client
  IPv6 identity end-to-end, XFF spoof defeated) PASS. Claim 4 (runtime
  hardening) PASS: `tests/docker-runtime-hardening.sh` failures=0 skips=0 with
  socket-proxy POST-mutation refusal 405 and neighbour healthz 403, plus
  `docker-hardening.sh`, `exposed-ports.sh` exit 0 and `wpfy secure --all`
  PASS. Claim 3 (migration) PARTIAL: merge/backup/invalid-JSON refusal,
  36.7 s restart auto-recovery, no-force refusal (zero mutation), and a 2.1 s
  idempotent forced migrate are proven; the `stack install` exit-3 IPv4-only
  edge-network refusal is unproven and not reproducible on Docker 29 (edge
  networks were created dual-stack at initial creation). The historical
  userland-relay IPv6 finding is corrected as Docker-version-specific — it did
  not reproduce on Docker 29.7.2 (pre-restart manual ban already counted 2
  packets and blocked v6; organic ban counter 0→2). Residual gaps recorded
  honestly: the panel-edge real-IPv6-bind branch was not exercised live, and
  wpfy has no operator ban CLI, so the never-ban guarantee is emission-side
  redaction only (not an operator ban rejection). Evidence: WPFY repo
  `docs/release-evidence/ipv6-validation-2026-09-01/`.
- 2026-08-26 v1 readiness assessed and IPv6 enforcement started (validation
  owner: orchestrator). **Not v1-taggable yet.** Three gates, per `TODO.md`
  (2026-08-21) and `ROADMAP.md`'s own "Near-term (v1 gates)": (1) nothing at
  HEAD is release-verified — `v1.0.0-rc7` was *prepared* (`ef6c74d`, version
  bumped to `1.0.0rc7`, `RELEASE-NOTES-rc7.md` written) but **never tagged**,
  newest tag is `v1.0.0-rc6`, and three commits landed after the prep (signed
  release pipeline `3bd9d04`, installer source identity #47, panel update
  indicator #48); (2) IPv6 is not enforced at all, no ADR; (3) ROADMAP's
  "proven live" gate still owes real-provider S3, real systemd timers,
  destructive shared-stack mutations, an external scanner run, and fail2ban's
  external-IPv4 origin plus an organic (non-manual) trigger. The SMTP gate is
  closed (renamed 2026-08-21, alerting explicitly not implemented). Full suite
  at `ddc6ac4` is **2281 passed, 0 failed** (`/opt/homebrew/bin/pytest -q`,
  649s) — that number is the baseline for any IPv6 branch comparison. Public
  mirror is current at `906446a` (= `ddc6ac4`) but carries no rc7 tag.
  Recommended sequence is rc8 from HEAD → one validation-VPS day against the
  *published* tag → `v1.0.0` off that unchanged tree; the rc5→rc6 socket-proxy
  outage is the precedent for never validating a patched working copy.
- 2026-08-26 IPv6 gap is wider than `TODO.md` records, and this is the reason
  the scope decision went the way it did. Both the panel token bucket
  (`src/wpfy/panel.py:234`, `_check_rate_limit`, one bucket per resolved client
  IP) and the sign-in throttle (`src/wpfy/panel_auth.py:1297`,
  `client_throttled`) key on the resolved client address, and Traefik reports
  `172.18.0.1` for **every** IPv6 client. On a dual-stack host all IPv6 clients
  therefore share one bucket and one throttle key: one IPv6 client can 429 every
  other IPv6 client and trip the failed-login throttle for all of them. That is
  an unauthenticated lockout vector, not merely absent ban enforcement, and it
  was not previously written down anywhere.
- 2026-08-26 decision (project owner): **implement IPv6 properly** rather than
  document an IPv4-only limitation. Accepted consequence: v1 slips. Work is on
  branch `feat/ipv6-enforcement`, durable worktree
  `~/Desktop/_Projects/wpfy-worktrees/phaseipv6`, based on `ddc6ac4`. Brief at
  `~/Desktop/_Projects/wpfy-agent-logs/ipv6-brief.md`. **ADR 0036 is not
  written yet** — it is Deliverable 0 of that brief and must be written to match
  what actually lands, with both consequences above in Context, plus a
  DECISION-LOG entry.
- 2026-08-26 IPv6 stage 1 landed, stages 2-3 did not. Actor (ox-alpha via
  `delegate-phase.sh`) **timed out at the 6h cap (exit 142)** roughly 40%
  through and wrote no report. One commit, `df6db90` — 415 insertions across
  `cli.py`, `daemon_ipv6.py` (new, 187 lines), `site_layout.py`, `stack.py`,
  `traefik.py`. Reviewed against the brief: `daemon_ipv6.py` honors every safety
  requirement — merge-never-clobber via an owned-keys tuple, refuse on
  unparseable JSON rather than overwrite, backup before write, idempotent no-op,
  host-capability gate, and no implicit `systemctl restart docker` (the message
  tells the operator to schedule it and states that it stops every container).
  Suite on the branch is **1 failed, 2280 passed**:
  `tests/test_stack.py::test_install_reports_traefik_and_helper_failures`
  asserts `[7, 7, 5, 0, 7]` but the new docker-ipv6 fact makes it
  `[7, 7, 5, 0, 0, 7]`. That is the test the actor was mid-edit on when killed
  (`tests/test_stack.py` is uncommitted, 4 lines), not a design fault. Note the
  arithmetic: 2280 + 1 = 2281, exactly the baseline total, so **no tests were
  added** — confirmed by composition, not just the file list.
- 2026-08-26 two defects found reviewing the delegated work, both open. (a)
  `site_ula_subnet()` in `site_layout.py` derives a per-site /64 as
  `sha256(project)[:4] % 65536`; its docstring calls this collision-free and
  claims "`tests` proves that absence over the whole index space", and **both
  claims are false** — it is a 16-bit space, so by the birthday bound a
  collision becomes likely around ~300 sites, and there are zero tests. Two
  sites sharing a subnet is a cross-site isolation break, i.e. the product's
  core guarantee. The fix is to reuse the existing idiom: `_allocate_site_uid`
  (`site_layout.py:1503`) scans used values, takes the first free one, and
  persists it in the site's env. (b) `daemon_ipv6_active()` reads
  `daemon.json`, not the live daemon, and its docstring's reasoning is inverted
  — it argues that reading the file avoids claiming active while the daemon
  lags, when reading the file is exactly what causes that (keys are on disk the
  moment wpfy writes them; the daemon has IPv6 off until restarted). Latent
  today because stage 3 never wired it into the fail2ban status claim, but it is
  the pre-`f0c4efd` defect class the brief warned against.
- 2026-08-26 IPv6 work still outstanding: ADR 0036 + DECISION-LOG entry; the
  `ipv6-migrate` command (the actor's own progress note listed it as next);
  all seven stage-3 downstream items — so `f0c4efd`'s withheld
  `IPv6 protection: active` claim is still withheld and
  `validate_panel_edge_bind`'s IPv6 branch is still dead code; tests throughout,
  including the ULA-uniqueness proof. **Nothing about the IPv6 work is
  live-verified** — the offline suite stubs `subprocess.run`, so a green suite
  proves rendering only. Daemon acceptance, real ban enforcement, and Traefik
  client-address behaviour all belong to a validation-VPS run.
- 2026-08-26 delegation infrastructure notes. `gpt-5.6-sol` and `gpt-5.6-terra`
  return **HTTP 401 "Selected Codex account needs reauthentication"** against
  the ocx proxy, while `gpt-5.6-luna`, `gpt-5.5` and `gpt-5.4` return 200 — one
  Codex account needs reauth, and until then the planned sol review of the IPv6
  branch cannot run. `check-phase.sh` reports `process: not running` for a
  healthy actor (its pattern misses the `perl` alarm-wrapper that forks
  `claude`); verify with
  `ps -o pid,etime,%cpu -p $(pgrep -f "claude --model command-code")` instead.
  `command-code/stealth/ox-alpha` routes fine (messages, streaming and
  `count_tokens` all 200); `[claude-code:unrecognized_model]` is a warning, not
  a failure, but it means `claude` assumes a 200k window — ox-alpha's real
  window is 1M, so pass `CLAUDE_CODE_MAX_CONTEXT_TOKENS=1000000` or add a
  `WINDOW` case to `~/.local/bin/gpt-agent` beside the `kimi-k3` entry. `setsid`
  does not exist on macOS; do not use it to detach a launch.
- 2026-08-25 ponytail W1 mechanical batches completed, local evidence only
  (validation owner: orchestrator): W1-02 `contextlib.suppress(X)`
  conversions across `site_layout.py`, `site_security.py`, `panel_auth.py`,
  `fail2ban_docker.py`, `fail2ban_host.py` — suppression pytest 524 passed.
  W1-07 `Path.unlink(missing_ok=True)` conversions (dir-fd no-follow sites
  untouched) — unlink-batch pytest 217 passed. W1-10 `smtp.py` TLS vocabulary
  derived via `typing.get_args(TLSMode)`, Literal order and error text
  preserved — 4 passed. W1-03 tranche two: remaining modules import the
  shared lazy `current_paths()` from `settings.py`, per-module
  `_current_paths` aliases kept for tests — path-access tests 86 passed.
  CodeDebrief artifacts regenerated and validated OK.
- 2026-08-25 ponytail batches (validation owner: orchestrator): W4-11
  installer source identity — local shell tests pass
  (`tests/installer-idempotency.sh`, `tests/installer-payload.sh`), and the
  disposable Ubuntu/VPS install gate completed 2026-08-25: the full staged
  installer ran end-to-end twice; the corrected failure-rollback probe exits
  97 after a forced staged-source install failure; the `/opt/wpfy/app`
  symlink was identical before and after the failed run
  (`/opt/wpfy/releases/legacy-20260825013714-2557/app`); and `wpfy
  --version` runs after the failure. Prior cleanup-trap defects (empty-variable
  `[[ -n ]] && rm` cleanup returning non-zero under trap) were corrected in
  both `wpfy` and `install.sh` and covered by the idempotency test. No
  independent installer review was performed. The full offline suite passed
  afterwards: `pytest -q` exit 0, 2277 passed in 649.22s, after a test-only
  fixture correction in `tests/test_edge_backup.py` (the transaction-lock
  case now uses the tmp state dir via frozen-dataclass replacement;
  targeted rerun 4 passed). Root/Docker-mutating shell tests were not run.
  W1-03 `_current_paths()` export — registry/events pytest 27 passed
  offline. CodeDebrief artifacts were regenerated and validated OK,
  superseding this pass's earlier analyzer-blocked refresh.
- 2026-08-25 installer follow-up (uncommitted at documentation time):
  archive source values no longer log (generic download/copy failures;
  bootstrap logs only the ref); repeated bootstrap reuses the symlinked
  venv; activation stages a release-local editable install under
  `releases/release-<stamp>/`, verifies the release import resolves to its
  own `app/src` before repointing `current`, and rolls back to the previous
  release on any pip/import/activation failure — repair-first when the
  staged release shares the previous release's venv: the shared interpreter
  reinstalls wpfy editable against the previous release's own app, the
  partial release is deleted only after that repair succeeds (previous
  release stays usable behind canonical root links), and a failed repair
  deliberately retains the staged release with exact printed manual recovery
  steps (pip reinstall against the previous app, delete the retained
  release, rerun the installer); the repair interpreter is built only after
  resolving the shared-venv symlink target, and a dangling or unusable
  target refuses the repair (staged release retained) instead of falling
  back to host `/bin/python`. Disposable Ubuntu/VPS:
  redaction probe passed; the initial rerun exposed a venv-symlink defect
  and an activation path bug, both restored with the previous release left
  active; the final repeat bootstrap exited 0 with `current` at
  `release-20260825055831-21347`, root links `current/app` and
  `current/venv`, the import resolving to the new release's `app/src`, and
  the wrapper version running. Final full pytest for this follow-up passed:
  2277 passed; offline installer coverage is now 27 passing checks in
  `tests/installer-idempotency.sh` including shared-venv import/pip failure,
  repair-before-delete, failed-repair retention, and dangling-symlink
  regression paths;
  root/Docker-mutating shell tests and independent installer review
  were not performed; the repair-first rollback has no live VPS rerun.
- 2026-08-25 decision batch (docs only; no source or test changes, nothing
  implemented or validated): Quantum stays disabled/parked through 1.0 stable
  and is reassessed at 1.1 planning with no code deletion (ADR 0031 amended);
  Multisite is scheduled for 1.1 with both modes and is blocked pending
  offline/VPS evidence — subdomain mode requires a Cloudflare DNS wildcard
  plus a passing wildcard TLS preflight before any mutation, and children must
  be disclosed as sharing one WPFY site runtime/database while WPFY sites stay
  isolated (ADR 0035); telemetry stays inert-by-default, SMTP test-only, and
  named S3 storage CLI-only for 1.0; flat CLI remains canonical with grouped
  compatibility surfaces and confirmed legacy removals deprecating in 1.0 and
  removable no earlier than 1.1 with actionable migration; `stack migrate`
  deprecates in 1.0 and removes in 1.1.
- The first panel administrator now comes from a run-token-authorized browser wizard. Setup routes return HTTP 410 after creation, edge-bound setup is refused, verified TOTP or an explicit skip completes the flow, and anonymous telemetry remains inert until an endpoint is configured. `wpfy telemetry status` prints the exact seven-field payload; see ADRs 0025 and 0026.
- The repo has a runnable Python CLI and Ubuntu installer for Docker-backed WordPress/server administration.
- Phase F bounds SSL discovery, Docker health inspection, and no-op registry writes. Local proof covers exact parser/opener/inspect/write counts plus full regression; real disposable-VPS timing remains optional and deferred.
- Commands now have real implementations for installer bootstrap, per-site Compose scaffolds, Traefik, SSL preflight, full WordPress provisioning, backups, restore, diagnostics, and SFTP lifecycle.
- Current parity surface includes backup retention/prune, explicit latest restore, named S3-compatible profiles, remote backup list/restore/delete/prune, Traefik/ACME edge backup/restore, Cloudflare-only wildcard SSL, and opt-in helper image pulls.
- Managed-site mutations now cross one interface in `src/wpfy/site_lifecycle.py`; create, update, and SSL-enable ordering no longer lives in `cli.py`.
- Persisted site representations regenerate from `src/wpfy/site_definition.py`; SFTP no longer edits generated YAML in place.
- Validated paths/env reads now live in `src/wpfy/site_paths.py`; Docker/Compose lifecycle and optimized health probes live in `src/wpfy/site_runtime.py`; scaffold/backup/restore stay in `src/wpfy/site_layout.py`.
- Certificate state and renewal live in `src/wpfy/certificate_lifecycle.py`; operational facts live in `src/wpfy/operational_inspection.py`.
- Phase D routes shared-stack operations through `src/wpfy/stack.py`, cache operations through `src/wpfy/cache_operations.py`, and CLI/panel logs/reset/WP through public `src/wpfy/site_runtime.py` APIs. Purge now requires `--force`; cache failures are non-zero.
- Phase E routes stored SMTP/DNS/S3 reads through the no-follow env reader, exact-value error masking through `redaction.py`, and cron/backup unit mechanics through `systemd.py`. CLI syntax, unit contents, and domain policy remain unchanged; symlink-backed secret configs now fail cleanly.
- Disposable-VPS validation tooling now exists in `scripts/vps-release-validation.sh` and `scripts/vps-release-validation-remote.sh`, with a local shape test at `tests/vps-validation-runner.sh`.
- Live-run follow-up fixes are in the current branch: rejected restore archives validate before stopping runtime, non-SSL routers bind to the HTTP `web` entrypoint, and validation HTTP probes no longer treat HTTPS 404s as non-SSL site failures.
- Installer hardening follow-ups are in the current branch: optional `WPFY_SOURCE_SHA256` source archive verification, staged source activation with rollback, and broader `wpfy secure` baseline reporting.
- Phase C keeps archive-sized S3 transfers out of Python memory, uses private cleanup-safe remote restore files, and verifies versioned WordPress tarballs against WordPress.org's published SHA-1 before extraction.
- Phase C repair is locally closed: strict SigV4 reconstruction passes; managed environment/scaffold and bootstrap paths use descriptor-relative no-follow operations; ownership failures gate scaffold-driven runtime starts; active-runtime partial bootstrap retries are blocked before app mutation; truncated/non-directory-root/special-member remote archives fail through the real validator before runtime stop; and restore rejects or defensively skips `db-data/` archive content so the live database volume is never replaced.
- Disposable-VPS proof for wildcard/Traefik behavior is complete for the release-candidate branch. Phase C real-provider S3 interoperability and the repaired bootstrap/restore paths on a disposable VPS remain deferred until credentials/host are available. Remaining release work is the clean public export/tag/push path, plus optional external scanner runs and hardening follow-ups such as Traefik socket risk reduction, release checksum publishing, and WP-CLI artifact verification.

## Safe Continuation Rules
- Before edits, check `docs/MEMORY.md` and `docs/CHANGELOG.md`.
- Do not silently change architecture decisions; update `docs/DECISION-LOG.md` and add or amend an ADR.
- Keep commands idempotent.
- Keep implemented vs planned status explicit.
- Preserve strong per-site isolation: no shared PHP, DB, Redis, or writable app volumes.
- Do not attempt ACME issuance unless DNS/IP preflight passes.

## Recommended Next Step
- IPv6 residuals from 2026-09-01 (ADR 0036 retained exception): exercise the
  `stack install` IPv4-only edge-network refusal (exit 3) on a host whose edge
  networks predate dual-stack creation, and exercise the panel-edge
  real-IPv6-bind branch live; both are unproven, not claimed. Decide whether an
  operator ban CLI is wanted — today the never-ban guarantee exists only
  emission-side (bridge mu-plugin redaction) and a manual `fail2ban-client
  banip` bypasses wpfy.
- Do not tag `v1.0.0` off an unverified HEAD. Cut `v1.0.0-rc8` (bump
  `1.0.0rc7` → `1.0.0rc8` in `pyproject.toml` and `src/wpfy/__init__.py`; rc7
  was prepared but never tagged, so skip rather than backfill it), publish it,
  validate against the *published* tag on a fresh VPS, then tag `v1.0.0` off
  that byte-identical tree. Install scanners (`testssl.sh`, `nuclei`, `trivy`,
  `gitleaks`) on the box first, or `phase_scanners` skips every one and still
  reports success.
- RC2 private commit is locally gated. Publish through the canonical exporter,
  then repeat the public tagged install path on a disposable VPS before final
  promotion.
- Optionally measure Phase F SSL preflight and fleet-health timing on a disposable Ubuntu VPS with real network and Docker latency; local closure uses deterministic call counts, not wall-clock claims.
- On a disposable VPS, exercise live stack image pulls/upgrade/forced purge, log follow/reset, cache container failures, and CLI/panel WP parity; local Phase D verification intentionally avoids destructive shared-stack mutation.
- On a disposable Ubuntu VPS, exercise real cron/backup timer install, trigger, status, partial failure, and disable paths; Phase E local QA used a fake `systemctl` and temporary unit root.
