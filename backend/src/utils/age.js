// Shared utility for calculating age from date of birth.
// Used by both registration.routes.js and admin.routes.js (registration-requests).

export function calculateAge(dob) {
  const diff = Date.now() - new Date(dob).getTime();
  return Math.floor(diff / (365.25 * 24 * 60 * 60 * 1000));
}
