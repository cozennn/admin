// functions/api/auth/seed.js
// يُنشئ أول حساب إداري مرة واحدة فقط.
// بعد النجاح، يمكن حذف هذا الملف أو تعطيله.

export async function onRequestPost({ request, env }) {
  const json = (body, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });

  // 1. التحقق من الأسرار
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD) {
    return json({ ok: false, error: "missing_secrets" }, 503);
  }
  if (!env.DB) {
    return json({ ok: false, error: "missing_db_binding" }, 503);
  }

  // 2. منع إعادة الإنشاء إذا وُجد أي حساب
  const existing = await env.DB
    .prepare("SELECT COUNT(*) AS n FROM admin_users")
    .first();
  if (existing && existing.n > 0) {
    return json({ ok: false, error: "already_initialized" }, 409);
  }

  // 3. اشتقاق hash من كلمة المرور باستخدام PBKDF2
  const passwordHash = await hashPassword(env.ADMIN_PASSWORD);

  // 4. إدخال الحساب
  const username = String(env.ADMIN_USERNAME).trim();
  const result = await env.DB
    .prepare(
      "INSERT INTO admin_users (username, password_hash) VALUES (?, ?)"
    )
    .bind(username, passwordHash)
    .run();

  if (!result.success) {
    return json({ ok: false, error: "insert_failed" }, 500);
  }

  return json({ ok: true, username, admin_id: result.meta.last_row_id });
}

// PBKDF2-SHA256، 100,000 دورة، 32 بايت، salt عشوائي 16 بايت
async function hashPassword(password) {
  const enc = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    256
  );
  const hashBytes = new Uint8Array(bits);
  // الصيغة المخزّنة: pbkdf2$100000$<salt_b64>$<hash_b64>
  return `pbkdf2$100000$${b64(salt)}$${b64(hashBytes)}`;
}

function b64(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}
