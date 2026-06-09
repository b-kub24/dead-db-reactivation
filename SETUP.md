# ReActivate Setup Guide

Complete guide to deploying the AI Dead-Database Reactivation Campaign Engine.

## Prerequisites

- Node.js 18+ and npm
- A Supabase project (free tier works)
- A Twilio account with SMS capability
- A Resend account for email delivery
- An Anthropic API key (Claude)
- A Vercel account for deployment

## Step 1: Clone and Install

```bash
cd dead-db-reactivation
npm install
```

## Step 2: Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in the Supabase dashboard
3. Copy the contents of `supabase/schema.sql` and run it
4. Go to **Settings > API** and copy:
   - Project URL (NEXT_PUBLIC_SUPABASE_URL)
   - anon/public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY)
5. Go to **Authentication > URL Configuration** and set:
   - Site URL: your Vercel deployment URL
   - Redirect URLs: add your Vercel URL

## Step 3: Set Up Twilio

1. Create a Twilio account at [twilio.com](https://twilio.com)
2. Get a phone number with SMS capability
3. Go to **Console > Account Info** and copy:
   - Account SID (TWILIO_ACCOUNT_SID)
   - Auth Token (TWILIO_AUTH_TOKEN)
   - Your Twilio phone number (TWILIO_PHONE_NUMBER)
4. Configure the SMS webhook (after deploying):
   - Go to **Phone Numbers > Manage > Active numbers**
   - Click your number
   - Under "Messaging", set the webhook URL to:
     `https://your-app.vercel.app/api/webhooks/twilio/sms-inbound`
   - Method: POST

## Step 4: Set Up Resend

1. Create an account at [resend.com](https://resend.com)
2. Add and verify your sending domain
3. Create an API key
4. Copy:
   - API Key (RESEND_API_KEY)
   - Your verified sending email (RESEND_FROM_EMAIL)

## Step 5: Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Copy it (ANTHROPIC_API_KEY)

## Step 6: Configure Environment Variables

```bash
cp .env.example .env.local
```

Fill in all values in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
RESEND_API_KEY=re_...
RESEND_FROM_EMAIL=campaigns@yourdomain.com
CRON_SECRET=your-random-secret-string
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

Generate a random CRON_SECRET:
```bash
openssl rand -hex 32
```

## Step 7: Run Locally

```bash
npm run dev
```

Visit `http://localhost:3000`

## Step 8: Deploy to Vercel

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Go to [vercel.com](https://vercel.com) and import your repository
3. Add all environment variables from `.env.local` to the Vercel project settings
4. Deploy

The `vercel.json` file configures the cron job to run `/api/cron/dispatch` every 15 minutes automatically.

## Step 9: Configure Twilio Webhook

After deployment, update your Twilio webhook URL:

1. Go to Twilio Console > Phone Numbers > Your number
2. Set the Messaging webhook to: `https://your-app.vercel.app/api/webhooks/twilio/sms-inbound`
3. Method: HTTP POST

## Step 10: Create Your First User

1. Go to Supabase > Authentication > Users
2. Create a user (or set up the sign-up flow)
3. Update the user's profile in the `users` table:
   - `business_name`: Your business name
   - `brand_voice`: Describe your communication style (e.g., "Warm, professional real estate agent in Austin TX. Casual but knowledgeable. Uses first names.")
   - `default_market_area`: Your area (e.g., "Austin, TX")
   - `twilio_number`: Your Twilio phone number
   - `phone`: Your personal phone for warm lead alerts

## Architecture Notes

- **Cron Job**: Runs every 15 minutes via Vercel Cron. Finds all campaign_contacts with `next_send_at <= now()`, generates AI messages, and sends them.
- **Reply Detection**: Twilio sends inbound SMS to the webhook. AI classifies intent and pauses the drip automatically.
- **AI Segmentation**: When contacts are uploaded, Claude analyzes recency, source, and notes to assign segments.
- **AI Message Generation**: Each touch is personalized by Claude using the contact's data and the user's brand voice.

## Troubleshooting

- **Cron not running**: Check Vercel dashboard > Cron Jobs tab. Ensure CRON_SECRET matches in env vars.
- **SMS not sending**: Verify Twilio credentials and that your phone number is SMS-capable.
- **Emails not sending**: Verify your domain is configured in Resend.
- **AI errors**: Check that your Anthropic API key is valid and has sufficient credits.
- **Database errors**: Run the schema.sql again if tables are missing. Check RLS policies.
