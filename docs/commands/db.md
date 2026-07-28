# `wpfy db`

## Purpose
Manage databases and scoped database users inside one site's isolated MariaDB container. The command never installs or mutates host-level MariaDB.

## Status
- Implemented: list and idempotently create/drop non-system databases.
- Implemented: list, create, drop, password-rotate, and database-grant scoped users.
- Implemented: optional per-site Adminer service with a loopback-only host port.

## Syntax
```bash
wpfy db <domain> list
wpfy db <domain> users
wpfy db <domain> create <name>
wpfy db <domain> drop <name>
wpfy db <domain> user-add <user> [--password [-|prompt]] [--database <name>]
wpfy db <domain> user-drop <user>
wpfy db <domain> user-password <user> [--password [-|prompt]]
wpfy db <domain> grant <user> <database>
wpfy db <domain> adminer on [--port <port>]
wpfy db <domain> adminer off
```

## Examples
```bash
wpfy db example.com list
wpfy db example.com create analytics
# Prefer the generated password, which is printed exactly once:
wpfy db example.com user-add reporting --database analytics
# To supply your own, pipe it in from a file. Never type a secret inline —
# it is recorded in shell history and visible in the process table.
cat /path/to/secret-file | wpfy db example.com user-add reporting --password - --database analytics
wpfy db example.com grant reporting analytics
wpfy db example.com user-password reporting --password -
wpfy db example.com adminer on --port 8081
wpfy db example.com adminer off
```

## Identifier Policy
Database and user names must match exactly `^[a-z][a-z0-9_]{0,31}$`. The value is rejected before a Compose command is constructed. Hostnames, punctuation, whitespace, shell syntax, and Unicode identifiers are not accepted.

## Password Behaviour
- Without a password, `user-add` and `user-password` generate a password and print it once in the CLI result.
- `--password -` reads one line from stdin and keeps it out of host argv and the child environment.
- `--password prompt` (or `--password` without a value) prompts only from a TTY.
- The database root password is expanded by the shell inside the database container; it is never placed in host argv, stdin, environment, or an operation result.

## Idempotency Behaviour
- `create` uses `CREATE DATABASE IF NOT EXISTS`.
- `drop` uses `DROP DATABASE IF EXISTS`.
- `user-add` uses `CREATE USER IF NOT EXISTS`; a requested grant is applied with a database-scoped `GRANT`.
- `user-drop` uses `DROP USER IF EXISTS`.
- Repeating an Adminer enable/disable operation reports success without duplicating service blocks or changing an operator-selected port.

## Adminer Isolation
Adminer is attached only to the site's `site` network and publishes `127.0.0.1:<port>:8080`. It is not routed through Traefik and never binds `0.0.0.0`. Use an SSH tunnel when the operator needs access from another machine.

## Panel Surface
The browser panel's Databases tab lists databases and scoped users, accepts database/user creation, and requires typing the exact resource name before a drop action enables. User creation and password rotation run as panel jobs; generated passwords appear in the one-time credential panel and are not fetched again. Adminer can be toggled from the same tab; when enabled, the panel shows `http://127.0.0.1:<port>` as plain text and directs remote operators to use an SSH tunnel.

## Failure Modes
- Invalid domain, missing site, or a site without a database service.
- Invalid database/user identifier or invalid Adminer port.
- Docker/Compose unavailable: database commands fail explicitly; Adminer state can be persisted offline but cannot claim a runtime start. Panel responses use HTTP 503 for this actionable runtime refusal.
- MariaDB command failure: stderr/stdout is returned without exposing the root password.
