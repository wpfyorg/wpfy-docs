# ADR 0019: Native path-jailed file manager

- Status: Accepted
- Date: 2026-07-27

## Context

The loopback panel needs browse, edit, upload, download, rename, chmod, and delete operations for each site's web root. The filesystem is attacker-influenced: the site's SFTP user, PHP process, WordPress plugins, or a compromised application can create symlinks and rename path components while the panel is serving another request.

The per-site directory also contains secrets and runtime state that must never enter this surface. `.env`, `compose.yaml`, `nginx/`, `php/`, and `db-data/` are siblings of `app/`; `.env` contains database and SFTP credentials. A blocklist over the site directory would make every new sibling another escape case.

A `realpath` containment check alone rejects links that currently resolve outside the jail, but it accepts a symlink whose current target is inside the jail and remains vulnerable if that link is repointed between validation and open. Downloads create a second boundary: site-controlled HTML, SVG, JavaScript, or PHP served from the panel origin could execute with access to the operator's bearer token unless every response is forced to download.

## Decision

Add `src/wpfy/files.py` as the sole operation layer for file-manager paths and mutations. Jail every path to `site_paths.app_dir(domain)`, not the wider site directory. The resolver:

1. rejects NUL bytes, absolute paths, and every `..` component before normalization;
2. permits only leading `./` removal and empty-component collapse;
3. walks every existing component with `lstat` and rejects every symlink, including links whose targets remain inside `app/`;
4. finishes with a `realpath` containment assertion as a backstop.

Every operation, including upload and rename destinations, uses that resolver. Operations then retain directory file descriptors and perform target opens, replacement, rename, chmod, mkdir, and recursive deletion with descriptor-relative syscalls; parent components cannot be repointed between the check and the mutation. File descriptors are opened with `O_NOFOLLOW | O_NONBLOCK`, so attacker-created FIFOs cannot block a panel worker before the regular-file check. Directory listings are the only entry-level exception: `scandir(..., follow_symlinks=False)` reports links as `type: symlink` without traversing them.

Text editing and raw uploads have separate module-level limits. Oversized editor reads fail instead of truncating. Upload routes require `Content-Length`, reject a declared over-limit request before reading one byte, and stream accepted bodies to a same-directory temporary file. If a raw upload handler rejects after its body was declared, the panel closes that HTTP connection rather than parsing the unread bytes as a following request. Writes and uploads use atomic replacement because `app/` is a directory bind mount; this does not change the existing rule that individually bind-mounted generated files must be updated in place.

Files and directories created by wpfy are chowned to the site's persisted `SITE_UID` when root and when ownership is not explicitly skipped. Chmod accepts only the octal strings `0600`, `0640`, `0644`, `0700`, `0750`, and `0755`; JSON integers and all setuid, setgid, sticky, or world-writable modes are refused.

A non-empty directory delete requires confirmation equal to the target basename. File and empty-directory deletes do not require confirmation, and an unnecessary confirmation remains accepted.

Every download uses `application/octet-stream`, `Content-Disposition: attachment`, and `X-Content-Type-Options: nosniff`. The ASCII fallback filename replaces unsafe characters, while `filename*` carries the percent-encoded UTF-8 name; raw CR/LF never reaches a response header.

Expose the operation layer through the panel Files tab and the thin grouped CLI surface `wpfy site files <domain> ls|cat|put|rm`. No archive extraction, bulk selection, search, preview rendering, symlink creation, chunked/resumable upload, or access outside `app/` is added.

## Alternatives considered

- **Jail the full site directory with a blocklist:** rejected. Secrets and database/runtime siblings would remain addressable unless every current and future name were blocked correctly.
- **`realpath` containment only:** rejected. It accepts contained symlinks and cannot make the check/open interval safe against link repointing.
- **Follow symlinks that currently resolve inside `app/`:** rejected. The site's own users can replace them without consulting wpfy.
- **Buffer uploads in the panel JSON reader:** rejected. The existing 64 KiB cap is too small for plugin archives, while raising it would buffer attacker-sized bodies in memory.
- **Infer download MIME types:** rejected. Site-controlled renderable content must never execute in the panel origin.
- **Add an editor or upload dependency:** rejected. A textarea, Fetch streams, and stdlib filesystem operations satisfy the accepted scope.

## Consequences

- The file manager cannot expose `.env`, Compose, generated Nginx/PHP configuration, or database storage through any relative path.
- Existing symlinks remain visible to operators but cannot be opened, edited, renamed through, chmodded, or downloaded.
- Large/binary files are downloadable but not editable; uploads require a fixed declared length and are capped.
- Root-created web-root files retain site updater and wp-cli compatibility through per-site ownership.
- The panel remains loopback-only and bearer-token protected; Phase 7 authentication and role work is unchanged.
- Offline tests can prove path, header, cap, and operation contracts, but cannot prove real Docker/Nginx acceptance or perform a real root chown on the host.

## Live validation

Every ownership assertion in the offline suite is made against a faked `geteuid` and an
intercepted `os.chown`, so the suite can only prove that the code *calls* chown. The
following was therefore run on the Ubuntu 24.04 validation host as real root, against
ext4, through the real panel over HTTP (2026-07-27):

- A file uploaded through the panel into `/opt/wpfy/sites/plain.wpfydev.top/app/` landed
  owned `100000:100000` — the site's own persisted `SITE_UID` — mode `0644`, not
  root-owned. This is the assertion the mocks stand in for.
- Upload, editor write, and mkdir in an isolated scratch root all produced files owned by
  that site's UID.
- `renameat2` resolves in this host's glibc, so the primary no-clobber path is live rather
  than silently falling through; rename succeeded on ext4 and refused an existing
  destination. The `EINVAL`/`ENOSYS`/`EOPNOTSUPP` fallback remains unit-tested only —
  ext4 supports `RENAME_NOREPLACE`, so no filesystem here rejects the flag.
- A FIFO planted in `app/` returned `path is not a regular file` instead of blocking a
  panel worker, confirming the `O_NONBLOCK` target open on real Linux.
- Downloads carried `application/octet-stream`, `attachment`, and `nosniff` over real HTTP.
- `../.env` was refused on a real site with a live credential file one directory above the
  jail root.

The probe file was deleted through the panel and the site directory verified unchanged.
