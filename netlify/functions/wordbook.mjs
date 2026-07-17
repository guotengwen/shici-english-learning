import { getStore } from "@netlify/blobs";
import { getUser } from "@netlify/identity";

function json(data, status = 200) {
  return Response.json(data, { status, headers: { "cache-control": "no-store" } });
}

export default async function handler(request) {
  const user = await getUser();
  if (!user) return json({ error: "Unauthorized" }, 401);

  const store = getStore("wordbooks");
  const key = `user-${user.id}`;

  if (request.method === "GET") {
    const saved = await store.get(key, { type: "json", consistency: "strong" });
    return json({ exists: saved !== null, words: Array.isArray(saved?.words) ? saved.words : [], updatedAt: saved?.updatedAt || null });
  }

  if (request.method === "PUT") {
    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.words) || body.words.length > 10000) return json({ error: "Invalid wordbook" }, 400);
    const payload = { words: body.words, updatedAt: Date.now() };
    await store.set(key, JSON.stringify(payload));
    return json({ saved: true, updatedAt: payload.updatedAt });
  }

  return json({ error: "Method Not Allowed" }, 405);
}
