// Re-export from the canonical lib/api.ts to avoid duplication.
// This file exists so feature module consumers can import from @/features/auth
// while the single source of truth stays in lib/api.ts.
export {
  fetchMe,
  loginRequest,
  logoutRequest,
  requestEarlyAccess,
  verifyInvite,
  completeSignup,
  bootstrapFirstAdmin,
  fetchBootstrapInfo,
  type SafeUser,
} from "@/lib/api";
