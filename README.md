# تبارك — نشر مجاني بالكامل (GitHub + Netlify + Groq)

موقع لاستخراج النص من الصور بدقة عالية عبر **Vision AI** وتلخيصه/ترتيبه
باستخدام **Groq** (مجاني، سريع جدًا، بدون بطاقة دفع).

---

## كيف يعمل

```
الزائر  →  الموقع (Netlify)  →  /api/ai (دالة Netlify)  →  Groq Vision/LLM
```

- **استخراج النص**: يُرسل الصورة لنموذج Groq Vision — دقة عالية بكل اللغات (عربي، إنجليزي، وغيرها)
- **التلخيص والمحادثة**: نموذج Groq النصي السريع
- **المفتاح محمي**: لا يظهر في كود الموقع أو على GitHub أبدًا

---

## الملفات

```
misbar-netlify/
├── public/
│   └── index.html          ← الموقع (الواجهة) — يتصل بـ /api/ai فقط
├── netlify/
│   └── functions/
│       └── ai.js           ← الدالة الخادمة (Vision + Text) عبر Groq
├── netlify.toml            ← إعدادات النشر والتوجيه
├── .gitignore
└── package.json
```

---

## خطوات النشر (10 دقائق)

### 1) احصل على مفتاح Groq مجانًا
- console.groq.com → تسجيل (بريد فقط، بدون بطاقة)
- API Keys → Create API Key → احتفظ به

### 2) ارفع على GitHub
```bash
git init
git add .
git commit -m "تبارك v1"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

### 3) اربط بـ Netlify
- netlify.com → Add new site → Import an existing project → اختر المستودع
- الإعدادات تُكتشف تلقائيًا من `netlify.toml`

### 4) أضف المفتاح
- Site configuration → Environment variables
- الاسم: `GROQ_API_KEY` | القيمة: مفتاحك
- Deploys → Trigger deploy

### 5) انتهيت 🎉
```
https://tabaarak.netlify.app
```

---

## ملاحظة
⚠️ لا ترفع ملف `.env` على GitHub — المفتاح يوضع فقط في إعدادات Netlify.
