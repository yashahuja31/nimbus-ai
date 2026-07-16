# API Reference

Base URL: `http://localhost:8000` locally, or wherever you deploy the
backend (see `docs/DEPLOYMENT.md`). Interactive docs are also always
available at `/docs` (Swagger UI) and `/redoc`.

## Auth

Every endpoint except `/health` requires a Clerk session token:

```
Authorization: Bearer <clerk session token>
```

The frontend attaches this automatically (`lib/useApi.ts`). To call the API
directly (e.g. from a script), grab a token from Clerk's `getToken()` in a
signed-in browser session, or use Clerk's backend SDK to mint one for
testing.

A missing or invalid token returns `401`.

---

### `GET /health`

No auth required. Liveness check for load balancers / uptime monitors.

```json
{ "status": "ok", "service": "nimbus-ai-backend" }
```

---

### `GET /auth/me`

Returns the backend's synced view of the current user. First call for a
new Clerk identity provisions the local `User` row.

```json
{ "id": "6f2e...", "email": "you@example.com" }
```

---

### `POST /chat`

Rate limited (`CHAT_RATE_LIMIT`, default `10/minute` per client) — this is
the endpoint that spends LLM tokens.

**Request**
```json
{ "message": "Create an S3 bucket for app logs" }
```

**Response** — a `Plan` (see shape below), `status: "proposed"`. Nothing
executes yet.

---

### `GET /plans?limit=50&offset=0`

Paginated list of the caller's plans, newest first. `limit` max 200
(`MAX_PAGE_SIZE`).

### `GET /plans/{plan_id}`

Single plan, 404 if it doesn't belong to the caller.

### `POST /plans/{plan_id}/approve`

Moves the plan to `executing` and enqueues one Celery task per step. 400 if
the plan isn't currently `proposed`.

### `POST /plans/{plan_id}/reject`

Moves the plan (and its steps) to `rejected`. 400 if not `proposed`.

**Plan shape**, returned by all four endpoints above:
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

---

### `GET /history?limit=50&offset=0`

Paginated execution log, newest first, scoped to the caller's plans.

```json
[
  { "id": "...", "plan_id": "...", "step_id": "...", "level": "success",
    "message": "created bucket 'my-app-logs'", "created_at": "2026-07-16T10:01:03Z" }
]
```

---

### `GET /cloud-accounts` / `POST /cloud-accounts`

Records that a provider account is connected. Body for `POST`:
```json
{ "provider": "aws", "label": "default", "region": "us-east-1" }
```

Note: this endpoint records *that* an account is connected for UI purposes.
The credentials Nimbus actually operates with come from the backend's own
environment (`AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`), not from this
table — per-customer credential storage is a Phase 9 (enterprise) concern,
noted in the root README's roadmap section.

## Errors

Standard FastAPI/Pydantic error shape:
```json
{ "detail": "Plan not found" }
```
`401` for auth failures, `404` for missing/not-owned resources, `400` for
invalid state transitions (e.g. approving an already-approved plan), `429`
for rate-limit hits, `422` for request-body validation errors.
