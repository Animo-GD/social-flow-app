'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowRight, ArrowLeft, Building2, Check, Loader2, Sparkles, Target, Mic2, FileText, Globe } from 'lucide-react';
import { useLang } from '@/lib/LanguageContext';

const EMPTY = {
  name: '', tagline: '', description: '', industry: '', website: '',
  target_audience: '', audience_age: '', audience_location: '',
  brand_voice: 'professional', brand_values: [] as string[], primary_language: 'ar',
  content_style: '', posting_frequency: '3x per week', preferred_platforms: [] as string[],
  example_posts: [] as any[], keywords: [] as string[], hashtags: [] as string[], competitors: [] as string[],
};

const PLATFORMS = ['instagram', 'linkedin', 'x', 'whatsapp', 'telegram'];
const VOICES = ['professional', 'playful', 'inspirational', 'educational', 'conversational', 'bold'];
const INDUSTRIES = [
  'E-commerce', 'Technology', 'Healthcare', 'Education', 'Real Estate',
  'Food & Beverage', 'Fashion', 'Finance', 'Travel', 'Media & Entertainment', 'Other',
];

export default function BusinessOnboarding() {
  const { lang, t } = useLang();
  const qc = useQueryClient();
  const isAr = lang === 'ar';

  const [step, setStep] = useState(0);
  const [form, setForm] = useState(EMPTY);
  const [tagInput, setTagInput] = useState('');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['business'],
    queryFn: () => fetch('/api/business').then(r => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: (data: typeof EMPTY) =>
      fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['business'] });
    },
  });

  // If loading, or if profile exists and has a name, don't show onboarding.
  if (isLoading || (profile && profile.name)) {
    return null;
  }

  function set(key: keyof typeof EMPTY, val: any) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function nextStep() {
    if (step < steps.length - 1) setStep(s => s + 1);
    else saveMutation.mutate(form);
  }

  function prevStep() {
    if (step > 0) setStep(s => s - 1);
  }

  const steps = [
    {
      id: 'welcome',
      icon: Sparkles,
      title: isAr ? 'لنبدأ بإعداد ملفك التجاري' : "Let's set up your business profile",
      subtitle: isAr ? 'سنطرح عليك بعض الأسئلة لمساعدة الذكاء الاصطناعي في فهم عملك وإنشاء محتوى مثالي لك.' : 'We will ask a few questions to help our AI understand your business and generate perfect content.',
      isValid: () => true,
      render: () => null, // Just welcome text
    },
    {
      id: 'basics',
      icon: Building2,
      title: isAr ? 'ما هو اسم عملك؟' : 'What is your business name?',
      subtitle: isAr ? 'أدخل التفاصيل الأساسية لعملك' : 'Enter the basic details of your business',
      isValid: () => form.name.trim().length > 0 && form.industry.length > 0,
      render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{isAr ? 'اسم العمل *' : 'Business Name *'}</label>
            <input 
              autoFocus
              className="onboard-input" 
              value={form.name} 
              onChange={e => set('name', e.target.value)}
              placeholder={isAr ? 'مثال: شركة النجوم للتقنية' : 'e.g. NovaTech Solutions'}
              onKeyDown={e => e.key === 'Enter' && form.name && form.industry && nextStep()}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{isAr ? 'القطاع / الصناعة *' : 'Industry *'}</label>
            <select className="onboard-input" value={form.industry} onChange={e => set('industry', e.target.value)}>
              <option value="">{isAr ? '— اختر —' : '— Select —'}</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{isAr ? 'الشعار (Tagline) - اختياري' : 'Tagline (optional)'}</label>
            <input 
              className="onboard-input" 
              value={form.tagline} 
              onChange={e => set('tagline', e.target.value)}
              placeholder={isAr ? 'جملة تعبيرية قصيرة' : 'Your catchy one-liner'}
              onKeyDown={e => e.key === 'Enter' && form.name && form.industry && nextStep()}
            />
          </div>
        </div>
      )
    },
    {
      id: 'description',
      icon: FileText,
      title: isAr ? 'ماذا يقدم عملك؟' : 'What does your business do?',
      subtitle: isAr ? 'اشرح خدماتك أو منتجاتك وما يميزك.' : 'Explain your services or products and what makes you unique.',
      isValid: () => form.description.trim().length > 10,
      render: () => (
        <div>
          <textarea 
            autoFocus
            className="onboard-input" 
            rows={5} 
            value={form.description} 
            onChange={e => set('description', e.target.value)}
            placeholder={isAr 
              ? 'نحن نقدم خدمات التسويق الرقمي للشركات الصغيرة ونتميز بالسرعة والأسعار التنافسية...' 
              : 'We provide digital marketing services for small businesses and we stand out with our speed...'}
          />
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            {isAr ? 'اكتب 10 أحرف على الأقل.' : 'Write at least 10 characters.'}
          </p>
        </div>
      )
    },
    {
      id: 'audience',
      icon: Target,
      title: isAr ? 'من هو جمهورك المستهدف؟' : 'Who is your target audience?',
      subtitle: isAr ? 'الذكاء الاصطناعي سيقوم بتخصيص المحتوى ليناسبهم.' : 'The AI will tailor the content to appeal to them.',
      isValid: () => form.target_audience.trim().length > 0,
      render: () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{isAr ? 'وصف الجمهور *' : 'Audience Description *'}</label>
            <input 
              autoFocus
              className="onboard-input" 
              value={form.target_audience} 
              onChange={e => set('target_audience', e.target.value)}
              placeholder={isAr ? 'أصحاب الأعمال الصغيرة' : 'Small business owners'}
              onKeyDown={e => e.key === 'Enter' && form.target_audience && nextStep()}
            />
          </div>
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{isAr ? 'الفئة العمرية' : 'Age Range'}</label>
              <input 
                className="onboard-input" 
                value={form.audience_age} 
                onChange={e => set('audience_age', e.target.value)}
                placeholder="25-44"
              />
            </div>
            <div style={{ flex: 1, minWidth: '150px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }}>{isAr ? 'الموقع الجغرافي' : 'Location'}</label>
              <input 
                className="onboard-input" 
                value={form.audience_location} 
                onChange={e => set('audience_location', e.target.value)}
                placeholder={isAr ? 'السعودية' : 'Saudi Arabia'}
              />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'voice',
      icon: Mic2,
      title: isAr ? 'كيف تريد أن يكون صوت علامتك؟' : 'What is your brand voice?',
      subtitle: isAr ? 'سيحدد هذا نبرة المنشورات.' : 'This will determine the tone of your posts.',
      isValid: () => form.brand_voice.length > 0,
      render: () => (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
          {VOICES.map(v => {
            const isSelected = form.brand_voice === v;
            return (
              <button
                key={v}
                onClick={() => set('brand_voice', v)}
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  border: isSelected ? '2px solid var(--color-accent)' : '2px solid var(--color-border)',
                  background: isSelected ? 'rgba(0,117,222,0.05)' : 'var(--color-bg)',
                  color: isSelected ? 'var(--color-accent)' : 'var(--color-text)',
                  fontWeight: 600,
                  fontSize: '1rem',
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {v}
              </button>
            )
          })}
        </div>
      )
    },
    {
      id: 'platforms',
      icon: Globe,
      title: isAr ? 'أين تنشر محتواك عادة؟' : 'Where do you usually post?',
      subtitle: isAr ? 'اختر المنصات المفضلة لديك.' : 'Select your preferred platforms.',
      isValid: () => form.preferred_platforms.length > 0,
      render: () => (
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
          {PLATFORMS.map(p => {
            const active = form.preferred_platforms.includes(p);
            return (
              <button
                key={p}
                onClick={() => set('preferred_platforms', 
                  active ? form.preferred_platforms.filter(x => x !== p) : [...form.preferred_platforms, p]
                )}
                style={{
                  padding: '12px 24px',
                  borderRadius: '99px',
                  border: active ? '2px solid var(--color-accent)' : '2px solid var(--color-border)',
                  background: active ? 'var(--color-accent)' : 'transparent',
                  color: active ? '#fff' : 'var(--color-text)',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '1.05rem',
                }}
              >
                {p}
              </button>
            )
          })}
        </div>
      )
    }
  ];

  const currentStep = steps[step];
  const Icon = currentStep.icon;

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'var(--color-bg)',
      zIndex: 99999,
      display: 'flex', flexDirection: 'column',
      animation: 'fadeIn 0.4s ease-out'
    }}>
      {/* Progress Bar */}
      <div style={{ height: '4px', background: 'var(--color-border)', width: '100%' }}>
        <div style={{ 
          height: '100%', 
          background: 'var(--color-accent)', 
          width: `${((step + 1) / steps.length) * 100}%`,
          transition: 'width 0.4s ease-in-out'
        }} />
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ 
          width: '100%', maxWidth: '600px',
          animation: 'slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
          
          <div style={{ 
            width: '64px', height: '64px', 
            background: 'rgba(0,117,222,0.1)', 
            color: 'var(--color-accent)', 
            borderRadius: '20px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '32px'
          }}>
            <Icon size={32} />
          </div>

          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '12px', lineHeight: 1.2 }}>
            {currentStep.title}
          </h1>
          <p style={{ fontSize: '1.2rem', color: 'var(--color-text-secondary)', marginBottom: '40px' }}>
            {currentStep.subtitle}
          </p>

          <div style={{ marginBottom: '40px' }}>
            {currentStep.render()}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {step > 0 && (
              <button 
                onClick={prevStep}
                style={{ 
                  padding: '16px 24px', 
                  borderRadius: '12px', 
                  background: 'var(--color-bg-warm)', 
                  border: 'none', 
                  color: 'var(--color-text)',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '8px'
                }}
              >
                <ArrowLeft size={20} />
              </button>
            )}

            <button 
              onClick={nextStep}
              disabled={!currentStep.isValid() || saveMutation.isPending}
              style={{ 
                flex: 1,
                padding: '16px 32px', 
                borderRadius: '12px', 
                background: currentStep.isValid() ? 'var(--color-accent)' : 'var(--color-border)', 
                border: 'none', 
                color: currentStep.isValid() ? '#fff' : 'var(--color-text-muted)',
                fontWeight: 600,
                fontSize: '1.1rem',
                cursor: currentStep.isValid() ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                transition: 'all 0.2s',
                boxShadow: currentStep.isValid() ? '0 10px 25px -5px rgba(0,117,222,0.4)' : 'none'
              }}
            >
              {saveMutation.isPending ? (
                <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
              ) : step === steps.length - 1 ? (
                <>
                  <Check size={24} /> {isAr ? 'إكمال' : 'Complete'}
                </>
              ) : (
                <>
                  {isAr ? 'متابعة' : 'Continue'} <ArrowRight size={24} />
                </>
              )}
            </button>
          </div>
          
          {step === 0 && (
            <p style={{ textAlign: 'center', marginTop: '24px', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
              {isAr ? 'اضغط متابعة للبدء. يستغرق الأمر دقيقة واحدة.' : 'Press continue to start. It takes about a minute.'}
            </p>
          )}

        </div>
      </div>

      <style>{`
        .onboard-input {
          width: 100%;
          padding: 20px;
          font-size: 1.2rem;
          border: 2px solid var(--color-border);
          border-radius: 12px;
          background: var(--color-bg);
          color: var(--color-text);
          transition: border-color 0.2s;
          font-family: inherit;
        }
        .onboard-input:focus {
          outline: none;
          border-color: var(--color-accent);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
