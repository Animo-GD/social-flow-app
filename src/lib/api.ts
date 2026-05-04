// API client — all calls go through NEXT_PUBLIC_API_URL

function resolveBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL || '';
  if (!configured) return '';
  if (typeof window === 'undefined') return configured;

  const browserHost = window.location.hostname;
  const browserIsLocal = browserHost === 'localhost' || browserHost === '127.0.0.1';

  try {
    const configuredUrl = new URL(configured);
    const configuredHost = configuredUrl.hostname;
    const configuredIsLocal = configuredHost === 'localhost' || configuredHost === '127.0.0.1';

    if (!browserIsLocal && configuredIsLocal) return '';
  } catch {
    return '';
  }

  return configured;
}

const BASE = resolveBaseUrl();

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }
  return res.json();
}

// ── Posts ──
export interface Post {
  id: string;
  platform: 'instagram' | 'linkedin' | 'x';
  status: 'draft' | 'scheduled' | 'posted' | 'failed' | 'completed';
  publish_at?: string | null;
  created_at?: string;
  text?: string;
  image_url?: string;
  product_notes?: string;
}

export const api = {
  // Content
  generateContent: (body: { topic: string; platform: string; tone: string; language: string; product_notes?: string }) =>
    req<{ text: string; image_url?: string }>('/api/content/generate', { method: 'POST', body: JSON.stringify(body) }),

  // Posts
  getPosts: () => req<Post[]>('/api/posts'),
  schedulePost: (body: { text: string; image_url?: string; platform: string; publish_at?: string; product_notes?: string }) =>
    req<Post>('/api/posts/schedule', { method: 'POST', body: JSON.stringify(body) }),
  updatePost: (id: string, body: { text?: string; image_url?: string | null; publish_at?: string | null; product_notes?: string }) =>
    req<Post>(`/api/posts/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deletePost: (id: string) => req<void>(`/api/posts/${id}`, { method: 'DELETE' }),

  // Messages
  getConversations: () => req<Conversation[]>('/api/messages'),
  getMessages: (id: string) => req<Message[]>(`/api/messages/${id}`),
  sendMessage: (id: string, text: string) =>
    req<Message>(`/api/messages/${id}/send`, { method: 'POST', body: JSON.stringify({ text }) }),

  // Analytics
  getAnalytics: () => req<Analytics>('/api/analytics'),

  // Settings
  getSettings: () => req<Settings>('/api/settings'),
  updateSettings: (body: Partial<Settings>) =>
    req<Settings>('/api/settings/update', { method: 'POST', body: JSON.stringify(body) }),

  // Admin Users
  getAdminUsers: () => req<AdminUser[]>('/api/admin/users'),
  createAdminUser: (body: { email: string; name?: string; password: string }) =>
    req<AdminUser>('/api/admin/users', { method: 'POST', body: JSON.stringify(body) }),
  updateAdminUser: (id: string, body: { is_admin?: boolean; credits?: number }) =>
    req<AdminUser>(`/api/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteAdminUser: (id: string) => req<{ ok: true }>(`/api/admin/users/${id}`, { method: 'DELETE' }),

  // User Profile
  getUserProfile: () => req<UserProfile>('/api/user/profile'),
  updateUserProfile: (body: Partial<UserProfile> & { current_password?: string; new_password?: string }) =>
    req<UserProfile>('/api/user/profile', { method: 'PATCH', body: JSON.stringify(body) }),
};

export interface Conversation {
  id: string;
  user: string;
  platform: 'whatsapp' | 'telegram';
  last_message: string;
  timestamp: string;
  unread?: number;
}

export interface Message {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  rag_context?: string;
}

export interface Analytics {
  likes: number;
  comments: number;
  shares: number;
  engagement_rate: number;
  time_series: { date: string; posts: number; engagement: number }[];
}

export interface Settings {
  connections: { platform: string; status: 'connected' | 'disconnected' }[];
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  is_admin?: boolean;
  credits?: number;
  created_at?: string;
}

export interface UserProfile {
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
