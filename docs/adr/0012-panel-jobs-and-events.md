# ADR 0012: Panel job execution and append-only event log

- Status: Accepted
- Date: 2026-07-23

## Context

The browser panel needs to expose site mutations without duplicating the CLI's lifecycle logic or making long-running requests indistinguishable from failures. Site creation, deletion, configuration changes, and SFTP rotation also need operator-visible progress and an auditable record of what was requested and what happened. Credential-producing operations need to return generated credentials without persisting another recoverable copy or leaking secrets into operational history.

The panel is currently a loopback-only, single-token, single-operator interface. It has no user accounts or roles, but its request authorization needs a seam that will not require every handler to change when those capabilities are added.

## Decision

Use an in-process panel job manager for asynchronous mutating operations. Jobs report step progress and retain a one-time payload for generated credentials. The payload is consumed exactly once and cleared server-side after the first read; it is not persisted anywhere and is never written to the event log. A client that loses or dismisses the payload cannot recover it through the panel.

Record operations in an append-only JSONL event log at `<state_dir>/events/events.jsonl`. Event fields are redacted by key before writing, and the file is rotated by size. Event writes are best-effort: a logging failure must not fail, interrupt, or roll back the operation being recorded. The CLI exposes the same records through `wpfy log events`, with optional domain and limit filters.

Route metadata is declarative (`RouteMeta`) and includes action, scope, mutation, and destructive-operation properties. Every request passes through the single `authorize(principal, meta, domain)` seam before routing. Today all authenticated requests resolve to one implicit admin principal; the seam is reserved for adding authentication and role policy later without changing individual handlers.

Site deletion continues to use the shared lifecycle operation and preserves backup-before-delete ordering. A delete requires exact typed confirmation, and the operation refuses to stop or remove the site when the pre-delete backup fails.

## Alternatives considered

- Run panel operations synchronously in the HTTP request: rejected because long-running site lifecycle work would block the request and provide no reliable progress surface.
- Persist jobs in a database or external queue: rejected for the current self-hosted, single-operator tool because it adds operational dependencies and durability beyond the panel's needs; in-process jobs are accepted even though they do not survive a panel restart.
- Persist one-time credentials for later retrieval: rejected because it creates another secret store and recovery path; read-once delivery reduces persistence and exposure at the cost of irrecoverability after loss.
- Store events in SQLite: rejected because append-only JSONL is sufficient for the current event stream, easy to inspect and copy, and avoids another state subsystem; key-based redaction and size rotation provide the needed controls.
- Make event logging mandatory for operation success: rejected because observability must not become a new failure mode for site mutation.
- Put authorization checks in each handler or defer roles until later: rejected because duplicated checks drift; the centralized seam allows future principals and roles without handler rewrites.

## Consequences

- Panel mutations can show live progress and return generated credentials once, but jobs and their payloads disappear when the panel process restarts and lost credentials cannot be recovered.
- The event log is inspectable and append-only, but best-effort writes mean an operation may complete without a corresponding event if logging fails; JSONL and size rotation do not provide database query semantics or transactional history.
- Key-based redaction prevents known secret fields from entering events, while callers must still use the established secret vocabulary correctly.
- The current panel remains single-token and single-operator; adding accounts or roles can build on `authorize(principal, meta, domain)` rather than changing route handlers.
- Shared lifecycle ordering keeps panel deletion behavior aligned with the CLI, including refusal after a failed pre-delete backup.
