# RUNNING THE HOSPITAL MANAGEMENT STACK

## 1. Prerequisites

- **Java 21+** (project tested against Temurin 24.0.1, but compiled for 21)
- **Apache Maven 3.9+**
- **Node.js 20+ / npm 10+**
- **PostgreSQL 14+** reachable on `localhost`
- **Optional**: [MailHog](https://github.com/mailhog/MailHog) or any SMTP catcher listening on `localhost:1025` for viewing password reset / OTP emails.

## 2. Database & configuration

1. Create the database:
   ```sql
   CREATE DATABASE hospital_db;
   ```
2. Update `src/main/resources/application-postgres.properties` if your Postgres host, port, username, or password differ.
3. Optional toggles:
   - `app.demo-data.enabled=true|false` – seed demo doctors/patients on startup.
   - `app.location.import-on-startup=true` – import the bundled Rwanda hierarchy JSON via `LocationImportService`. Disabled by default to keep startup fast.
   - `app.auth.enforce-2fa=true` – force OTP for every login. By default only users with `twoFactorEnabled` require OTP.
   - `app.auth.return-2fa-code=true` – return the OTP in `/auth/login` responses for local testing so you do not need MailHog.

Flyway automatically bootstraps the schema from `src/main/resources/db/migration/V1__init_schema.sql` on first run.

## 3. Backend

```bash
# from repo root
mvn clean package
java -jar target/hospitalmanagement-0.0.1-SNAPSHOT.jar \
  --spring.profiles.active=postgres
```

- Runs on **http://localhost:8899** by default (see `server.port`).
- Default seeded accounts (password `password` unless noted):
  - `admin@hospital.rw` (ROLE_ADMIN, 2FA disabled)
  - `alice@hospital.rw` (ROLE_DOCTOR, 2FA enabled → check email/logs)
  - `reception@hospital.rw` (ROLE_RECEPTIONIST)
  - `mia@hospital.rw` (ROLE_PATIENT, 2FA enabled)
- OTP/password reset emails are sent via the configured `JavaMailSender`. Without SMTP the `MailService` logs a warning and prints the body so you can copy the code manually.
- Run tests with `mvn test` (repository + controller coverage included).

## 4. Frontend (Vite + React + Tailwind)

```bash
cd frontend
npm install
# development server with hot reload
npm run dev
# build production assets
npm run build
```

Environment:

- Copy `.env.example` (if present) or set `VITE_API_BASE_URL=http://localhost:8899/api`.
- Vite dev server defaults to http://localhost:5173 and proxies API calls to the backend origin derived from `VITE_API_BASE_URL`.

## 5. Feature walkthrough

| Feature | Where | Notes |
|---------|-------|-------|
| Auth + JWT + 2FA | `/api/auth/*`, frontend `src/pages/auth/*` | Login returns JWT, OTP emailed/logged. Toggle OTP per user via `/api/auth/2fa/setup`. |
| Password reset | `/api/auth/forgot-password`, `/api/auth/reset-password` | Uses temporary tokens with expiry. |
| Role-based API security | `SecurityConfig.java` | ADMIN/DOCTOR/PATIENT/RECEPTIONIST enforced per endpoint. |
| Location hierarchy & search | `LocationController`, front page `/locations` | Browse/filter provinces → villages, import via JSON when needed. |
| CRUD Modules (Patients, Doctors, Departments, Appointments, Bills) | `/api/*` controllers + React pages | Each list supports pagination + column filters (patients) or search. |
| Dashboard metrics | `/api/dashboard/summary`, `DashboardPage.tsx` | Returns totals, today's appointments, completed counts, revenue, etc. |
| Global search | `/api/search?q=...`, `TopBar` + `SearchResultsPage` | Looks across patients/doctors/departments/locations/appointments/bills. |
| Tests | `PatientRepositoryTest`, `PatientControllerTest` | Run with `mvn test`. |

When running demos:

1. Start backend (profile `postgres`).
2. Verify Flyway created tables and `DemoDataInitializer` seeded base data (check logs).
3. Start frontend (`npm run dev`) and browse `http://localhost:5173`.
4. Login as `admin@hospital.rw`. For OTP-required users, grab the code from MailHog or enable `app.auth.return-2fa-code=true`.

Happy hacking!
