# ADR 0003: SSL IP check before issuance

Date: 2026-05-20
Status: Accepted

## Context
Let’s Encrypt HTTP validation fails when DNS does not point to the VPS. Failed attempts waste user time and can hit rate limits.

## Decision
When SSL is requested through `-le` or `--letsencrypt`, `wpfy` automatically checks DNS A/AAAA records against the VPS public IPs before attempting ACME issuance.

## Reasoning
Automatic preflight gives safer defaults without requiring users to remember a separate flag.

## Alternatives Considered
- Add a separate `--check-ip` flag.
- Attempt ACME and let failures surface from the ACME client.

## Consequences
- SSL commands need reliable DNS lookup and public IP detection.
- Failed preflight must produce clear diagnostics and must not call ACME.

## Follow-up Tasks
- Implement A/AAAA lookup.
- Implement VPS public IP detection.
- Decide whether port 80 reachability check is v1 or later.
