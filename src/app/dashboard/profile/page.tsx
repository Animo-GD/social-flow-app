'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import { useLang } from '@/lib/LanguageContext';
import {
  User, Camera, Lock, Zap, Building2, CreditCard,
  Save, Loader2, Eye, EyeOff, CheckCircle, History,
  Plus, Trash2, ChevronDown, ChevronUp, Globe, Users,
  Mic2, FileText, Lightbulb, X,
} from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface UserProfile {
  id: string;
  name: string;
  username?: string;
  email: string;
  phone?: string;
  preferred_language?: string;
  avatar_url?: string;
  credits: number;
  is_admin?: boolean;
  created_at?: string;
}

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_usd: number;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  description: string;
  created_at: string;
}

interface ExamplePost {
  id: string;
  platform: string;
  text: string;
  notes?: string;
}

interface BusinessProfile {
  name: string; tagline: string; description: string; industry: string;
  website: string; target_audience: string; audience_age: string;
  audience_location: string; brand_voice: string; brand_values: string[];
  primary_language: string; content_style: string; posting_frequency: string;
  preferred_platforms: string[]; example_posts: ExamplePost[];
  keywords: string[]; hashtags: string[]; competitors: string[];
}

const EMPTY_BIZ: BusinessProfile = {
  name: '', tagline: '', description: '', industry: '', website: '',
  target_audience: '', audience_age: '', audience_location: '',
  brand_voice: 'professional', brand_values: [], primary_language: 'ar',
  content_style: '', posting_frequency: '3x per week', preferred_platforms: [],
  example_posts: [], keywords: [], hashtags: [], competitors: [],
};

const PLATFORMS  = ['instagram', 'facebook', 'linkedin', 'x', 'whatsapp', 'telegram'];
const VOICES     = ['professional', 'playful', 'inspirational', 'educational', 'conversational', 'bold'];
const INDUSTRIES = ['E-commerce', 'Technology', 'Healthcare', 'Education', 'Real Estate', 'Food & Beverage', 'Fashion', 'Finance', 'Travel', 'Media & Entertainment', 'Other'];

// ─── Small helpers ────────────────────────────────────────────────────────────

function TagInput({ label, values, onChange, placeholder }: {
  label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string;
}) {
  const [input, setInput] = useState('');
  function add() {
    const v = input.trim();
    if (v && !values.includes(v)) { onChange([...values, v]); setInput(''); }
  }
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
        {values.map(v => (
          <span key={v} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'rgba(0,117,222,0.1)', color: '#0075de', border: '1px solid rgba(0,117,222,0.25)', borderRadius: 99, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600 }}>
            {v}
            <button type="button" onClick={() => onChange(values.filter(x => x !== v))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0075de', lineHeight: 1, padding: 0 }}>×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input className="form-input" value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} placeholder={placeholder ?? 'Type and press Enter'} style={{ flex: 1 }} />
        <button type="button" className="btn btn-secondary" onClick={add} style={{ flexShrink: 0 }}><Plus size={14} /> Add</button>
      </div>
    </div>
  );
}

function BizSection({ icon: Icon, title, children, defaultOpen = true }: {
  icon: React.ElementType; title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ border: '1px solid var(--color-border)', borderRadius: 10, marginBottom: 16, overflow: 'hidden', background: 'var(--color-bg)' }}>
      <button type="button" onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--color-bg-warm)', border: 'none', borderBottom: open ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text-primary)' }}>
        <Icon size={15} style={{ color: 'var(--color-accent)' }} />
        {title}
        <span style={{ marginInlineStart: 'auto' }}>{open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
      </button>
      {open && <div style={{ padding: '16px 16px 4px' }}>{children}</div>}
    </div>
  );
}

// ─── Tab: Profile ─────────────────────────────────────────────────────────────

