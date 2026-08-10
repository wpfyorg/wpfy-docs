# wpfy Documentation

Read these first:
- `MEMORY.md` for compact current context.
- `HANDOFF.md` for how a new agent should continue safely.
- `CHANGELOG.md` before editing.
- `DECISION-LOG.md` and `adr/` before changing architecture.

Status terms:
- Implemented: exists in code today.
- Planned: agreed direction, not built yet.
- Proposed: candidate direction, not decided.
- Open question: unresolved and should not be silently assumed.

Release deployment:
- Source and docs live in separate repositories (split-repo discipline). Docs
  record accepted decisions and implemented truth; the application repository
  is the code source of truth.
- Staging deployment and rollback are driven from the application repository:
  `scripts/deploy-staging`, `scripts/smoke-staging`, and
  `scripts/rollback-staging` (`WPFY_STAGING_TEST_MODE=1` enables the forced
  rollback drill). Release rehearsals record redacted evidence under
  `.omo/evidence/wpfy-fix-plan/` in the application worktree.
- Documentation must not describe a hotfix as live until a release containing
  it is deployed and verified. Claims of live behaviour link the rehearsal
  evidence that proved them.

Primary docs:
- `ARCHITECTURE.md`: system model and boundaries.
- `SERVER-LAYOUT.md`: intended VPS paths.
- `INSTALLER.md`: one-shot installer behavior.
- `SITE-ISOLATION.md`: per-site Compose isolation model.
- `SSL-FLOW.md`: opt-in SSL and automatic DNS/IP preflight.
- `SECURITY.md`: security goals, risks, and constraints.
- `COMMANDS.md`: command index.
- `ROADMAP.md`: staged work.
