# QuoteLoop

## 1. Project Overview

QuoteLoop is a lean B2B micro-SaaS. Solo trade contractors send quotes to customers and then forget to follow up. Leads go cold. QuoteLoop solves this by letting contractors add a customer name, phone number, job description, and quote amount — then automatically sending polite SMS follow-up messages at 48 hours and 7 days if the customer hasn't responded. The contractor gets a simple dashboard showing all open quotes and their status. The name reflects the core idea: your quote goes out, QuoteLoop closes the loop.

## 2. Target User

Solo trade contractors with 1–3 person operations. Plumbers, electricians, HVAC techs, general handymen. They are not technical. They work with their hands all day. The app must be dead simple — usable in 30 seconds while standing on a job site. No jargon. No complexity.

## 3. Core Features (MVP Only)

- Contractor can register and log in
- Contractor can add a new quote (customer name, phone number, job description, quote amount)
- App automatically sends an SMS follow-up at 48 hours after quote is added
- App automatically sends a second SMS follow-up at 7 days if still no response
- Contractor can mark a quote as Won, Lost, or Pending
- Dashboard showing all quotes and their current status
- Freemium model: Free plan (9 quotes/month) + Plus plan ($36/month unlimited)

## 4. Tech Stack

- **Frontend:** Next.js with Tailwind CSS
- **Backend:** Next.js API routes
- **Database:** PostgreSQL with Prisma ORM
- **Messaging:** Telegram Bot API (testing), Twilio SMS (production)
- **Workflow automation:** n8n (local Docker, webhook-triggered follow-ups)
- **Payments:** Stripe
- **Auth:** NextAuth.js (phone + OTP via Telegram)
- **Deployment:** Vercel

## 5. Business Model

- Freemium: Free plan (9 quotes/month, forever) + Plus plan ($36/month, unlimited quotes)
- No credit card required for free plan — removes signup friction
- SMS costs ~$0.007 per message via Twilio (negligible)
- Target: 300 paying Plus customers = ~$10,800 MRR
- Domain: quoteloop.com
- Long-term vision: QuoteLoop becomes the trust layer between contractors and customers, eventually evolving into a two-sided marketplace where customers post jobs and contractors bid on them

## 6. Design Principles

- Mobile-first. Contractors use this on their phone between jobs.
- No unnecessary features in MVP. Build only what is listed in section 3.
- Every screen must be completable in under 30 seconds.
- Plain English everywhere. No technical terms visible to the user.
- Brand feel: modern, clean, premium — inspired by Linear, Vercel, Raycast. Sharp typography, generous whitespace, subtle borders, smooth interactions.

### Design System

- **Font:** Inter via `next/font/google`, weights 400, 500, 600, 700, 800
- **Border radius:** 16px for cards (`rounded-card`/`rounded-2xl`), 8px for buttons/inputs (`rounded-btn`)
- **Shadows:** `shadow-card` for light surfaces, `shadow-glow` (blue glow) for hover effects
- **Transitions:** All interactive elements use `transition-all duration-200` with cubic-bezier easing
- **Animations:** Framer Motion for scroll-triggered reveals, staggered children, word-by-word headlines, counting numbers, floating mockup, hover lifts, shimmer sweeps on buttons, typing indicators

#### Dark theme (entire app):
  - Page background: `#060910` — `page-bg`
  - Surface cards: `#0D1117` — `surface`
  - Border color: `#1E2D3D` — `dark-border`
  - Primary blue: `#3B82F6` — `brand-500`
  - Blue glow: `rgba(59, 130, 246, 0.15)` — `brand-glow`
  - Accent cyan: `#06B6D4` — `accent-cyan`
  - Text primary: `#F0F6FC` — `txt-primary`
  - Text secondary: `#8B949E` — `txt-secondary`
  - Success green: `#238636` — `success-green`
  - Hero gradient: `linear-gradient(135deg, #060910 0%, #0D1B2A 50%, #060910 100%)`
  - CTA gradient: `linear-gradient(135deg, #1E3A5F 0%, #0D1117 100%)`
  - Plus card gradient: `linear-gradient(135deg, #1E3A5F, #0D1B2A)`
  - Headline: clamp(40px, 6vw, 72px), weight 800, tracking -2px
  - Sections: 120px vertical padding desktop, 60px mobile
  - Input style: `input-dark` class (dark bg, dark border, light text)
  - Buttons: solid blue with shimmer sweep on hover (`btn-shimmer`) and blue glow
  - Dashboard: dark surface cards, dark stat cards with `bg-brand-500/10` icons, dark badges (amber/green/gray on dark bg), dark usage bar
  - Sidebar: `bg-surface` with `border-dark-border`, active nav `bg-brand-500 text-white`, mobile bars with `backdrop-blur-xl`
  - Billing: dark pricing cards, Plus card with gradient bg + blue border + glow for active plan

