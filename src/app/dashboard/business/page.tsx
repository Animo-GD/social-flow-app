'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast, { Toaster } from 'react-hot-toast';
import { useLang } from '@/lib/LanguageContext';
import {
  Building2, Globe, Users, Mic2, Hash, FileText,
  Plus, Trash2, Save, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface ExamplePost {
  id:       string;
  platform: string;
  text:     string;
  notes?:   string;
}

interface BusinessProfile {
  id?:                  string;
  name:                 string;
  tagline:              string;
  description:          string;
  industry:             string;
  website:              string;
  target_audience:      string;
  audience_age:         string;
  audience_location:    string;
  brand_voice:          string;
  brand_values:         string[];
  primary_language:     string;
  content_style:        string;
  posting_frequency:    string;
  preferred_platforms:  string[];
  example_posts:        ExamplePost[];
  keywords:             string[];
  hashtags:             string[];
  competitors:          string[];
}

const EMPTY: BusinessProfile = {
  name: '', tagline: '', description: '', industry: '', website: '',
  target_audience: '', audience_age: '', audience_location: '',
  brand_voice: 'professional', brand_values: [], primary_language: 'ar',
  content_style: '', posting_frequency: '3x per week', preferred_platforms: [],
  example_posts: [], keywords: [], hashtags: [], competitors: [],
};

const PLATFORMS = ['instagram', 'linkedin', 'x', 'whatsapp', 'telegram'];
const VOICES    = ['professional', 'playful', 'inspirational', 'educational', 'conversational', 'bold'];
const INDUSTRIES = [
  'E-commerce', 'Technology', 'Healthcare', 'Education', 'Real Estate',
  'Food & Beverage', 'Fashion', 'Finance', 'Travel', 'Media & Entertainment', 'Other',
];

// ── Tag input helper ──────────────────────────────────────────────────────────
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
          <span key={v} style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(0,117,222,0.1)', color: '#0075de',
            border: '1px solid rgba(0,117,222,0.25)',
            borderRadius: 99, padding: '2px 10px', fontSize: '0.8rem', fontWeight: 600,
          }}>
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter(x => x !== v))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0075de', lineHeight: 1, padding: 0 }}
            >×</button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="form-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder ?? 'Type and press Enter'}
          style={{ flex: 1 }}
        />
        <button type="button" className="btn btn-secondary" onClick={add} style={{ flexShrink: 0 }}>
          <Plus size={14} /> Add
        </button>
      </div>
    </div>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ icon: Icon, title, children, defaultOpen = true }: {
  icon: React.ElementType; title: string; children: React.ReactNode; defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card" style={{ marginBottom: 20, padding: 0, overflow: 'hidden' }}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 20px', background: 'var(--color-bg-warm)',
          border: 'none', borderBottom: open ? '1px solid var(--color-border)' : 'none',
          cursor: 'pointer', fontWeight: 700, fontSize: '0.94rem',
          color: 'var(--color-text-primary)',
        }}
      >
        <Icon size={16} style={{ color: 'var(--color-accent)' }} />
        {title}
        <span style={{ marginInlineStart: 'auto' }}>
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>
      {open && <div style={{ padding: '20px 20px 4px' }}>{children}</div>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function BusinessPage() {
  const { t, lang } = useLang();
  const qc = useQueryClient();

  const [form, setForm] = useState<BusinessProfile>(EMPTY);
  const [newPost, setNewPost] = useState<Omit<ExamplePost, 'id'>>({ platform: 'instagram', text: '', notes: '' });
  const [showPostForm, setShowPostForm] = useState(false);

  // Load profile
  const { data: profile, isLoading } = useQuery({
    queryKey: ['business'],
    queryFn: () => fetch('/api/business').then(r => r.json()),
  });

  useEffect(() => {
    if (profile) setForm({ ...EMPTY, ...profile });
  }, [profile]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: (data: BusinessProfile) =>
      fetch('/api/business', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      toast.success(lang === 'ar' ? 'تم حفظ الملف التجاري ✓' : 'Business profile saved ✓');
      qc.invalidateQueries({ queryKey: ['business'] });
    },
    onError: () => toast.error(lang === 'ar' ? 'فشل الحفظ' : 'Save failed'),
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

  function removeExamplePost(id: string) {
    set('example_posts', form.example_posts.filter(p => p.id !== id));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    saveMutation.mutate(form);
  }

  if (isLoading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="text-heading">{lang === 'ar' ? 'الملف التجاري' : 'Business Profile'}</h1>
        </div>
        <div className="page-body">
          {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 12, marginBottom: 20 }} />)}
        </div>
      </div>
    );
  }

  return (
    <div>
      <Toaster position="top-right" />

      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="text-heading">{lang === 'ar' ? 'الملف التجاري' : 'Business Profile'}</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginTop: 4 }}>
            {lang === 'ar'
              ? 'أخبر الذكاء الاصطناعي بكل شيء عن عملك لتوليد محتوى مخصص'
              : 'Tell the AI everything about your business to generate perfectly tailored content'}
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={saveMutation.isPending}
          style={{ flexShrink: 0 }}
        >
          {saveMutation.isPending
            ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
            : <Save size={14} />}
          {lang === 'ar' ? 'حفظ الملف' : 'Save Profile'}
        </button>
      </div>

      <div className="page-body">
        <form onSubmit={handleSubmit}>

          {/* ── 1. Business Identity ── */}
          <Section icon={Building2} title={lang === 'ar' ? '🏢 هوية العمل' : '🏢 Business Identity'}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{lang === 'ar' ? 'اسم العمل *' : 'Business Name *'}</label>
                <input className="form-input" value={form.name}
                  onChange={e => set('name', e.target.value)}
                  placeholder={lang === 'ar' ? 'مثال: شركة النجوم للتقنية' : 'e.g. NovaTech Solutions'}
                  required />
              </div>
              <div className="form-group">
                <label className="form-label">{lang === 'ar' ? 'الشعار (Tagline)' : 'Tagline'}</label>
                <input className="form-input" value={form.tagline}
                  onChange={e => set('tagline', e.target.value)}
                  placeholder={lang === 'ar' ? 'جملة تعبيرية قصيرة' : 'Your catchy one-liner'} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{lang === 'ar' ? 'القطاع / الصناعة' : 'Industry'}</label>
                <select className="form-select" value={form.industry} onChange={e => set('industry', e.target.value)}>
                  <option value="">{lang === 'ar' ? '— اختر —' : '— Select —'}</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{lang === 'ar' ? 'الموقع الإلكتروني' : 'Website'}</label>
                <input className="form-input" type="url" value={form.website}
                  onChange={e => set('website', e.target.value)}
                  placeholder="https://example.com" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">{lang === 'ar' ? 'وصف العمل' : 'Business Description'}</label>
              <textarea className="form-textarea" rows={4} value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder={lang === 'ar'
                  ? 'اشرح ما تقدمه، ما يميزك، وما هي قيمتك للعملاء…'
                  : 'What you do, what makes you unique, and the value you bring to customers…'} />
            </div>
          </Section>

          {/* ── 2. Target Audience ── */}
          <Section icon={Users} title={lang === 'ar' ? '🎯 الجمهور المستهدف' : '🎯 Target Audience'}>
            <div className="form-group">
              <label className="form-label">{lang === 'ar' ? 'من هو جمهورك؟' : 'Who is your audience?'}</label>
              <textarea className="form-textarea" rows={3} value={form.target_audience}
                onChange={e => set('target_audience', e.target.value)}
                placeholder={lang === 'ar'
                  ? 'مثال: أصحاب الأعمال الصغيرة في السعودية المهتمون بالتحول الرقمي'
                  : 'e.g. Small business owners interested in digital transformation'} />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{lang === 'ar' ? 'الفئة العمرية' : 'Age Range'}</label>
                <input className="form-input" value={form.audience_age}
                  onChange={e => set('audience_age', e.target.value)}
                  placeholder="25–44" />
              </div>
              <div className="form-group">
                <label className="form-label">{lang === 'ar' ? 'الموقع الجغرافي' : 'Location'}</label>
                <input className="form-input" value={form.audience_location}
                  onChange={e => set('audience_location', e.target.value)}
                  placeholder={lang === 'ar' ? 'السعودية، الإمارات، مصر' : 'Saudi Arabia, UAE, Egypt'} />
              </div>
            </div>
            <TagInput
              label={lang === 'ar' ? 'الكلمات المفتاحية' : 'Keywords'}
              values={form.keywords}
              onChange={v => set('keywords', v)}
              placeholder={lang === 'ar' ? 'اكتب كلمة واضغط Enter' : 'Type and press Enter'}
            />
            <TagInput
              label={lang === 'ar' ? 'المنافسون' : 'Competitors'}
              values={form.competitors}
              onChange={v => set('competitors', v)}
              placeholder={lang === 'ar' ? 'اسم المنافس' : 'Competitor name'}
            />
          </Section>

          {/* ── 3. Brand Voice ── */}
          <Section icon={Mic2} title={lang === 'ar' ? '🎙️ صوت العلامة التجارية' : '🎙️ Brand Voice & Style'}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">{lang === 'ar' ? 'نبرة الصوت' : 'Brand Voice'}</label>
                <select className="form-select" value={form.brand_voice} onChange={e => set('brand_voice', e.target.value)}>
                  {VOICES.map(v => (
                    <option key={v} value={v} style={{ textTransform: 'capitalize' }}>{v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{lang === 'ar' ? 'تكرار النشر' : 'Posting Frequency'}</label>
                <input className="form-input" value={form.posting_frequency}
                  onChange={e => set('posting_frequency', e.target.value)}
                  placeholder="3x per week" />
              </div>
            </div>
            <TagInput
              label={lang === 'ar' ? 'قيم العلامة التجارية' : 'Brand Values'}
              values={form.brand_values}
              onChange={v => set('brand_values', v)}
              placeholder={lang === 'ar' ? 'مثال: الثقة، الابتكار' : 'e.g. Trust, Innovation'}
            />
            <div className="form-group">
              <label className="form-label">{lang === 'ar' ? 'المنصات المفضلة' : 'Preferred Platforms'}</label>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {PLATFORMS.map(p => {
                  const active = form.preferred_platforms.includes(p);
                  return (
                    <button
                      key={p} type="button"
                      className={`btn ${active ? 'btn-primary' : 'btn-secondary'}`}
                      style={{ textTransform: 'capitalize' }}
                      onClick={() => set('preferred_platforms',
                        active ? form.preferred_platforms.filter(x => x !== p)
                               : [...form.preferred_platforms, p]
                      )}
                    >{p}</button>
                  );
                })}
              </div>
            </div>
            <TagInput
              label={lang === 'ar' ? 'الهاشتاقات المعتادة' : 'Default Hashtags'}
              values={form.hashtags}
              onChange={v => set('hashtags', v)}
              placeholder="#YourBrand"
            />
            <div className="form-group">
              <label className="form-label">{lang === 'ar' ? 'ملاحظات الأسلوب / النمط' : 'Content Style Notes'}</label>
              <textarea className="form-textarea" rows={3} value={form.content_style}
                onChange={e => set('content_style', e.target.value)}
                placeholder={lang === 'ar'
                  ? 'كيف تريد أن يبدو المحتوى؟ مثال: مختصر وجذاب، مع إيموجي، جمل قصيرة…'
                  : 'How should your content feel? e.g. Short punchy sentences, always end with a question, use emojis sparingly…'} />
            </div>
          </Section>

          {/* ── 4. Example Posts ── */}
          <Section icon={FileText} title={lang === 'ar' ? '📝 مشاركات مرجعية' : '📝 Example Posts'} defaultOpen={false}>
            <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem', marginBottom: 16 }}>
              {lang === 'ar'
                ? 'أضف منشورات ناجحة سابقة حتى يتعلم الذكاء الاصطناعي أسلوبك'
                : 'Add real posts that performed well so the AI can learn your exact style'}
            </p>

            {/* Existing example posts */}
            {form.example_posts.map((post, i) => (
              <div key={post.id} style={{
                border: '1px solid var(--color-border)', borderRadius: 10,
                padding: '12px 14px', marginBottom: 12,
                background: 'var(--color-bg-warm)',
                position: 'relative',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{post.platform}</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    {lang === 'ar' ? `مثال ${i + 1}` : `Example ${i + 1}`}
                  </span>
                  <button
                    type="button" onClick={() => removeExamplePost(post.id)}
                    style={{
                      marginInlineStart: 'auto', background: 'none', border: 'none',
                      cursor: 'pointer', color: 'var(--color-error)', padding: 0,
                    }}
                  ><Trash2 size={14} /></button>
                </div>
                <p style={{ fontSize: '0.85rem', margin: 0, whiteSpace: 'pre-wrap', color: 'var(--color-text-primary)' }}>
                  {post.text}
                </p>
                {post.notes && (
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 6, marginBottom: 0 }}>
                    💡 {post.notes}
                  </p>
                )}
              </div>
            ))}

            {/* Add new post form */}
            {showPostForm ? (
              <div style={{
                border: '2px dashed var(--color-accent)', borderRadius: 10,
                padding: 16, background: 'rgba(0,117,222,0.03)',
              }}>
                <div className="form-row" style={{ marginBottom: 0 }}>
                  <div className="form-group">
                    <label className="form-label">{lang === 'ar' ? 'المنصة' : 'Platform'}</label>
                    <select className="form-select" value={newPost.platform}
                      onChange={e => setNewPost(p => ({ ...p, platform: e.target.value }))}>
                      {PLATFORMS.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">{lang === 'ar' ? 'نص المنشور *' : 'Post text *'}</label>
                  <textarea className="form-textarea" rows={5} value={newPost.text}
                    onChange={e => setNewPost(p => ({ ...p, text: e.target.value }))}
                    placeholder={lang === 'ar' ? 'الصق نص منشور حقيقي هنا…' : 'Paste a real post here…'} />
                </div>
                <div className="form-group">
                  <label className="form-label">{lang === 'ar' ? 'ملاحظات (اختياري)' : 'Notes (optional)'}</label>
                  <input className="form-input" value={newPost.notes}
                    onChange={e => setNewPost(p => ({ ...p, notes: e.target.value }))}
                    placeholder={lang === 'ar' ? 'مثال: حصل على أعلى تفاعل في 2024' : 'e.g. Best performing post in Q1 2024'} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" className="btn btn-primary" onClick={addExamplePost}>
                    <Plus size={14} /> {lang === 'ar' ? 'إضافة' : 'Add Post'}
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPostForm(false)}>
                    {lang === 'ar' ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" className="btn btn-secondary" onClick={() => setShowPostForm(true)}>
                <Plus size={14} />
                {lang === 'ar' ? 'إضافة منشور مرجعي' : 'Add Example Post'}
              </button>
            )}
          </Section>

          {/* ── 5. Website & SEO ── */}
          <Section icon={Globe} title={lang === 'ar' ? '🌐 هاشتاق SEO' : '🌐 Discovery & SEO'} defaultOpen={false}>
            <TagInput
              label={lang === 'ar' ? 'الهاشتاقات' : 'Hashtags'}
              values={form.hashtags}
              onChange={v => set('hashtags', v)}
              placeholder="#YourHashtag"
            />
            <TagInput
              label={lang === 'ar' ? 'الكلمات المفتاحية' : 'Keywords'}
              values={form.keywords}
              onChange={v => set('keywords', v)}
              placeholder={lang === 'ar' ? 'كلمة مفتاحية' : 'keyword'}
            />
          </Section>

          {/* ── Sticky save bar ── */}
          <div style={{
            position: 'sticky', bottom: 16, textAlign: 'center',
            paddingBottom: 8,
          }}>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saveMutation.isPending}
              style={{ minWidth: 200, justifyContent: 'center', boxShadow: '0 4px 20px rgba(0,117,222,0.35)' }}
            >
              {saveMutation.isPending
                ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                : <Save size={14} />}
              {lang === 'ar' ? 'حفظ الملف التجاري' : 'Save Business Profile'}
            </button>
          </div>

        </form>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
