#!/bin/bash
set -euo pipefail
# Key-only root SSH; keep the current session open until a new login is verified.
install -m 600 /opt/freebk-setup/00-freebk.conf /etc/ssh/sshd_config.d/00-freebk.conf
sshd -t
systemctl reload ssh
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y python3-venv git nginx certbot python3-certbot-nginx
id freebk >/dev/null 2>&1 || useradd --system --create-home --home-dir /opt/freebk --shell /usr/sbin/nologin freebk
chmod 751 /opt/freebk
if [ ! -d /opt/freebk/app/.git ]; then
  git clone https://github.com/chronofag357-maker/turbo-fishstick.git /opt/freebk/app
fi
python3 -m venv /opt/freebk/app/.venv
/opt/freebk/app/.venv/bin/pip install -r /opt/freebk/app/requirements.txt
chown -R freebk:freebk /opt/freebk/app
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
