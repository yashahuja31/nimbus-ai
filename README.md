# Nimbus AI — Your AI Cloud Engineer

Tell it what you want deployed or changed in your cloud infrastructure. It
proposes a plan — the exact operations, the generated Terraform, a risk
level, and a cost estimate — and nothing touches your AWS account until
you click **Approve**. This repo is the Phase 1 MVP: a real, working,
end-to-end slice of that product, built to grow into the fuller roadmap
described below rather than be rewritten for it.

## Table of contents

- [What's actually built](#whats-actually-built)
- [What's not built yet — the roadmap](#whats-not-built-yet--the-roadmap)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Data model](#data-model)
- [Auth](#auth)
- [API reference](#api-reference)
- [Repo layout](#repo-layout)
- [Running it locally](#running-it-locally)
- [Deployment](#deployment)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)
- [Security notes](#security-notes)
- [Nimbus AI and OptiVault](#nimbus-ai-and-optivault)

---

## What's actually built

Everything below is real, working code — not a stub or a mock.

- **Auth via Clerk.** Email/password and OAuth (Google/GitHub, or whatever
  you enable in the Clerk dashboard) are handled entirely by Clerk's
  hosted components on the frontend. The backend never sees a password —
  it only verifies the session token Clerk issues.
- **AI planner.** A LangGraph graph (`backend/app/agent/graph.py`) takes a
  plain-English request, calls Gemini with structured output restricted to
  a fixed catalog of safe operations, generates matching Terraform HCL,
  and scores risk level + estimated monthly cost — all before anything
  touches AWS.
- **Structural approval gate.** The executor only ever runs from
  `POST /plans/{id}/approve`, a request that only exists because a human
  clicked a button. This is enforced by the API layer, not by prompting
  the model to behave — see [Architecture](#architecture) for why that
  distinction matters.
- **Real AWS execution.** `boto3` calls for the three Phase-1 operations
  (create S3 bucket, enable versioning, enable encryption), gated behind a
  `DRY_RUN` flag that defaults to `true` so nothing hits a real account
  until you deliberately flip it.
- **Async execution + audit trail.** Celery + Redis run approved steps as
  background tasks; every attempt writes an `ExecutionLog` row, and once
  every step in a plan resolves, the plan's status rolls up to `completed`
  or `failed` with a summary line.
- **Scalability basics already in place.** Indexed foreign keys, paginated
  list endpoints, and a rate limit on the one endpoint that spends LLM
  tokens (`/chat`). Full detail in [Scaling](#scaling).
- **Frontend.** Next.js 14 (App Router) + TypeScript + Tailwind + Clerk,
  with a signature animated pipeline visualization on the landing page,
  plan-approval cards with a Terraform preview, a dashboard, and an
  execution history page — all wired to the real API. Also: a `⌘K`
  command palette, a toast notification system used consistently across
  every action, live polling so an executing plan's status updates
  without a manual refresh, a full multi-account page (connect/list/
  remove), and route-level + root-level error boundaries with a real
  fallback UI instead of a blank crash.
- **Postgres models, Docker Compose, GitHub Actions CI** — all present and
  functional. `docker compose up --build` runs the whole stack.

## What's not built yet — the roadmap

The original product vision is a real 12-month, multi-person-team plan.
Here's the full shape of it and what stage each part is at:

| Phase | Scope | Status |
|---|---|---|
| **1 — MVP** | Chat-based cloud actions, approval flow, S3 bucket create/versioning/encryption | ✅ Built (this repo) |
| **2 — Infrastructure automation** | Deploy React/Node/Python (Django/Flask/FastAPI) apps; auto-provision EC2, RDS, IAM roles, Security Groups, VPC, Load Balancer, Route53, SSL | Not started |
| **3 — DevOps agent** | Diagnose issues ("my API is slow") by checking CPU/RAM/disk/logs/DB/network/cache, recommend fixes | Not started |
| **4 — Cost optimization** | Find unused volumes, idle instances, old snapshots, overprovisioned DBs; show potential savings | Not started — and functionally overlaps with a separate project, see [Nimbus AI and OptiVault](#nimbus-ai-and-optivault) |
| **5 — Incident response** | Auto-read logs/metrics, restart services, notify Slack, write incident reports, open GitHub issues | Not started |
| **6 — Security** | Scan for public S3 buckets, weak IAM, open ports, old certs, leaked secrets | Not started |
| **7 — Multi-agent system** | Specialized Planner/Cost/Security/Deployment/Monitoring/Documentation/Incident agents | Not started |
| **8 — Multi-cloud** | Azure, GCP, DigitalOcean, Cloudflare, Oracle Cloud support | Not started |
| **9 — Enterprise** | Team workspaces, RBAC, audit logs, SSO, approval workflows, multi-account, policy enforcement, compliance reports | Not started |

The architecture is deliberately built so growing into these is additive:
adding a Phase 2 operation is one entry in `agent/tools.py` plus one
executor function, not a rewrite of the plan/approve/execute pipeline.

## Tech stack

**Frontend** — React, Next.js 14 (App Router), TypeScript, Tailwind CSS,
hand-rolled shadcn-style UI primitives, Clerk (auth), framer-motion
(the landing-page pipeline animation and card transitions).

**Backend** — FastAPI, Python 3.12, Celery (background execution), Redis
(broker + rate-limit storage), PostgreSQL, SQLAlchemy, slowapi (rate
limiting), PyJWT (Clerk token verification).

**AI** — Gemini 2.5 Pro via `langchain-google-genai`, LangGraph
(planning graph), LangChain core. The LLM call is isolated to one file
(`backend/app/agent/llm.py`), so swapping providers later is a one-function
change.

**Infrastructure** — Docker, Docker Compose (local dev), GitHub Actions
(CI), a reference Terraform module (`infra/terraform/modules/s3_bucket`)
matching the shape of what the planner generates.

**Not yet used, on the original list for later phases** — Kubernetes,
Ansible, a vector database (Qdrant/pgvector) for anything beyond the
current stateless planning graph, multi-cloud SDKs.

## Architecture

```
 ┌──────────┐      ┌──────────────┐      ┌────────────────┐
 │ Next.js  │──────▶  FastAPI      │──────▶  LangGraph       │
 │ frontend │ HTTPS │  (API layer) │      │  planner (Gemini)│
 │ (Clerk   │◀──────│              │◀──────                  │
 │  auth)   │       └──────┬───────┘      └────────────────┘
 └──────────┘              │
                            │ approve
                            ▼
                     ┌──────────────┐      ┌────────────────┐
                     │ Celery task  │──────▶  boto3 executor  │
                     │ queue (Redis)│      │  (AWS S3, etc.)  │
                     └──────┬───────┘      └────────────────┘
                            │
                            ▼
                     ┌──────────────┐
                     │  Postgres     │  Users, Plans, PlanSteps,
                     │               │  ExecutionLogs
                     └──────────────┘
```

### Request lifecycle

1. **Sign-in.** The frontend never talks to the backend for auth — Clerk's
   hosted components handle sign-up/sign-in entirely client-side and issue
   a short-lived session token.
2. **Chat.** `POST /chat` verifies that token, calls the LangGraph planner
   synchronously, and writes a `Plan` + its `PlanStep`s to Postgres with
   status `proposed`. Rate-limited (`CHAT_RATE_LIMIT`, default 10/min)
   since it's the one endpoint that spends real LLM tokens.
3. **Review.** The frontend renders the plan, its generated Terraform,
   risk level, and cost estimate. Nothing has touched AWS yet.
4. **Approve.** `POST /plans/{id}/approve` flips the plan to `executing`
   and enqueues one Celery task per step.
5. **Execute.** Each task calls the matching `boto3` function in
   `app/executor`. With `DRY_RUN=true` the call is built and logged but
   never sent to AWS.
6. **Verify.** Once every step resolves, the task rolls the plan's status
   up (`completed`/`failed`) and writes a summary `ExecutionLog` line.

### Why approval isn't a LangGraph node

LangGraph supports human-in-the-loop interrupts, and an earlier design put
approval inside the graph. It moved out on purpose: enforcing "never
execute without approval" as a property of the *API* (the executor only
ever runs from a POST hit by a real browser session) is a stronger
guarantee than enforcing it as a property of *prompted agent behavior*. A
bug in the graph can't accidentally skip a REST call that was never made
in the first place.

### The planner catalog

`backend/app/agent/tools.py` holds the actual safety boundary: the LLM is
instructed to only ever choose from a fixed list of operations, and the
planner discards anything else server-side. Growing the product means
growing this catalog plus a matching executor function — the
plan/approve/execute machinery underneath doesn't change.

## Data model

| Table | Purpose | Key relationships |
|---|---|---|
| `users` | One row per Clerk identity (`clerk_user_id` is the real key, email is best-effort) | — |
| `cloud_accounts` | Records that a customer has connected a provider | `owner_id → users` |
| `plans` | One row per chat request | `owner_id → users` |
| `plan_steps` | One row per operation in a plan | `plan_id → plans` |
| `execution_logs` | Audit trail of everything the executor did | `plan_id → plans`, `step_id → plan_steps` |

All foreign-key columns used in query filters (`owner_id`, `plan_id`,
`step_id`) are indexed.

## Auth

Clerk owns identity end to end — sign-up, sign-in, password resets, social
login, session rotation. The backend's only job (`backend/app/security.py`):

1. Pull the `Authorization: Bearer <token>` header.
2. Verify the token's signature against Clerk's JWKS endpoint
   (`CLERK_JWKS_URL`) using `PyJWKClient`, which handles key rotation
   automatically.
3. Read the `sub` claim (Clerk's stable user id) and find-or-create a
   local `User` row keyed on it. `email` syncs opportunistically if your
   Clerk JWT template includes it — nothing depends on it being present.

This makes the backend fully stateless with respect to auth: any instance
can verify any request with no shared session store, which is what makes
horizontal API scaling trivial.

The frontend's sign-in/sign-up pages (`frontend/app/sign-in/page.tsx`,
`frontend/app/sign-up/page.tsx`) use Clerk's `routing="hash"` mode
deliberately — it works from a plain route with no special folder naming,
which is more robust against accidental edits than Clerk's catch-all-route
(`routing="path"`) alternative.

## API reference

Base URL: `http://localhost:8000` locally. Interactive docs always
available at `/docs` and `/redoc`. Every endpoint except `/health` requires
`Authorization: Bearer <clerk session token>`.

| Method & path | Auth | Notes |
|---|---|---|
| `GET /health` | No | Liveness check |
| `GET /auth/me` | Yes | Returns/provisions the local synced user |
| `POST /chat` | Yes | Rate-limited (`CHAT_RATE_LIMIT`). Body: `{"message": "..."}`. Returns a `Plan`, status `proposed` |
| `GET /plans?limit=&offset=` | Yes | Paginated list, newest first, max `limit` 200 |
| `GET /plans/{id}` | Yes | Single plan, 404 if not owned by caller |
| `POST /plans/{id}/approve` | Yes | Moves to `executing`, enqueues Celery tasks. 400 if not currently `proposed` |
| `POST /plans/{id}/reject` | Yes | Moves to `rejected`. 400 if not currently `proposed` |
| `GET /history?limit=&offset=` | Yes | Paginated execution log, newest first |
| `GET /cloud-accounts` | Yes | List connected accounts |
| `POST /cloud-accounts` | Yes | Body: `{"provider": "aws", "label": "default", "region": "us-east-1"}` |
| `DELETE /cloud-accounts/{id}` | Yes | Remove a connected account. 204, or 404 if not owned by caller |

**Plan shape:**
```json
{
  "id": "b7e1...",
  "request_text": "Create an S3 bucket for app logs",
  "summary": "Create an S3 bucket with versioning and encryption enabled.",
  "terraform_hcl": "resource \"aws_s3_bucket\" ...",
  "risk_level": "low",
  "estimated_monthly_cost_usd": "0.75",
  "status": "proposed",
  "created_at": "2026-07-16T10:00:00Z",
  "steps": [
    { "id": "...", "operation": "s3.create_bucket", "params_json": "{\"bucket_name\": \"...\"}", "status": "proposed" }
  ]
}
```

**Errors:** `401` auth failure, `404` missing/not-owned resource, `400`
invalid state transition, `429` rate limit, `422` validation error — all
as `{"detail": "..."}`.

Note: `/cloud-accounts` records that an account is *connected* for UI
purposes. The credentials Nimbus actually operates with come from the
backend's own environment (`AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`),
not from this table — real per-customer credential storage is a Phase 9
concern.

## Repo layout

```
backend/
  app/
    agent/         LangGraph planner, Gemini client, Terraform generator, operation catalog
    executor/      boto3 calls + Celery tasks
    routers/       auth, chat, plans, cloud-accounts, history
    models.py      SQLAlchemy models
    security.py    Clerk token verification
    main.py        FastAPI app, CORS, rate limiter, lifespan
  tests/
frontend/
  app/              Next.js routes (landing, sign-in, sign-up, dashboard, chat, history, accounts)
                    plus error.tsx / global-error.tsx boundaries
  components/       ChatPanel, PlanApprovalCard, NavBar, PipelineFlow, CommandPalette,
                    ToastProvider, ui/ primitives
  lib/              api.ts (client factory), useApi.ts (Clerk-bound hook)
  middleware.ts     Clerk route protection
docs/               Architecture, API, deployment, and scaling docs (this README consolidates them)
infra/terraform/    Reference Terraform module
.github/workflows/  CI
docker-compose.yml
```

## Running it locally

```bash
cp .env.example .env                          # backend: GOOGLE_API_KEY, CLERK_JWKS_URL, AWS creds
cp frontend/.env.example frontend/.env.local   # frontend: Clerk publishable/secret keys
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs

Sign up through Clerk's hosted UI, click "Connect AWS account" on the
dashboard, then try the chat page with something like *"Create an S3
bucket for app logs."* Without `GOOGLE_API_KEY` the planner raises a clear
error rather than failing silently; without a correct `CLERK_JWKS_URL`
every request 401s.

## Deployment

Five independently-deployable pieces — frontend, backend API, Celery
worker, Postgres, Redis — plus Clerk, already hosted. Every option below
is a managed platform with a free/cheap tier and a git-push deploy flow.

**Recommended stack (get a live URL for $0/month):**

| Piece | Platform |
|---|---|
| Frontend | **Vercel** — zero-config for this repo |
| Backend + worker | **Render** — Docker-native, has a real Background Worker type for Celery |
| Postgres | **Neon** — serverless, scales to zero |
| Redis | **Upstash** — serverless, pay-per-request |
| Auth | **Clerk** — already hosted |

Steps: create the Clerk app and grab its keys/JWKS URL → create a Neon
project and copy its pooled connection string as `DATABASE_URL` → create
an Upstash Redis database and copy its `rediss://` URL as `REDIS_URL` →
on Render, create a Web Service (backend, Docker, `backend/Dockerfile`)
and a Background Worker (same image, command
`celery -A app.celery_app.celery_app worker --loglevel=info`), both with
the same env vars → on Vercel, import the repo with root directory
`frontend`, set `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`,
`NEXT_PUBLIC_API_BASE` (the Render URL) → set `CORS_ORIGINS` on Render to
the Vercel URL → attach custom domains on both platforms once ready →
flip `DRY_RUN=false` after smoke-testing.

**Alternatives, if you want more control:**

| Need | Option | Trade-off |
|---|---|---|
| Already deep in AWS (true via OptiVault) | ECS/Fargate + RDS + ElastiCache | More setup, one cloud bill; the Dockerfiles work as-is as ECS task images |
| One dashboard for everything | Railway | Slightly pricier at scale than Neon/Upstash |
| Simpler PaaS | Fly.io or DigitalOcean App Platform | Similar Docker-native flow, different pricing shape |
| Full self-host | Any VPS + the provided `docker-compose.yml` | You own TLS, backups, updates |

`.github/workflows/ci.yml` runs backend tests and a frontend build on
every push/PR; Vercel and Render both deploy on push to `main` once
connected — nothing extra to wire up. Never commit `.env`/`.env.local` —
every value in the `.env.example` files should be a real secret in your
platform's dashboard, not baked into the repo or image.

## Scaling

**Already true of this codebase:** stateless API (no session store, any
instance can serve any request), decoupled execution (Celery workers scale
independently of the web process), indexed foreign keys, paginated list
endpoints, rate-limited LLM endpoint.

**The next three things worth doing, in order:**

1. **Move planning off the request path.** `POST /chat` currently blocks
   on a synchronous Gemini call. Fix: return immediately with a `planning`
   status, fill in the plan via a Celery task, have the frontend poll
   `GET /plans/{id}` until it resolves. No new infrastructure needed.
2. **Alembic migrations instead of `create_all()`.** Fine for one dev/demo
   deployment, unsafe once there's real data and schema changes. Standard
   `alembic init` + `revision --autogenerate` + run `alembic upgrade head`
   as a release step.
3. **Connection pooling at real concurrency.** If on Neon, use their
   pooled (`-pooler`) connection string rather than adding PgBouncer
   yourself.

**Further out:** cache repeated cost-estimate/catalog lookups in Redis
once real pricing-API calls get added (Phase 4); move to a real secrets
manager (AWS Secrets Manager/Vault) once customers connect their *own*
AWS accounts rather than sharing the backend's credentials (Phase 9);
add structured logging + an APM/error tracker (Sentry is the common
choice for FastAPI + Next.js) once there are users you don't personally
know are hitting errors; horizontal-scale Celery workers by just running
more replicas — no code change needed, since execution is already
queue-based.

## Troubleshooting

Real issues hit while building and testing this, kept here so they don't
get rediscovered the hard way:

- **Browser bounces through `*.accounts.dev` once, then loops forever
  instead of landing.** Clerk development instances sync cookies across
  domains via a `__clerk_db_jwt` URL handoff — one bounce is normal. A
  loop usually means the post-auth redirect target is a route your
  `middleware.ts` protects with `auth.protect()`, which runs server-side
  before the client has finished the handoff. Fix: redirect to `/` (public)
  after sign-in, not straight to `/dashboard` — that's what
  `fallbackRedirectUrl="/"` does in `frontend/app/sign-in/page.tsx`.
- **"You cannot define a route with the same specificity as an optional
  catch-all route."** Happens if both `sign-in/page.tsx` and a leftover
  `sign-in/[[...sign-in]]/` folder exist at once — usually from
  re-extracting a newer zip over an older project folder instead of
  starting from a clean extract. Delete the whole bracketed folder, not
  just the file inside it (PowerShell needs `Remove-Item -LiteralPath`
  since `[`/`]` are wildcard characters).
- **`AttributeError: 'PyJWKClient' object has no attribute
  'signing_key_from_jwt'`.** The correct PyJWT method is
  `get_signing_key_from_jwt`. Already fixed in `backend/app/security.py`.
- **Clean `401` on any authenticated endpoint.** Check, in order: (1) the
  actual response body's `detail` field (DevTools → Network → the failed
  request → Response) — it names the real reason; (2) `CLERK_JWKS_URL` in
  the root `.env` matches your Clerk app's JWKS URL exactly
  (Dashboard → Configure → API Keys → Show JWKS URL); (3)
  `frontend/.env.local`'s Clerk keys are from that *same* app, not a
  different one created while testing; (4) after editing any `.env` file,
  run `docker compose down` then `up --build` — a running container
  doesn't always pick up edited env values otherwise.
- **VS Code shows errors for files you already deleted.** Stale
  TypeScript server cache. Delete `frontend/.next`, then
  Ctrl+Shift+P → "TypeScript: Restart TS Server". This never blocks
  `docker compose` itself — Docker builds from disk, not the editor's cache.

## Security notes

- `DRY_RUN=true` by default — the executor builds and logs every AWS call
  without sending it until you deliberately flip this.
- Use a scoped IAM user for Nimbus, not an admin key: Phase 1 only needs
  `s3:CreateBucket`, `s3:PutBucketVersioning`,
  `s3:PutEncryptionConfiguration`, `s3:GetBucketLocation`.
- Clerk means the backend never handles a password.
- CORS is wide open (`*`) by default for local dev — `CORS_ORIGINS` should
  be set to your real frontend domain(s) in production.
- Never commit `.env`, `.env.local`, or `frontend/.env.local` — the
  `.gitignore` already excludes them.

## Nimbus AI and OptiVault

These are staying separate products by design — Nimbus isn't absorbing
OptiVault's cost-optimization work, even though Phase 4 of this roadmap
functionally overlaps with what OptiVault already does.