# Faultline Deployment Guide

This guide outlines the exact commands and order of steps to build, start, and initialize Faultline on a server using Docker and Docker Compose.

---

## 1. Prerequisites
Ensure Docker Engine and Docker Compose are installed and running on your host machine:
```bash
docker --version
docker compose version
```

---

## 2. Environment Configuration
Create your production `.env` file from the example template:
```bash
cp .env.example .env
```

Open `.env` and configure strong values for the secrets:
* `DB_PASSWORD`: A secure password for the `faultline` Postgres user.
* `JWT_SECRET`: A random 32+ character string used to sign session cookies.

---

## 3. Build and Start the Containers
Run Docker Compose in detached mode to build the images and launch the services:
```bash
docker compose up -d --build
```

This brings up:
1. `db`: PostgreSQL 18 with persistent storage in Docker volume `pgdata`.
2. `api`: Node.js 22 Express backend (starts automatically once `db` passes health checks).
3. `web`: Nginx reverse proxy serving the built React SPA on loopback port `127.0.0.1:4200`.

---

## 4. Initialize Database Schema
Once the containers are up and the database is healthy, load `db/schema.sql` into the PostgreSQL container:
```bash
docker compose exec -T db psql -U faultline -d faultline < db/schema.sql
```

*(Optional)* Run migrations if any additional migration scripts exist:
```bash
for file in db/migrations/*.sql; do
  docker compose exec -T db psql -U faultline -d faultline < "$file"
done
```

---

## 5. Verify the Deployment
1. **Check container status and health:**
   ```bash
   docker compose ps
   ```
   All services (`db`, `api`, `web`) should be listed with state `Up` or `healthy`.

2. **Test the health endpoint via loopback:**
   ```bash
   curl -i http://127.0.0.1:4200/health
   ```
   Expected response:
   ```http
   HTTP/1.1 200 OK
   Content-Type: application/json; charset=utf-8
   ...
   {"ok":true}
   ```

3. **Access the Dashboard:**
   Open `http://127.0.0.1:4200` in your browser (or proxy via your host's edge reverse proxy like Cloudflare, Caddy, or Nginx).

---

## 6. Common Operations
* **View live logs:**
  ```bash
  docker compose logs -f
  ```
* **View API logs only:**
  ```bash
  docker compose logs -f api
  ```
* **Restart services:**
  ```bash
  docker compose restart
  ```
* **Stop containers:**
  ```bash
  docker compose down
  ```
* **Stop containers and purge data (Warning: deletes database volume):**
  ```bash
  docker compose down -v
  ```
