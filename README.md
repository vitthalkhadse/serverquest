# ServerQuest 🖥️🐱 (SadServers-style pixel game)
Stack: Vite+React (frontend) · Node+Express (backend) · PostgreSQL. **Login/register nahi hai** (sirf optional player naam).

## 🧑 TUMHARA KAAM — Point 1 & 2 (maine nahi banaya)
**Point 1: Git & secrets** — branches (`main`/`dev`/`feature/*`), main lock (PR + CI required), `.gitignore`, `.dockerignore`, `.env.example`, GitHub Secrets.
**Point 2: Docker** — `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`. App se ye expectations hain:
- Backend env: `DB_HOST DB_PORT DB_USER DB_PASSWORD DB_NAME PORT(5000)` (+ optional `CORS_ORIGIN`). Frontend container: static files port 80 pe (`frontend/nginx.conf` ready hai).
- Compose services ke naam **exactly**: `db`, `backend`, `frontend`, `nginx`. `nginx` = `./nginx/nginx.conf` -> `/etc/nginx/conf.d/default.conf`, ports `80:80` (443 baad mein).
- `db` pe `ports:` mat do (bahar expose nahi) + volume `/var/lib/postgresql/data`. `backend` pe bhi host port nahi, `container_name` nahi (scale chahiye).
- Backend Dockerfile mein `HEALTHCHECK` (`wget -qO- http://localhost:5000/health`) aur `USER node`; image mein `.env` copy mat karna.
- `.env` mein `GRAFANA_PASSWORD` bhi rakhna (monitoring ke liye).
- Pehli baar `npm install` + `npm run format` dono folders mein chalao aur `package-lock.json` commit karo (CI ko chahiye).

## 🤖 MERA BANAYA — Point 3-6 + Security
| Kya | Kahan |
|---|---|
| CI (format, test, audit, build, Trivy scan, push) | `.github/workflows/ci.yml` |
| CD (SSH + zero-downtime rolling deploy) | `.github/workflows/cd.yml`, `scripts/deploy.sh` |
| Reverse proxy, load balancing, rate limit, security headers, SSL template | `nginx/nginx.conf` |
| Firewall, fail2ban, auto-updates, backup cron | `scripts/server-setup.sh`, `scripts/firewall.sh` |
| Backup / restore | `scripts/backup.sh`, `scripts/restore.sh` |
| Trivy local scan | `scripts/scan.sh <image>` |
| Prometheus, Grafana, Loki logs, Alertmanager (email/Slack) | `monitoring/` |

**GitHub Secrets:** `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `SERVER_HOST`, `SERVER_USER`, `SERVER_SSH_KEY`.
**Server order:** `server-setup.sh` -> repo `/opt/serverquest` clone + `.env` -> `docker compose up -d` -> monitoring up -> domain + certbot -> nginx HTTPS block + HSTS on.
**Scale:** `BACKEND_REPLICAS=3 ./scripts/deploy.sh` ya `docker compose up -d --scale backend=3` (nginx khud naye replicas dhoondh leta hai).

## 🔒 Security jo app mein hai
- Sab SQL parameterized (SQL injection nahi) · input validation (`validate.js`, tested) · JSON body max 2KB
- `helmet` headers · rate limit (app: 120/min, command: 30/min · nginx: 10 req/s) · CORS band (same-origin)
- Error pe stack trace leak nahi · `/metrics` aur DB bahar expose nahi · React auto-escape (XSS) + strict CSP
- Fake terminal: koi asli command run nahi hota (sirf regex match) -> command injection ka rasta hi nahi
- ⚠ Docker published ports **ufw ko bypass** karte hain — isiliye DB/backend/monitoring ke ports kabhi publicly publish mat karo.

## Local run (bina Docker)
`cd backend && npm install && npm run dev` · `cd frontend && npm install && npm run dev` (:5173, /api proxy)
