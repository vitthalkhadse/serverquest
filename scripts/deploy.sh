#!/usr/bin/env bash
# Zero-downtime deploy (rolling): naye backend containers pehle start, healthy hone par purane band.
# Zaroori: compose mein service names db/backend/frontend/nginx, backend pe host port NAHI, Dockerfile mein HEALTHCHECK.
set -euo pipefail
cd "$(dirname "$0")/.."
N=${BACKEND_REPLICAS:-2}

docker compose pull
OLD=$(docker compose ps -q backend | sort)

# 1) naye image wale containers purano ke SAATH start (--no-recreate = purane chhuo mat)
docker compose up -d --no-deps --no-recreate --scale backend=$((N * 2)) backend
NEW=$(comm -13 <(echo "$OLD") <(docker compose ps -q backend | sort))

# 2) naye containers healthy hone ka wait (max ~60s)
for id in $NEW; do
  ok=0
  for _ in $(seq 1 30); do
    s=$(docker inspect -f '{{.State.Health.Status}}' "$id" 2>/dev/null || echo none)
    [ "$s" = "healthy" ] && ok=1 && break
    sleep 2
  done
  if [ "$ok" -ne 1 ]; then
    echo "Naya container healthy nahi -> ROLLBACK (purane chal rahe hain)"
    docker stop $NEW >/dev/null && docker rm $NEW >/dev/null
    exit 1
  fi
done

# 3) purane graceful band (backend SIGTERM pe chalti requests poori karta hai)
[ -n "$OLD" ] && { docker stop -t 15 $OLD >/dev/null; docker rm $OLD >/dev/null; }

# 4) baaki services (static frontend, nginx) sirf jo badli unhe recreate
docker compose up -d --no-deps frontend nginx

# 5) final check
for _ in $(seq 1 15); do
  curl -fsS http://localhost/api/health >/dev/null && { echo "Deploy OK"; exit 0; }
  sleep 2
done
echo "Final health check FAIL"; exit 1
