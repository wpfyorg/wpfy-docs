# ADR 0038: Host-derived PHP-FPM pool sizing via a second `[www]` pool override

- Status: Accepted (implementation scope: generated scaffold file, refresh
  migration; validation owner: orchestrator)
- Date: 2026-09-01

## Context

The five-platform load benchmark (`runcloud-audit/perf/`) showed wpfy
collapsing under uncached, plugin-heavy load (C3, ~53% errors) on a 2-vCPU
box while Webinoly and CloudPanel did not. The follow-up analysis in
`runcloud-audit/perf/FPM-SIZING-PLAN.md` found the mechanism was pool
capacity, not pool mode, and that wpfy's PHP tier was bounded by three
constants that never scale with the host:

- **`pm.max_children=5`** — never set by wpfy at all. It was inherited from
  the upstream `php:*-fpm` image's stock `www.conf` development default.
- **CPU quota `1.00`** — hardcoded in the app service hardening, so on a
  2-vCPU host wpfy's PHP tier was limited to half the machine while every
  other panel tested ran PHP unconstrained on the host.
- **Memory limit `512m`** — fixed regardless of host RAM.

The dominant term was the CPU cap, which the benchmark write-up missed
entirely; the static-vs-dynamic attribution in the benchmark reports is
corrected separately in those reports.

## Decision

**1. wpfy generates a per-site `php/zz-wpfy-pool.conf` that extends the
image's `[www]` pool rather than replacing it.** The file is emitted next to
the existing `php/zz-wpfy.ini`, bind-mounted read-only into the app service,
and re-declares the `[www]` pool. PHP-FPM applies later declarations of the
same pool name over earlier ones, so the pool keeps its name and the stock
listen socket, and no nginx upstream changes; the image's pool file stays in
place and the generated section overrides only the pool-management
directives wpfy sets. Like `zz-wpfy.ini`, the file is written in place and
is never replaced by inode-swapping (`os.replace`), because it is
bind-mounted individually. The WP-CLI service does not mount either FPM pool
file — only the app service runs the pool.

**2. The pool uses `pm=ondemand`, chosen over `pm=dynamic` because wpfy runs
one pool per site.** `dynamic` keeps spare servers resident, and across N
per-site pools that multiplies resident idle workers — and idle RSS — by
site count, the same reason `pm=static` is wrong for this architecture.
With `ondemand`, an idle site holds no PHP workers and the pool still grows
to its full host-derived `pm.max_children` under load; the benchmark's
CloudPanel round (survival on `ondemand` with adequate headroom, versus
WordOps collapsing on `ondemand` with 50 workers) shows the mode itself was
never the survival mechanism — capacity was. `ondemand` therefore takes the
elastic mode's idle-footprint benefit for a multi-site host without giving
up anything at the ceiling.

**3. Sizing is host-derived, with no artificial caps.** The app container's
memory limit is `min(96 MB × 4 × host CPU count, 40% of host RAM)`, with a
512m floor and no artificial maximum; `pm.max_children` derives from that
limit at 96 MB of working set per worker (the observed RSS of a WordPress +
Elementor + 15-plugin worker); the CPU quota equals the host CPU count with
no artificial cap, replacing the fixed `1.00`. Worked values: a 2-vCPU /
2468 MB box yields a 768m limit, `2.00` CPUs, and 8 workers; 8 vCPU /
16 GB yields 3072m, `8.00`, and 32; a 1-vCPU / 1 GB box hits the floor at
512m, `1.00`, and 5 workers. On the benchmark box shape this gives PHP both
cores, matching what every competing panel does by default.

**3b. The operator override surface is `php/pool-custom.conf`.** The
generated file carries a header pointing operators at it;
`pool-custom.conf` is mounted after the generated override so operator
directives win over wpfy's generated values, mirroring the existing
`php/custom.ini` pattern. Regeneration rewrites `zz-wpfy-pool.conf` but
never touches `pool-custom.conf` content.

**4. Existing sites migrate through `wpfy refresh all --restart`.** The
override is a generated scaffold file, so sites created before this change
adopt it by regenerating the scaffold (which adds `php/zz-wpfy-pool.conf`
and its bind mount) and recreating the site's app and web containers.
Refresh processes sites sequentially; each site's recreation is a brief
per-site 502 window, disclosed as such rather than hidden. There is no
fleet-wide simultaneous restart and no shared-edge downtime.

## Alternatives considered

- **Copy Webinoly's `pm=static`.** Rejected: resident workers multiplied
  across per-site pools are the wrong shape for wpfy's one-pool-per-site
  architecture, and the benchmark's own data shows static mode is not the
  survival mechanism.
- **Keep `pm=dynamic` with host-derived ceilings.** Rejected: dynamic's
  resident spare servers are exactly what per-site pools should not hold on
  a multi-site host; `ondemand` provides the same load ceiling without the
  multiplied idle footprint.
- **Keep fixed ceilings, only rename the pool file.** Rejected: the CPU cap
  was the dominant term on the benchmark hardware; without host-derived
  memory/CPU/worker sizing, the override file just republishes the
  development defaults.
- **nginx-level concurrency limiting or queue bounding.** Rejected: not
  needed once the pool is sized to the host, and it adds a failure mode of
  its own.

## Consequences

- Site PHP capacity now scales with the host instead of silently inheriting
  a development default. The idle footprint trade (larger per-site memory
  and CPU allocations reduce sites-per-box density) is accepted and visible
  in the generated scaffold rather than hidden in constants.
- Resource limits remain per-container ceilings, not reservations: they bound
  what one site can consume but do not partition the host, and combined
  per-site limits can oversubscribe the host. See `SITE-ISOLATION.md`.
- The benchmark reports' static-attribution framing is corrected in
  `runcloud-audit/perf/SUMMARY.md` and `runcloud-audit/perf/webinoly/RESULTS.md`;
  no new benchmark or live claims are made by this ADR.
- **Validated on the benchmark hardware (2026-09-02).** A full re-benchmark
  on the original 2 vCPU / 2468 MB VPS confirmed the sizing emits
  `mem_limit: 768m`, `cpus: 2.00`, `pm.max_children = 8` on that host shape,
  identical on both test sites. The C3 condition that previously collapsed
  (~53% errors, auto-aborting every rep) completed all three reps at 0%
  errors, 1040 ms median, with host CPU saturating at 100% and PHP-FPM
  reaching exactly its 8-worker ceiling — versus 67.9-84.6% peak CPU while
  failing before the change. Results, telemetry and caveats in
  `runcloud-audit/perf/wpfy-v2/`.
- The density trade was measured rather than assumed: with 8 workers under
  full load the app container used ~98 MiB of its 768 MiB limit, and idle
  host memory moved 1016 MB → 1035 MB across twelve back-to-back runs. The
  96 MB-per-worker divisor is therefore conservative by roughly 8x on this
  workload; CPU, not memory, is the binding constraint at this host size.
  Left as-is deliberately — over-guessing per-worker RSS costs queueing,
  under-guessing costs cgroup OOM kills, and the asymmetry favours caution.
- One defect surfaced during validation and is tracked separately: recreating
  the app container on a cache toggle leaves nginx holding a stale upstream
  IP for 5-10 seconds (wpfy-pvt issue #54).
