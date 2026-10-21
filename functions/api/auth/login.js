// functions/api/auth/login.js
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

  if (!env.DB) return json({ ok: false, error: "missing_db_binding" }, 503);

  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "invalid_json" }, 400);
  }

  const username = String(data.username || "").trim();
  const password = String(data.password || "");
  if (!username || !password) {
    return json({ ok: false, error: "missing_fields" }, 400);
  }

  const user = await env.DB
    .prepare("SELECT id, username, password_hash FROM admin_users WHERE username = ?")
    .bind(username)
    .first();

  if (!user) {
    await timingSafeDelay();
    return json({ ok: false, error: "invalid_credentials" }, 401);
  }

  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    await timingSafeDelay();
    return json({ ok: false, error: "invalid_credentials" }, 401);
  }

  const rawToken = crypto.getRandomValues(new Uint8Array(32));
  const token = b64url(rawToken);
  const idHash = await sha256Hex(token);
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString();

  await env.DB
    .prepare("INSERT INTO sessions (id_hash, admin_id, expires_at) VALUES (?, ?, ?)")
    .bind(idHash, user.id, expiresAt)
    .run();

  const cookie = [
    `norda_session=${token}`,
    "Path=/",
    "HttpOnly",
    "Secure",
    "SameSite=Strict",
    `Max-Age=${60 * 60 * 24 * 7}`,
  ].join("; ");

  return json(
    { ok: true, username: user.username, admin_id: user.id, expires_at: expiresAt },
    200,
    { "Set-Cookie": cookie }
  );
}

async function verifyPassword(password, stored) {
  try {
    const parts = String(stored).split("$");
    if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
    const iterations = parseInt(parts[1], 10);
    const salt = b64decode(parts[2]);
    const expected = b64decode(parts[3]);
    const enc = new TextEncoder();
    const baseKey = await crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    const bits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations, hash: "SHA-256" },
      baseKey,
      expected.length * 8
    );
    const actual = new Uint8Array(bits);
    if (actual.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < actual.length; i++) diff |= actual[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
}

async function sha256Hex(str) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(str));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function b64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64url(bytes) {
  return b64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64decode(str) {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function timingSafeDelay() {
  await new Promise((r) => setTimeout(r, 100 + Math.random() * 50));
}
