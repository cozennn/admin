/* Cloudflare Pages Function: send contact form submissions as ordinary Telegram messages.
   Configure BOT_TOKEN and CHAT_ID as Pages secrets/environment variables. */
export async function onRequestPost({ request, env }) {
  const json = (body, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
  });

  if (!env.BOT_TOKEN || !env.CHAT_ID) return json({ ok: false }, 503);

  let data;
  try { data = await request.json(); } catch { return json({ ok: false }, 400); }

  // Honeypot: silently accept automated spam without forwarding it.
  if (typeof data.website === "string" && data.website.trim()) return json({ ok: true });
  const name = String(data.name || "").trim().slice(0, 80);
  const email = String(data.email || "").trim().slice(0, 120);
  const subject = String(data.subject || "").trim().slice(0, 120);
  const country = String(data.country || "").trim().slice(0, 80);
  const address = String(data.address || "").trim().slice(0, 180);
  const message = String(data.message || "").trim().slice(0, 1500);
  if (!name || !email || !subject || !message || data.privacyConsent !== true) return json({ ok: false }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ ok: false }, 400);

  const text = [
    "📩 رسالة تواصل جديدة | NORDA", "",
    "الاسم: " + name,
    "البريد الإلكتروني: " + email,
    "الموضوع: " + subject,
    "البلد: " + (country || "غير محدد"),
    "العنوان: " + (address || "غير محدد"), "",
    "الرسالة:", message, "",
    "موافقة سياسة الخصوصية: نعم"
  ].join("\n");

  try {
    const telegramResponse = await fetch("https://api.telegram.org/bot" + env.BOT_TOKEN + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: env.CHAT_ID, text })
    });
    const result = await telegramResponse.json();
    if (!telegramResponse.ok || !result.ok) return json({ ok: false }, 502);
    return json({ ok: true });
  } catch { return json({ ok: false }, 502); }
}
