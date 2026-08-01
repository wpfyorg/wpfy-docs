# ADR 0027: ACME contact email resolution and applied state

- Status: Accepted
- Date: 2026-08-01

## Context

Traefik uses the ACME contact email from its generated static configuration. A host could be configured through `WPFY_ACME_EMAIL`, then later run a render without that environment variable. The renderer fell back to `admin@localhost` and replaced the configured address. Defect #11 showed that a process-local environment value was not durable enough to define the desired contact address.

Persisting the address did not by itself prove that Traefik was using it. wpfy recorded a hash of the desired static configuration in `traefik-applied.json` and treated that record as authoritative. During live finding L8, the record matched the desired configuration while the rendered `traefik.yml` still contained the old address. `wpfy stack acme-email` therefore reported that Traefik already had the desired configuration, and `wpfy stack install --nginx` rewrote the file without recreating the running container. Traefik reads static configuration only at startup, so every certificate issuance continued to fail against the old contact address.

## Decision

Resolve the desired ACME contact address in this precedence order: a valid `WPFY_ACME_EMAIL` environment value, the valid persisted value in `acme.env`, one valid consistent value recovered from the existing rendered `traefik.yml`, then `admin@localhost`. A re-render must never downgrade a valid configured address to the default merely because a later process lacks the environment variable.

`wpfy stack acme-email [address]` is the operator surface. Supplying an address validates and persists it; omitting the address reports the effective value, its source, and whether a Traefik restart is required.

Define applied state from the rendered file first. If `traefik.yml` does not match the desired static configuration, an apply is required regardless of the recorded hash. Only when the rendered file matches may the recorded hash narrow the remaining question: whether the running container has loaded that file. Compute drift before scaffold rendering changes the file, recreate a running Traefik container when drift exists, and record the desired hash only after a healthy apply.

## Alternatives considered

- Require `WPFY_ACME_EMAIL` on every command: rejected because omission on a later render caused Defect #11 and silently restored the default.
- Treat the persisted state file as the only fallback: rejected because an existing valid rendered address is the migration floor for hosts configured before `acme.env` existed.
- Keep the recorded hash authoritative: rejected because L8 proved that the record can disagree with the file Traefik reads and can suppress the required container recreation.
- Recreate Traefik on every stack install: rejected because unchanged configuration needs no restart, and repeatedly interrupting the shared edge would be worse than the defect.

## Consequences

- Existing valid rendered contact addresses survive migration and later renders; new explicit values persist across processes.
- `admin@localhost` remains the fallback and refusal sentinel for a never-configured install.
- A rendered-file mismatch always remains pending until the file is corrected and the running container has loaded it.
- The recorded hash remains useful, but it can no longer overrule `traefik.yml` or claim a stale running proxy is current.
