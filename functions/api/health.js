const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
});
export async function onRequestGet({ env }) {
  const keyConfigured = Boolean(env.NVIDIA_NIM_API_KEY || env.NADOS_API_KEY);
  return json({ ok: true, configured: keyConfigured, provider: "nvidia-nim", modelConfigured: Boolean(env.NVIDIA_NIM_MODEL || env.NADOS_MODEL), note: "Checks configuration presence only, not whether the key works." });
}
