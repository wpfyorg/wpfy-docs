# ADR 0026: Opt-out anonymous install telemetry

- Status: Accepted
- Date: 2026-07-28

## Context

wpfy has no reliable measure of how many installations exist or which supported environments are in use. That information can guide compatibility and release work, but a self-hosted server tool operates on commercially sensitive domains and infrastructure. Telemetry must therefore be inspectable, bounded to a written payload, optional in practice, and unable to make panel or CLI work slower or less reliable.

The collection service does not exist at the time of this decision. The implementation must not invent a plausible production URL or imply that data is currently received.

## Decision

Offer anonymous telemetry as an opt-out choice in first-run setup: the checkbox is selected by default but remains separate from the mandatory licence acknowledgement. Persist the choice in mode-0600 `panel-state.json`. Generate one random UUID4 `install_id` during successful setup and never regenerate it for that install.

The outbound JSON payload is exhaustive. It contains exactly:

- `install_id`: the random install UUID;
- `wpfy_version`;
- `os`;
- `release`;
- `python_version`;
- `site_count`;
- `active_sites`.

`active_sites` counts managed sites whose `web` and `app` services are both observed as running or healthy. Only the integer leaves the machine. Domains, hostnames, IP addresses, email addresses, usernames, site names, filesystem paths, secrets, backup content, event content, and values derived from user input are never sent.

Keep the built-in endpoint constant empty. `WPFY_TELEMETRY_ENDPOINT` is the explicit deployment override; with no endpoint, telemetry is inert regardless of the stored preference. `WPFY_TELEMETRY=0` (and equivalent false values) overrides the stored preference without rewriting it.

At most one successful submission may occur per 24 hours. Persist `telemetry_last_sent_at` only after a 2xx response and serialize concurrent processes through an owner-only lock file. Use a daemon background thread, stdlib `urllib.request`, and a 1.5-second network timeout. All sender errors are swallowed: they do not appear in the panel, CLI output, event log, or exit code.

Add `wpfy telemetry status|enable|disable`. Status prints the effective controls, whether an endpoint is configured, the last successful send time, and the exact current payload so an operator can inspect what would leave the host.

## Alternatives considered

- Opt-in: rejected for this decision because the product choice is opt-out; the privacy boundary is instead enforced through a tiny exhaustive payload, visibility, easy disablement, and an inert unset endpoint.
- Send domains or coarse hashes: rejected because they disclose business relationships or remain linkable identifiers beyond the stated install UUID.
- Send distro strings as one free-form value: rejected in favour of the bounded `os` and `release` fields.
- Add an analytics SDK: rejected because it would add a dependency, obscure payload behavior, and widen the network surface.
- Retry synchronously or report failures: rejected because telemetry must never affect command reliability or latency.
- Generate an install ID on every process start: rejected because it would overcount installations and make the metric dishonest.

## Consequences

- Nothing is received until an operator or release deployment supplies `WPFY_TELEMETRY_ENDPOINT` and stands up the service.
- Opt-out deserves scrutiny. The implementation makes the choice visible and reversible, but operators who require configuration-enforced silence should set `WPFY_TELEMETRY=0` before first boot.
- The status command may inspect local Docker service state to produce the real `active_sites` value; ordinary commands perform that work only in a background thread.
- A daemon thread may be terminated when a short-lived CLI process exits. The long-running panel service provides the dependable opportunity to send; delivery is best-effort by design.
- The payload contract cannot grow silently. Adding any field requires amending this ADR and the tests that assert the exact key set.
