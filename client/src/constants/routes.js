// client/src/constants/routes.js
export const ROUTES = {
  // Public
  ROOT: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  VERIFY_OTP: "/verify-otp",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",

  // User
  DASHBOARD: "/dashboard",
  ASSIGNMENTS: "/assignments",
  PRACTICE: "/practice",
  RESULTS: "/results",
  REPORTS: "/reports",
  TAKE: (assignmentId = ":assignmentId") => `/take/${assignmentId}`,

  // Admin
  ADMIN_HOME: "/admin",
  ADMIN_TESTS: "/admin/tests",
  ADMIN_ASSIGN: "/admin/assignments",
  ADMIN_SUBMISSIONS: "/admin/submissions"
};
