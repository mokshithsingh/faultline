# Faultline: prototype
Sentry-like error tracker. College prototype, must be demo-able in ~1 week.

## Stack
Node + Express, PostgreSQL, React (Vite) dashboard, plain JS SDK.

## Pieces (build ONE at a time, only when I ask)
1. POST /ingest  2. fingerprinting  3. SDK + demo app  4. dashboard

## Rules
- Do NOT add: queues, Redis, auth/accounts, Docker, rate limiting, alerts.
- Keep code simple and commented. I must be able to explain every function.
- After writing code, summarize what each file does in plain words.
- Never commit secrets; read keys from .env.