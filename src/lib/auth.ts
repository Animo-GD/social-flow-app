import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: 'jwt' },
  secret: process.env.NEXTAUTH_SECRET || 'dev-secret-change-in-production',
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        // Query Supabase — bcrypt check via pgcrypto
        const { data, error } = await supabase.rpc('verify_user_password', {
          p_email: credentials.email as string,
          p_password: credentials.password as string,
        });

        if (error || !data || data.length === 0) {
          // Fallback: demo credentials when DB function not yet available
          if (
            credentials.email === 'admin@socialflow.ai' &&
            credentials.password === 'demo'
          ) {
            return { id: 'demo', name: 'Admin', email: 'admin@socialflow.ai' };
          }
          return null;
        }

        const user = data[0];
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  pages: { signIn: '/login' },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) (session.user as { id?: string }).id = token.id as string;
      return session;
    },
  },
});