function ProfileTab({ profile, refetch }: { profile: UserProfile; refetch: () => void }) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);

  const [username, setUsername]   = useState(profile.username ?? '');
  const [phone, setPhone]         = useState(profile.phone ?? '');
  const [prefLang, setPrefLang]   = useState(profile.preferred_language ?? 'en');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile]       = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const [curPwd, setCurPwd]   = useState('');
  const [newPwd, setNewPwd]   = useState('');
  const [cfmPwd, setCfmPwd]   = useState('');
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const saveMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      return data;
    },
    onSuccess: () => {
      toast.success(isAr ? 'تم الحفظ ✓' : 'Profile saved ✓');
      qc.invalidateQueries({ queryKey: ['user-profile'] });
      refetch();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }

  async function uploadAvatar(): Promise<string | null> {
    if (!avatarFile) return null;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', avatarFile);
    const res = await fetch('/api/uploads/avatar', { method: 'POST', body: fd });
    const data = await res.json();
    setUploading(false);
    if (!res.ok) { toast.error(data.error || 'Upload failed'); return null; }
    return data.url;
  }

  async function handleSaveProfile() {
    const payload: Record<string, unknown> = { username, phone, preferred_language: prefLang };
    if (avatarFile) {
      const url = await uploadAvatar();
      if (url) payload.avatar_url = url;
    }
    saveMutation.mutate(payload);
  }

  function handleChangePassword() {
    if (newPwd !== cfmPwd) { toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match'); return; }
    if (newPwd.length < 8) { toast.error(isAr ? 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' : 'Password must be at least 8 characters'); return; }
    saveMutation.mutate({ current_password: curPwd, new_password: newPwd });
    setCurPwd(''); setNewPwd(''); setCfmPwd('');
  }

  const avatarSrc = avatarPreview ?? profile.avatar_url;
  const initials  = (profile.username ?? profile.email).slice(0, 2).toUpperCase();

  return (
    <div style={{ display: 'grid', gap: 24 }}>

      {/* Avatar + basic info */}
      <div className="card">
        <h2 className="text-subhead" style={{ marginBottom: 20 }}>
          <User size={16} style={{ marginInlineEnd: 8, verticalAlign: 'middle' }} />
          {isAr ? 'معلومات الحساب' : 'Account Information'}
        </h2>

        {/* Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {avatarSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarSrc}
                alt="avatar"
                style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--color-border)' }}
              />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--color-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#fff', border: '3px solid var(--color-border)' }}>
                {initials}
              </div>
            )}
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              style={{ position: 'absolute', bottom: 0, insetInlineEnd: 0, width: 26, height: 26, borderRadius: '50%', background: 'var(--color-accent)', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              {uploading ? <Loader2 size={12} color="#fff" style={{ animation: 'spin 1s linear infinite' }} /> : <Camera size={12} color="#fff" />}
            </button>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" style={{ display: 'none' }} onChange={handleAvatarChange} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{profile.username ?? profile.name}</div>
            <div style={{ color: 'var(--color-text-muted)', fontSize: '0.88rem' }}>{profile.email}</div>
            {profile.is_admin && (
              <span className="badge badge-success" style={{ marginTop: 6 }}>Admin</span>
            )}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{isAr ? 'اسم المستخدم' : 'Username'}</label>
            <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} placeholder="@creative_mind_88" />
          </div>
          <div className="form-group">
            <label className="form-label">{isAr ? 'البريد الإلكتروني' : 'Email'}</label>
            <input className="form-input" value={profile.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{isAr ? 'رقم الهاتف' : 'Phone Number'}</label>
            <input className="form-input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+20 123 456 7890" type="tel" />
          </div>
          <div className="form-group">
            <label className="form-label">{isAr ? 'اللغة المفضلة' : 'Preferred Language'}</label>
            <select className="form-select" value={prefLang} onChange={e => setPrefLang(e.target.value)}>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleSaveProfile} disabled={saveMutation.isPending || uploading} style={{ width: 'fit-content' }}>
          {(saveMutation.isPending || uploading) ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
          {isAr ? 'حفظ المعلومات' : 'Save Changes'}
        </button>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="text-subhead" style={{ marginBottom: 20 }}>
          <Lock size={16} style={{ marginInlineEnd: 8, verticalAlign: 'middle' }} />
          {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
        </h2>

        <div style={{ maxWidth: 420, display: 'grid', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">{isAr ? 'كلمة المرور الحالية' : 'Current Password'}</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showCur ? 'text' : 'password'} value={curPwd} onChange={e => setCurPwd(e.target.value)} style={{ paddingInlineEnd: 40 }} />
              <button type="button" onClick={() => setShowCur(p => !p)} style={{ position: 'absolute', insetInlineEnd: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                {showCur ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{isAr ? 'كلمة المرور الجديدة' : 'New Password'}</label>
            <div style={{ position: 'relative' }}>
              <input className="form-input" type={showNew ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)} style={{ paddingInlineEnd: 40 }} />
              <button type="button" onClick={() => setShowNew(p => !p)} style={{ position: 'absolute', insetInlineEnd: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}>
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">{isAr ? 'تأكيد كلمة المرور' : 'Confirm New Password'}</label>
            <input className="form-input" type="password" value={cfmPwd} onChange={e => setCfmPwd(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChangePassword()} />
          </div>
          <button className="btn btn-secondary" onClick={handleChangePassword} disabled={!curPwd || !newPwd || !cfmPwd || saveMutation.isPending} style={{ width: 'fit-content' }}>
            {saveMutation.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={14} />}
            {isAr ? 'تحديث كلمة المرور' : 'Update Password'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Tab: Credits ─────────────────────────────────────────────────────────────

function CreditsTab({ initialCredits }: { initialCredits: number }) {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const [buying, setBuying] = useState<string | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<CreditPackage | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'moyasar' | 'paymob'>('paymob');
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const cancelled = searchParams.get('cancelled');

  const { data: balance, refetch } = useQuery({
    queryKey: ['credits-balance'],
    queryFn: () => fetch('/api/credits/balance').then(r => r.json()),
    initialData: { credits: initialCredits, history: [] },
  });

  const { data: packages } = useQuery({
    queryKey: ['credit-packages'],
    queryFn: () => fetch('/api/credits/packages').then(r => r.json()),
  });

  async function handleConfirmPayment() {
    if (!selectedPkg) return;
    setBuying(selectedPkg.id);
    try {
      const endpoint = paymentMethod === 'moyasar' ? '/api/credits/checkout' : '/api/credits/checkout/paymob';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedPkg.id }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else toast.error(data.error || 'Checkout failed');
    } catch { toast.error('Failed to initiate checkout'); }
    setBuying(null);
    setSelectedPkg(null);
  }

  return (
    <div style={{ display: 'grid', gap: 24 }}>
      {success && (
        <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, color: '#065f46' }}>
          <CheckCircle size={18} /> {isAr ? 'تم شراء الكريدت بنجاح!' : 'Credits purchased successfully!'}
        </div>
      )}
      {cancelled && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, color: '#991b1b' }}>
          <X size={18} /> {isAr ? 'تم إلغاء عملية الدفع' : 'Payment was cancelled'}
        </div>
      )}

      {/* Balance card */}
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ width: 56, height: 56, background: 'rgba(0,117,222,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Zap size={28} style={{ color: 'var(--color-accent)' }} />
        </div>
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isAr ? 'رصيدك الحالي' : 'Your Balance'}
          </div>
          <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1.1 }}>
            {balance?.credits ?? 0}
          </div>
          <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
            {isAr ? 'كريدت متاح' : 'credits available'}
          </div>
        </div>
      </div>

      {/* Payment Selection Modal */}
      {selectedPkg && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{ maxWidth: 400, width: '100%', position: 'relative', animation: 'popIn 0.3s ease' }}>
            <button 
              onClick={() => setSelectedPkg(null)}
              style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
            >
              <X size={20} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8, textAlign: 'center' }}>
              {isAr ? 'اختر وسيلة الدفع' : 'Select Payment Method'}
            </h3>
            <p style={{ textAlign: 'center', color: 'var(--color-text-secondary)', fontSize: '0.9rem', marginBottom: 24 }}>
              {isAr ? `أنت على وشك شراء حزمة ${selectedPkg.name}` : `You are buying the ${selectedPkg.name} package`}
            </p>

            <div style={{ display: 'grid', gap: 12, marginBottom: 24 }}>
              <button 
                className={`btn ${paymentMethod === 'paymob' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPaymentMethod('paymob')}
                style={{ justifyContent: 'center', padding: '16px' }}
              >
                🇪🇬 {isAr ? 'إنستا باي / فيزا (EGP)' : 'InstaPay / Card (EGP)'}
              </button>
              <button 
                className={`btn ${paymentMethod === 'moyasar' ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setPaymentMethod('moyasar')}
                style={{ justifyContent: 'center', padding: '16px' }}
              >
                🇸🇦 {isAr ? 'مدى / فيزا (SAR)' : 'Mada / Visa (SAR)'}
              </button>
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: '100%', justifyContent: 'center', padding: '12px' }}
              onClick={handleConfirmPayment}
              disabled={!!buying}
            >
              {buying ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <CreditCard size={18} />}
              {isAr ? 'استمرار للدفع' : 'Proceed to Payment'}
            </button>
          </div>
        </div>
      )}

      {/* Packages */}
      <div>
        <h2 className="text-subhead" style={{ marginBottom: 16 }}>
          <CreditCard size={18} style={{ marginInlineEnd: 8, verticalAlign: 'middle' }} />
          {isAr ? 'حزم الكريدت' : 'Credit Packages'}
        </h2>
        <div className="grid-4">
          {(packages ?? []).map((pkg: CreditPackage) => (
            <div key={pkg.id} className="card" style={{ textAlign: 'center', position: 'relative' }}>
              {pkg.name === 'Pro' && (
                <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-accent)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '2px 12px', borderRadius: 99 }}>
                  {isAr ? 'الأكثر شيوعًا' : 'Most Popular'}
                </div>
              )}
              <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{pkg.name}</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1 }}>{pkg.credits.toLocaleString()}</div>
              <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>{isAr ? 'كريدت' : 'credits'}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>${pkg.price_usd}</div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setSelectedPkg(pkg)} disabled={!!buying}>
                <CreditCard size={14} />
                {isAr ? 'شراء الآن' : 'Buy Now'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* History */}
      <div className="card">
        <h2 className="text-subhead" style={{ marginBottom: 16 }}>
          <History size={18} style={{ marginInlineEnd: 8, verticalAlign: 'middle' }} />
          {isAr ? 'سجل المعاملات' : 'Transaction History'}
        </h2>
        {(balance?.history ?? []).length === 0 ? (
          <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px 0' }}>
            {isAr ? 'لا توجد معاملات بعد' : 'No transactions yet'}
          </p>
        ) : (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{isAr ? 'الوصف' : 'Description'}</th>
                  <th>{isAr ? 'الكمية' : 'Amount'}</th>
                  <th>{isAr ? 'التاريخ' : 'Date'}</th>
                </tr>
              </thead>
              <tbody>
                {balance.history.map((tx: Transaction) => (
                  <tr key={tx.id}>
                    <td>{tx.description}</td>
                    <td style={{ color: tx.amount > 0 ? 'var(--color-success)' : 'var(--color-error)', fontWeight: 700 }}>
                      {tx.amount > 0 ? '+' : ''}{tx.amount}
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Tab: Business ────────────────────────────────────────────────────────────

function BusinessTab() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const qc = useQueryClient();

  const [form, setForm] = useState<BusinessProfile>(EMPTY_BIZ);
  const [newPost, setNewPost] = useState<Omit<ExamplePost, 'id'>>({ platform: 'instagram', text: '', notes: '' });
  const [showPostForm, setShowPostForm] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['business'],
    queryFn: () => fetch('/api/business').then(r => r.json()),
  });

  useEffect(() => {
    if (profile) setForm({ ...EMPTY_BIZ, ...profile });
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: (data: BusinessProfile) =>
      fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      toast.success(isAr ? 'تم حفظ الملف التجاري ✓' : 'Business profile saved ✓');
      qc.invalidateQueries({ queryKey: ['business'] });
    },
    onError: () => toast.error(isAr ? 'فشل الحفظ' : 'Save failed'),
  });

  function set<K extends keyof BusinessProfile>(key: K, val: BusinessProfile[K]) {
    setForm(f => ({ ...f, [key]: val }));
  }

  function addExamplePost() {
    if (!newPost.text.trim()) return;
    const post: ExamplePost = { id: Date.now().toString(), ...newPost };
    set('example_posts', [...form.example_posts, post]);
    setNewPost({ platform: 'instagram', text: '', notes: '' });
    setShowPostForm(false);
  }

  if (isLoading) {
    return <div style={{ display: 'grid', gap: 16 }}>{[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}</div>;
  }

  return (
    <form onSubmit={e => { e.preventDefault(); saveMutation.mutate(form); }} style={{ display: 'grid', gap: 0 }}>

      <BizSection icon={Building2} title={isAr ? 'هوية العمل' : 'Business Identity'}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{isAr ? 'اسم العمل *' : 'Business Name *'}</label>
            <input className="form-input" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label">{isAr ? 'الشعار' : 'Tagline'}</label>
            <input className="form-input" value={form.tagline} onChange={e => set('tagline', e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{isAr ? 'القطاع' : 'Industry'}</label>
            <select className="form-select" value={form.industry} onChange={e => set('industry', e.target.value)}>
              <option value="">{isAr ? '— اختر —' : '— Select —'}</option>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{isAr ? 'الموقع الإلكتروني' : 'Website'}</label>
            <input className="form-input" type="url" value={form.website} onChange={e => set('website', e.target.value)} placeholder="https://example.com" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">{isAr ? 'وصف العمل' : 'Business Description'}</label>
          <textarea className="form-textarea" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
        </div>
      </BizSection>

      <BizSection icon={Users} title={isAr ? 'الجمهور المستهدف' : 'Target Audience'} defaultOpen={false}>
        <div className="form-group">
          <label className="form-label">{isAr ? 'من هو جمهورك؟' : 'Who is your audience?'}</label>
          <textarea className="form-textarea" rows={2} value={form.target_audience} onChange={e => set('target_audience', e.target.value)} />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{isAr ? 'الفئة العمرية' : 'Age Range'}</label>
            <input className="form-input" value={form.audience_age} onChange={e => set('audience_age', e.target.value)} placeholder="25–44" />
          </div>
          <div className="form-group">
            <label className="form-label">{isAr ? 'الموقع الجغرافي' : 'Location'}</label>
            <input className="form-input" value={form.audience_location} onChange={e => set('audience_location', e.target.value)} />
          </div>
        </div>
        <TagInput label={isAr ? 'الكلمات المفتاحية' : 'Keywords'} values={form.keywords} onChange={v => set('keywords', v)} />
        <TagInput label={isAr ? 'المنافسون' : 'Competitors'} values={form.competitors} onChange={v => set('competitors', v)} />
      </BizSection>

      <BizSection icon={Mic2} title={isAr ? 'صوت العلامة التجارية' : 'Brand Voice'} defaultOpen={false}>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">{isAr ? 'نبرة الصوت' : 'Brand Voice'}</label>
            <select className="form-select" value={form.brand_voice} onChange={e => set('brand_voice', e.target.value)}>
              {VOICES.map(v => <option key={v} value={v} style={{ textTransform: 'capitalize' }}>{v}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">{isAr ? 'تكرار النشر' : 'Posting Frequency'}</label>
            <input className="form-input" value={form.posting_frequency} onChange={e => set('posting_frequency', e.target.value)} />
          </div>
        </div>
        <TagInput label={isAr ? 'قيم العلامة' : 'Brand Values'} values={form.brand_values} onChange={v => set('brand_values', v)} />
        <div className="form-group">
          <label className="form-label">{isAr ? 'المنصات المفضلة' : 'Preferred Platforms'}</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {PLATFORMS.map(p => {
              const active = form.preferred_platforms.includes(p);
              return (
                <button key={p} type="button" className={`btn ${active ? 'btn-primary' : 'btn-secondary'} btn-sm`} style={{ textTransform: 'capitalize' }}
                  onClick={() => set('preferred_platforms', active ? form.preferred_platforms.filter(x => x !== p) : [...form.preferred_platforms, p])}>
                  {p}
                </button>
              );
            })}
          </div>
        </div>
        <TagInput label={isAr ? 'الهاشتاقات' : 'Default Hashtags'} values={form.hashtags} onChange={v => set('hashtags', v)} placeholder="#YourBrand" />
        <div className="form-group">
          <label className="form-label">{isAr ? 'ملاحظات الأسلوب' : 'Content Style Notes'}</label>
          <textarea className="form-textarea" rows={2} value={form.content_style} onChange={e => set('content_style', e.target.value)} />
        </div>
      </BizSection>

      <BizSection icon={FileText} title={isAr ? 'مشاركات مرجعية' : 'Example Posts'} defaultOpen={false}>
        {form.example_posts.map((post, i) => (
          <div key={post.id} style={{ border: '1px solid var(--color-border)', borderRadius: 8, padding: '10px 12px', marginBottom: 10, background: 'var(--color-bg-warm)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{post.platform}</span>
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{isAr ? `مثال ${i + 1}` : `Example ${i + 1}`}</span>
              <button type="button" onClick={() => set('example_posts', form.example_posts.filter(p => p.id !== post.id))} style={{ marginInlineStart: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-error)' }}>
                <Trash2 size={13} />
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', margin: 0, whiteSpace: 'pre-wrap' }}>{post.text}</p>
            {post.notes && <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 4, marginBottom: 0 }}><Lightbulb size={11} style={{ marginInlineEnd: 4, verticalAlign: 'text-top' }} />{post.notes}</p>}
          </div>
        ))}
        {showPostForm ? (
          <div style={{ border: '2px dashed var(--color-accent)', borderRadius: 8, padding: 14, background: 'rgba(0,117,222,0.03)' }}>
            <div className="form-group">
              <label className="form-label">{isAr ? 'المنصة' : 'Platform'}</label>
              <select className="form-select" value={newPost.platform} onChange={e => setNewPost(p => ({ ...p, platform: e.target.value }))}>
                {PLATFORMS.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'نص المنشور *' : 'Post text *'}</label>
              <textarea className="form-textarea" rows={4} value={newPost.text} onChange={e => setNewPost(p => ({ ...p, text: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">{isAr ? 'ملاحظات' : 'Notes (optional)'}</label>
              <input className="form-input" value={newPost.notes} onChange={e => setNewPost(p => ({ ...p, notes: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={addExamplePost}><Plus size={13} /> {isAr ? 'إضافة' : 'Add'}</button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPostForm(false)}>{isAr ? 'إلغاء' : 'Cancel'}</button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowPostForm(true)}><Plus size={13} /> {isAr ? 'إضافة منشور مرجعي' : 'Add Example Post'}</button>
        )}
      </BizSection>

      <BizSection icon={Globe} title={isAr ? 'السيو والهاشتاق' : 'SEO & Discovery'} defaultOpen={false}>
        <TagInput label={isAr ? 'الهاشتاقات' : 'Hashtags'} values={form.hashtags} onChange={v => set('hashtags', v)} placeholder="#YourHashtag" />
        <TagInput label={isAr ? 'الكلمات المفتاحية' : 'Keywords'} values={form.keywords} onChange={v => set('keywords', v)} />
      </BizSection>

      {/* Sticky save */}
      <div style={{ position: 'sticky', bottom: 16, textAlign: 'center', paddingTop: 8 }}>
        <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending} style={{ minWidth: 200, justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,117,222,0.35)' }}>
          {saveMutation.isPending ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
          {isAr ? 'حفظ الملف التجاري' : 'Save Business Profile'}
        </button>
      </div>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

type TabKey = 'profile' | 'credits' | 'business';

function ProfilePageContent() {
  const { lang } = useLang();
  const isAr = lang === 'ar';
  const searchParams = useSearchParams();
  const defaultTab = (searchParams.get('tab') as TabKey) ?? 'profile';
  const [tab, setTab] = useState<TabKey>(defaultTab);

  const { data: profile, isLoading, refetch } = useQuery({
    queryKey: ['user-profile'],
    queryFn: () => fetch('/api/user/profile').then(r => r.json()),
  });

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <div className="skeleton skeleton-title" style={{ width: 200 }} />
        </div>
        <div className="page-body" style={{ display: 'grid', gap: 20 }}>
          {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12 }} />)}
        </div>
      </div>
    );
  }

  const tabs: { key: TabKey; label: string; icon: React.ElementType }[] = [
    { key: 'profile',  label: isAr ? 'الحساب الشخصي' : 'Profile',          icon: User },
    { key: 'credits',  label: isAr ? 'الكريدت'        : 'Credits',          icon: Zap },
    { key: 'business', label: isAr ? 'الملف التجاري'  : 'Business Profile', icon: Building2 },
  ];

  return (
    <div>
      <Toaster position="top-right" />

      <div className="page-header">
        <h1 className="text-heading">{isAr ? 'الملف الشخصي' : 'My Profile'}</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginTop: 4 }}>
          {isAr ? 'إدارة حسابك وكريدتاتك ومعلومات عملك' : 'Manage your account, credits, and business information'}
        </p>
      </div>

      <div className="page-body">
        {/* Tabs */}
        <div className="tabs" style={{ marginBottom: 28 }}>
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={`tab-btn${tab === key ? ' active' : ''}`}
              onClick={() => setTab(key)}
            >
              <Icon size={14} style={{ marginInlineEnd: 6, verticalAlign: 'middle' }} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'profile'  && <ProfileTab profile={profile} refetch={refetch} />}
        {tab === 'credits'  && <CreditsTab initialCredits={profile?.credits ?? 0} />}
        {tab === 'business' && <BusinessTab />}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfilePageContent />
    </Suspense>
  );
}
