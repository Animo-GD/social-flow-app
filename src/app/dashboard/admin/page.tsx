'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useLang } from '@/lib/LanguageContext';

export default function AdminUsersPage() {
  const { t } = useLang();
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-users'], queryFn: api.getAdminUsers });

  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const createUser = useMutation({
    mutationFn: api.createAdminUser,
    onSuccess: () => {
      setEmail('');
      setName('');
      setPassword('');
      setFormError('');
      return qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: Error) => setFormError(e.message || 'Failed to create user'),
  });

  const deleteUser = useMutation({
    mutationFn: api.deleteAdminUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users = useMemo(() => data ?? [], [data]);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError('');
    createUser.mutate({ email, name, password });
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="text-heading">{t('page_admin_title')}</h1>
        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.94rem', marginTop: 4 }}>
          {t('page_admin_sub')}
        </p>
      </div>

      <div className="page-body" style={{ display: 'grid', gap: 20 }}>
        <div className="card">
          <h2 className="text-subhead" style={{ marginBottom: 16 }}>{t('admin_create_user')}</h2>
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12, maxWidth: 560 }}>
            <input
              className="form-input"
              placeholder={t('label_email')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              className="form-input"
              placeholder={t('admin_name_optional')}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="form-input"
              type="password"
              placeholder={t('label_password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            {formError ? <p style={{ color: 'var(--color-error)', margin: 0 }}>{formError}</p> : null}
            <button className="btn btn-primary" type="submit" disabled={createUser.isPending}>
              {createUser.isPending ? t('admin_creating') : t('admin_create_btn')}
            </button>
          </form>
        </div>

        <div className="card">
          <h2 className="text-subhead" style={{ marginBottom: 16 }}>{t('admin_users_list')}</h2>
          {isLoading ? <p>{t('loading')}</p> : null}
          {error ? <p style={{ color: 'var(--color-error)' }}>{(error as Error).message}</p> : null}
          {!isLoading && !error ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>{t('label_email')}</th>
                    <th>{t('admin_name_col')}</th>
                    <th>{t('admin_created_col')}</th>
                    <th>{t('col_action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.email}</td>
                      <td>{user.name}</td>
                      <td>{user.created_at ? new Date(user.created_at).toLocaleString() : '-'}</td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            if (confirm(`Delete ${user.email}?`)) deleteUser.mutate(user.id);
                          }}
                          disabled={deleteUser.isPending}
                        >
                          {t('admin_delete_btn')}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ color: 'var(--color-text-muted)' }}>
                        {t('admin_empty')}
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
