# Faultline

A lightweight, Sentry-like error tracker prototype.

## Running the Project

Open three terminal windows and run the following three commands:

### 1. Start the Backend Server
```bash
cd server && npm start
```
* **URL:** http://localhost:4000
* Handles error ingestion (`POST /ingest`), fingerprint grouping, and dashboard REST APIs.

---

### 2. Start the Dashboard UI
```bash
cd dashboard && npm run dev
```
* **URL:** http://localhost:3000
* React + Vite dark-mode dashboard showing aggregated statistics, issue lists, and stack traces.

---

### 3. Start the Demo Application
```bash
cd demo && npm start
```
* **URL:** http://localhost:5000
* Interactive web app integrated with the Faultline SDK for triggering and verifying test errors in real time.
