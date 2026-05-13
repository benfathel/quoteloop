<img width="3428" height="2214" alt="CleanShot 2026-05-10 at 18 12 42@2x" src="https://github.com/user-attachments/assets/77cb1b21-6da8-46d2-b416-48a094a19a70" />
# QuoteLoop

QuoteLoop is a full-stack B2B SaaS app for solo trade contractors who need a simple way to track quotes, follow up with customers, and turn accepted quotes into bookings.

The product is built for mobile-first field use: a contractor can add a quote, let QuoteLoop handle follow-ups, and manage booking requests from one dashboard.

## Core Features

- Phone + OTP authentication with NextAuth
- Quote dashboard with pending, won, lost, and bulk actions
- Custom follow-up timing, quote expiration, and per-quote message overrides
- n8n-powered follow-up workflow with secure callback endpoints
- Free and Plus plan limits with Stripe Checkout and billing portal
- Public customer intake form for Plus quotes
- Availability settings with weekly hours, blocked dates, job duration, and buffer time
- Booking requests, manual bookings, reschedule/cancel links, and in-app notifications
- Vercel cron routes for quota reset, quote expiration, hold reminders, and appointment reminders

## Tech Stack

- Next.js 14 App Router
- React 18 + TypeScript
- Tailwind CSS
- Prisma 7 + PostgreSQL
- NextAuth credentials provider
- Stripe subscriptions
- n8n workflow automation
- Telegram test messaging, with Twilio helper ready for production SMS work

## Project Structure

```text
src/app/                 Next.js pages, layouts, and API routes
src/components/          Shared UI and landing page components
src/lib/                 Auth, Prisma, messaging, Stripe, n8n, slots, utilities
src/types/               NextAuth type augmentation
prisma/schema.prisma     Database schema
scripts/                 Local workflow and test scripts
docs/cv-entry.md         CV-ready project description
```

## Getting Started

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env
```

Generate Prisma client:

```bash
npm run postinstall
```

Run the development server:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Useful Commands

```bash
npm run lint
npm run build
npm start
```

## Environment Variables

See `.env.example` for the required keys:

- `DATABASE_URL`, `DIRECT_URL`
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_TEST_CHAT_ID`
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_ID`
- `N8N_BASE_URL`, `N8N_API_KEY`, `N8N_WEBHOOK_URL`, `N8N_CALLBACK_SECRET`
- `CRON_SECRET`

## Current Status

The app builds and lints cleanly. The private repository is ready for continued product hardening.

Known pre-launch work:

- Wire production SMS delivery instead of Telegram test routing.
- Enforce server-side availability validation in all booking mutation routes.
- Reuse shared quote and booking action services for single and bulk operations.
- Tighten Free vs Plus gating across all booking routes.
- Add regression tests for quote creation, follow-up cancellation, booking confirmation, and plan limits.
