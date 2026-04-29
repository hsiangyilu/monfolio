import { describe, it, expect, vi } from "vitest"
import { NextRequest } from "next/server"

// Mock env validation so missing env vars don't throw in tests
vi.mock("@/lib/env", () => ({}))

const { GET, POST } = await import("@/app/api/holdings/route")
const { PUT, DELETE } = await import("@/app/api/holdings/[id]/route")

function makeRequest(method: string, body?: unknown): NextRequest {
  return new NextRequest("http://localhost/api/holdings", {
    method,
    headers: { "Content-Type": "application/json" },
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

describe("GET /api/holdings", () => {
  it("returns grouped holdings", async () => {
    const res = await GET()
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data).toHaveProperty("tw_stock")
    expect(data).toHaveProperty("us_stock")
    expect(data).toHaveProperty("crypto")
    expect(data).toHaveProperty("cash")
  })
})

describe("POST /api/holdings", () => {
  it("creates a holding", async () => {
    const req = makeRequest("POST", {
      category: "cash",
      symbol: "TWD",
      name: "台幣現金",
      quantity: 100000,
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const data = await res.json()
    expect(data.symbol).toBe("TWD")
    expect(data.quantity).toBe(100000)
  })

  it("returns 400 for missing required fields", async () => {
    const req = makeRequest("POST", { category: "cash" })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe("PUT /api/holdings/[id]", () => {
  it("updates a holding", async () => {
    // First create one
    const createReq = makeRequest("POST", {
      category: "cash",
      symbol: "USD_TEST",
      name: "USD Test",
      quantity: 5000,
    })
    const createRes = await POST(createReq)
    const created = await createRes.json()

    const req = makeRequest("PUT", { quantity: 9999 })
    const params = Promise.resolve({ id: created.id })
    const res = await PUT(req, { params })
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(data.quantity).toBe(9999)
  })

  it("returns 404 for non-existent holding", async () => {
    const req = makeRequest("PUT", { quantity: 1 })
    const params = Promise.resolve({ id: "nonexistent-id" })
    const res = await PUT(req, { params })
    expect(res.status).toBe(404)
  })
})

describe("DELETE /api/holdings/[id]", () => {
  it("deletes a holding and returns 404 on next attempt", async () => {
    // Create a holding to delete
    const createReq = makeRequest("POST", {
      category: "cash",
      symbol: "DELETE_ME",
      name: "To Delete",
      quantity: 1,
    })
    const createRes = await POST(createReq)
    const created = await createRes.json()

    // Delete it
    const deleteReq = new NextRequest(`http://localhost/api/holdings/${created.id}`, { method: "DELETE" })
    const params = Promise.resolve({ id: created.id })
    const delRes = await DELETE(deleteReq, { params })
    expect(delRes.status).toBe(204)

    // Second delete should return 404
    const delRes2 = await DELETE(deleteReq, { params })
    expect(delRes2.status).toBe(404)
  })
})
