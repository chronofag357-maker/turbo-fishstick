# VPS: 06.09.2026

- Beget, 159.194.244.46, Ubuntu 24.04.4. SSH key access verified.
- Root SSH password login disabled (PermitRootLogin prohibit-password); key login rechecked successfully. User deferred password rotation: remind before final handoff. The exposed root password still needs changing, including for non-SSH access.
- Code cloned to /opt/freebk/app; freebk system user created; venv and requirements installed, pip check passed.
- nginx/certbot installed. Firewall permits SSH/HTTP/HTTPS only (plus standard UFW defaults).
- Bot polling started on VPS via freebk-bot.service. Local Python processes no longer running. Environment transferred over SSH with mode 600 to freebk user. SQLite backup integrity OK; transferred to VPS mode 600. Local original and .tools/vps-migration-backup.db retained.
- Public probes: Telegram 302, GitHub 200, The Odds root 200 (not an authenticated odds check). OpenRouter models endpoint: 403, Access denied by security policy. Do not bypass policy; resolve with provider or choose supported hosting/provider before enabling LLM here.
- HTTPS active: https://159-194-244-46.sslip.io (third-party free DNS, not Beget). Let's Encrypt certificate issued, automatic renewal configured.
- freebk-api standalone service disabled; freebk-bot provides API on 8082 behind nginx. Firewall blocks direct 8082. PROXY_URL overridden empty on VPS. MINI_APP_URL points to the VPS HTTPS address.
- Cached odds/metadata transferred. Public HTTPS returned 50 MMA and 41 boxing events. This is not verification of a fresh paid-provider request.
- The Odds authenticated sports endpoint HTTP 200. Legacy Boxing Data endpoint returns zero events. Broadcast HTML HTTP 200; actual video playback requires phone verification, video comes directly from Triller rather than through our VPS.
- Next: verify Mini App and video on phone; resolve OpenRouter 403 legitimately. Remind user to rotate exposed root password. Do not start local bot simultaneously.
