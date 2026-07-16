# Deployment

Nimbus is five independently-deployable pieces: frontend, backend API,
Celery worker, Postgres, Redis — plus Clerk, which is already hosted for
you. Nothing here needs a server you SSH into; every recommended option
below is a managed platform with a free or cheap tier and a git-push deploy
flow, which is also what keeps this scalable by default (see
`docs/SCALING.md`).

## Recommended stack (fastest path to a live URL)

| Piece | Platform | Why |
|---|---|---|
| Frontend | **Vercel** | Built by the Next.js team; zero-config for this repo |
| Backend + worker | **Render** | Docker-native, has a real "Background Worker" service type for Celery |
| Postgres | **Neon** | Serverless, scales to zero, branching for free |
| Redis | **Upstash** | Serverless, pay-per-request, no instance to manage |
| Auth | **Clerk** | Already hosted — nothing to deploy |

Total cost to get a working live product in front of real users: **$0/month**
on free tiers, until you have enough usage that upgrading is a good
problem to have.

### 1. Clerk

1. Create an application at [clerk.com](https://clerk.com) if you haven't.
2. Configure sign-in methods (Dashboard → Configure → User & Authentication)
   — email/password is on by default; toggle on Google/GitHub for OAuth.
3. Copy the **Publishable key** and **Secret key** (Configure → API Keys).
4. Copy the **JWKS URL** from the same page.
5. Add your production frontend domain under Configure → Domains once you
   have one (step 5 below) so Clerk allows it.

### 2. Neon (Postgres)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the connection string it gives you — this is your `DATABASE_URL`.
   Neon's pooled connection string (the one with `-pooler` in the hostname)
   is the one to use in production; it fixes the "too many connections"
   problem you'd otherwise hit as traffic grows.

### 3. Upstash (Redis)

1. Create a Redis database at [upstash.com](https://upstash.com) (choose a
   region close to your Render backend).
2. Copy the `rediss://` connection string (note the TLS `s`) — this is your
   `REDIS_URL`.

### 4. Render (backend API + Celery worker)

1. Push this repo to GitHub.
2. New → **Web Service**, connect the repo, root directory `backend`,
   environment: Docker (it'll use `backend/Dockerfile` as-is).
3. Set environment variables: `DATABASE_URL` (from Neon), `REDIS_URL`
   (from Upstash), `CLERK_JWKS_URL`, `GOOGLE_API_KEY`, `AWS_ACCESS_KEY_ID`,
   `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `DRY_RUN=true`, `CORS_ORIGINS`
   (your Vercel URL, added after step 5).
4. New → **Background Worker**, same repo/root/Dockerfile, but override the
   start command to `celery -A app.celery_app.celery_app worker --loglevel=info`.
   Give it the same environment variables as the web service.
5. Note the web service's public URL — that's your backend URL for the
   frontend to call.

### 5. Vercel (frontend)

1. Import the repo, set **root directory** to `frontend`.
2. Environment variables: `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`,
   `CLERK_SECRET_KEY`, `NEXT_PUBLIC_API_BASE` (the Render URL from step 4).
3. Deploy. Vercel auto-builds on every push to `main` from here on — no
   extra CI config needed for this half.
4. Go back to Render and set `CORS_ORIGINS` to your new Vercel URL (or your
   custom domain once attached), so the backend accepts requests from it.

### 6. Custom domain

Attach it in Vercel (frontend) and, if you want a clean API subdomain, in
Render too (e.g. `app.yoursite.com` → Vercel, `api.yoursite.com` →
Render). Both platforms issue TLS certificates automatically. Add the
final domains to Clerk's allowed domains list.

### 7. Go live

Flip `DRY_RUN=false` on both the Render web service and worker once you've
smoke-tested the dry-run path end to end (see the root README's "Running
it locally" section for the same flow against production).

## Alternatives, if you want more control

| Need | Option | Trade-off vs. the recommended stack |
|---|---|---|
| Already deep in AWS (you are, via OptiVault) | **ECS/Fargate** for backend+worker, **RDS** for Postgres, **ElastiCache** for Redis | More setup (VPC, task defs, ALB), but one cloud bill and IAM story; the `Dockerfile`s here work as-is as ECS task images |
| Want a single dashboard for everything | **Railway** | Backend, worker, Postgres, and Redis can all live in one project; slightly pricier at scale than Neon/Upstash's serverless pricing |
| Prefer a simpler PaaS than Render | **Fly.io** or **DigitalOcean App Platform** | Similar Docker-native deploy flow; Fly's free tier is smaller, DO has no free tier but predictable flat pricing |
| Want to self-host everything | Any VPS + the provided `docker-compose.yml` | You manage TLS, backups, and updates yourself — `docker compose up -d` behind a reverse proxy like Caddy or Traefik gets you most of the way |

## CI/CD

`.github/workflows/ci.yml` already runs backend tests and a frontend build
on every push/PR — treat a red check as "don't merge," independent of
whichever platform above does the actual deploying. Vercel and Render both
deploy straight from GitHub on push to `main`; there's nothing extra to
wire up for continuous deployment once they're connected to the repo.

## Secrets checklist

Never commit `.env`, `.env.local`, or `frontend/.env.local`. Every value in
`.env.example` and `frontend/.env.example` should be set as a real secret
in Vercel/Render's dashboards (or your platform of choice) — not baked
into the repo or the Docker image.
