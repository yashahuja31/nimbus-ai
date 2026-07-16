# Nimbus AI — Your AI Cloud Engineer

Phase 1 MVP: chat with an AI agent about your AWS account, get back a
reviewable plan (steps + generated Terraform + risk + cost estimate), and
nothing touches your AWS account until you click **Approve**.

Full documentation lives in [`docs/`](docs/):

- [**Architecture**](docs/ARCHITECTURE.md) — system design, request
  lifecycle, why approval isn't inside the AI graph
- [**API Reference**](docs/API.md) — every endpoint, request/response
  shapes, auth
- [**Deployment**](docs/DEPLOYMENT.md) — recommended platforms and
  step-by-step instructions to get this live on the internet, plus
  alternatives if you want more control
- [**Scaling**](docs/SCALING.md) — what's already built to scale, and the
  next three things worth doing as usage grows

## What's actually working here

- **Auth via Clerk** — email/password and OAuth (Google/GitHub, or
  whatever you enable in the Clerk dashboard) are fully handled by Clerk's
  hosted components; the backend only verifies the session token
  (`backend/app/security.py`), it never touches a password.
- **Planner**: a LangGraph graph (`backend/app/agent/graph.py`) that takes
  a plain-English request, calls Gemini for a structured plan restricted
  to a fixed catalog of safe operations, generates matching Terraform, and
  scores risk + estimated monthly cost.
- **Approval gate**: enforced structurally, not by prompting — the
  executor only ever runs from `POST /plans/{id}/approve`, a
  human-initiated request.
- **Executor**: real boto3 calls for the three Phase-1 operations (create
  S3 bucket, enable versioning, enable encryption), gated behind a
  `DRY_RUN` flag that defaults to `true`.
- **Async execution**: Celery + Redis run approved steps as background
  tasks and write an audit trail (`ExecutionLog`) that rolls up into a
  verified plan summary.
- **Rate limiting & pagination**: `/chat` (the only endpoint that spends
  LLM tokens) is rate-limited; `/plans` and `/history` are paginated.
  Foreign keys used in filters are indexed. Details in
  [`docs/SCALING.md`](docs/SCALING.md).
- **Frontend**: Next.js/TypeScript/Tailwind + Clerk, a signature animated
  pipeline visualization on the landing page, plan-approval cards with a
  Terraform preview, dashboard, execution history — all wired to the real
  API, no mock data.
- **Postgres models, Docker Compose, GitHub Actions CI**: all present and
  functional.

I built and ran this end-to-end in a sandbox (backend test suite, a full
Clerk-token → chat → plan → list flow, and `next build`) before handing it
to you — see "What I verified" below for exactly what that covered.

## What's intentionally out of scope for this pass

The original roadmap is a real 12-month, multi-person-team plan —
deployment automation, diagnostics, cost optimization, security scanning,
the multi-agent system, Kubernetes, multi-cloud, and enterprise features
aren't in this codebase yet. The architecture (catalog-driven operations,
plan/approve/execute, Celery task queue) is built to grow into those
rather than be rewritten for them — e.g. adding an operation is one entry
in `agent/tools.py` plus one handler in `executor/`.

## Running it locally

```bash
cp .env.example .env                          # backend: fill in GOOGLE_API_KEY, CLERK_JWKS_URL, AWS creds
cp frontend/.env.example frontend/.env.local   # frontend: fill in Clerk publishable/secret keys
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend docs: http://localhost:8000/docs

Sign up through Clerk's hosted UI, click "Connect AWS account" on the
dashboard, then try the chat page with something like *"Create an S3
bucket for app logs."*

Without a `GOOGLE_API_KEY` the planner will raise a clear error rather than
fail silently; without `CLERK_JWKS_URL` set correctly every request will
401 — everything else (routing, dashboard shell, history) still renders.

## Deploying it for real users

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the full walkthrough —
short version: Vercel (frontend) + Render (backend + worker) + Neon
(Postgres) + Upstash (Redis) + Clerk (auth) gets you a live product for
$0/month on free tiers, or see that doc's alternatives table for AWS
ECS/Fargate, Fly.io, Railway, or self-hosting.

## What I verified before handing this over

- Backend: `pytest` passes; a full Clerk-token-verified `/auth/me` →
  `/chat` (mocked LLM) → paginated `/plans` → paginated `/history` →
  `/cloud-accounts` flow runs clean against a real SQLite DB; unauthenticated
  requests correctly get `401`; the LangGraph graph compiles and its
  terraform/cost helpers produce correct output.
- Frontend: `next build` compiles and type-checks all seven routes
  (including the Clerk middleware and sign-in/sign-up catch-all routes)
  with no errors.
- **Not verified** (needs real credentials I don't have here): an actual
  Clerk instance, an actual Gemini API call, an actual AWS API call, and
  the Celery worker against a live Redis broker. The code paths are
  written and reviewed, but smoke-test them yourself on first run — the
  step-by-step for that is a few messages back in this conversation, or
  just repeat the flow described in "Running it locally" above.

## Nimbus AI and OptiVault

These are staying separate products by design — Nimbus isn't absorbing
OptiVault's cost-optimization work.

## Repo layout

```
backend/    FastAPI + Celery + LangGraph agent + boto3 executor
frontend/   Next.js chat UI, dashboard, history (Clerk auth)
docs/       Architecture, API reference, deployment, scaling
infra/      Reference Terraform module
.github/    CI workflow
```
