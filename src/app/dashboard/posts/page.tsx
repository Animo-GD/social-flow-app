'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, Post } from '@/lib/api';
import dynamic from 'next/dynamic';
import { Loader2, Sparkles, Calendar, Trash2, Clock, CheckCircle, XCircle, Image as ImageIcon, FileText, Pencil } from 'lucide-react';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { useLang } from '@/lib/LanguageContext';
import type { TranslationKey } from '@/lib/i18n';

// Inline card — shown in the preview panel, not fullscreen
const GeneratingCard = dynamic(() => import('@/components/GeneratingCard'), { ssr: false });


const PLATFORMS = ['instagram', 'linkedin', 'x'] as const;
const TONES     = ['formal', 'casual', 'sales'] as const;

function StatusBadge({ status, t }: { status: Post['status']; t: (k: TranslationKey) => string }) {
  if (status === 'draft') return <span className="badge badge-gray"><FileText size={10} style={{ marginInlineEnd: 3 }} />Draft</span>;
  if (status === 'posted')   return <span className="badge badge-success"><CheckCircle size={10} style={{ marginInlineEnd: 3 }} />{t('status_posted')}</span>;
  if (status === 'failed')   return <span className="badge badge-error"><XCircle size={10} style={{ marginInlineEnd: 3 }} />{t('status_failed')}</span>;
  if (status === 'completed') return <span className="badge badge-success"><CheckCircle size={10} style={{ marginInlineEnd: 3 }} />Completed</span>;
  return <span className="badge"><Clock size={10} style={{ marginInlineEnd: 3 }} />{t('status_scheduled')}</span>;
}

