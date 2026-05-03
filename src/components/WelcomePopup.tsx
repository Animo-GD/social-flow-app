'use client';

import { useState, useEffect } from 'react';
import { Gift, X } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

export default function WelcomePopup() {
  const { t, lang } = useLang();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if the welcome_bonus cookie exists
    const hasBonus = document.cookie.includes('welcome_bonus=1');
    if (hasBonus) {
      setShow(true);
      // Remove the cookie so it doesn't show again
      document.cookie = 'welcome_bonus=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }
  }, []);

  if (!show) return null;

  const isAr = lang === 'ar';

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'var(--color-bg)',
        borderRadius: '16px',
        maxWidth: '400px',
        width: '100%',
        padding: '32px',
        textAlign: 'center',
        position: 'relative',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        animation: 'popIn 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        <button 
          onClick={() => setShow(false)}
          style={{
            position: 'absolute',
            top: '16px', right: '16px',
            background: 'none', border: 'none',
            cursor: 'pointer',
            color: 'var(--color-text-muted)',
            padding: '4px'
          }}
        >
          <X size={20} />
        </button>

        <div style={{
          width: '80px', height: '80px',
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4)'
        }}>
          <Gift size={40} color="white" />
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '12px', color: 'var(--color-text)' }}>
          {isAr ? 'مبروك! 🎉' : 'Congratulations! 🎉'}
        </h2>
        
        <p style={{ fontSize: '1rem', color: 'var(--color-text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
          {isAr 
            ? 'لقد حصلت للتو على 2000 كريدت مجاني كهدية ترحيبية. يمكنك استخدامها لتوليد المحتوى الآن.'
            : 'You just received 2,000 FREE credits as a welcome bonus. Start generating AI content right away!'}
        </p>

        <button 
          onClick={() => setShow(false)}
          className="btn btn-primary"
          style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '1.1rem' }}
        >
          {isAr ? 'ابدأ الآن' : 'Get Started'}
        </button>
      </div>

      <style>{`
        @keyframes popIn {
          0% { opacity: 0; transform: scale(0.9) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
