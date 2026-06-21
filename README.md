# مِسبار — نشر مجاني بالكامل (GitHub + Netlify + Groq)

موقع لاستخراج النص من الصور (OCR محلي مجاني) وتلخيصه/ترتيبه بالذكاء الاصطناعي
عبر **Groq** (مجاني، سريع جدًا، بدون بطاقة دفع).

---

## كيف يعمل

```
الزائر  →  الموقع (ثابت، على Netlify)  →  /api/ai (دالة Netlify الخادمة)  →  Groq (بالمفتاح السري)
```

مفتاح Groq يبقى محفوظًا فقط داخل إعدادات Netlify، ولا يظهر أبدًا في كود الموقع أو على GitHub.

---

## الخطوات (10 دقائق تقريبًا)

### 1) احصل على مفتاح Groq مجانًا
- console.groq.com → سجّل دخول (بريد إلكتروني فقط)
- API Keys → Create API Key → احتفظ به

### 2) ارفع المشروع على GitHub
- أنشئ مستودع (Repository) فاضي جديد
- ارفع كل ملفات هذا المجلد:
```bash
git init
git add .
git commit -m "أول نسخة من مِسبار"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```
⚠️ ملف `.env` مستثنى تلقائيًا — لا ترفعه يدويًا أبدًا.

### 3) اربط المستودع بـ Netlify
- netlify.com → سجّل دخول بحساب GitHub
- "Add new site" → "Import an existing project" → اختر المستودع
- Netlify يكتشف `netlify.toml` تلقائيًا (مجلد النشر `public`، والدوال في `netlify/functions`) — لا تحتاج تغيير أي إعداد

### 4) أضف مفتاح Groq كمتغيّر بيئة
- Site configuration → Environment variables → Add a variable
- الاسم: `GROQ_API_KEY`
- القيمة: مفتاحك من Groq
- احفظ، ثم Deploys → Trigger deploy لإعادة النشر بحيث يلتقط المتغيّر الجديد

### 5) انتهيت
Netlify بيعطيك رابطًا مثل:
```
https://misbar.netlify.app
```
شاركه مع أي شخص — الموقع يعمل بالكامل والمفتاح محمي.

---

## التحكم بالاستهلاك
حصة Groq المجانية يومية ومحدودة. الدالة في `netlify/functions/ai.js` فيها حد بسيط
(15 طلب/دقيقة لكل زائر) لمنع استنزاف الحصة من شخص واحد. راقب استهلاكك من console.groq.com
إذا زادت الزيارات.

---

## ملفات المشروع
- `public/index.html` — الموقع (الواجهة) — يتصل بـ `/api/ai` فقط، لا يحتوي أي مفتاح
- `netlify/functions/ai.js` — الدالة الخادمة، تتصل بـ Groq بالمفتاح السري من متغيرات البيئة
- `netlify.toml` — إعدادات النشر وإعادة التوجيه من `/api/ai` إلى الدالة الفعلية
- `.gitignore` — يمنع رفع أي ملف أسرار بالخطأ
