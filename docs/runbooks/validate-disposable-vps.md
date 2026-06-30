# Runbook: Validate Disposable VPS

## Status
- Implemented as tooling plus manual execution steps.

## Goal
Run the release-validation flow against a disposable Ubuntu VPS while keeping evidence organized and reproducible.

## Local preparation
1. Prepare a bundle:
   `scripts/vps-release-validation.sh prepare`
2. Review the generated bundle under `.context/vps-validation/<run-id>/`.
3. Stage it to the VPS:
   `scripts/vps-release-validation.sh stage --run-id <run-id> --target root@<ip> --domain-base <domain>`

## Remote execution
1. Use the printed SSH command from the stage step, or run:
   `ssh root@<ip> 'cd /root/wpfy-validation/<run-id> && chmod +x ./vps-release-validation-remote.sh && WPFY_VALIDATION_RUN_ID=<run-id> WPFY_VALIDATION_DOMAIN_BASE=<domain> WPFY_VALIDATION_SOURCE_ARCHIVE=/root/wpfy-validation/<run-id>/wpfy-<run-id>.tar.gz bash ./vps-release-validation-remote.sh all'`
2. This runs the non-reboot phases and writes numbered evidence files under `/root/wpfy-validation/<run-id>/`.
3. Secrets are appended only to `/root/wpfy-validation/<run-id>/secrets.txt` with mode `0600`.

## Reboot checkpoint
1. Before reboot, confirm `96-pre-reboot.txt` exists and looks sane.
2. Reboot the VPS.
3. After reconnecting, run:
   `WPFY_VALIDATION_RUN_ID=<run-id> bash /root/wpfy-validation/<run-id>/vps-release-validation-remote.sh post-reboot`

## Public install repeat
- Run `public-install-repeat` only on a clean VPS after the public archive path is reachable without credentials.
- The default URL is `https://raw.githubusercontent.com/wpfyorg/wpfy/main/install.sh`.

## Notes
- The remote runner is intentionally phase-based. Re-run only the failed phase after fixing an issue.
- `all` excludes the reboot continuation and the public-install repeat because they require explicit operator intent and, in the public case, a clean target.
- The local bundle excludes `.git`, `.context`, caches, and build artifacts so the staged archive matches the intended release surface closely enough for validation.
