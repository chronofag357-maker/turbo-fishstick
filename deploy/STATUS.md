# VPS: 06.09.2026

- Beget, 159.194.244.46, Ubuntu 24.04.4. SSH key access verified.
- Root SSH password login disabled (PermitRootLogin prohibit-password); key login rechecked successfully. User deferred password rotation: remind before final handoff. The exposed root password still needs changing, including for non-SSH access.
- Code cloned to /opt/freebk/app; freebk system user created; venv and requirements installed, pip check passed.
- nginx/certbot installed. Firewall permits SSH/HTTP/HTTPS only (plus standard UFW defaults).
- No bot polling started on VPS; local bot unchanged. Environment transferred over SSH with mode 600 to freebk user. Database not transferred.
- Public probes: Telegram 302, GitHub 200, The Odds root 200 (not an authenticated odds check). OpenRouter models endpoint: 403, Access denied by security policy. Do not bypass policy; resolve with provider or choose supported hosting/provider before enabling LLM here.
- HTTPS active: https://159-194-244-46.sslip.io (third-party free DNS, not Beget). Let's Encrypt certificate issued, automatic renewal configured.
- freebk-api systemd service enabled, loopback 8082 behind nginx; firewall blocks direct 8082. PROXY_URL overridden empty on VPS.
- Cached odds/metadata transferred. Public HTTPS returned 50 MMA and 41 boxing events. This is not verification of a fresh paid-provider request.
- Next: verify Mini App on phone; resolve OpenRouter 403 legitimately; migrate database and stop local polling before starting VPS polling. Remind user to rotate exposed root password.
