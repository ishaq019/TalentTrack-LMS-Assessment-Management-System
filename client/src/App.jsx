// client/src/App.jsx
import React, { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AuthProvider, useAuth } from "./state/auth.jsx";

import AuthLayout from "./ui/layouts/AuthLayout.jsx";
import AppLayout from "./ui/layouts/AppLayout.jsx";
import AdminLayout from "./ui/layouts/AdminLayout.jsx";

import LoginPage from "./pages/auth/LoginPage.jsx";
import SignupPage from "./pages/auth/SignupPage.jsx";
import VerifyOtpPage from "./pages/auth/VerifyOtpPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.jsx";

import UserDashboard from "./pages/user/UserDashboard.jsx";
import UserAssignments from "./pages/user/UserAssignments.jsx";
import UserPractice from "./pages/user/UserPractice.jsx";
import UserResults from "./pages/user/UserResults.jsx";
import UserReports from "./pages/user/UserReports.jsx";
import TakeAssignment from "./pages/user/TakeAssignment.jsx";

import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminTests from "./pages/admin/AdminTests.jsx";
import AdminAssignments from "./pages/admin/AdminAssignments.jsx";
import AdminSubmissions from "./pages/admin/AdminSubmissions.jsx";

function RequireAuth({ children }) {
  const { isReady, isAuthed } = useAuth();
  if (!isReady) return null;
  if (!isAuthed) return <Navigate to="/login" replace />;
  return children;
}

function RequireRole({ role, children }) {
  const { isReady, isAuthed, user } = useAuth();
  if (!isReady) return null;
  if (!isAuthed) return <Navigate to="/login" replace />;
  if ((user?.role || "user") !== role) return <Navigate to="/dashboard" replace />;
  return children;
}

function RootRedirect() {
  const { isReady, isAuthed, user } = useAuth();
  if (!isReady) return null;
  if (!isAuthed) return <Navigate to="/login" replace />;
  return user?.role === "admin" ? (
    <Navigate to="/admin" replace />
  ) : (
    <Navigate to="/dashboard" replace />
  );
}

function AppRoutes() {
  const { bootstrap } = useAuth();

  // Load tokens + /me on first load
  useEffect(() => {
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />

      {/* ---------- Auth ---------- */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* ---------- User ---------- */}
      <Route
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route path="/dashboard" element={<UserDashboard />} />
        <Route path="/assignments" element={<UserAssignments />} />
        <Route path="/practice" element={<UserPractice />} />
        <Route path="/results" element={<UserResults />} />
        <Route path="/reports" element={<UserReports />} />
        <Route path="/take/:assignmentId" element={<TakeAssignment />} />
      </Route>

      {/* ---------- Admin ---------- */}
      <Route
        element={
          <RequireRole role="admin">
            <AdminLayout />
          </RequireRole>
        }
      >
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/tests" element={<AdminTests />} />
        <Route path="/admin/assignments" element={<AdminAssignments />} />
        <Route path="/admin/submissions" element={<AdminSubmissions />} />
      </Route>

      {/* ---------- Fallback ---------- */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
