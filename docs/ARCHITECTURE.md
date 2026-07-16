# Architecture

## System overview

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

Every box above is a real, running piece of this codebase — this isn't an
aspirational diagram. What's aspirational is everything *around* this
diagram (multi-cloud, multi-agent, Kubernetes) — see the repo root
README's "What's intentionally out of scope" section for the honest line
between what's built and what's roadmap.

## Request lifecycle

1. **Sign-in.** The frontend never talks to the backend for auth — Clerk's
   hosted components handle sign-up/sign-in entirely client-side and issue
   a short-lived session token.
2. **Chat.** `POST /chat` verifies that token (see "Auth" below), calls the
   LangGraph planner synchronously, and writes a `Plan` + its `PlanStep`s to
   Postgres with status `proposed`. This call is rate-limited
   (`CHAT_RATE_LIMIT`, default 10/min) since it's the one endpoint that
   costs real LLM tokens per request.
3. **Review.** The frontend renders the plan, its generated Terraform, risk
   level, and cost estimate. Nothing has touched AWS yet.
4. **Approve.** `POST /plans/{id}/approve` flips the plan to `executing` and
   enqueues one Celery task per step — this is the one line in the system
   that turns "the AI wants to do X" into "X is happening," and it only
   exists because a human hit a button.
5. **Execute.** Each Celery task calls the matching `boto3` function in
   `app/executor`. With `DRY_RUN=true` (the default) the call is built and
   logged but never sent to AWS.
6. **Verify.** Once every step for a plan resolves, the task rolls the
   plan's status up (`completed` or `failed`) and writes a summary
   `ExecutionLog` line. The frontend's history page reads this trail.

## The planner (`backend/app/agent/`)

- `tools.py` — the Phase-1 operation catalog. This is the actual safety
  boundary: the LLM is instructed to only ever choose from this list, and
  the planner discards anything else server-side (`unsupported` in
  `graph.py`). Growing the product means growing this catalog plus a
  matching executor function — the plan/approve/execute machinery doesn't
  change.
- `graph.py` — a LangGraph `StateGraph` with three nodes: `plan` (calls
  Gemini with structured output), `terraform` (deterministic HCL
  generation), `risk_and_cost` (deterministic scoring). Approval and
  execution are deliberately *outside* the graph and live in the API/Celery
  layer instead — see "Why approval isn't a graph node" below.
- `terraform_gen.py` — turns the operation list into human-reviewable HCL.
  Not wired to a real `terraform apply` in this MVP (see
  `infra/terraform/modules/s3_bucket` for the module it's meant to
  graduate into).
- `llm.py` — the only file that imports a provider SDK. Swapping Gemini for
  another LangChain-compatible chat model is a one-function change here.

### Why approval isn't a graph node

LangGraph supports human-in-the-loop interrupts, and an earlier design put
approval inside the graph. It moved out on purpose: enforcing "never
execute without approval" as a property of the *API* (the executor only
ever runs from a POST hit by a real browser session) is a stronger
guarantee than enforcing it as a property of *prompted agent behavior*. A
bug in the graph can't accidentally skip a REST call that was never made
in the first place.

## Auth (`backend/app/security.py`)

Clerk owns identity end to end — sign-up, sign-in, password resets, social
login, session rotation. The backend never sees a password. Its only job:

1. Pull the `Authorization: Bearer <token>` header.
2. Verify the token's signature against Clerk's JWKS endpoint
   (`CLERK_JWKS_URL`), using `PyJWKClient` so key rotation is handled
   automatically.
3. Read the `sub` claim (Clerk's stable user id) and find-or-create a local
   `User` row keyed on it. `email` is synced opportunistically if your
   Clerk JWT template includes it — nothing depends on it being present.

This means the backend is fully stateless with respect to auth: any
instance can verify any request with no shared session store, which is
what makes horizontal scaling of the API trivial (see `docs/SCALING.md`).

## Data model (`backend/app/models.py`)

| Table | Purpose | Key relationships |
|---|---|---|
| `users` | One row per Clerk identity | — |
| `cloud_accounts` | Records that a customer has connected a provider | `owner_id → users` |
| `plans` | One row per chat request | `owner_id → users` |
| `plan_steps` | One row per operation in a plan | `plan_id → plans` |
| `execution_logs` | Audit trail of everything the executor did | `plan_id → plans`, `step_id → plan_steps` |

All foreign-key columns used in query filters (`owner_id`, `plan_id`,
`step_id`) are indexed — see `docs/SCALING.md` for why that matters and
what else scaling further would need.

## Frontend (`frontend/`)

Next.js 14 App Router, Clerk for auth (`middleware.ts` protects
`/dashboard`, `/chat`, `/history`), Tailwind for styling, framer-motion for
the handful of deliberate motion moments (the landing-page pipeline
animation, plan-card entrance). `lib/api.ts` exports a client *factory*
(`createNimbusApi(getToken)`) rather than a singleton, because each request
needs a fresh Clerk session token — `lib/useApi.ts` binds that factory to
the current session inside client components.
