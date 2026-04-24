import { describe, it, expect, vi } from "vitest"
import { NextRequest } from "next/server"

// Mock auth to return a valid session for all tests
vi.mock("@/lib/auth", () => ({
  auth: vi.fn().mockResolvedValue({ user: { email: "test@example.com" } }),
}))

// Mock env validation so missing env vars don't throw in tests
vi.mock("@/lib/env", () => ({}))

const { GET, PUT } = await import("@/app/api/debt/route")
const { DELETE } = await import("@/app/api/debt/[id]/route")

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest("http://localhost/api/debt", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

describe("GET /api/debt", () => {
  it("returns debts array", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })
})

describe("PUT /api/debt", () => {
  it("creates a debt when no id provided", async () => {
    const req = makeRequest("PUT", {
      name: "房貸",
      principalTotal: 5000000,
      remainingBalance: 4000000,
    })
    const res = await PUT(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.name).toBe("房貸")
    expect(data.remainingBalance).toBe(4000000)
  })

  it("updates a debt when id provided", async () => {
    // First create
    const createReq = makeRequest("PUT", {
      name: "車貸",
      principalTotal: 500000,
      remainingBalance: 300000,
    })
    const createRes = await PUT(createReq)
    const created = await createRes.json()

    // Now update
    const updateReq = makeRequest("PUT", {
      id: created.id,
      remainingBalance: 250000,
    })
    const updateRes = await PUT(updateReq)
    expect(updateRes.status).toBe(200)
    const updated = await updateRes.json()
    expect(updated.remainingBalance).toBe(250000)
  })

  it("returns 400 for missing required fields on create", async () => {
    const req = makeRequest("PUT", { name: "bad debt" })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })
})

describe("DELETE /api/debt/[id]", () => {
  it("returns 204 on successful delete, then 404 on second delete", async () => {
    // Create a debt to delete
    const createReq = makeRequest("PUT", {
      name: "Delete Me",
      principalTotal: 100000,
      remainingBalance: 100000,
    })
    const createRes = await PUT(createReq)
    const created = await createRes.json()

    // Delete it
    const deleteReq = new NextRequest(`http://localhost/api/debt/${created.id}`, { method: "DELETE" })
    const params = Promise.resolve({ id: created.id })
    const delRes = await DELETE(deleteReq, { params })
    expect(delRes.status).toBe(204)

    // Second delete should return 404
    const delRes2 = await DELETE(deleteReq, { params })
    expect(delRes2.status).toBe(404)
  })
})
