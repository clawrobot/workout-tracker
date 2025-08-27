# Workout Tracker (Monorepo)

Full-stack gym/workout tracker.  
**Web:** React (Vite + TS + Tailwind) • **API:** Express + TS + Zod • **DB:** Postgres (Docker) via Prisma • **Tooling:** PNPM workspaces + Turborepo + TSX.

---

## Stack

- **Frontend:** React, Vite, TypeScript, TailwindCSS  
- **API:** Express, TypeScript, Zod (validation)  
- **Database:** PostgreSQL (Docker), Prisma ORM  
- **Dev tooling:** PNPM, Turborepo, TSX, Docker Compose

---

## Prereqs

- Node 20+ and **pnpm**
    corepack enable
    corepack prepare pnpm@latest --activate
- Git
- Docker Desktop (with WSL integration on Windows)
- VS Code + Tailwind CSS IntelliSense extension

---

## 1) Clone & install

    git clone <your-repo-url> workout-tracker
    cd workout-tracker
    pnpm install

---

## 2) Env files

Copy the example env files and edit if needed:

    cp .env.example .env
    cp apps/api/.env.example apps/api/.env
    cp apps/web/.env.example apps/web/.env

**What’s in them (defaults for local dev):**

- `/.env`

        PORT=4000
        DATABASE_URL="postgresql://workout:workout@localhost:5432/workout?schema=public"
        VITE_API_URL=http://localhost:4000

- `/apps/api/.env`

        PORT=4000
        DATABASE_URL="postgresql://workout:workout@localhost:5432/workout?schema=public"

- `/apps/web/.env`

        VITE_API_URL=http://localhost:4000

---

## 3) Start Postgres (Docker)

    docker compose up -d

Launches Postgres 16 at `localhost:5432` with user/db/password `workout`.

---

## 4) Initialize DB schema (first time)

    cd apps/api
    npx prisma migrate dev --name init
    cd ../../

If you change the Prisma schema later, run another migrate with a new name.

---

## 5) Run dev (API + Web)

    pnpm dev

- Web: http://localhost:5173  
- API: http://localhost:4000  
- Health: http://localhost:4000/health

To run individually:

    pnpm --filter api dev   # API only
    pnpm --filter web dev   # Web only

---


---

## API quick reference

Base URL: `http://localhost:4000`

**Health**
- GET `/health` → `{ ok, service, timestamp }`

**Workouts**
- GET `/workouts` → list workouts
- POST `/workouts` → create workout `{ name: string }`
- DELETE `/workouts/:id` → delete workout (cascades to exercises)

**Exercises**
- GET `/workouts/:id/exercises` → list exercises for a workout
- POST `/workouts/:id/exercises` → create exercise `{ name: string }`
  - Relation: an exercise belongs to one workout
  - Cascade delete: deleting a workout deletes its exercises

**Sets**
- GET `/exercises/:id/sets` → list sets for an exercise
- POST `/exercises/:id/sets` → create set `{ reps: number, weight: number }`
  - Relation: a set belongs to one exercise
  - Cascade delete: deleting an exercise deletes its sets

Validation by **Zod**. Responses are JSON. Errors return 4xx/5xx with `{ error }`.

---

## Useful dev commands

    # DB GUI
    cd apps/api && npx prisma studio

    # Regenerate Prisma client (after schema edits)
    cd apps/api && npx prisma generate

    # Apply schema changes with a migration
    cd apps/api && npx prisma migrate dev --name <change-name>

    # Start/stop Postgres
    docker compose up -d
    docker compose down

---

## Troubleshooting

- **Frontend says “NetworkError”** → ensure API is running (`pnpm --filter api dev`) and `apps/web/.env` has `VITE_API_URL=http://localhost:4000` (restart web dev server after changes).  
- **CORS error** → API uses `app.use(cors())` in dev. If deploying, configure allowed origins.  
- **Prisma types missing (e.g., `prisma.exercise` not found)** → run `cd apps/api && npx prisma generate`, then reload TS server in VS Code (Cmd/Ctrl+Shift+P → *TypeScript: Restart TS server*).  
- **Cannot delete workout** → ensure cascade is set in `schema.prisma` on `Exercise.workout` relation (`onDelete: Cascade`) and migrate again.

---

## Notes / Next ideas

- Delete/edit for exercises & sets  
- Auth (Clerk/Auth.js) + multi-user data  
- Deploy: Web → Vercel; API → Render/Railway/Fly; DB → Neon/Supabase  
- Dockerfiles for API/Web and a compose that runs all services together
