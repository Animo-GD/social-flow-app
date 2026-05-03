import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendVerificationEmail(email: string, code: string, lang: 'en' | 'ar' = 'en') {
  const subject = lang === 'ar' ? 'رمز التحقق من البريد الإلكتروني - SocialFlow' : 'Verify your email - SocialFlow';
  const body = lang === 'ar'
    ? `<div dir="rtl" style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>مرحبًا بك في SocialFlow</h2>
        <p>رمز التحقق الخاص بك هو:</p>
        <div style="font-size:2.5rem;font-weight:700;letter-spacing:8px;color:#0075de;padding:16px;background:#f0f6ff;border-radius:8px;text-align:center">${code}</div>
        <p style="color:#888">ينتهي الرمز خلال 10 دقائق. لا تشاركه مع أحد.</p>
      </div>`
    : `<div style="font-family:sans-serif;max-width:480px;margin:auto">
        <h2>Welcome to SocialFlow</h2>
        <p>Your verification code is:</p>
        <div style="font-size:2.5rem;font-weight:700;letter-spacing:8px;color:#0075de;padding:16px;background:#f0f6ff;border-radius:8px;text-align:center">${code}</div>
        <p style="color:#888">This code expires in 10 minutes. Do not share it.</p>
      </div>`;

  await resend.emails.send({
    from: process.env.EMAIL_FROM ?? 'noreply@socialflow.ai',
    to: email,
    subject,
    html: body,
  });
}
