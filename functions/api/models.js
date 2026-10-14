const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});
export async function onRequestGet({ env }) {
  const apiKey = env.NVIDIA_NIM_API_KEY || env.NADOS_API_KEY;
  if (!apiKey) return json({ error: "أضف NVIDIA_NIM_API_KEY كـ Secret في إعدادات Cloudflare Pages." }, 503);
  try {
    const response = await fetch("https://integrate.api.nvidia.com/v1/models", {
      headers: { authorization: `Bearer ${apiKey}`, accept: "application/json" },
    });
    if (!response.ok) return json({ error: response.status === 401 || response.status === 403 ? "مفتاح NVIDIA غير صالح أو غير مخوّل." : `تعذر جلب قائمة النماذج (HTTP ${response.status}).` }, response.status === 429 ? 429 : 502);
    const data = await response.json();
    const models = (Array.isArray(data.data) ? data.data : [])
      .map(item => ({ id: item.id, name: item.id }))
      .filter(item => typeof item.id === "string" && item.id.length < 200)
      .sort((a,b) => a.id.localeCompare(b.id));
    return json({ models, count: models.length, provider: "nvidia-nim" });
  } catch {
    return json({ error: "تعذر الاتصال بخدمة قائمة نماذج NVIDIA." }, 502);
  }
}
