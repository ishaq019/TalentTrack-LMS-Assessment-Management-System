// client/src/utils/guards.js
export function isAdmin(user) {
  return (user?.role || "user") === "admin";
}

export function isAuthed(user) {
  return !!user;
}
