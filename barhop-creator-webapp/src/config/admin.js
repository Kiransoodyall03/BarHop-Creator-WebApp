// Accounts allowed into the /admin console. Mirrors ADMIN_EMAILS in
// functions/index.js — this copy only gates the client route for UX; the
// Cloud Functions enforce the real check server-side, so editing this list
// alone grants no data access.
export const ADMIN_EMAILS = ['kiransoodyall03@gmail.com'];

export function isAdmin(user) {
  return Boolean(user && user.email && ADMIN_EMAILS.includes(user.email));
}
