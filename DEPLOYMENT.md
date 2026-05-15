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
  - `SPRING_MAIL_SMTP_STARTTLS_REQUIRED`
  - `APP_MAIL_FROM`
- Optional keep-alive vars (Render anti-sleep ping every 13 minutes):
  - `APP_KEEPALIVE_ENABLED=true`
  - `APP_KEEPALIVE_URL=https://<your-backend-domain>/api/health`
  - `APP_KEEPALIVE_INTERVAL_MS=780000`

After deploy, verify:

- `https://<your-backend-domain>/api/health`

### Gmail SMTP (recommended)

If you use Gmail for password reset and 2FA emails, set:

- `SPRING_MAIL_HOST=smtp.gmail.com`
- `SPRING_MAIL_PORT=587`
- `SPRING_MAIL_USERNAME=<your-gmail-address>`
- `SPRING_MAIL_PASSWORD=<gmail-app-password>`
- `SPRING_MAIL_SMTP_AUTH=true`
- `SPRING_MAIL_SMTP_STARTTLS=true`
- `SPRING_MAIL_SMTP_STARTTLS_REQUIRED=true`
- `APP_MAIL_FROM=<your-gmail-address>`

Important: `SPRING_MAIL_PASSWORD` must be a Google App Password (16 chars), not your normal Gmail password.

## 1.1 Keep backend warm on Render (13 min)

To reduce idle sleep risk on Render, enable backend self-ping:

- `APP_KEEPALIVE_ENABLED=true`
- `APP_KEEPALIVE_URL=https://<your-backend-domain>/api/health`
- `APP_KEEPALIVE_INTERVAL_MS=780000` (13 minutes)

This triggers a health request every 13 minutes from the running service.

Optional external keep-alive (recommended): create a Render Cron Job using `render-keepalive-cron.yaml` and set:

- `BACKEND_HEALTH_URL=https://<your-backend-domain>/api/health`

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
