const isTest = process.env.NODE_ENV === "test"
const isBuild = process.env.NEXT_PHASE === "phase-production-build"

if (!isTest && !isBuild) {
  const required = [
    "DATABASE_URL",
    "NEXTAUTH_SECRET",
    "NEXTAUTH_URL",
    "GEMINI_API_KEY",
    "ANTHROPIC_API_KEY",
  ]
  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required environment variable: ${key}`)
    }
  }
}
