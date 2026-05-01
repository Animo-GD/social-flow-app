'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect, useState } from 'react';
import { LanguageProvider } from './LanguageContext';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
          mutations: { retry: 0 },
        },
      })
  );

  useEffect(() => {
    function onUnhandledRejection(event: PromiseRejectionEvent) {
      const reason = event.reason;
      const message =
        typeof reason === 'string'
          ? reason
          : reason && typeof reason === 'object' && 'message' in reason
            ? String((reason as { message?: unknown }).message ?? '')
            : '';

      if (message.includes('A listener indicated an asynchronous response by returning true')) {
        event.preventDefault();
      }
    }

    window.addEventListener('unhandledrejection', onUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', onUnhandledRejection);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        {children}
      </LanguageProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
