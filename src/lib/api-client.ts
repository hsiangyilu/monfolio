/**
 * Thin fetch wrapper. Normalizes errors so callers always throw an Error
 * with a useful message, and centralizes 401 handling.
 *
 * Usage:
 *   const holding = await api<Holding>("/api/holdings/123", {
 *     method: "PUT",
 *     json: { quantity: 10 },
 *   });
 */

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiInit extends Omit<RequestInit, "body"> {
  /** Auto-stringified, sets Content-Type: application/json. */
  json?: unknown;
}

export async function api<T = unknown>(
  url: string,
  init: ApiInit = {}
): Promise<T> {
  const { json, headers, ...rest } = init;

  const finalInit: RequestInit = {
    ...rest,
    headers: {
      ...(json !== undefined && { "Content-Type": "application/json" }),
      ...headers,
    },
    ...(json !== undefined && { body: JSON.stringify(json) }),
  };

  let res: Response;
  try {
    res = await fetch(url, finalInit);
  } catch (e) {
    // Network / CORS / abort
    throw new ApiError(
      e instanceof Error ? e.message : "Network request failed",
      0
    );
  }

  if (res.status === 401) {
    // Soft redirect — login flow handles the rest
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    let body: unknown = undefined;
    let message = `HTTP ${res.status}`;
    try {
      body = await res.json();
      if (
        body &&
        typeof body === "object" &&
        "error" in body &&
        typeof (body as { error: unknown }).error === "string"
      ) {
        message = (body as { error: string }).error;
      }
    } catch {
      try {
        const text = await res.text();
        if (text) message = text;
      } catch {
        // ignore
      }
    }
    throw new ApiError(message, res.status, body);
  }

  if (res.status === 204) return undefined as T;

  // Some endpoints (e.g. snapshots POST in fire-and-forget mode) may return empty
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
