# Validate Disposable VPS

## Goal

Run release validation on a throwaway server without mutating a developer workstation.

## Prerequisites

- A disposable Ubuntu VPS.
- DNS records for validation domains when SSL is tested.
- Public release archive or staged validation bundle.
- Permission to destroy the VPS after testing.

## Steps

1. Prepare the validation bundle from the release branch.
2. Stage it to the disposable VPS.
3. Run the remote validation script on the VPS.
4. Collect numbered evidence from the run.
5. Destroy the VPS after evidence is captured.

## Verification

The validation runner should report phase results for installer, stack, site lifecycle, SSL, HTTP, operations, backup/restore, delete, and reboot checks when those phases are selected.

## Failure Recovery

Fix the first failing phase, rebuild the bundle, and rerun on a fresh or cleaned disposable host.

## Cleanup

Destroy the VPS and remove temporary local validation artifacts when they are no longer needed.

## Related Reference Pages

[`Release matrix`](../reference/release-matrix), [`Security`](../reference/security).
