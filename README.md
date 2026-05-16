# 🎯 Coddy

Learn programming and earn prizes — like Duolingo, but for code!

## Tech Stack

- **Frontend:** React + TailwindCSS
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Auth:** JWT-based authentication

## Getting Started

Coming soon...
Coddy v0.2 — Production-ready skeleton
=====================================

This repository has been scaffolded with a production-ready skeleton for
Coddy v0.2. The new version lives under the `v0.2/` folder and includes a
backend (Express) and a frontend (Vite + React) designed for Docker-based
deployments.

Quick layout
- `v0.2/backend` — Express API with JWT auth scaffold, export ZIP endpoint, and Dockerfile.
- `v0.2/frontend` — Vite + React app with a split-screen editor/preview and Dockerfile (nginx).

Getting started (local, simple)
1. Populate environment values from `.env.example`.
2. Start the backend:

```bash
cd v0.2/backend
npm install
npm run dev
```

3. Start the frontend dev server:

```bash
cd v0.2/frontend
npm install
npm run dev
```

Production with Docker (example)

```bash
# Build both images then run with your preferred orchestration (docker-compose or k8s)
docker build -t coddy-backend:0.2 -f v0.2/backend/Dockerfile v0.2/backend
docker build -t coddy-frontend:0.2 -f v0.2/frontend/Dockerfile v0.2/frontend
```

Next steps
- Replace the in-memory auth in `v0.2/backend/src/routes/auth.js` with a real Postgres-backed user model.
- Add migrations and tests.
- Wire CI for builds and image publishing.

Lessons migration
- The legacy `lessons/` content has been replaced by project-based course definitions.
- New project-based lessons live under `lessons/portfolio/` and follow the v0.2 course schema.
- If you need the original lesson files, create a backup branch before proceeding.
