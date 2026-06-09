# ReActivate Operating Guide

Day-to-day guide for running reactivation campaigns.

## Getting Started

### 1. Prepare Your Brand Voice

Before uploading contacts, set your brand voice in the database. This ensures all AI-generated messages match your communication style.

Example brand voices:
- "Friendly real estate agent in Denver. First-name basis, warm, uses phrases like 'hope you're doing well' and 'just checking in'. Mentions local landmarks."
- "Professional mortgage broker. Clear and concise. Always includes a value proposition. Signs off with full name and title."
- "Casual home inspector. Down-to-earth, uses simple language. Focuses on being helpful and educational."

Update in Supabase: `users` table > `brand_voice` column.

### 2. Export Your CRM Contacts

Export dormant contacts as CSV from your CRM. Supported CRMs:
- Follow Up Boss (Contacts > Export)
- KVCore (Contacts > Export > CSV)
- BoomTown (People > Export)
- Salesforce (Reports > Export to CSV)
- HubSpot (Contacts > Export)
- Any system that exports CSV

**Best columns to include:**
- First Name, Last Name
- Email, Phone
- Last Contact Date (critical for segmentation)
- Lead Source (helps AI personalize)
- Notes/Comments (most important for personalization)

### 3. Upload and Segment

1. Go to Dashboard > Upload CSV
2. Drag and drop your file
3. Review auto-detected field mapping and adjust if needed
4. Click "Upload & Segment with AI"
5. AI will analyze each contact and assign segments:
   - **hot-dormant**: Last contacted within 6 months
   - **warm-dormant**: 6-18 months ago
   - **cold-dormant**: 18+ months ago
   - **past-client**: Previously transacted
   - **referral-source**: Known referrer
   - **sphere-of-influence**: Personal network
   - **event-lead**: From events/open houses
   - **online-lead**: From websites/portals

### 4. Create a Campaign

1. Go to Campaigns > New Campaign
2. Name your campaign (e.g., "Q1 2025 Warm Leads Reactivation")
3. Customize the drip cadence:
   - Default: Day 0 SMS, Day 7 Email, Day 21 SMS, Day 45 Email
   - Adjust days and channels as needed
   - Add or remove steps
4. Select contacts by segment (start with hot-dormant for best results)
5. Click "Create Campaign"

### 5. Launch

1. Go to the campaign detail page
2. Review the contact list and cadence
3. Click "Start Campaign"
4. The system will:
   - Mark contacts as "active"
   - Schedule the first touch immediately (Day 0)
   - The cron job runs every 15 minutes and sends due messages

## Campaign Flow

```
Day 0:  SMS sent (personalized check-in)
         |
Day 7:  Email sent (value-add, relevant to their segment)
         |
Day 21: SMS sent (gentle follow-up with soft CTA)
         |
Day 45: Email sent (final touch, direct but respectful)
```

At any point:
- **Contact replies** -> Drip pauses automatically
- **Warm reply detected** -> You get an SMS alert
- **"STOP" or opt-out** -> Contact removed, drip ends, opt-out confirmed

## Monitoring

### Dashboard
- **Reply Rate**: Percentage of contacts who replied to any touch
- **Reactivation Rate**: Percentage marked as warm/reactivated
- **Opt-Out Rate**: Percentage who opted out (should be <2%)
- **Recent Activity**: Live feed of replies and status changes

### Campaign Detail
- Per-step progress bars
- Individual contact status and step tracking
- Full touch history with message content

### Contact Detail
- Complete touch timeline
- AI message preview (generate test messages)
- Status and segment information

## Handling Replies

When a contact replies:

1. **You get an SMS alert** with their name, phone, and reply text
2. **The drip pauses automatically** (no more automated messages)
3. **The contact status updates**:
   - Warm reply -> "reactivated"
   - Not-now reply -> "replied"
   - Opt-out -> "opted_out"
4. **You follow up personally** (this is the handoff point)

### Warm Lead Alert Format
```
WARM LEAD ALERT: John Smith (+15551234567) replied to your
reactivation campaign: "Yes, I'm actually looking to sell
my house this spring!"
```

## Best Practices

### Contact Selection
- Start with **hot-dormant** and **past-client** segments (highest conversion)
- Run separate campaigns per segment for better personalization
- Never include contacts who have opted out of previous campaigns

### Campaign Timing
- Start campaigns on Tuesday-Thursday (best response rates)
- Avoid starting on weekends or holidays
- The 0-7-21-45 day cadence is optimized but adjust for your market

### Brand Voice Tips
- Be specific in your brand voice description
- Include phrases you commonly use
- Mention your market area
- Describe your personality (formal, casual, warm, direct)

### Compliance
- Always honor opt-outs immediately (the system handles this automatically)
- Include opt-out instructions in your brand voice or let the system add them
- Review your local regulations on SMS marketing
- The system adds "Reply STOP to unsubscribe" to emails automatically

### Scaling
- **Starter plan**: Up to 1,000 contacts, 1 active campaign
- **Growth plan**: Up to 5,000 contacts, 5 active campaigns
- **Enterprise plan**: Up to 25,000 contacts, unlimited campaigns

### Performance Benchmarks
- **5-10%** reactivation rate is typical
- **15-25%** reply rate is excellent
- **<2%** opt-out rate is healthy
- If opt-out rate exceeds 5%, review your messaging and contact quality

## Troubleshooting

### Messages not sending
1. Check the campaign status is "active"
2. Verify cron job is running (Vercel dashboard > Cron Jobs)
3. Check contact has the right channel info (phone for SMS, email for email)
4. Verify Twilio/Resend credentials

### No warm lead alerts
1. Ensure your phone number is in the `users` table `phone` column
2. Check Twilio webhook URL is correctly configured
3. Test by sending an SMS to your Twilio number

### AI messages seem generic
1. Update your brand voice with more detail
2. Ensure contact notes and source data are populated
3. More data = better personalization

### High opt-out rate
1. Review contact data quality (are these truly your contacts?)
2. Adjust messaging tone in brand voice
3. Consider longer delays between touches
4. Focus on warmer segments first
