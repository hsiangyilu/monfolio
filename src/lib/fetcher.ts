export async function fetcher(url: string) {
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err.error ?? `HTTP ${res.status}`), { status: res.status });
  }
  return res.json();
}
