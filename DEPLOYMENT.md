# Deployment Guide (Backend + Frontend)

This project is split into:
- Backend: Spring Boot API in the repo root.
- Frontend: Vite/React app in `frontend/` (already deployed on Vercel).

## 1. Deploy Backend

Use any host that supports Docker (Render, Railway, Fly.io, etc.).

- Build source: this repository root.
- Dockerfile: `./Dockerfile`
- Health check path: `/api/health`
- Runtime: container port from `$PORT` (already handled).

Set these backend environment variables:

- `SPRING_PROFILES_ACTIVE=postgres`
- `JWT_SECRET=<long-random-secret>`
- `SPRING_DATASOURCE_URL=<jdbc:postgresql://...>`
- `SPRING_DATASOURCE_USERNAME=<db-user>`
- `SPRING_DATASOURCE_PASSWORD=<db-password>`
- `SPRING_DATASOURCE_DRIVER_CLASS_NAME=org.postgresql.Driver`
- `APP_CORS_ALLOWED_ORIGINS=https://hospitalsystem-ten.vercel.app`
- Optional mail vars:
  - `SPRING_MAIL_HOST`
  - `SPRING_MAIL_PORT`
  - `SPRING_MAIL_USERNAME`
  - `SPRING_MAIL_PASSWORD`
  - `SPRING_MAIL_SMTP_AUTH`
  - `SPRING_MAIL_SMTP_STARTTLS`

After deploy, verify:

- `https://<your-backend-domain>/api/health`

## 2. Link Frontend to Backend (Vercel)

From repo root:

```bash
cd frontend
vercel env add VITE_API_BASE_URL production
```

When prompted, enter:

```text
https://<your-backend-domain>
```

Then redeploy frontend from repo root (because Vercel root directory is `frontend`):

```bash
cd ..
vercel --prod --yes
```

## 3. Update Backend CORS If Domain Changes

If your frontend URL changes, update backend env:

```text
APP_CORS_ALLOWED_ORIGINS=https://<new-frontend-domain>
```

Then redeploy backend.
