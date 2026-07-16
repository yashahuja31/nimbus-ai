# Scaling

## Already true of this codebase

- **Stateless API.** Auth is a Clerk token verified per-request against a
  JWKS endpoint — no server-side session store. Any number of backend
  instances can serve any request; there's no sticky-session requirement.
- **Decoupled execution.** Approving a plan enqueues Celery tasks; it
  doesn't run AWS calls inline on the request. The web process and the
  work it triggers scale independently — add worker replicas without
  touching the API, or vice versa.
- **Indexed foreign keys.** `owner_id` on `plans`/`cloud_accounts`,
  `plan_id`/`step_id` on `execution_logs` are all indexed
  (`backend/app/models.py`) — the queries the app actually makes (list my
  plans, list my history) hit an index, not a sequential scan, regardless
  of table size.
- **Paginated list endpoints.** `/plans` and `/history` take bounded
  `limit`/`offset` (`DEFAULT_PAGE_SIZE=50`, `MAX_PAGE_SIZE=200`) instead of
  returning an ever-growing unbounded array.
- **Rate-limited LLM endpoint.** `/chat` is the one call that costs real
  Gemini tokens; it's capped per-client (`CHAT_RATE_LIMIT`, default
  10/min) so a runaway client or bug can't silently run up your AI bill.

## The next three things worth doing, in order

### 1. Move planning off the request path

Right now `POST /chat` blocks on a synchronous Gemini call — fine for an
MVP, but it means one slow LLM response ties up a web worker for its
duration, and there's no retry if Gemini hiccups. The fix follows the same
pattern already used for execution:

- `POST /chat` creates a `Plan` row with a new `planning` status and
  returns immediately with just the id.
- A Celery task runs `run_planner(...)` and fills in the plan's fields,
  flipping status to `proposed` (or `failed` on error, with a retry).
- The frontend polls `GET /plans/{id}` (it already has this endpoint) until
  status leaves `planning`, or upgrades to a WebSocket/SSE push later.

This is a schema change (`PlanStatus.planning`) plus moving the body of
`app/routers/chat.py` into a Celery task — no new infrastructure needed,
since Celery/Redis are already in place.

### 2. Migrations instead of `create_all`

`app/main.py` calls `Base.metadata.create_all()` on startup, which is fine
for a single dev/demo deployment but can't express schema changes safely
once you have real data. Add Alembic:

```bash
pip install alembic
alembic init backend/alembic
alembic revision --autogenerate -m "initial schema"
```

Run `alembic upgrade head` as a release step in whichever platform you
deploy to (Render supports a pre-deploy command), and remove the
`create_all()` call.

### 3. Connection pooling for Postgres at real concurrency

SQLAlchemy's default pool is fine at MVP traffic. If you're on Neon, use
their pooled connection string (the `-pooler` hostname — see
`docs/DEPLOYMENT.md`) rather than adding PgBouncer yourself; it does the
same job without another service to run.

## Further out (not urgent, but worth knowing the shape of)

- **Caching.** The cost-estimate table and operation catalog in
  `app/agent/tools.py` are static and cheap today; if Phase 4-style real
  Cost Explorer lookups get added later, cache those in Redis (already a
  dependency) rather than calling AWS pricing APIs per request.
- **Secrets manager.** AWS credentials currently come from the backend's
  own environment — one set of credentials for the whole deployment. Real
  per-customer credentials (each user connects *their own* AWS account)
  need a secrets manager (AWS Secrets Manager, or Vault) rather than env
  vars or plaintext DB columns — this is explicitly a Phase 9 (enterprise)
  concern in the root README, not something to bolt on casually.
- **Observability.** Structured logging (the Celery tasks already write an
  audit trail to `ExecutionLog`, but that's app-level, not
  infra-level) plus an APM/error tracker (Sentry is the common choice for
  a FastAPI + Next.js stack) becomes worth it once you have users you
  don't personally know are hitting errors.
- **Horizontal worker scaling.** Because execution is already
  Celery-based, this is just "run more worker replicas" on Render/ECS/
  wherever — no code change. Do this before vertically upsizing a single
  worker if execution throughput becomes the bottleneck.
