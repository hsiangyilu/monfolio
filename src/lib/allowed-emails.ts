export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowedEmails = process.env.ALLOWED_EMAILS;
  if (!allowedEmails || allowedEmails.trim() === "") return false;
  const allowed = allowedEmails.split(",").map((e) => e.trim().toLowerCase());
  return allowed.includes(email.toLowerCase());
}
