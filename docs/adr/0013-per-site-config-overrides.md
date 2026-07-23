# ADR 0013: Per-site config overrides via generated mounted files

- Status: Accepted
- Date: 2026-07-24

## Context

CloudPanel exposes database management, PHP settings, and a virtual-host editor. wpfy must provide the useful parts of that surface without weakening its Docker-first isolation or allowing an operator request to become an arbitrary host or container command. Site state is regenerated from `.env` through `SiteDefinition`, while the generated Compose and Nginx files are the authoritative runtime layout.

Three configuration classes need different ownership rules:

- database names and users must be validated before they reach MariaDB;
- PHP settings must be constrained before they are rendered into a mounted ini file;
- Nginx operator additions need an escape hatch, but a raw replacement of the generated `server {}` block would bypass the generated security policy.

Adminer is useful for database operations but must not create a publicly reachable management service.

## Decision

Keep the generated Nginx `server {}` block owned by wpfy and include only `/etc/nginx/wpfy-extra/*.conf` from the operator-owned host directory. `wpfy site nginx ... set` and the panel PUT route write a candidate file that is validated with `nginx -t` inside the site's web container. The candidate is installed only after validation succeeds; validation failure leaves the previous file byte-identical, removes every temporary file, and never reloads Nginx. If Docker/Compose is unavailable, validation fails closed and no candidate is installed.

Render wpfy-managed PHP values into `php/zz-wpfy.ini`, mounted read-only into the site's PHP services. Create `php/custom.ini` once and mount it after the generated file as an operator-owned escape hatch. Scaffold regeneration updates only `zz-wpfy.ini`; it never overwrites `custom.ini` or `nginx/extra/custom.conf`. PHP values are accepted only through narrow size/integer patterns, so newlines, NULs, section headers, and comment injection cannot become directives.

Persist Adminer state as `ADMINER_PORT` in the site's managed environment. When enabled, the Adminer service joins only that site's `site` network and publishes `127.0.0.1:<port>:8080`. It is not attached to the shared edge network and never binds all host interfaces.

Database operations use the existing secret-safe Compose pattern: SQL travels on subprocess stdin and the MariaDB root password is expanded by `sh -lc` inside the database container. Database and user identifiers use the exact `[a-z][a-z0-9_]{0,31}` whitelist before any command is built. All create/drop operations use `IF NOT EXISTS` or `IF EXISTS`; generated user passwords are delivered once through the panel job payload or CLI result and are not placed in host argv or the child environment.

## Alternatives considered

- Replace the generated vhost with a raw operator-supplied file: rejected because it would permit disabling the generated path guards, headers, and PHP execution constraints.
- Write a temporary `*.conf` beside the live include and run `nginx -t`: rejected because the glob would make the temporary file live configuration. Candidates use a non-`.conf` suffix and are removed on every exit path.
- Validate only on the host or trust `WPFY_SKIP_RUNTIME=1`: rejected because the host does not have the site's exact Nginx image/configuration and offline mode must not install unvalidated configuration.
- Mount one shared PHP configuration directory across sites: rejected because site PHP settings and writable/operator-owned files must remain per-site.
- Publish Adminer through Traefik or `0.0.0.0`: rejected because a management UI must remain loopback-only and reachable remotely only through the operator's existing SSH tunnel workflow.

## Consequences

- Repeated scaffold refreshes are deterministic for generated files and preserve operator-owned files byte-for-byte.
- Nginx custom changes require a running Docker runtime; an unavailable runtime is an explicit refusal rather than an unsafe success.
- The panel and CLI share the same operation layer for database, PHP, Adminer, and Nginx behavior, while the panel can deliver generated passwords through the existing read-once job payload.
- Adminer remains convenient for local/tunneled access but is intentionally unavailable as a public web endpoint.
- `php/custom.ini` remains an operator escape hatch; operators are responsible for the directives they put there, while wpfy guarantees it will not silently replace the file.
- Docker daemon or host compromise remains outside this file-level isolation guarantee.
