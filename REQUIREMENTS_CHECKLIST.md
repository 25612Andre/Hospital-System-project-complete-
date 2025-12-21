# Requirements Checklist

## MIDTERM

| Requirement | Status | Implementation Reference | How to Demo |
|-------------|--------|--------------------------|-------------|
| Spring Boot + PostgreSQL + Flyway schema management | DONE | `pom.xml` (PostgreSQL + Flyway deps), `src/main/resources/application-postgres.properties`, `db/migration/V1__init_schema.sql` | Run `mvn clean package` – Flyway creates schema, connect to `hospital_db`. |
| Core entities (User, Patient, Doctor, Appointment, Department) with CRUD controllers/services/repositories | DONE | `model/*`, `repository/*`, `service/*`, `controller/*` | Use Swagger or REST client to hit `/api/{patients,doctors,departments,appointments,bills}` endpoints. |
| Location hierarchy (Province → Village) with browse endpoints and validation | DONE | `Location.java`, `LocationService`, `LocationController`, `LocationImportService` | Call `/api/locations/type/PROVINCE`, `/api/locations/province/code/RW-KGL`. |
| Location seeding / import | DONE | `config/DemoDataInitializer`, optional importer `config/LocationJsonImporter` | Startup seeds sample Kigali + Musanze tree; set `app.location.import-on-startup=true` to ingest full JSON. |
| Relationships: One-to-one (UserAccount ↔ Patient/Doctor), One-to-many (Department → Doctors), Many-to-many (Patient ↔ Doctor) | DONE | `UserAccount.java`, `Department.java`, `Patient.java` | Fetch `/api/doctors/page` or `/api/users/search` to see linked entities. |
| Derived queries, exists checks, pagination, and custom query | DONE | `PatientRepository` (`existsByEmail...`, `filterPatients`), `UserAccountRepository`, `LocationRepository.searchHierarchy` | `/api/patients/page?page=0&size=5`, `/api/patients/filter?email=...`. |
| Rwandan location navigation and user-by-province APIs | DONE | `LocationController`, `UserAccountController#byProvince` | `/api/locations/province/name/Kigali`, `/api/users/by-province?code=RW-KGL`. |
| Security with roles and JWT | DONE | `config/SecurityConfig`, `security/JwtService`, `auth/controller/AuthController` | Login via `/api/auth/login`, hit protected endpoint with `Authorization: Bearer`. |
| Column search & pagination for patients | DONE | `/api/patients/filter` + front-end `PersonListPage.tsx` filter grid | On Patients page, fill column filters and watch backend query. |
| Dashboard summary endpoint | DONE | `DashboardService`, `DashboardController`, `DashboardSummaryDTO` | GET `/api/dashboard/summary` or open Dashboard page. |
| Global search endpoint | DONE | `SearchService`, `SearchController`, `SearchResultDTO` | Call `/api/search?q=mia` or use TopBar search. |

## FINAL

| Requirement | Status | Implementation Reference | How to Demo |
|-------------|--------|--------------------------|-------------|
| Minimum 5 pages (Dashboard, Patients, Doctors, Appointments, Departments, Locations) with reusable layout components | DONE | `frontend/src/pages/*`, layout components `Sidebar.tsx`, `TopBar.tsx`, `Footer.tsx`, shared `AppButton/AppTable/Pagination` | Run `npm run dev`, login, navigate via sidebar. |
| Frontend pagination tied to Spring data & column search inputs | DONE | `AppTable` + `Pagination`, patient filters in `PersonListPage.tsx`, React Query requests hitting `/page` + `/filter` endpoints | Change page via table footer or set filters; watch query params update. |
| Global search bar | DONE | `components/layout/TopBar.tsx`, backend `/api/search` | Use top-right search input; user is redirected to `/search` results fed by API. |
| Password reset via email | DONE | `/api/auth/forgot-password`, `/api/auth/reset-password`, DTO `PasswordResetRequest`, `MailService` | Call forgot/reset endpoints; token logged/sent via SMTP catcher. |
| Two-factor authentication (email OTP, optional per user) | DONE | `AuthController`, `TwoFactorAuthService`, `UserAccount.twoFactorEnabled`, `TwoFactorSetupRequest/Response`, UI `TwoFactorPage.tsx` | Login as `alice@hospital.rw`, read OTP from MailHog/log or set `app.auth.return-2fa-code=true`, submit on `/2fa`. |
| Role-based UI (hide admin-only sections) | DONE | `frontend/src/context/RoleGuard.tsx`, `Sidebar` role arrays, `AppRouter` guards | Login as `mia@hospital.rw` (PATIENT) to see limited menu vs `admin`. |
| Dashboard KPIs incl. today appointments, completed visits, departments, revenue | DONE | `DashboardSummaryDTO`, `DashboardService`, `DashboardPage.tsx` | Load dashboard page; new cards show metrics. |
| Location browser page | DONE | `frontend/src/pages/locations/LocationTreePage.tsx` calling `/api/locations/*` endpoints | Navigate to Locations and expand nodes. |
| Column search + pagination for key tables (patients, doctors, appointments) | DONE | Patient filters + search inputs, doctors/appointments have search + pagination controls tied to backend via React Query | Observe network calls to `/api/.../page` when paginating. |
| Global search backend + UI | DONE | `/api/search`, `SearchResultsPage.tsx` | Use layout search bar. |
| Tests (repository + controller) | DONE | `PatientRepositoryTest`, `PatientControllerTest` | `mvn test`. |
| Documentation (how to run & checklist) | DONE | `RUNNING.md`, `REQUIREMENTS_CHECKLIST.md` | Read these docs. |

**Demo data**: `DemoDataInitializer` wires realistic departments, doctors, patients, appointments, bills, and users so the UI is not empty during presentations.
