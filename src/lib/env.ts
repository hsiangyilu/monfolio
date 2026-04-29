/**
 * Environment validation. Runs once at module load.
 *
 * Hard requirement: DATABASE_URL — without it nothing works.
 * Soft requirements: warn but don't crash. The features that depend on these
 * (OCR) check at the call site and surface a usable error.
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
