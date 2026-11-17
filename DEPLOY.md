# Faultline Deployment Guide

Faultline runs as three Docker containers managed by Docker Compose (project name `faultline`):

```
Internet ──:4200──► web  (nginx: built React dashboard + reverse proxy)
                     └─ /api/, /v1/, /ingest, /health ──► api (Node/Express :4000, not published)
                                                            └──► db (PostgreSQL 18 :5432, volume faultline_pgdata)
```

> ⚠️ **Never run `docker compose down -v`.** The `-v` flag deletes the `faultline_pgdata`
> volume, which means **all users, projects and errors are lost**. Plain `docker compose down` is safe.

---

## 1. Prerequisites
```bash
docker --version
docker compose version
```

---

## 2. Environment Configuration
Create `.env` in the repo root (next to `docker-compose.yml`):
```bash
cp .env.example .env
```

Set:
* `DB_PASSWORD`: password of the `faultline` Postgres user. If the database volume already
  exists, this **must be the password it was first created with**.
* `JWT_SECRET`: required. Generate one with `openssl rand -hex 32`.
* `GEMINI_API_KEY`: optional, enables AI explanations.

### Optional: publish the database port on the host
The `db` service has no published port by default. To reach it from the host
(e.g. for an SSH tunnel), create `docker-compose.override.yml` (git-ignored):
```yaml
services:
  db:
    ports:
      - "127.0.0.1:4220:5432"
```
Docker Compose merges this file automatically.

---

## 3. Build and Start
```bash
docker compose up -d --build
```

This starts:
1. `db`: PostgreSQL 18 with persistent storage in the `faultline_pgdata` volume.
2. `api`: Node.js 22 Express backend (starts once `db` is healthy).
3. `web`: nginx serving the dashboard on host port `4200`.

---

## 4. Initialize the Database Schema (first deploy only)
Check whether tables already exist:
```bash
docker compose exec db psql -U faultline -d faultline -c '\dt'
```

If it says "Did not find any tables", load the schema:
```bash
docker compose exec -T db psql -U faultline -d faultline < db/schema.sql
```

> Do **not** run the files in `db/migrations/`. `schema.sql` is already the complete,
> current schema. The migrations exist only to upgrade old development databases, and
> `002_users_projects.sql` deletes all issues and events.

---

## 5. Verify the Deployment
1. **Container status:**
   ```bash
   docker compose ps
   ```
   `db` should be `healthy`; `api` and `web` should be `Up`.

2. **Health endpoint (through nginx):**
   ```bash
   curl -i http://localhost:4200/health
   ```
   Expected: `HTTP/1.1 200 OK` with body `{"ok":true}`.

3. **Dashboard:** open `http://<YOUR_VPS_IP>:4200`, register, create a project and copy its API key.

4. **Send a test error:**
   ```bash
   curl -X POST http://<YOUR_VPS_IP>:4200/v1/ingest \
     -H 'Content-Type: application/json' \
     -H 'x-api-key: flt_your_project_api_key' \
     -d '{"type":"TestError","message":"Hello from curl"}'
   ```
   The issue should appear in the dashboard.

**Firewall:** if UFW is enabled: `sudo ufw allow 4200/tcp`. Note that Docker-published
ports bypass UFW rules, so also check any firewall in your VPS provider's panel.

---

## 6. Updating to a New Version
```bash
git pull
docker compose up -d --build
```
Only containers whose image or config changed are recreated; the database volume is kept.

---

## 7. Common Operations
* **Live logs:** `docker compose logs -f` (API only: `docker compose logs -f api`)
* **Restart services:** `docker compose restart`
* **Stop containers (data is kept):** `docker compose down`
