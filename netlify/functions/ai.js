// دالة Netlify الخادمة: تستقبل الطلب من الموقع، تضيف مفتاح Groq السرّي
// من متغيرات البيئة، وترسل الطلب الحقيقي لـ Groq. المفتاح لا يظهر أبدًا
// في كود المتصفح ولا على GitHub.

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
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'طلب غير صالح.' }), { status: 400 });
  }

  const prompt = body && body.prompt;
  if (!prompt || typeof prompt !== 'string' || prompt.length > 20000) {
    return new Response(
      JSON.stringify({ error: 'نص الطلب مفقود أو طويل جدًا.' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'الخادم غير مهيأ: لا يوجد مفتاح GROQ_API_KEY.' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 2000,
        temperature: 0.3
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Groq API error:', data);
      return new Response(
        JSON.stringify({ error: (data && data.error && data.error.message) || 'خطأ من خدمة الذكاء الاصطناعي.' }),
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
