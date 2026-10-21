// functions/api/auth/me.js
export async function onRequestGet({ request, env }) {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
    });

  if (!env.DB) return json({ ok: false, error: "missing_db_binding" }, 503);

  const token = readCookie(request, "norda_session");
  if (!token) return json({ ok: false, error: "no_session" }, 401);

  const idHash = await sha256Hex(token);
  const row = await env.DB
    .prepare(
      `SELECT s.admin_id, s.expires_at, u.username
       FROM sessions s JOIN admin_users u ON u.id = s.admin_id
       WHERE s.id_hash = ?`
    )
    .bind(idHash)
    .first();

  if (!row) return json({ ok: false, error: "invalid_session" }, 401);
  if (new Date(row.expires_at).getTime() < Date.now()) {
    await env.DB.prepare("DELETE FROM sessions WHERE id_hash = ?").bind(idHash).run();
    return json({ ok: false, error: "expired" }, 401);
  }

  return json({ ok: true, admin_id: row.admin_id, username: row.username, expires_at: row.expires_at });
}

function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return null;
}

async function sha256Hex(str) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
