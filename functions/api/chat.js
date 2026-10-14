const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});
const allowedRoles = new Set(["user", "assistant", "system"]);

export async function onRequestPost({ request, env }) {
  if (!env.NADOS_API_KEY) return json({ error: "خادم NADOS غير مهيأ: أضف NADOS_API_KEY إلى Secrets في Cloudflare Pages." }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "صيغة JSON غير صحيحة." }, 400); }
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 40) {
    return json({ error: "يجب إرسال مصفوفة رسائل من 1 إلى 40 رسالة." }, 400);
  }
  const messages = [];
  let totalChars = 0;
  for (const item of body.messages) {
    if (!item || !allowedRoles.has(item.role) || typeof item.content !== "string") return json({ error: "صيغة رسالة غير صالحة." }, 400);
    const content = item.content.trim();
    if (!content) continue;
    totalChars += content.length;
    messages.push({ role: item.role, content });
  }
  if (!messages.length) return json({ error: "الرسائل فارغة." }, 400);
  if (totalChars > 60000) return json({ error: "حجم المحادثة أكبر من الحد المسموح (60,000 حرف)." }, 413);
  const provider = (env.NADOS_PROVIDER || "openai-compatible").toLowerCase();
  const model = env.NADOS_MODEL || (provider === "gemini" ? "gemini-2.5-flash" : "gpt-4o-mini");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  try {
    let upstream, payload;
    if (provider === "gemini") {
      const base = (env.NADOS_API_BASE || "https://generativelanguage.googleapis.com/v1beta").replace(/\/$/, "");
      const contents = messages.filter(m => m.role !== "system").map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      }));
      const systemText = messages.filter(m => m.role === "system").map(m => m.content).join("\n\n");
      payload = { contents, generationConfig: { temperature: 0.7, maxOutputTokens: 4096 } };
      if (systemText) payload.systemInstruction = { parts: [{ text: systemText }] };
      upstream = await fetch(`${base}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(env.NADOS_API_KEY)}`, {
        method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), signal: controller.signal,
      });
    } else if (provider === "openai-compatible") {
      const base = (env.NADOS_API_BASE || "https://api.openai.com/v1").replace(/\/$/, "");
      payload = { model, messages, temperature: 0.7, max_tokens: 4096 };
      upstream = await fetch(`${base}/chat/completions`, {
        method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${env.NADOS_API_KEY}` },
        body: JSON.stringify(payload), signal: controller.signal,
      });
    } else {
      return json({ error: "قيمة NADOS_PROVIDER غير مدعومة. استخدم openai-compatible أو gemini." }, 500);
    }
    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = {}; }
    if (!upstream.ok) {
      return json({ error: `فشل مزود الذكاء الاصطناعي (HTTP ${upstream.status}). تحقق من اسم النموذج والمفتاح وإعدادات المزود.` }, 502);
    }
    let text;
    if (provider === "gemini") text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || "").join("\n").trim();
    else text = data.choices?.[0]?.message?.content;
    if (typeof text !== "string" || !text.trim()) return json({ error: "أعاد المزود استجابة لا تحتوي على نص. قد يكون الرد محجوباً أو تنسيق المزود مختلفاً." }, 502);
    return json({ text: text.trim(), model, provider });
  } catch (error) {
    const message = error?.name === "AbortError" ? "انتهت مهلة الطلب إلى المزود (55 ثانية)." : "تعذر الوصول إلى مزود الذكاء الاصطناعي. تحقق من عنوان API واتصال المزود.";
    return json({ error: message }, 502);
  } finally {
    clearTimeout(timeout);
  }
}
