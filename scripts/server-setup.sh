#!/usr/bin/env bash
# Fresh Ubuntu server pe ek baar: sudo ./scripts/server-setup.sh
set -euo pipefail
apt-get update
apt-get install -y ufw fail2ban unattended-upgrades curl
systemctl enable --now fail2ban        # SSH brute-force block
dpkg-reconfigure -f noninteractive unattended-upgrades   # auto security updates
"$(dirname "$0")/firewall.sh"
# Raat 2 baje DB backup
CRON="0 2 * * * $(cd "$(dirname "$0")/.." && pwd)/scripts/backup.sh >> /var/log/sq-backup.log 2>&1"
( crontab -l 2>/dev/null | grep -v backup.sh; echo "$CRON" ) | crontab -
echo "Done. Ab SSH mein password login band karo (PasswordAuthentication no) - key login test karne ke BAAD."
