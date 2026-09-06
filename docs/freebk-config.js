// For GitHub Pages set this to the public HTTPS address of bot/web/api.py.
// When served by the bot itself, requests use the same origin automatically.
window.FREEBK_API_BASE = window.location.hostname.endsWith('.github.io') ? 'https://159-194-244-46.sslip.io' : window.location.origin;
