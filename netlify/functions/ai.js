// دالة Netlify: تعالج نوعين من الطلبات:
// 1) Vision — استخراج نص من صورة (يُرسل base64 مع prompt='__VISION__')
// 2) Text  — تلخيص أو ترتيب نص عادي

const requestLog = new Map();
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60 * 1000;

function isRateLimited(ip) {
  const now = Date.now();
  const timestamps = (requestLog.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  timestamps.push(now);
  requestLog.set(ip, timestamps);
  return timestamps.length > RATE_LIMIT;
}

export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const ip = context.ip || req.headers.get('x-forwarded-for') || 'unknown';
  if (isRateLimited(ip)) {
    return new Response(
      JSON.stringify({ error: 'تم تجاوز عدد الطلبات المسموح به، حاول بعد دقيقة.' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let body;
  try { body = await req.json(); }
  catch { return new Response(JSON.stringify({ error: 'طلب غير صالح.' }), { status: 400 }); }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'الخادم غير مهيأ: لا يوجد مفتاح GROQ_API_KEY.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const isVision = body.prompt === '__VISION__' && body.image;

  let messages;
  if (isVision) {
    // طلب استخراج نص من صورة — يستخدم نموذج Groq الذي يدعم الصور
    messages = [{
      role: 'user',
      content: [
        {
          type: 'image_url',
          image_url: {
            url: `data:${body.mediaType || 'image/jpeg'};base64,${body.image}`
          }
        },
        {
          type: 'text',
          text: `استخرج كل النص الموجود في هذه الصورة كما هو بالضبط، بنفس الترتيب وبنفس فقراته وأسطره الطبيعية.
لا تلخّص ولا تضف ولا تحذف شيئًا.
لا تكتب أي تعليق أو مقدمة — فقط النص المستخرج مباشرة.
إذا لم يوجد نص في الصورة اكتب: (لا يوجد نص في هذه الصورة)`
        }
      ]
    }];
  } else {
    // طلب نص عادي (تلخيص / ترتيب / محادثة)
    const { prompt } = body;
    if (!prompt || typeof prompt !== 'string' || prompt.length > 20000) {
      return new Response(
        JSON.stringify({ error: 'نص الطلب مفقود أو طويل جدًا.' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    messages = [{ role: 'user', content: prompt }];
  }

  try {
    const model = isVision ? 'meta-llama/llama-4-scout-17b-16e-instruct' : 'llama-3.3-70b-versatile';
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({ model, messages, max_tokens: 3000, temperature: 0.2 })
    });

    const data = await response.json();
    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: data?.error?.message || 'خطأ من خدمة الذكاء الاصطناعي.' }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const text = data?.choices?.[0]?.message?.content?.trim() || '';
    return new Response(JSON.stringify({ text }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('Proxy error:', err);
    return new Response(
      JSON.stringify({ error: 'تعذّر الاتصال بخدمة الذكاء الاصطناعي.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
