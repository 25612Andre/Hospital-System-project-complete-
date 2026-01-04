import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "../pages/auth/LoginPage";
import ForgotPasswordPage from "../pages/auth/ForgotPasswordPage";
import ResetPasswordPage from "../pages/auth/ResetPasswordPage";
import TwoFactorPage from "../pages/auth/TwoFactorPage";
import SignupPage from "../pages/auth/SignupPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import PersonListPage from "../pages/persons/PersonListPage";
import PersonFormPage from "../pages/persons/PersonFormPage";
import PersonDetailPage from "../pages/persons/PersonDetailPage";
import LocationTreePage from "../pages/locations/LocationTreePage";
import UserListPage from "../pages/users/UserListPage";
import RoleListPage from "../pages/roles/RoleListPage";
import AppointmentListPage from "../pages/appointments/AppointmentListPage";
import BillListPage from "../pages/bills/BillListPage";
import DepartmentListPage from "../pages/departments/DepartmentListPage";
import DoctorListPage from "../pages/doctors/DoctorListPage";
import SearchResultsPage from "../pages/search/SearchResultsPage";
import ProfilePage from "../pages/profile/ProfilePage";
import NotificationsReportPage from "../pages/notifications/NotificationsReportPage";
import MainLayout from "../components/layout/MainLayout";
import { useAuth } from "../context/useAuth";
import RoleGuard from "../context/RoleGuard";

const allAuth = ["ADMIN", "DOCTOR", "PATIENT"];
const staffOnly = ["ADMIN", "DOCTOR"];
const adminOnly = ["ADMIN"];



const billsAuth = ["ADMIN", "PATIENT"];

const Protected: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token, requires2fa } = useAuth();

  if (requires2fa) {
    return <Navigate to="/2fa" replace />;
  }

  if (!token) {
    return <LoginPage />;
  }

  // In case token exists but user is not yet loaded, keep rendering protected area
  return <>{children}</>;
};

const AppRouter: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/2fa" element={<TwoFactorPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route
        path="/*"
        element={
          <Protected>
            <MainLayout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route
                  path="/patients"
                  element={
                    <RoleGuard allowed={staffOnly}>
                      <PersonListPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/PersonList"
                  element={
                    <RoleGuard allowed={staffOnly}>
                      <PersonListPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/patients/new"
                  element={
                    <RoleGuard allowed={staffOnly}>
                      <PersonFormPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/patients/:id/edit"
                  element={
                    <RoleGuard allowed={staffOnly}>
                      <PersonFormPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/patients/:id"
                  element={
                    <RoleGuard allowed={allAuth}>
                      <PersonDetailPage />
                    </RoleGuard>
                  }
                />

                <Route
                  path="/doctors"
                  element={
                    <RoleGuard allowed={allAuth}>
                      <DoctorListPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/appointments"
                  element={
                    <RoleGuard allowed={allAuth}>
                      <AppointmentListPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/bills"
                  element={
                    <RoleGuard allowed={billsAuth}>
                      <BillListPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/departments"
                  element={
                    <RoleGuard allowed={allAuth}>
                      <DepartmentListPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/locations"
                  element={
                    <RoleGuard allowed={allAuth}>
                      <LocationTreePage />
                    </RoleGuard>
                  }
                />
                <Route path="/search" element={<SearchResultsPage />} />

                <Route
                  path="/users"
                  element={
                    <RoleGuard allowed={adminOnly}>
                      <UserListPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/roles"
                  element={
                    <RoleGuard allowed={adminOnly}>
                      <RoleListPage />
                    </RoleGuard>
                  }
                />
                <Route
                  path="/notifications"
                  element={
                    <RoleGuard allowed={adminOnly}>
                      <NotificationsReportPage />
                    </RoleGuard>
                  }
                />
              </Routes>
            </MainLayout>
          </Protected>
        }
      />
    </Routes>
  </BrowserRouter>
);

export default AppRouter;
