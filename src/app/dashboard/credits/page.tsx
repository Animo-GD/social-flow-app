'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CreditCard, Zap, History, CheckCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { useLang } from '@/lib/LanguageContext';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

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

function CreditsContent() {
  const { lang } = useLang();
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const [buying, setBuying] = useState<string | null>(null);

  const { data: balance, refetch: refetchBalance } = useQuery({
    queryKey: ['credits-balance'],
    queryFn: () => fetch('/api/credits/balance').then(r => r.json()),
  });

  const { data: packages } = useQuery({
    queryKey: ['credit-packages'],
    queryFn: () => fetch('/api/credits/packages').then(r => r.json()),
  });

  async function handleBuy(pkg: CreditPackage) {
    setBuying(pkg.id);
    try {
      const res = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: pkg.id }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Checkout failed');
      }
    } catch {
      toast.error('Failed to initiate checkout');
    }
    setBuying(null);
  }

  return (
    <div>
      <Toaster position="top-right" />
      {success && (
        <div style={{ background: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 8, padding: '12px 16px', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 10, color: '#065f46' }}>
          <CheckCircle size={18} /> {lang === 'ar' ? 'تم شراء الكريدت بنجاح!' : 'Credits purchased successfully!'}
        </div>
      )}

      <div className="page-header">
        <h1 className="text-heading">{lang === 'ar' ? 'الكريدت' : 'Credits'}</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginTop: 4 }}>
          {lang === 'ar' ? 'اشترِ كريدتات لتوليد المحتوى بالذكاء الاصطناعي' : 'Buy credits to generate AI content'}
        </p>
      </div>

      <div className="page-body" style={{ display: 'grid', gap: 24 }}>
        {/* Balance Card */}
        <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 56, height: 56, background: 'rgba(0,117,222,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={28} style={{ color: 'var(--color-accent)' }} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {lang === 'ar' ? 'رصيدك الحالي' : 'Your Balance'}
            </div>
            <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1.1 }}>
              {balance?.credits ?? 0}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)' }}>
              {lang === 'ar' ? 'كريدت متاح' : 'credits available'}
            </div>
          </div>
        </div>

        {/* Packages */}
        <div>
          <h2 className="text-subhead" style={{ marginBottom: 16 }}>
            <CreditCard size={18} style={{ marginInlineEnd: 8, verticalAlign: 'middle' }} />
            {lang === 'ar' ? 'حزم الكريدت' : 'Credit Packages'}
          </h2>
          <div className="grid-4">
            {(packages ?? []).map((pkg: CreditPackage) => (
              <div key={pkg.id} className="card" style={{ textAlign: 'center', position: 'relative' }}>
                {pkg.name === 'Pro' && (
                  <div style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: 'var(--color-accent)', color: '#fff', fontSize: '0.72rem', fontWeight: 700, padding: '2px 12px', borderRadius: 99 }}>
                    {lang === 'ar' ? 'الأكثر شيوعًا' : 'Most Popular'}
                  </div>
                )}
                <div style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 4 }}>{pkg.name}</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 700, color: 'var(--color-accent)', lineHeight: 1 }}>
                  {pkg.credits.toLocaleString()}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', marginBottom: 12 }}>
                  {lang === 'ar' ? 'كريدت' : 'credits'}
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: 16 }}>
                  ${pkg.price_usd}
                </div>
                <button
                  className="btn btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => handleBuy(pkg)}
                  disabled={!!buying}
                >
                  {buying === pkg.id ? '...' : lang === 'ar' ? 'شراء الآن' : 'Buy Now'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Transaction History */}
        <div className="card">
          <h2 className="text-subhead" style={{ marginBottom: 16 }}>
            <History size={18} style={{ marginInlineEnd: 8, verticalAlign: 'middle' }} />
            {lang === 'ar' ? 'سجل المعاملات' : 'Transaction History'}
          </h2>
          {(balance?.history ?? []).length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: '24px 0' }}>
              {lang === 'ar' ? 'لا توجد معاملات بعد' : 'No transactions yet'}
            </p>
          ) : (
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{lang === 'ar' ? 'الوصف' : 'Description'}</th>
                    <th>{lang === 'ar' ? 'الكمية' : 'Amount'}</th>
                    <th>{lang === 'ar' ? 'التاريخ' : 'Date'}</th>
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
    </div>
  );
}

export default function CreditsPage() {
  return (
    <Suspense>
      <CreditsContent />
    </Suspense>
  );
}
