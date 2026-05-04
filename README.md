# 🚀 SocialFlow — AI-Powered Social Media Marketing

SocialFlow is a premium AI marketing system designed to automate social media content creation, scheduling, and analytics. It features a robust onboarding flow, secure authentication, and integrated payments.

## ✨ Key Features
- **AI Content Generation**: Create high-quality text and images for social media using integrated AI workflows.
- **Strict Onboarding**: Secure flow that ensures business profiles are complete before dashboard access.
- **Multi-Platform Support**: Manage content for Facebook, Instagram, LinkedIn, and more.
- **Secure Auth**: OTP-based verification and session management with cache-busting security.
- **Integrated Payments**: Support for Paymob (InstaPay, Credit Cards, Wallets).
- **Dual Language**: Fully localized in English and Arabic.

---

## 🛠 Tech Stack
- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router, Turbopack)
- **Database/Auth**: [Supabase](https://supabase.com/)
- **UI/UX**: Vanilla CSS (Premium Custom Design System), Lucide Icons
- **State Management**: TanStack Query
- **Email**: Resend
- **Payments**: Paymob

---

## 💻 Local Setup

### 1. Prerequisites
- Node.js 20+ installed.
- A Supabase project.
- A Resend account (for email verification).
- Paymob account (optional for payments testing).

### 2. Clone and Install
```bash
git clone https://github.com/your-username/social-flow-app.git
cd social-flow-app
npm install
```

### 3. Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in the following essential keys:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_API_URL` (set to `http://localhost:3000`)

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to see the application.

---

## 🐳 Docker Setup

You can run the entire stack locally using Docker:

```bash
# Build and start
docker compose up --build

# Stop
docker compose down
```

The application includes a built-in health check at `/api/health` which Docker and Traefik use to monitor availability.

---

## 📁 Project Structure
- `/src/app`: Next.js App Router (Pages and API routes).
- `/src/components`: Reusable UI components.
- `/src/lib`: Shared utilities (Supabase client, session management, i18n).
- `/src/proxy.ts`: Auth proxy and security middleware.
- `/public`: Static assets.

---

## 🔒 Security
- **Auth Guard**: Protected routes are gated by `src/proxy.ts`.
- **Cache Control**: Logout process uses `no-store` headers to prevent unauthorized "Back" button navigation.
- **Environment Safety**: Secrets are never exposed to the client; only `NEXT_PUBLIC_` variables are available in the browser.

---

## 📜 License
Internal Project - All Rights Reserved.
