# SaySo - Family Quote & Memory Capture App

SaySo is a production-ready MVP that lets families and close friends quickly capture short quotes and memories, organize them by person and tags, and generate beautiful print-ready books.

## Features

- **Quick Capture**: Add quotes in under 10 seconds with person attribution and tags
- **Beautiful Books**: Generate print-ready PDF books with elegant layouts
- **People Management**: Organize entries by person with profiles
- **CSV Import**: Bulk import entries from CSV files
- **Private & Secure**: All data is private to your household with Row Level Security
- **Mobile-First**: Optimized for mobile devices with a clean, modern UI

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, TailwindCSS, shadcn/ui
- **Backend**: Supabase (Postgres + Auth + RLS + Storage)
- **PDF Generation**: Playwright (server-side)
- **Payments**: Stripe (optional)
- **Hosting**: Vercel

## Setup Instructions

### Prerequisites

- Node.js 18 or 20
- pnpm (or npm)
- Supabase account
- Vercel account (for deployment)

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd KidsSayThings
pnpm install
```

### 2. Set Up Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to Settings > API and copy:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (from Settings > API > Service Role)

### 3. Run Database Migrations

Option A: Using Supabase CLI
```bash
supabase init
supabase link --project-ref <your-project-ref>
supabase db push
```

Option B: Using Supabase Dashboard
1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Paste and run in SQL Editor

### 4. Create Storage Bucket

1. Go to Storage in Supabase Dashboard
2. Create a new bucket named `attachments`
3. Set it to private (RLS will control access)

### 5. Set Up Environment Variables

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Optional: Stripe (for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID_MONTHLY=price_...
STRIPE_PRICE_ID_ANNUAL=price_...

# Optional: Twilio (for SMS)
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_NUMBER=...
```

- Point your Twilio number’s SMS webhook to `https://<your-domain>/api/twilio/sms`.
- Store approved parent numbers in the `parent_phone_numbers` table (use E.164 format, e.g. `+15551234567`).
- See [`docs/SMS_SETUP.md`](docs/SMS_SETUP.md) for the full walkthrough.

### 6. Run Development Server

```bash
pnpm dev
```

Visit http://localhost:3000

### 7. Seed Database (Optional)

```bash
# First, create a test user in Supabase Auth dashboard
# Then set TEST_USER_ID in .env.local
pnpm seed
```

## Deployment to Vercel

### 1. Connect GitHub to Vercel

1. Go to https://vercel.com
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings

### 2. Set Environment Variables

In Vercel dashboard, add all environment variables from `.env.local`:
- Go to Settings > Environment Variables
- Add each variable for Production and Preview environments

### 3. Configure Build Settings

- Framework Preset: Next.js
- Node Version: 20
- Build Command: `pnpm build` (or `npm run build`)
- Install Command: `pnpm install` (or `npm ci`)

### 4. Deploy

- Push to `main` branch → auto-deploys to production
- Create a PR → preview deployment

### 5. Update Site URL

After deployment, update `NEXT_PUBLIC_SITE_URL` in Vercel to your production domain.

## Project Structure

```
/app
  /(auth) - Landing, sign in/up pages
  /app - Main app (protected)
    /page.tsx - Home feed
    /people - People management
    /books - Book creation and management
    /settings - Settings
    /import - CSV import
  /api - API routes
/components
  /ui - shadcn/ui components
  /app - App-specific components
/lib
  /supabase - Supabase client helpers
  pdf.ts - PDF generation
/supabase
  /migrations - Database migrations
```

## Key Features Implementation

### Entry Capture
- Quick add form with person selector and tags
- Image/audio upload (stubbed for MVP)
- Real-time character count
- Optimistic updates

### People Management
- Create and manage persons
- Person profiles with filtered entries
- Avatar upload support

### Book Generation
- Multi-step wizard for book creation
- Two themes: Classic (serif) and Playful (sans-serif)
- Print-ready PDF with proper margins and bleed
- Monthly section dividers
- Automatic layout (pull-quote for short entries, body text for longer)

### CSV Import
- Parse CSV with columns: text, said_by, date, tags, type, notes
- Auto-create persons if they don't exist
- Progress indicator
- Error handling

## Security

- Row Level Security (RLS) enabled on all tables
- Server-side validation of household membership
- No public entry links
- Secure file uploads to Supabase Storage

## Testing

```bash
# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Type check
pnpm type-check
```

## Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Lint
pnpm lint
```

## Environment Variables Reference

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `NEXT_PUBLIC_SITE_URL` | Site URL for callbacks | Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key | No |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | No |
| `STRIPE_PRICE_ID_MONTHLY` | Monthly subscription price ID | No |
| `STRIPE_PRICE_ID_ANNUAL` | Annual subscription price ID | No |
| `TWILIO_ACCOUNT_SID` | Twilio account SID | No |
| `TWILIO_AUTH_TOKEN` | Twilio auth token | No |
| `TWILIO_NUMBER` | Twilio phone number | No |

## Troubleshooting

### PDF Generation Fails
- Ensure Playwright is installed: `pnpm install playwright`
- Check that the route uses Node.js runtime (not Edge)
- Verify Supabase Storage bucket exists and is accessible

### RLS Policies Not Working
- Verify migrations ran successfully
- Check that `is_member` function exists
- Ensure user is added to `household_members` table

### Authentication Issues
- Verify Supabase URL and keys are correct
- Check that email redirect URLs are configured in Supabase Auth settings
- Ensure `NEXT_PUBLIC_SITE_URL` matches your deployment URL

## License

Private - All rights reserved



