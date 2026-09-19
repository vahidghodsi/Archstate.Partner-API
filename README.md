# Partner API consumer

Independent Next.js app that talks to the read-only partner JSON API from the **browser**.

Pairing:

- this UI: `http://localhost:3000`
- partner API: `http://localhost:8080`

The key identifies one profile. There is no Firebase Auth, App Check, or `profile_id` query.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The partner API must already be listening on port 8080.

Optional env (defaults match the partner brief):

```bash
NEXT_PUBLIC_PARTNER_API_BASE=http://localhost:8080
NEXT_PUBLIC_PARTNER_API_KEY=556d5b14d66cfc8b52672ceea0c58e0965c1751bcc6739169638ea2e1e558f60
```

## How this client calls the API

Every GET:

```
Authorization: Bearer <key>
```

The browser sends `Origin: http://localhost:3000`. CORS is hostname `localhost`. Preflight is `OPTIONS` with **no** key. Allowed request headers: `Authorization`, `Content-Type`. Methods: `GET`, `OPTIONS`.

Fetches are client-side on purpose. A Next.js server fetch would not send that Origin and would not exercise CORS.

### Endpoints

1. `GET /api/partner/v1/profile`  
   No query, no profile id. The key selects the profile.

2. `GET /api/partner/v1/project/{projectId}`  
   `{projectId}` comes from `data.projects[].id`. Singular `project`.

Success: HTTP 200 `{ "data": { ... } }`.  
Errors: `{ "code", "message", "status" }`

- 401 `INVALID_PARTNER_API_KEY`
- 403 `PARTNER_ORIGIN_NOT_ALLOWED`
- 404 `PROJECT_NOT_FOUND`

This app does **not** call `/api/public/*` or member `/api/project*`. Asset `url` / `thumbnail_url` values are used as-is (Firebase Storage download URLs). They are not proxied.

Sanity check: profile GET → pick one `projects[].id` → project GET → `data.groups` is an array (possibly empty).

## What the UI does

On load it runs the two GETs, renders the profile and the first public project, and keeps a request log. The Tests tab runs extra cases (missing key, wrong key, unknown project id, success envelope, OPTIONS without a key).

If `localhost:8080` is down, the page shows that error and can preview layout with a clearly labeled sample payload. Sample data is local only.

## Optional mock API

This repo can stand in for the partner API while the other app is offline. It implements the same two GETs, error codes, and CORS hostname rule.

```bash
npm run mock-api
```

Default CORS matches the brief (`Origin` hostname must be `localhost`). For a preview host that is not localhost:

```bash
PARTNER_ALLOW_ALL_ORIGINS=1 npm run mock-api
```

Do not run the mock on the same machine as the real partner API — both use port 8080.

## Scripts

```bash
npm run dev      # port 3000
npm run build
npm run start    # port 3000
npm run lint
```
