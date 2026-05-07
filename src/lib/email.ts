export async function sendVerificationEmail(email: string, code: string, lang: 'en' | 'ar' = 'en') {
  const subject = lang === 'ar' ? 'رمز التحقق من البريد الإلكتروني - Mawja' : 'Verify your email - Mawja';
  const body = lang === 'ar'
    ? `<div dir="rtl" style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>مرحبًا بك في Mawja (موجه)</h2>
        <p>رمز التحقق الخاص بك هو:</p>
        <div style="font-size:2.5rem;font-weight:700;letter-spacing:8px;color:#4f46e5;padding:16px;background:#f0f6ff;border-radius:8px;text-align:center">${code}</div>
        <p style="color:#888">ينتهي الرمز خلال 10 دقائق. لا تشاركه مع أحد.</p>
      </div>`
    : `<div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Welcome to Mawja</h2>
        <p>Your verification code is:</p>
        <div style="font-size:2.5rem;font-weight:700;letter-spacing:8px;color:#0075de;padding:16px;background:#f0f6ff;border-radius:8px;text-align:center">${code}</div>
        <p style="color:#888">This code expires in 10 minutes. Do not share it.</p>
      </div>`;

  const webhookUrl = process.env.N8N_EMAIL_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.warn('N8N_EMAIL_WEBHOOK_URL is not set. Simulating email send:', { email, code });
    return;
  }

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      to: email,
      subject,
      html: body,
      code,
      lang,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to send email via n8n: ${res.statusText}`);
  }
}
