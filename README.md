# NADOS AI — Cloudflare Pages starter

واجهة عربية RTL لمساعد NADOS AI، مع Cloudflare Pages Functions للاتصال الآمن بمزود API. لا يتطلب Frontend build أو npm.

## نشر المشروع
1. في Cloudflare Dashboard افتح **Workers & Pages → Create → Pages → Connect to Git** واختر هذا المستودع.
2. اختر Framework preset: **None**، واترك Build command فارغاً، واجعل Build output directory هو `.`.
3. بعد النشر، أضف المتغيرات في إعدادات Cloudflare Pages:
   - `NADOS_PROVIDER` = `openai-compatible` أو `gemini`
   - `NADOS_MODEL` = اسم نموذج متاح لحسابك
   - `NADOS_API_KEY` = مفتاح المزود كـ **Secret**
   - `NADOS_API_BASE` = اختياري؛ عنوان API الأساسي للمزود
4. أعد النشر واختبر `/api/health` ثم أرسل رسالة فعلية من الواجهة.

## ملفات المشروع
- `index.html` — واجهة عربية RTL متجاوبة.
- `functions/api/chat.js` — API خلفي للاتصال بمزود OpenAI-compatible أو Gemini.
- `functions/api/health.js` — فحص وجود الإعدادات.
- `_headers` — ترويسات أمان أساسية.

## حدود النسخة الحالية
لا تتضمن هذه الحزمة نموذج Nados أصلياً أو بحثاً حقيقياً أو تسجيل دخول أو مزامنة سحابية أو تنفيذ مهام/كود. وضع Demo لا يستدعي نموذجاً حقيقياً.

**مهم:** لا تضع `NADOS_API_KEY` في ملفات المشروع أو GitHub. خزّنه كـ Secret في Cloudflare فقط. طلبات API قد تستهلك رصيداً لدى المزود؛ راقب حدود الإنفاق.
