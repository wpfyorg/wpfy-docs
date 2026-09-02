# `wpfy site files`

## Purpose

Perform small scripted file operations inside one managed site's `app/` directory. The browser panel is the primary file-manager surface; the CLI intentionally exposes only list, text read, host-file write, and remove.

## Status

Implemented in Phase 6. Every path is jail-relative and passes through the native file operation layer. Nothing above `<site>/app/` is addressable.

## Syntax

```bash
wpfy site files <domain> ls [path]
wpfy site files <domain> cat <path>
wpfy site files <domain> put <path> --content-file <host-file>
wpfy site files <domain> rm <path> [--confirm <name>]
```

An omitted `ls` path means the jail root. Paths never begin with `/`.

## Examples

```bash
wpfy site files example.com ls
wpfy site files example.com ls wp-content/plugins
wpfy site files example.com cat wp-config.php
wpfy site files example.com put wp-content/mu-plugins/site.php --content-file ./site.php
wpfy site files example.com rm wp-content/cache/stale.txt
wpfy site files example.com rm wp-content/cache --confirm cache
```

## Output

`ls` prints one tab-separated row per entry:

```text
MODE    TYPE    SIZE    MODIFIED_EPOCH    NAME
```

Directories sort before other entries. `TYPE` is `file`, `dir`, `symlink`, or `other`; symlinks are reported but never followed.

`cat` prints UTF-8 text only and refuses files above the editor limit instead of truncating them. Use the panel download action for large or binary files.

`put` streams the host file through the same capped upload operation used by the panel. The destination is atomically installed inside `app/` and chowned to the site's `SITE_UID` when wpfy is running as root.

`rm` removes files and empty directories without confirmation. A non-empty directory requires `--confirm` equal to its basename, not its full path. Supplying confirmation where none is needed is accepted.

## Path jail

The command refuses:

- NUL bytes;
- absolute paths;
- any `..` component;
- any path that traverses a symlink, even when the link currently points inside `app/`.

The jail root is `<site>/app/`. Site `.env`, `compose.yaml`, `nginx/`, `php/`, and `db-data/` remain outside the addressable tree.

## Panel API

The Files tab uses these authenticated routes:

```text
GET    /api/sites/<domain>/files?path=<rel>
GET    /api/sites/<domain>/files/content?path=<rel>
PUT    /api/sites/<domain>/files/content
GET    /api/sites/<domain>/files/download?path=<rel>
POST   /api/sites/<domain>/files/upload?path=<rel>
POST   /api/sites/<domain>/files/mkdir
POST   /api/sites/<domain>/files/rename
POST   /api/sites/<domain>/files/chmod
DELETE /api/sites/<domain>/files
```

Uploads are raw fixed-length request bodies, not JSON. Downloads are always `application/octet-stream` attachments with `nosniff`; the panel never renders site files inline.

## Failure modes

- Missing site or path: non-zero result / HTTP error.
- Traversal, absolute path, NUL, or symlink component: refused before the operation.
- Text file above the edit cap or invalid UTF-8: refused without truncation.
- Upload above the upload cap or without `Content-Length`: refused.
- Chmod outside `0600`, `0640`, `0644`, `0700`, `0750`, or `0755`: refused.
- Non-empty directory without exact basename confirmation: refused without deleting anything.

## Non-goals

No archive extract/compress, search, bulk operations, multi-file selection, resumable/chunked upload, in-panel rendering, symlink creation, or access outside `app/`.
