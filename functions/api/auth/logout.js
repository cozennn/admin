// functions/api/auth/logout.js
export async function onRequestPost({ request, env }) {
  const json = (body, status = 200, headers = {}) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
        ...headers,
      },
    });

  const token = readCookie(request, "norda_session");
  if (token && env.DB) {
    try {
      const idHash = await sha256Hex(token);
      await env.DB.prepare("DELETE FROM sessions WHERE id_hash = ?").bind(idHash).run();
    } catch {}
  }

  const cookie = "norda_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0";
  return json({ ok: true }, 200, { "Set-Cookie": cookie });
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
