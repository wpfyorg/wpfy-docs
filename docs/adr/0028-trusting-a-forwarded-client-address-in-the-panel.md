# ADR 0028: Trusting a forwarded client address in the panel

- Status: Accepted
- Date: 2026-08-01

## Context

Panel failed-login throttling was keyed on the socket peer. That is the caller for loopback or direct access, but an exposed panel receives every public request from Traefik. The per-client control therefore collapsed into one global proxy bucket: ten failed sign-ins from one caller denied sign-in to every remote operator. Live finding L7 reproduced the shared cooldown while the same valid account continued to work over loopback.

`X-Forwarded-For` contains the client chain when Traefik is the peer, but it is request-controlled when a caller reaches the panel directly. Trusting it without authenticating the forwarding hop would turn an availability defect into a spoofing primitive.

## Decision

Use a forwarded client address for panel failed-login throttling only when the socket peer belongs to the discovered `wpfy-panel-edge` network. Walk the forwarded chain right-to-left, skip known trusted hops, and select the nearest valid untrusted address. Ignore malformed entries. If the peer is not trusted, the header is absent or unusable, or no edge network can be discovered, key the throttle on the socket peer.

This mirrors the existing site-level model in `site_security.py`: trust forwarded identity only from discovered edge sources and apply recursive real-IP semantics. Successful edge discovery may be cached for the panel process; discovery failure is not cached, so a transient Docker failure does not pin the degraded behavior for the process lifetime.

## Alternatives considered

- Continue using the socket peer: rejected because every remote caller behind Traefik shares one cooldown bucket.
- Trust `X-Forwarded-For` unconditionally: rejected as worse than the original defect. A caller could rotate forged addresses to evade its own cooldown or name another address to pin the cooldown onto that party.
- Use the leftmost forwarded address: rejected because a caller may prepend that value; walking from the trusted edge right-to-left identifies the nearest untrusted hop.
- Trust the header when edge discovery fails: rejected because an unverifiable forwarding claim must not become authoritative. Falling back to the peer preserves the old shared-bucket failure mode without opening spoofing.

## Consequences

- Remote clients behind the discovered edge receive distinct failed-login buckets, so one caller no longer cools down every operator.
- Direct and loopback callers cannot change their throttle identity with a forged forwarded header.
- Edge discovery failure degrades to the socket-peer bucket. This can temporarily restore the original shared cooldown, but it fails closed against identity spoofing and retries discovery on a later request.
- The panel and site security paths now use the same trust direction and right-to-left chain semantics.
