#!/usr/bin/env bash
# Server pe ek baar chalao (sudo). DB port (5432) kabhi open nahi karte.
set -euo pipefail
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
ufw status verbose
