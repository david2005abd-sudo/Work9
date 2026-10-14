const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});
const allowedRoles = new Set(["user", "assistant", "system"]);
const MODEL_RE = /^[a-zA-Z0-9][a-zA-Z0-9._/-]{1,180}$/;

export async function onRequestPost({ request, env }) {
  const apiKey = env.NVIDIA_NIM_API_KEY || env.NADOS_API_KEY;
  if (!apiKey) return json({ error: "أضف NVIDIA_NIM_API_KEY كـ Secret في إعدادات Cloudflare Pages." }, 503);
  let body;
  try { body = await request.json(); } catch { return json({ error: "صيغة JSON غير صحيحة." }, 400); }
  if (!Array.isArray(body.messages) || body.messages.length < 1 || body.messages.length > 40)
    return json({ error: "يجب إرسال مصفوفة رسائل من 1 إلى 40 رسالة." }, 400);
  const messages = [];
  let totalChars = 0;
  for (const item of body.messages) {
    if (!item || !allowedRoles.has(item.role) || typeof item.content !== "string")
      return json({ error: "صيغة رسالة غير صالحة." }, 400);
    const content = item.content.trim();
    if (!content) continue;
    totalChars += content.length;
    messages.push({ role: item.role, content });
  }
  if (!messages.length) return json({ error: "الرسائل فارغة." }, 400);
  if (totalChars > 60000) return json({ error: "حجم المحادثة أكبر من الحد المسموح (60,000 حرف)." }, 413);
  const requestedModel = typeof body.model === "string" ? body.model.trim() : "";
  const model = requestedModel || env.NVIDIA_NIM_MODEL || env.NADOS_MODEL || "deepseek-ai/deepseek-v4.1-flash";
  if (!MODEL_RE.test(model)) return json({ error: "معرّف النموذج غير صالح." }, 400);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 55000);
  try {
    const upstream = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages, temperature: 0.6, max_tokens: 4096, stream: false }),
      signal: controller.signal,
    });
    const raw = await upstream.text();
    let data;
    try { data = JSON.parse(raw); } catch { data = {}; }
    if (!upstream.ok) {
      const detail = upstream.status === 401 || upstream.status === 403
        ? "مفتاح NVIDIA غير صالح أو لا يملك صلاحية الوصول."
        : upstream.status === 429 ? "وصلت إلى حد الطلبات أو الحصة المتاحة في NVIDIA NIM."
        : `رفض NVIDIA NIM الطلب (HTTP ${upstream.status}). تحقق من توفر النموذج لحسابك.`;
      return json({ error: detail }, upstream.status === 429 ? 429 : 502);
    }
    const answer = data.choices?.[0]?.message?.content;
    if (typeof answer !== "string" || !answer.trim())
      return json({ error: "لم يُرجع النموذج نصاً. جرّب نموذجاً آخر من القائمة." }, 502);
    return json({ text: answer.trim(), model, provider: "nvidia-nim" });
  } catch (error) {
    return json({ error: error?.name === "AbortError" ? "انتهت مهلة الطلب إلى NVIDIA NIM (55 ثانية)." : "تعذر الاتصال بـ NVIDIA NIM. حاول مرة أخرى لاحقاً." }, 502);
  } finally { clearTimeout(timeout); }
}
