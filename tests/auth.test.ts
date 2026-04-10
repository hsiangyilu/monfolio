import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { isEmailAllowed } from "@/lib/allowed-emails";

describe("isEmailAllowed", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("returns true for an allowed email", () => {
    process.env.ALLOWED_EMAILS = "user@gmail.com,admin@gmail.com";
    expect(isEmailAllowed("user@gmail.com")).toBe(true);
  });

  it("returns true for an allowed email (case-insensitive)", () => {
    process.env.ALLOWED_EMAILS = "User@Gmail.com";
    expect(isEmailAllowed("user@gmail.com")).toBe(true);
  });

  it("returns false for a disallowed email", () => {
    process.env.ALLOWED_EMAILS = "user@gmail.com";
    expect(isEmailAllowed("hacker@evil.com")).toBe(false);
  });

  it("returns false when ALLOWED_EMAILS is missing (fail-closed)", () => {
    delete process.env.ALLOWED_EMAILS;
    expect(isEmailAllowed("user@gmail.com")).toBe(false);
  });

  it("returns false when ALLOWED_EMAILS is empty string (fail-closed)", () => {
    process.env.ALLOWED_EMAILS = "";
    expect(isEmailAllowed("user@gmail.com")).toBe(false);
  });

  it("returns false when ALLOWED_EMAILS is whitespace only (fail-closed)", () => {
    process.env.ALLOWED_EMAILS = "   ";
    expect(isEmailAllowed("user@gmail.com")).toBe(false);
  });

  it("returns false for null email", () => {
    process.env.ALLOWED_EMAILS = "user@gmail.com";
    expect(isEmailAllowed(null)).toBe(false);
  });

  it("returns false for undefined email", () => {
    process.env.ALLOWED_EMAILS = "user@gmail.com";
    expect(isEmailAllowed(undefined)).toBe(false);
  });

  it("handles whitespace around emails in allowlist", () => {
    process.env.ALLOWED_EMAILS = "  user@gmail.com , admin@gmail.com  ";
    expect(isEmailAllowed("user@gmail.com")).toBe(true);
    expect(isEmailAllowed("admin@gmail.com")).toBe(true);
  });
});
