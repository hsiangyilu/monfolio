import { describe, it, expect, vi, afterEach } from "vitest"
import { fetcher } from "@/lib/fetcher"

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("fetcher", () => {
  it("returns parsed JSON on 200 OK", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ value: 42 }),
    }))
    const data = await fetcher("/api/test")
    expect(data).toEqual({ value: 42 })
  })

  it("throws with status and error message on non-2xx response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: "Unauthorized" }),
    }))
    await expect(fetcher("/api/test")).rejects.toMatchObject({
      message: "Unauthorized",
      status: 401,
    })
  })

  it("falls back to HTTP {status} message when error body is not JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.reject(new SyntaxError("not json")),
    }))
    await expect(fetcher("/api/test")).rejects.toMatchObject({
      message: "HTTP 500",
      status: 500,
    })
  })
})
