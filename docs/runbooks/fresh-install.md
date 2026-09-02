# Runbook: Fresh Install

## Status
- Implemented for Ubuntu 22.04 and 24.04.

## Goal
Bootstrap a fresh Ubuntu VPS for `wpfy`.

## Steps
1. Run `curl -fsSL https://raw.githubusercontent.com/wpfyorg/wpfy/main/install.sh | sudo bash`.
   - When installing from a release with a published checksum, set `WPFY_SOURCE_SHA256=<sha256>` before running the command.
2. Installer verifies root and Ubuntu support.
   - Before validation, it prints a compact `WPFY` logo and detected host summary for operator review.
   - Interactive installs show one color-coded 16-step progress bar. Use `--verbose` for raw command output or `--no-color` for plain output.
3. Installer creates adaptive swap when no active swap exists and `/` has enough free space.
   - Defaults: no swap below 8 GB free, 2 GB swap for 8-29 GB free, 4 GB swap for 30 GB+ free.
   - Controls: `WPFY_SWAP=0` disables swap creation, `WPFY_SWAP_SIZE_MB=<mb>` forces a size, and `WPFY_SWAP_FILE=<path>` changes the swap file path.
4. Installer installs or verifies Docker and Compose plugin.
5. Installer creates `/opt/wpfy`, `/etc/wpfy`, `/var/lib/wpfy`, and `/var/log/wpfy`.
6. Installer installs `wpfy` CLI.
7. Installer runs smoke checks.

## Resulting Layout
- Code and virtualenv live under `/opt/wpfy/releases/<release-id>`; `/opt/wpfy/current` symlinks to the active release, and `/opt/wpfy/app` plus `/opt/wpfy/venv` are symlinks through `current`.
- `/usr/local/bin/wpfy` resolves through `current`, so activation switches the CLI without touching the wrapper.
- Flat `/opt/wpfy/app` and `/opt/wpfy/venv` trees from older installs are migrated into `releases/legacy-<stamp>` on first run of the current bootstrap.

## Updates and Rollback
- Re-running the bootstrap stages a fresh `releases/release-<stamp>`, reinstalls `wpfy` editable against that release with its own interpreter, verifies the release imports its own source, then repoints `current`.
- The prior release stays active until the new release passes verification.
- If activation fails, the partial release is deleted automatically and the prior release remains active; no manual link surgery is required.

## Recovery
- Re-run installer after fixing the reported failure; it is designed to be restartable.
- Read the failure summary, then check `/var/log/wpfy/install.log` for the complete failed-step output and command history.
- The log never contains source archive URLs; the bootstrap logs the ref only.
