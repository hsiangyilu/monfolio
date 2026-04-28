/**
 * Environment validation. Runs once at module load.
 *
 * Hard requirement: DATABASE_URL — without it nothing works.
 * Soft requirements: warn but don't crash. The features that depend on these
 * (auth, OCR) check at the call site and surface a usable error.
 *
 * Why this matters: previously this file threw on missing NEXTAUTH_SECRET et al
 * at module load. That blew up *every* route that imported `@/lib/db` —
 * including holdings reads, which don't actually need auth secrets to load.
 * The result was a 500 storm that looked like "data was cleared". It wasn't.
 */

const isTest = process.env.NODE_ENV === "test";
const isBuild = process.env.NEXT_PHASE === "phase-production-build";

if (!isTest && !isBuild) {
  if (!process.env.DATABASE_URL) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }

  // Soft warnings — features that need these will fail loudly when invoked,
  // not when loading unrelated routes.
  const softRequired = [
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "GEMINI_API_KEY",
    "ANTHROPIC_API_KEY",
  ];
  const missing = softRequired.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.warn(
      `[env] Missing optional env vars: ${missing.join(", ")}. ` +
        `Features that depend on them will fail when invoked.`
    );
  }
}
