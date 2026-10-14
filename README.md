# NADOS AI — NVIDIA NIM + Cloudflare Pages

واجهة محادثة عربية RTL تعمل على Cloudflare Pages Functions، وتستخدم NVIDIA NIM عبر واجهة OpenAI-compatible. يتم جلب قائمة النماذج مباشرة من NVIDIA API Catalog بدلاً من الاعتماد على قائمة ثابتة.

## 1) أمان المفتاح أولاً

**المفتاح الذي أُرسل في المحادثة يجب إلغاؤه/تدويره وإنشاء مفتاح جديد.** لا تضع المفتاح في هذا المستودع أو في الواجهة.

من Cloudflare Dashboard:
1. افتح **Workers & Pages → مشروع NADOS → Settings → Variables and Secrets**.
2. أضف Secret بالاسم `NVIDIA_NIM_API_KEY` وضع المفتاح الجديد كقيمة.
3. اختياري: أضف `NVIDIA_NIM_MODEL` مع معرّف النموذج الافتراضي.
4. أعد نشر Pages إذا طلبت لوحة Cloudflare ذلك.

يقبل الخادم أيضاً `NADOS_API_KEY` كاسم توافق قديم، لكن يفضّل استخدام `NVIDIA_NIM_API_KEY`.

## 2) النشر

- Framework preset: **None**
- Build command: اتركه فارغاً
- Build output directory: `.`

المسارات:
- `index.html` — واجهة NADOS AI، مع قائمة اختيار نموذج.
- `functions/api/chat.js` — يرسل المحادثة إلى `https://integrate.api.nvidia.com/v1/chat/completions`.
- `functions/api/models.js` — يجلب النماذج من `https://integrate.api.nvidia.com/v1/models`.
- `functions/api/health.js` — يفحص وجود إعداد المفتاح فقط.
- `_headers` — ترويسات أمان أساسية.

## 3) الاختبار

بعد النشر:
1. افتح `/api/health` وتأكد أن `configured` تساوي `true`.
2. افتح `/api/models` وتأكد أن قائمة النماذج تظهر.
3. في واجهة NADOS AI اختر النموذج من القائمة وأرسل سؤالاً قصيراً.

تظهر النماذج التي ترجعها NVIDIA API لهذا المفتاح/الحساب. توفر النموذج وحدود الاستخدام قد يتغيران؛ ليس كل نموذج في الكتالوج متاحاً لكل حساب أو لكل وقت. إذا فشل نموذج، اختر نموذجاً آخر من القائمة.

## 4) حماية الاستخدام

هذا مشروع تجريبي؛ نقطة `/api/chat` عامة على الإنترنت ولا تحتوي على تسجيل دخول أو حدود استخدام خاصة بالمستخدم. قبل مشاركة الرابط مع الجمهور، فعّل Cloudflare Rate Limiting/WAF المناسب، وراقب استخدام NVIDIA، ولا تضع مفتاح API في المتصفح. وصول المستخدمين إلى نقطة المحادثة قد يستهلك الحصة المرتبطة بمفتاحك.

## حدود النسخة الحالية

هذه الحزمة لا تتضمن نموذج NADOS أصلياً مدرّباً، ولا تسجيل دخول، ولا تنفيذ مهام على الملفات أو أدوات وكيل. إنها واجهة محادثة مرتبطة بالنماذج المتاحة عبر NVIDIA NIM. استخدام NVIDIA Developer API المجاني مخصص للتجربة والتطوير وقد يخضع لحدود وسياسات NVIDIA؛ راجع الوثائق الرسمية قبل الاستخدام الإنتاجي.

مراجع:
- https://docs.api.nvidia.com/nim/reference/llm-apis
- https://docs.api.nvidia.com/nim/docs/api-quickstart
