# Runbook: Unblock Failed SSL

## Status
- Implemented for DNS/IP preflight failures.

## Goal
Recover when SSL cannot be issued.

## Steps
1. Check the failed preflight output.
2. Compare resolved A/AAAA records with VPS public IPs.
3. Update DNS records if needed.
4. Wait for DNS propagation.
5. Retry SSL command.

## Notes
- `wpfy` must not call ACME when DNS/IP preflight fails.
- If ACME fails after preflight passes, inspect port 80 reachability and edge proxy logs.