- **Component classes:** `card`, `btn-primary`, `btn-secondary`, `input-field`, `input-dark`, `btn-shimmer`, `nav-link-underline` defined in globals.css
- **Layout:** Sidebar navigation on desktop (240px fixed), bottom nav on mobile with mobile top bar
- **Landing page:** 9 sections — fixed navbar (transparent→blur on scroll, mobile hamburger overlay), two-column hero (animated headline + floating dashboard mockup), social proof counters, how-it-works cards, bento feature grid (SMS conversation mockup, phone mockup, 3 small cards), testimonials with stars + avatars, pricing (free + plus), CTA banner, footer
- **Login/Register:** Dark background (`page-bg`), centered card (`surface` bg, `dark-border`), `input-dark` fields

## 7. Project Status

- **Currently at:** Full booking system complete — customer intake forms, availability, reschedule/cancel, notifications
- Next.js 14 app initialized with App Router, TypeScript, and Tailwind CSS
- Prisma configured with PostgreSQL and full schema (User + Quote models)
- Database pushed via `prisma db push` (using Prisma dev server with embedded Postgres)
- NextAuth.js configured with credentials provider (phone + OTP via Telegram)
- Registration page with name, phone (with country code dropdown), business name fields — no email/password
- Login page with two-step phone + OTP flow: enter phone → receive Telegram code → verify
- POST /api/auth/send-otp generates 6-digit OTP, stores in DB with 5-min expiry, sends via Telegram bot
- OTP verification happens inside NextAuth authorize callback (phone + otp credentials)
- User model: email optional, hashedPassword optional, phone required+unique, otpCode, otpExpiresAt, telegramChatId fields
- Protected dashboard layout that redirects unauthenticated users to /login
- Navbar showing business name and logout button when logged in
- Dashboard showing all quotes with status badges, status update buttons, and empty state
- New quote form at /dashboard/new-quote with customer name, phone, job description, and amount
- POST /api/quotes to create quotes, GET /api/quotes to list contractor's quotes
- PATCH /api/quotes/[id] to update quote status (Won/Lost/Pending)
- Telegram Bot API integration at lib/telegram.ts: sendTelegramMessage(), sendOTP(), sendFollowUpMessage()
- n8n workflow automation at lib/n8n.ts: triggerFollowUpWorkflow(), cancelExecution(), getExecutionStatus()
- n8n workflow "QuoteLoop Follow-Up" created via scripts/setup-n8n-workflow.ts — webhook-triggered, Wait nodes for timing, status checks before sending, Telegram messages to test chat ID
- Quote model has n8nExecutionId field to track running workflow executions
- When quote created → triggers n8n webhook → workflow waits → checks status → sends Telegram follow-ups
- When quote status changes to WON/LOST → cancels n8n execution (stops pending follow-ups)
- When quote goes back to PENDING → re-triggers n8n workflow
- When quote deleted → cancels n8n execution
- GET /api/quotes/[id]/status — callback endpoint for n8n to check if quote is still PENDING (secured by N8N_CALLBACK_SECRET)
- POST /api/quotes/[id]/mark-sent — callback endpoint for n8n to update followUpSentAt timestamps after sending
- SMS templates for 48h and 7d follow-ups with contractor/business name personalization (still in lib/sms-templates.ts)
- "Follow up now" button sends via Telegram instead of Twilio
- Cron follow-up endpoint still exists but no longer in vercel.json (replaced by n8n workflow)
- Dashboard shows follow-up status on each pending quote card
- vercel.json has monthly quota reset cron only (follow-up cron removed, replaced by n8n)
- .env.example updated with all required environment variables including CRON_SECRET
- Freemium model: Free plan (9 quotes/month) + Plus plan ($36/month unlimited)
- SubscriptionStatus enum: FREE, PLUS, CANCELLED, PAST_DUE
- User model tracks quotesUsedThisMonth and quotesResetAt for free plan limits
- Quote creation checks free plan quota (9/month), blocks with upgrade prompt when exceeded
- Monthly cron at /api/cron/reset-quotes resets free plan usage on 1st of each month
- Stripe Checkout for Plus upgrades, Customer Portal for managing billing
- Webhook handles checkout.session.completed (→PLUS), subscription.deleted (→FREE), invoice.payment_failed (→PAST_DUE)
- Cancelled subscriptions downgrade to FREE (keeps free tier access)
- /billing page shows side-by-side Free/Plus plan cards with current plan badge
- Dashboard shows usage bar for free plan users (blue → amber at 8/9 → red at 9/9)
- Dashboard never blocks access — only quote creation is gated by free plan limit
- Navbar includes Billing link
- No credit card required for signup — new users start on FREE plan
- Landing page with hero, how it works, pricing, and footer sections
- All API routes wrapped in try/catch with friendly error messages
- Loading spinners on all forms and data-fetching pages
- Phone number validation (inline error on blur, server-side 10-digit minimum)
- Improved empty state on dashboard with call-to-action button
- Status messages when marking quotes as Won ("Great work!") or Lost ("Noted. On to the next one.")
- All buttons min 44px height for mobile tap targets, all inputs py-3 for readability
- Page titles on every page (browser tab)
- Rate limiting on /register — max 5 per IP per hour
- All Stripe errors show friendly billing error message
- Database connection errors show "We're having trouble connecting. Please refresh."
- Full UI redesign: Inter font, design tokens, component classes (card, btn-primary, btn-secondary, input-field)
- Sidebar navigation on desktop (240px fixed), bottom nav + top bar on mobile
- Time-of-day greeting ("Good morning/afternoon/evening, [name]")
- Dashboard stats row: Total quotes, Won, Conversion rate
- Quote cards with colored left border (blue=pending, green=won, gray=lost)
- Mobile floating action button for adding quotes
- Landing page completely rebuilt with dark theme (#060910 bg), Framer Motion animations, 9 sections: navbar, hero with floating dashboard mockup, social proof counters, how-it-works, bento feature grid with SMS conversation + phone mockup, testimonials, pricing, CTA banner, footer
- Landing page split into separate client components in src/components/landing/ for performance (Navbar, Hero, SocialProof, HowItWorks, Features, Testimonials, Pricing, CTA, Footer)
- framer-motion installed for scroll-triggered animations, word-by-word headline, staggered cards, counting numbers, floating mockup, shimmer buttons, mobile menu overlay
- Inter font loaded via next/font/google instead of CDN import
- Login/register pages: dark theme (#060910 bg), centered card with #0D1117 surface, input-dark fields, 400px max-width
- New quote page: back arrow, centered form at 520px max-width
- Full webapp dark theme: dashboard, sidebar, new quote form, and billing pages all converted to dark design system (bg-page-bg, bg-surface, border-dark-border, txt-primary/secondary, input-dark)
- Dashboard: dark stat cards with brand-500/10 icon backgrounds, dark quote cards with colored left borders, dark status badges, dark usage bar
- Sidebar: dark surface background, brand-500/10 greeting card, active nav bg-brand-500, mobile bars with backdrop-blur
- Billing: dark pricing cards, Plus card with gradient background (135deg #1E3A5F→#0D1B2A), active plan glow
- Custom follow-up timing: contractors choose when follow-ups are sent per quote using number + unit selector (minutes/hours/days)
- Follow-up timing stored in minutes internally: Quote model has followUp1Minutes (Int, default 2880) and followUp2Minutes (Int?, default 10080)
- User model has defaultFollowUp1Minutes (Int, default 2880) and defaultFollowUp2Minutes (Int?, default 10080) for default timing preferences
- New quote form has number input + unit dropdown (minutes/hours/days) with live preview of send dates, toggle for second follow-up
- Minimum follow-up time: 5 minutes, maximum: 30 days (43200 minutes)
- Shared time utility at lib/time.ts: toMinutes(), toReadable(), toDisplayString(), formatPreviewDate(), MIN/MAX constants
- PhoneInput component (src/components/PhoneInput.tsx) with country code dropdown for 60+ countries
- Country codes data at lib/country-codes.ts
- New quote form and edit quote form use PhoneInput component
- "Follow up now" button on dashboard sends via Telegram (not Twilio)
- POST /api/quotes/[id]/follow-up-now route for instant follow-ups with ownership verification
- Toast notification system (ToastProvider) with success/error variants, auto-dismiss after 3s, stacking
- Settings page at /dashboard/settings for default follow-up timing with number + unit selector
- GET/PATCH /api/settings route for reading/updating user settings
- New quote form pre-selects the user's default timing from settings
- Settings link with gear icon added to sidebar navigation
- SMS templates shared via lib/sms-templates.ts — both cron job and instant follow-up import from same file
- Edit quote page at /dashboard/quotes/[id] — pre-populated form to modify all quote fields
- PUT /api/quotes/[id] to update all quote fields, DELETE /api/quotes/[id] to remove a quote
- Edit page disables follow-up timing inputs if that follow-up has already been sent
- Edit page includes status selector (Pending/Won/Lost) and inline delete confirmation
- Dashboard quote cards are clickable (navigates to edit page), with hover pencil icon
- Action buttons (Won/Lost/Follow-up-now) use stopPropagation to prevent navigation
- Dashboard shows follow-up timing display using toDisplayString() from lib/time.ts
- n8n running locally via Docker at localhost:5678, workflow activated with webhook at /webhook/quote-followup
- For testing: all Telegram messages go to hardcoded test chat ID (TELEGRAM_TEST_CHAT_ID env var)
- For production: switch to Twilio SMS by updating lib/telegram.ts and n8n workflow Send nodes
- Settings page expanded into full profile + settings page with three sections: Profile (name, business name, phone), Default follow-up timing, Default follow-up messages
- User model has defaultFollowUp1Message and defaultFollowUp2Message fields for default message templates
- Settings API (GET/PATCH /api/settings) returns and accepts profile fields + default messages
- Phone uniqueness check on settings update (excludes current user)
- Custom messages per quote: Quote model has useCustomMessage1, customMessage1, useCustomMessage2, customMessage2 fields
- New quote form and edit quote form have toggle + textarea for custom messages per follow-up
- When custom message toggle is ON, the custom message bypasses the default system message
- New quote form pre-fills custom message textarea with user's default message from settings (if set)
- n8n webhook payload includes custom message fields (useCustomMessage1/2, customMessage1/2)
- n8n workflow Telegram send nodes check for custom message before falling back to default
- "Follow up now" endpoint uses custom message when set, falls back to default templates
- Cancel follow-ups: PATCH /api/quotes/[id] accepts { cancelFollowUps: true } to stop pending follow-ups
- Quote model has followUpCancelled Boolean field — when true, n8n execution is stopped and no more follow-ups are sent
- Dashboard shows "Cancel follow-ups" button on pending quotes with active follow-ups
- Dashboard shows "Follow-ups cancelled" label when follow-ups have been cancelled
- Live countdown on dashboard: quote cards update every 60 seconds showing time remaining until next follow-up
- Dashboard filter tabs: Pending (default), Won, Lost, All — pending quotes shown by default, won/lost quotes move out of default view
- "Follow up now" button shows confirmation modal before sending, displays how many messages have already been sent for that quote
- Static "Timing: X" label removed from quote cards — replaced by live countdown (e.g. "Follow-up 1 in 2 hours")
- Quote expiration: optional expiry date per quote (number of days from creation)
- User model has defaultExpirationDays (Int?, null = no expiry) for default expiration setting
- Quote model has expiresAt (DateTime?, null = no expiry) calculated from createdAt + expirationDays
- Settings page has quote expiration section with toggle and days input
- New quote and edit quote forms have expiration toggle + days input, pre-filled from user's default
- Dashboard shows "Expires [date]" or "Expires tomorrow" / "Expires in X days" on pending quote cards
- Expiry label turns amber when within 3 days of expiration
- Auto-close on dashboard load: expired PENDING quotes are automatically marked as LOST when user views dashboard
- Daily cron at /api/cron/expire-quotes runs at 6 AM UTC to auto-close expired quotes and cancel n8n executions
- vercel.json has both monthly quota reset cron and daily expiry cron
- Final follow-up message (7d / second follow-up) mentions expiry date when quote has expiration set ("your quote expires on [date]")
- n8n webhook payload includes expiresAt field for expiry-aware messaging
- Database schema expanded: WeeklySchedule, BlockedDate, Booking, Notification models + BookingStatus enum
- User model expanded with jobDurationMinutes, bufferMinutes, autoConfirmBookings, autoFollowUpsUsedThisMonth fields
- Quote model expanded with formToken, formSubmittedAt, durationMinutes fields
- Availability system: weekly schedule (7-day grid), blocked dates, buffer time between appointments
- Slot calculation algorithm at lib/slots.ts: generates available time slots based on schedule, blocked dates, existing bookings, buffer
- GET/PUT /api/availability for weekly schedule CRUD
- GET/POST /api/availability/blocked-dates and DELETE /api/availability/blocked-dates/[id]
- GET /api/availability/slots returns available slots for date range (public endpoint for forms + manual booking)
- Settings page: availability section with weekly schedule grid, job duration dropdown, buffer time, blocked dates, auto-confirm toggle
- Quote creation generates formToken (unique link for customer intake form)
- Per-quote job duration override (dropdown on new quote form, defaults to user setting)
- Form link included in follow-up messages for Plus users only
- Customer intake form at /form/[token] — public page (no auth), dark theme
- Form shows contractor's business name, quote amount, customer fields, SlotPicker, LocationInput
- SlotPicker component (src/components/SlotPicker.tsx): week-by-week slot picker, shows available times, grayed booked slots
- LocationInput component (src/components/LocationInput.tsx): GPS button + manual address input with Nominatim geocoding
- Form submission creates Booking record with slot race condition prevention (atomic check + insert)
- Auto-confirm if contractor has autoConfirmBookings enabled, otherwise PENDING_CONFIRMATION with 24h hold
- Messaging abstraction at lib/messaging.ts: sendMessage() function (currently uses Telegram, ready for Twilio/SMS)
- Booking confirmation flow: contractor reviews, confirms, or declines bookings at /dashboard/bookings/[id]
- GET/PATCH /api/bookings/[id] for booking detail + confirm/decline/complete actions
- Confirm sends customer confirmation with reschedule/cancel links
- Decline releases slot and notifies customer
- Bookings dashboard at /dashboard/bookings with calendar view (day + week modes)
- CalendarView component (src/components/CalendarView.tsx): hourly grid 6AM-9PM, booking blocks positioned by time, color-coded by status, red "now" indicator, day/week views
- Day view: single day with hourly grid, booking blocks showing name/time/job/amount based on block height
- Week view: 7-day columns (Sun-Sat) with compact booking blocks, day headers with date numbers
- Navigation: prev/next arrows, Today button, Day/Week toggle, smart date labels ("Today"/"Tomorrow"/full date/week range)
- Manual booking form at /dashboard/bookings/new — contractor creates booking directly
- POST /api/bookings/manual creates manual booking (auto-confirmed, sends customer notification)
- Reschedule flow at /reschedule/[token] — public page with SlotPicker, auto-confirms if original was confirmed
- GET/POST /api/reschedule/[token] handles reschedule validation + execution
- Reschedule generates new tokens, notifies contractor, sends updated confirmation to customer
- Cancel flow at /cancel/[token] — public page with booking summary + confirmation prompt
- GET/POST /api/cancel/[token] handles cancellation (24h cutoff, token expiry, status checks)
- Cancel sets status=CANCELLED, notifies contractor
- In-app notification system: NotificationBell component in sidebar/mobile top bar
- GET /api/notifications (paginated, with unread count), PATCH /api/notifications/[id]/read, PATCH /api/notifications/read-all
- Notification helper at lib/notifications.ts: createNotification() used across all booking events
- NotificationBell: bell icon with red badge (unread count), dropdown panel with notification list, 30s polling
- Click notification marks as read + navigates to relevant booking
- Notification types: booking_request, auto_confirmed, reschedule, cancel, hold_expiring, reminder_24h
- Hold reminder cron at /api/cron/hold-reminders (hourly) — reminds contractor when hold is expiring
- Appointment reminder cron at /api/cron/appointment-reminders (daily 8am UTC) — 24h before confirmed bookings
- vercel.json crons: reset-quotes (monthly), expire-quotes (daily 6am), hold-reminders (hourly), appointment-reminders (daily 8am)
- Sidebar updated with Bookings nav item (calendar icon)
- Dashboard shows today's bookings summary section with links to booking details
- Dashboard quote cards have "Copy form link" button for pending quotes (copies /form/[formToken])
- Free plan: unlimited manual quotes + 3 auto follow-ups/month, no form link in messages, no customer intake form, no bookings
- Plus plan: unlimited everything — auto follow-ups, form links, customer intake forms, full booking system
- Free plan enforcement: form endpoint returns 403 for free contractors, auto follow-up gating (3/month)
- Dashboard usage bar shows both quote usage and auto follow-up usage for free users
- Billing info API returns autoFollowUpsUsedThisMonth
- Monthly cron resets both quotesUsedThisMonth and autoFollowUpsUsedThisMonth
- UX redesign: simplified navigation — 3-tab layout (Home, Quotes, Schedule) + profile dropdown menu (Settings, Billing, Log out)
- Sidebar narrowed to 220px on desktop with "New Quote" CTA button, mobile bottom nav reduced to 3 items
- Dashboard redesigned as clean home page: compact stats row, today's schedule, upcoming bookings, single CTA
- Quotes page at /dashboard/quotes — dedicated page with filter tabs (Pending/Won/Lost/All), quote cards with inline actions
- "Booking form" button on quote cards (clipboard icon) copies customer intake form link
- SlotPicker redesigned as Microsoft-style two-step picker: month calendar grid → click date → 3-column time slot grid
- SlotPicker shows blue dots under available dates, grays out past dates and non-working days, 3-month max navigation
- Timezone bug fixed in lib/slots.ts: local date formatting instead of toISOString() to prevent UTC date shifting
- CalendarView redesigned: 72px hour height, 3px left accent borders, overlap detection for side-by-side blocks, pulsing now indicator
- Booking deletion: DELETE /api/bookings/[id] with inline confirmation UI on booking detail page
- Multi-select on Quotes page: checkboxes, select-all, floating action bar with Won/Lost/Pending/Delete bulk actions
- POST /api/quotes/bulk for bulk quote actions (WON/LOST/PENDING/DELETE with ownership verification)
- Multi-select on Bookings page: List view mode with checkboxes, select-all, floating action bar with Confirm/Complete/Delete
- POST /api/bookings/bulk for bulk booking actions (CONFIRMED/COMPLETED/DELETE with ownership verification)
- Bookings page has three view modes: Day, Week, List — List view supports multi-select
- ProfileMenu component with click-outside detection for Settings/Billing/Logout dropdown
- **Next step:** Deploy to Vercel, set up production Twilio SMS

## 8. Key Decisions Log

- **Name:** QuoteLoop — chosen because it describes the core action (closing the loop on a quote), domain quoteloop.com is available
- Switched from Twilio SMS cron to n8n workflow + Telegram for follow-ups (Twilio kept for production)
- Switched from email+password auth to phone+OTP via Telegram bot for simpler contractor login
- Using Stripe for billing because it is the industry standard
- Chose Next.js over separate frontend/backend to keep the codebase simple for a solo developer
- No mobile app in MVP — web app only, optimised for mobile browsers

## 9. Instructions for Claude Code

- Always read this file at the start of every session before doing anything
- Never add features not listed in the MVP section without asking first
- Keep code simple and readable — this project is maintained by a solo non-technical founder using AI assistance
- After completing each task, update the "Project status" section of this file to reflect what was just built
- When in doubt about a product decision, refer to the target user description in section 2
