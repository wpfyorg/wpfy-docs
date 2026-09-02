# Installer

## Target UX
```bash
curl -fsSL https://raw.githubusercontent.com/wpfyorg/wpfy/main/install.sh | sudo bash
```

## Implemented
- Public bootstrap script exists at repo root as `install.sh`.
- Installer script exists at repo root as `wpfy`.
- `install.sh` downloads the public GitHub source archive for `WPFY_REF` (default `main`) and runs the bundled `wpfy` installer in full. It does not pass `--skip-wpfy-install`; that flag only skips the bundled installer's source-verification step.
- `install.sh` verifies the source archive when `WPFY_SOURCE_SHA256` is set.
- After the bundled installer finishes, `install.sh` copies the bundled updater trust anchor to `/etc/wpfy/update_trust.gpg` and then ensures the versioned release layout.
- Stack install with `--nginx`, `--all`, or `--fail2ban` ensures host-level fail2ban idempotently (Branch C): installs the package when absent, lands WPFY-owned filter/jail/action files before service start, validates, starts and reloads the service, and rolls back on failure. WPFY never modifies `/etc/fail2ban/jail.conf` or administrator-owned jails; the panel login jail activates with the install and per-site jails activate at site enable. See amended ADR 0023.
- The script bootstraps Ubuntu, creates adaptive swap when useful on small VPS hosts, installs base packages, installs or verifies Docker and the Compose plugin, creates core directories, syncs the source tree, installs `wpfy` into a virtualenv, writes a `/usr/local/bin/wpfy` wrapper that resolves through `/opt/wpfy/current`, writes `/etc/wpfy/wpfy.conf`, and runs smoke checks.
- Installed code lives in versioned releases under `/opt/wpfy/releases/release-<stamp>` (migrated trees use `releases/legacy-<stamp>`). `/opt/wpfy/current` symlinks to the active release; root-level `/opt/wpfy/app` and `/opt/wpfy/venv` are symlinks through `current`.
- First install migrates any existing flat `/opt/wpfy/app` and `/opt/wpfy/venv` trees into `releases/legacy-<stamp>` and activates them via `current`.
- A repeated bootstrap stages the new source, moves it and the venv (or links the existing active venv) into a fresh `releases/release-<stamp>`, reinstalls `wpfy` editable against that release with the release's own interpreter, verifies the release imports its own source, and only then repoints `current`.
- If activation fails at any point, the partial release is deleted and the previously active release stays active.
- Both scripts support `--dry-run` for non-destructive verification; `wpfy` also supports `WPFY_DRY_RUN=1`.
- The script can install from a local checkout or from `WPFY_SOURCE_URL` when run from a downloaded release asset.
- The root installer writes durable logs to `/var/log/wpfy/install.log` by default, or `WPFY_INSTALL_LOG` when set.
- Installer failures report the failed step, exit status, command name, log path, and a bounded log tail.
- The root installer begins with a compact `WPFY` logo and host summary so operators can confirm the target OS, hostname, virtualization, disk, RAM, swap, CPU, and IP addresses before mutation starts.
- Interactive installs use one color-coded 16-step progress bar spanning archive bootstrap and system installation. Non-TTY output uses one stable plain line per completed step.
- Full command output is written to the install log. `--verbose` / `WPFY_VERBOSE=1` mirrors it to the terminal; `--no-color`, `WPFY_NO_COLOR=1`, and `NO_COLOR` disable ANSI output and cursor rewriting.
- Failures print the failed step, exit status, command name, log path, and the last 15 lines from that step. Interruptions restore the cursor and retain the log.

## Responsibilities
- Verify root/sudo execution.
- Verify supported Ubuntu release.
- Ensure adaptive swap is available when useful for small VPS hosts.
- Install or verify Docker Engine.
- Install or verify Docker Compose plugin.
- Create `/opt/wpfy`, `/etc/wpfy`, `/var/lib/wpfy`, and `/var/log/wpfy`.
- Install the `wpfy` CLI entrypoint through the internal venv wrapper.
- Initialize runtime config.
- Run smoke checks for Docker, Compose, CLI, and directory permissions.
- Write installer logs.

