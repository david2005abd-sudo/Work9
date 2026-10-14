const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});
export async function onRequestGet({ env }) {
  const provider = (env.NADOS_PROVIDER || "openai-compatible").toLowerCase();
  return json({ ok: true, configured: Boolean(env.NADOS_API_KEY && env.NADOS_MODEL), provider, note: "This checks configuration presence only, not provider authentication." });
}
