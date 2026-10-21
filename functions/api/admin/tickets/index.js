// Authenticated admin endpoint: tickets
export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (!auth.ok) return json({ ok: false, error: auth.error }, auth.status);
  if (!env.DB) return json({ ok: false, error: "missing_db_binding" }, 503);
  try {
    const result = await env.DB.prepare(
      "SELECT id, user_name, status, created_at FROM tickets ORDER BY created_at DESC"
    ).all();
    const messageCount = await env.DB.prepare("SELECT COUNT(*) AS count FROM messages").first();
    return json({ ok: true, tickets: result.results || [], message_count: Number(messageCount?.count || 0) });
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