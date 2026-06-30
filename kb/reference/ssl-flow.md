# SSL Flow

## Certificate Lifecycle

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Preflight  │────▶│   ACME       │────▶│   Renewal    │
│   (DNS/IP)   │     │   Issuance   │     │   (auto)     │
└──────────────┘     └──────────────┘     └──────────────┘
```

## 1. Preflight (DNS/IP Verification)

Before any ACME request, WPFY verifies:

1. Resolve domain's A/AAAA records
2. Detect current VPS public IP
3. Match DNS records to public IP

If they match: preflight passes, proceed to issuance.
If they don't match: blocked, no file changes. Cloudflare-proxied domains are auto-detected and use HTTP-01 instead.

## 2. ACME Issuance

**Direct (default — TLS-ALPN-01):**
- Traefik serves a self-signed cert on port 443 during challenge
- Let's Encrypt validates via TLS-ALPN
- WPFY never touches port 80

**Proxied (HTTP-01):**
- Cloudflare forwards `/.well-known/acme-challenge/` to origin
- Let's Encrypt validates via HTTP
- Requires Cloudflare SSL mode: Full or Full (strict)

## 3. Certificate Storage

Certificates stored in Traefik's `acme.json` at `/opt/wpfy/traefik/acme.json`. WPFY reads this file to report status.

## 4. Renewal

Traefik auto-renews certificates 30 days before expiry. Manual renewal:

```bash
wpfy site ssl example.com --renew
```

## WordPress URL Update

When SSL is enabled on a WordPress site, WPFY updates:
- `home` → `https://<domain>`
- `siteurl` → `https://<domain>`

## Related Commands

- [wpfy site ssl](/site-commands/site-ssl)
- [wpfy site create -le](/site-commands/site-create)
