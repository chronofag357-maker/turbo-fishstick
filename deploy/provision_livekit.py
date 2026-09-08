"""One-time isolated media service provisioning, root on the existing VPS.

Does not restart the bot or change its configuration. Never prints credentials.
TLS signalling uses 8443; TURN/UDP 443. TURN/TLS 443 needs a separate design.
"""
import hashlib
import os
from pathlib import Path
import secrets
import subprocess
import tarfile
import tempfile
import urllib.request

VERSION = "1.13.6"
DOMAIN = "159-194-244-46.sslip.io"


def run(*args):
    subprocess.run(args, check=True)


def create(path, content, mode=0o600):
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, mode)
    with os.fdopen(descriptor, "w") as output:
        output.write(content)


def main():
    paths = ["/etc/p2p-livekit.yaml", "/etc/p2p-livekit.env",
             "/etc/systemd/system/p2p-livekit.service",
             "/etc/nginx/conf.d/p2p-livekit.conf"]
    if any(Path(path).exists() for path in paths):
        raise SystemExit("Existing media configuration found; inspect instead of overwriting.")
    base = f"https://github.com/livekit/livekit/releases/download/v{VERSION}/"
    filename = f"livekit_{VERSION}_linux_amd64.tar.gz"
    with tempfile.TemporaryDirectory(prefix="p2p-livekit-") as temp:
        archive = Path(temp) / filename
        urllib.request.urlretrieve(base + filename, archive)
        sums = urllib.request.urlopen(base + "checksums.txt", timeout=30).read().decode()
        expected = next(line.split()[0] for line in sums.splitlines() if line.endswith(filename))
        if hashlib.sha256(archive.read_bytes()).hexdigest() != expected:
            raise SystemExit("Binary checksum mismatch")
        with tarfile.open(archive) as package:
            member = next(item for item in package.getmembers() if item.name == "livekit-server")
            destination = Path("/usr/local/bin/p2p-livekit-server")
            if destination.exists():
                raise SystemExit("Existing binary found; inspect instead of overwriting.")
            with package.extractfile(member) as source:
                destination.write_bytes(source.read())
            destination.chmod(0o755)
    key = "p2p" + secrets.token_hex(12)
    secret = secrets.token_hex(32)
    room = "partners-" + secrets.token_hex(16)
    create(paths[0], f"""port: 7880
rtc:
  tcp_port: 7881
  udp_port: 7882
  use_external_ip: false
  node_ip: 159.194.244.46
keys:
  {key}: {secret}
room:
  max_participants: 3
  empty_timeout: 60
  departure_timeout: 20
turn:
  enabled: true
  udp_port: 443
  relay_range_start: 30000
  relay_range_end: 30100
logging:
  level: warn
""")
    create(paths[1], f"""LIVEKIT_ENABLED=true
LIVEKIT_URL=wss://{DOMAIN}:8443
LIVEKIT_API_KEY={key}
LIVEKIT_API_SECRET={secret}
LIVEKIT_ROOM={room}
LIVEKIT_PARTICIPANT_IDS=6192376154
""")
    create(paths[2], """[Unit]
Description=P2P Market private media service
After=network-online.target
[Service]
DynamicUser=true
ExecStart=/usr/local/bin/p2p-livekit-server --config %d/config.yaml
LoadCredential=config.yaml:/etc/p2p-livekit.yaml
Restart=on-failure
RestartSec=5
MemoryMax=700M
CPUQuota=70%
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
[Install]
WantedBy=multi-user.target
""", 0o644)
    create(paths[3], f"""server {{
    listen 8443 ssl;
    server_name {DOMAIN};
    ssl_certificate /etc/letsencrypt/live/{DOMAIN}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/{DOMAIN}/privkey.pem;
    access_log off;
    location / {{
        proxy_pass http://127.0.0.1:7880;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_read_timeout 3600s;
    }}
}}
""", 0o644)
    run("nginx", "-t")
    for port in ("8443/tcp", "7881/tcp", "7882/udp", "443/udp"):
        run("ufw", "allow", port)
    run("systemctl", "daemon-reload")
    run("systemctl", "enable", "--now", "p2p-livekit")
    run("systemctl", "reload", "nginx")
    print("Media service prepared. Bot unchanged; partner IDs and mobile tests still required.")


if __name__ == "__main__":
    main()