## Current Behaviour
- `install.sh` is the public one-line entrypoint. It accepts `WPFY_REF`, `WPFY_SOURCE_ARCHIVE`, `WPFY_SOURCE_SHA256`, `WPFY_REPO_OWNER`, and `WPFY_REPO_NAME` for release validation and forks.
- The root installer creates `/swapfile` before package/Docker installation when no active swap exists and `/` has enough free space: 2 GB swap for 8-29 GB free, 4 GB swap for 30 GB+ free, and no swap below 8 GB free. `WPFY_SWAP=0` disables this, `WPFY_SWAP_SIZE_MB=<mb>` forces a size, and `WPFY_SWAP_FILE=<path>` changes the path.
- On a checkout, the bundled installer rsyncs the repo into `/opt/wpfy/app` (staged via `/opt/wpfy/app.next`, with the prior tree kept briefly at `/opt/wpfy/app.previous` within the same run) and installs the package in editable mode inside `/opt/wpfy/venv`; `install.sh` then converts the result into a versioned release under `/opt/wpfy/releases` activated by `/opt/wpfy/current`.
- On a release asset without source files, the script requires `WPFY_SOURCE_URL` to fetch a source tarball.
- Bootstrap and root-installer command output is recorded in `/var/log/wpfy/install.log`; `install.sh` reports download/extraction failures before handing off to the bundled installer. The bootstrap logs the ref only (`wpfy bootstrap: installing from ref <ref>`); source archive URLs are never printed or logged because they may carry private tokens, and download/copy failures surface as generic messages with tool diagnostics suppressed.
- The default terminal view suppresses raw package-manager and build output; `/var/log/wpfy/install.log` remains the authoritative transcript with per-step timestamps, status, and duration.

## Must Not Do
- Must not install host-level Nginx, PHP-FPM, MariaDB, or Redis stacks.
- Must not issue certificates during installer bootstrap.
- Must not create a default public site unless explicitly requested in a future command.
- Must not overwrite existing `wpfy` state without backup/confirmation.

## Root/Sudo Assumptions
- Installer requires root because Docker installation and system paths need elevated privileges. Install once with `sudo bash install.sh` (or the public `curl … | sudo bash`).
- Day-to-day CLI commands run as root. To keep the UX as plain `wpfy …` for a non-root login (e.g. the `ubuntu` cloud user), the installed `/usr/local/bin/wpfy` wrapper **self-elevates** via `sudo`, forwarding `WPFY_*`/`ACME_*` env (see ADR 0008). The operator therefore never types `sudo wpfy …`.
- Self-elevation assumes the operator has passwordless `sudo` (default on Ubuntu cloud images). `WPFY_NO_SELF_ELEVATE=1` disables elevation for testing the raw non-root path.
- Python package installation must not use system pip directly on Ubuntu hosts because Ubuntu 24.04 enforces PEP 668 externally managed environments.

## Distro Support
- Implemented v1: Ubuntu 22.04 LTS and 24.04 LTS.
- Debian support is later roadmap work.

## Docker Install/Check Flow
- Implemented: if Docker exists, verify usable Engine 24+ and Compose plugin.
- Implemented: if Docker is absent, install using the official Docker repository flow for supported Ubuntu releases.
- Current policy: minimum Docker Engine 24; exact patch version is not pinned.

## Rollback/Partial Install Behaviour
- Implemented: installer is restartable/idempotent for directory creation, source sync, venv install, wrapper write, config write, and Docker verification.
- Implemented: if a step fails, print the failed line, command, and log path.
- Implemented: within a bundled-installer run, a failing later step restores the previous source tree before exit.
- Implemented: during release activation, any failure deletes the partial `releases/release-<stamp>` directory, restores the canonical `app`/`venv` symlinks, and leaves the prior release active via `current`.
