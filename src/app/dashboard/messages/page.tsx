'use client';

import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Send, BookOpen } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useLang } from '@/lib/LanguageContext';

function platformColor(p: string) {
  return p === 'whatsapp' ? '#25d366' : '#229ed9';
}

export default function MessagesPage() {
  const { t } = useLang();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [showRag, setShowRag] = useState<string | null>(null);

  const { data: conversations, isLoading } = useQuery({ queryKey: ['conversations'], queryFn: api.getConversations });
  const { data: messages, isLoading: msgsLoading } = useQuery({
    queryKey: ['messages', selectedId],
    queryFn: () => api.getMessages(selectedId!),
    enabled: !!selectedId,
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => api.sendMessage(id, text),
    onSuccess: () => { setInput(''); toast.success(t('toast_msg_sent')); },
    onError: () => toast.error(t('toast_msg_failed')),
  });

  const selected = conversations?.find(c => c.id === selectedId);

  return (
    <div>
      <Toaster position="top-right" />
      <div className="page-header">
        <h1 className="text-heading">{t('page_messages_title')}</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginTop: 4 }}>
          {t('page_messages_sub')}
        </p>
      </div>

      <div className="page-body" style={{ padding: 0 }}>
        <div className="chat-wrap">
          {/* Conversations List */}
          <div className="conversations-list">
            {isLoading ? (
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 64, borderRadius: 8 }} />)}
              </div>
            ) : (
              conversations?.map(c => (
                <div
                  key={c.id}
                  className={`conv-item${selectedId === c.id ? ' active' : ''}`}
                  onClick={() => setSelectedId(c.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="conv-platform" style={{ color: platformColor(c.platform) }}>{c.platform}</div>
                    <span className="conv-time">{new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="conv-user">{c.user}</div>
                  <div className="conv-preview">{c.last_message}</div>
                </div>
              ))
            )}
          </div>

          {/* Chat View */}
          <div className="chat-view">
            {!selectedId ? (
              <div className="empty-state" style={{ flex: 1 }}>
                <Send size={40} />
                <p>{t('select_conversation')}</p>
              </div>
            ) : (
              <>
                <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{selected?.user}</div>
                    <div style={{ fontSize: '0.75rem', color: platformColor(selected?.platform || '') }}>{selected?.platform}</div>
                  </div>
                </div>

                <div className="messages-area">
                  {msgsLoading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
                      {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 48, borderRadius: 12, width: i % 2 === 0 ? '60%' : '70%', alignSelf: i % 2 === 0 ? 'flex-end' : 'flex-start' }} />)}
                    </div>
                  ) : messages?.map(msg => (
                    <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                      <div className={`msg ${msg.sender === 'user' ? 'msg-user' : 'msg-agent'}`}>
                        {msg.text}
                        {msg.rag_context && (
                          <div style={{ marginTop: 6 }}>
                            <button
                              onClick={() => setShowRag(showRag === msg.id ? null : msg.id)}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.7, display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}
                            >
                              <BookOpen size={11} /> {t('view_context')}
                            </button>
                            {showRag === msg.id && (
                              <div style={{ marginTop: 6, padding: '6px 10px', background: 'rgba(0,0,0,0.06)', borderRadius: 6, fontSize: '0.78rem', opacity: 0.8 }}>
                                {msg.rag_context}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="msg-time">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ))}
                </div>

                <div className="chat-input-area">
                  <input
                    className="form-input" style={{ flex: 1 }}
                    placeholder={t('type_reply')}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && input.trim()) sendMutation.mutate({ id: selectedId, text: input }); }}
                  />
                  <button
                    className="btn btn-primary"
                    disabled={!input.trim() || sendMutation.isPending}
                    onClick={() => sendMutation.mutate({ id: selectedId, text: input })}
                  >
                    <Send size={14} /> {t('btn_send')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
