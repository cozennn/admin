// Authenticated, read-only ticket message endpoint
export async function onRequestGet({ request, env, params }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);
  if (!env.DB) return json({ ok: false, error: "missing_db_binding" }, 503);
  const id = String(params?.id ?? "").trim();
  if (!id || !/^\d+$/.test(id)) return json({ ok: false, error: "invalid_ticket_id" }, 400);
  try {
    const ticket = await env.DB.prepare("SELECT id FROM tickets WHERE id = ?").bind(id).first();
    if (!ticket) return json({ ok: false, error: "ticket_not_found" }, 404);
    const result = await env.DB.prepare(
      "SELECT * FROM messages WHERE ticket_id = ? ORDER BY created_at ASC"
    ).bind(id).all();
    return json({ ok: true, messages: result.results || [] });
  } catch (error) {
    return json({ ok: false, error: "database_error" }, 500);
  }
}
async function requireAdmin(request, env) {
  if (!env.DB) return { ok: false, status: 503, error: "missing_db_binding" };
  const token = readCookie(request, "norda_session");
  if (!token) return { ok: false, status: 401, error: "no_session" };
  const idHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    "SELECT s.admin_id, s.expires_at FROM sessions s JOIN admin_users u ON u.id = s.admin_id WHERE s.id_hash = ?"
  ).bind(idHash).first();
  if (!row) return { ok: false, status: 401, error: "invalid_session" };
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE id_hash = ?").bind(idHash).run();
    return { ok: false, status: 401, error: "expired" };
  }
  return { ok: true };
}
function readCookie(request, name) {
  for (const part of (request.headers.get("Cookie") || "").split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=") || null;
  }
  return null;
}
async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } });
}