export default function PostsPage() {
  const { t } = useLang();
  const qc = useQueryClient();

  const [tab, setTab] = useState<'create' | 'scheduled'>('create');
  const [form, setForm] = useState({ topic: '', platform: 'instagram', tone: 'casual', language: 'en' });
  const [generated, setGenerated] = useState<{ text: string; image_url?: string } | null>(null);
  const [previewPostId, setPreviewPostId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [filter, setFilter] = useState({ platform: '', status: '' });
  const [productImage, setProductImage] = useState<File | null>(null);
  const [productImageUrl, setProductImageUrl] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPublishAt, setEditPublishAt] = useState('');
  const previewTextareaRef = useRef<HTMLTextAreaElement | null>(null);

  // Async generation state
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const { data: posts, isLoading: postsLoading } = useQuery({ queryKey: ['posts'], queryFn: api.getPosts });

  // ── Schedule mutation ──────────────────────────────────────────────
  const scheduleMutation = useMutation({
    mutationFn: api.schedulePost,
    onSuccess: () => {
      toast.success(t('toast_post_scheduled'));
      qc.invalidateQueries({ queryKey: ['posts'] });
      setPreviewPostId(null);
      setGenerated(null); setScheduleAt(''); setTab('scheduled');
    },
    onError: () => toast.error(t('toast_scheduling_failed')),
  });

  const deleteMutation = useMutation({
    mutationFn: api.deletePost,
    onSuccess: () => { toast.success(t('toast_post_deleted')); qc.invalidateQueries({ queryKey: ['posts'] }); },
    onError: () => toast.error(t('toast_delete_failed')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { text?: string; publish_at?: string | null } }) => api.updatePost(id, body),
    onSuccess: () => {
      toast.success('Post updated');
      setEditingId(null);
      qc.invalidateQueries({ queryKey: ['posts'] });
    },
    onError: () => toast.error('Update failed'),
  });

  // ── Generation callbacks ───────────────────────────────────────────
  const handleGenerationComplete = useCallback(async (result: { text: string; image_url?: string }) => {
    setActiveJobId(null);
    setPreviewPostId(null);

    if (result?.text || result?.image_url) {
      setGenerated(result);
      setEditedText(result.text || '');
    } else {
      const freshPosts = await api.getPosts().catch(() => []);
      const latestWithContent = freshPosts.find((p) => !!p.text || !!p.image_url);
      if (latestWithContent) {
        setGenerated({ text: latestWithContent.text || '', image_url: latestWithContent.image_url || undefined });
        setEditedText(latestWithContent.text || '');
        setPreviewPostId(latestWithContent.id);
        setScheduleAt(toDateTimeLocal(latestWithContent.publish_at));
      }
    }

    qc.invalidateQueries({ queryKey: ['posts'] });
    toast.success(t('toast_content_generated'));
  }, [qc, t]);

  const handleGenerationError = useCallback((msg: string) => {
    setActiveJobId(null);
    toast.error(msg || t('toast_generation_failed'));
  }, [t]);

  // ── Start generation ───────────────────────────────────────────────
  async function handleGenerate(action_type: 'generate_text' | 'generate_image' | 'generate_both') {
    if (!form.topic.trim()) { toast.error(t('toast_enter_topic')); return; }

    try {
      let uploadedImageUrl = productImageUrl;

      if (productImage) {
        const fd = new FormData();
        fd.append('file', productImage);

        const upRes = await fetch('/api/uploads/product-image', {
          method: 'POST',
          body: fd,
        });
        const upData = await upRes.json();
        if (!upRes.ok) {
          toast.error(upData.error || 'Image upload failed');
          return;
        }
        uploadedImageUrl = upData.url;
        setProductImageUrl(uploadedImageUrl);
      }

      const res = await fetch('/api/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, product_image_url: uploadedImageUrl || null, action_type }),
      });
      const data = await res.json();

      if (res.status === 402) {
        toast.error(data.error || 'Not enough credits! Please buy more credits.');
        return;
      }
      if (!res.ok) {
        toast.error(data.error || t('toast_generation_failed'));
        return;
      }

      if (data.sync) {
        // n8n responded synchronously (no generation_jobs table)
        setGenerated(data);
        setEditedText(data.text);
        setPreviewPostId(null);
        toast.success(t('toast_content_generated'));
      } else {
        // Async: show overlay and poll
        setActiveJobId(data.job_id);
      }
    } catch {
      toast.error(t('toast_generation_failed'));
    }
  }

  function handleSchedule() {
    if (!generated) return;
    if (previewPostId) {
      updateMutation.mutate({
        id: previewPostId,
        body: {
          text: editedText,
          publish_at: scheduleAt || null,
        },
      });
      return;
    }

    scheduleMutation.mutate({
      text: editedText,
      image_url: generated.image_url,
      platform: form.platform,
      publish_at: scheduleAt || undefined,
    });
  }

  function handleDelete(id: string) {
    if (!confirm(t('confirm_delete_post'))) return;
    deleteMutation.mutate(id);
  }

  function toDateTimeLocal(iso?: string | null) {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
  }

  function startEdit(post: Post) {
    setEditingId(post.id);
    setEditText(post.text || '');
    setEditPublishAt(toDateTimeLocal(post.publish_at));
  }

  function saveEdit() {
    if (!editingId) return;
    updateMutation.mutate({
      id: editingId,
      body: { text: editText, publish_at: editPublishAt || null },
    });
  }

  const filtered = posts?.filter(p => {
    if (filter.platform && p.platform !== filter.platform) return false;
    if (filter.status && p.status !== filter.status) return false;
    return true;
  }) ?? [];

  const toneLabels: Record<string, string> = {
    formal: t('tone_formal'), casual: t('tone_casual'), sales: t('tone_sales'),
  };

  useEffect(() => {
    const el = previewTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [editedText]);

  return (
    <div>
      <Toaster position="top-right" />


      <div className="page-header">
        <h1 className="text-heading">{t('page_posts_title')}</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginTop: 4 }}>
          {t('page_posts_sub')}
        </p>
      </div>

      <div className="page-body">
        <div className="tabs">
          <button className={`tab-btn${tab === 'create' ? ' active' : ''}`} onClick={() => setTab('create')}>
            <Sparkles size={14} style={{ marginInlineEnd: 6, verticalAlign: 'middle' }} />{t('tab_create')}
          </button>
          <button className={`tab-btn${tab === 'scheduled' ? ' active' : ''}`} onClick={() => setTab('scheduled')}>
            <Calendar size={14} style={{ marginInlineEnd: 6, verticalAlign: 'middle' }} />{t('tab_scheduled')}
            {posts && <span className="badge" style={{ marginInlineStart: 8 }}>{posts.filter(p => p.status === 'scheduled').length}</span>}
          </button>
        </div>

        {tab === 'create' && (
          <div className="grid-2">
            {/* ── Form ── */}
            <div className="card">
              <h2 className="text-subhead" style={{ marginBottom: 20 }}>{t('generate_content_title')}</h2>

              <div className="form-group">
                <label className="form-label" htmlFor="topic">{t('label_topic')}</label>
                <input
                  id="topic" className="form-input"
                  value={form.topic}
                  onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                  onKeyDown={e => e.key === 'Enter' && handleGenerate('generate_both')}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="platform">{t('label_platform')}</label>
                  <select id="platform" className="form-select" value={form.platform} onChange={e => setForm(f => ({ ...f, platform: e.target.value }))}>
                    {PLATFORMS.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="tone">{t('label_tone')}</label>
                  <select id="tone" className="form-select" value={form.tone} onChange={e => setForm(f => ({ ...f, tone: e.target.value }))}>
                    {TONES.map(tone => <option key={tone} value={tone}>{toneLabels[tone]}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="lang">{t('label_language_content')}</label>
                <select id="lang" className="form-select" value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                  <option value="en">{t('lang_english')}</option>
                  <option value="ar">{t('lang_arabic')}</option>
                  <option value="fr">{t('lang_french')}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="product-image">Product Image (Optional)</label>
                <input
                  id="product-image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="form-input"
                  onChange={e => setProductImage(e.target.files?.[0] ?? null)}
                />
                {(productImage || productImageUrl) && (
                  <p style={{ marginTop: 6, fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                    {productImage ? `Selected: ${productImage.name}` : 'Image uploaded and ready'}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleGenerate('generate_text')}
                  disabled={!!activeJobId}
                >
                  {activeJobId ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <FileText size={14} />}
                  {t('btn_generate_text')}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleGenerate('generate_image')}
                  disabled={!!activeJobId}
                >
                  <ImageIcon size={14} /> {t('btn_generate_image')}
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleGenerate('generate_both')}
                  disabled={!!activeJobId}
                >
                  <Sparkles size={14} /> {t('btn_generate_both')}
                </button>
              </div>
            </div>

            {/* ── Preview / Generating Card ── */}
            <div>
              {activeJobId ? (
                // Generating — show Remotion animation inline
                <GeneratingCard
                  jobId={activeJobId}
                  onComplete={handleGenerationComplete}
                  onError={handleGenerationError}
                />
              ) : generated ? (
                // Done — show editable result
                <div className="content-preview">
                  <div className="preview-header">
                    <span>{t('preview_label')} — {form.platform}</span>
                    <span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{toneLabels[form.tone]}</span>
                  </div>
                  {generated.image_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={generated.image_url} alt="Generated" className="preview-image" />
                  )}
                  <div className="preview-body">
                    <textarea
                      ref={previewTextareaRef}
                      className="form-textarea"
                      value={editedText}
                      onChange={e => setEditedText(e.target.value)}
                      rows={1}
                      style={{ marginBottom: 16, resize: 'none', overflow: 'hidden' }}
                    />
                    <hr className="divider" />
                    <div className="form-group">
                      <label className="form-label" htmlFor="schedule-at">{t('label_schedule_datetime')} (Optional)</label>
                      <input
                        id="schedule-at" type="datetime-local" className="form-input"
                        value={scheduleAt} onChange={e => setScheduleAt(e.target.value)}
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={handleSchedule}
                      disabled={scheduleMutation.isPending}
                      style={{ width: '100%', justifyContent: 'center' }}
                    >
                      {scheduleMutation.isPending
                        ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                        : <Calendar size={14} />
                      }
                      {scheduleAt ? t('btn_schedule_post') : 'Save Post'}
                    </button>
                  </div>
                </div>
              ) : (
                // Empty state
                <div className="card-flat empty-state" style={{ minHeight: 380 }}>
                  <Sparkles size={40} />
                  <p className="text-body-med" style={{ color: 'var(--color-text-secondary)' }}>{t('generate_empty_title')}</p>
                  <p style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>{t('generate_empty_sub')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Scheduled posts table ── */}
        {tab === 'scheduled' && (
          <div>
            <div className="filters-row">
              <select
                className="form-select" style={{ width: 'auto', minWidth: 140 }}
                value={filter.platform} onChange={e => setFilter(f => ({ ...f, platform: e.target.value }))}
              >
                <option value="">{t('filter_all_platforms')}</option>
                {PLATFORMS.map(p => <option key={p} value={p} style={{ textTransform: 'capitalize' }}>{p}</option>)}
              </select>
              <select
                className="form-select" style={{ width: 'auto', minWidth: 140 }}
                value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
              >
                <option value="">{t('filter_all_status')}</option>
                <option value="scheduled">{t('status_scheduled')}</option>
                <option value="draft">Draft</option>
                <option value="posted">{t('status_posted')}</option>
                <option value="failed">{t('status_failed')}</option>
              </select>
            </div>

            {postsLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 56, borderRadius: 8 }} />)}
              </div>
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <Calendar size={40} />
                <p>{t('no_posts_found')}</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>{t('col_platform')}</th>
                      <th>{t('col_content')}</th>
                      <th>{t('col_status')}</th>
                      <th>{t('col_scheduled_at')}</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(post => (
                      <tr key={post.id}>
                        <td><span className="badge badge-gray" style={{ textTransform: 'capitalize' }}>{post.platform}</span></td>
                        <td style={{ maxWidth: 280 }}>
                          {editingId === post.id ? (
                            <textarea
                              className="form-textarea"
                              rows={3}
                              value={editText}
                              onChange={e => setEditText(e.target.value)}
                            />
                          ) : (
                            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', fontSize: '0.88rem', color: 'var(--color-text-secondary)' }}>
                              {post.text || '—'}
                            </span>
                          )}
                        </td>
                        <td><StatusBadge status={post.status} t={t} /></td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>
                          {editingId === post.id ? (
                            <input
                              type="datetime-local"
                              className="form-input"
                              value={editPublishAt}
                              onChange={e => setEditPublishAt(e.target.value)}
                            />
                          ) : (
                            post.publish_at ? new Date(post.publish_at).toLocaleString() : 'Not scheduled'
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            {editingId === post.id ? (
                              <>
                                <button className="btn btn-secondary btn-sm" onClick={saveEdit} disabled={updateMutation.isPending}>
                                  Save
                                </button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)} disabled={updateMutation.isPending}>
                                  Cancel
                                </button>
                              </>
                            ) : (
                              <button className="btn-icon btn-ghost" title="Edit" onClick={() => startEdit(post)}>
                                <Pencil size={14} />
                              </button>
                            )}
                            <button
                              className="btn-icon btn-ghost" title="Delete"
                              disabled={deleteMutation.isPending || updateMutation.isPending}
                              onClick={() => handleDelete(post.id)}
                            >
                              <Trash2 size={14} style={{ color: 'var(--color-error)' }} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`.spin { animation: spin 1s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
