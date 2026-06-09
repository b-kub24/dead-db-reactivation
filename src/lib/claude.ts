import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export interface SegmentationInput {
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  lastContactAt: string | null;
  source: string | null;
  notes: string | null;
}

export interface SegmentationResult {
  segment: string;
  reasoning: string;
}

export async function segmentContacts(
  contacts: SegmentationInput[]
): Promise<SegmentationResult[]> {
  const contactSummaries = contacts.map((c, i) => {
    const parts = [`Contact ${i + 1}:`];
    if (c.firstName || c.lastName) parts.push(`Name: ${c.firstName || ''} ${c.lastName || ''}`);
    if (c.lastContactAt) parts.push(`Last Contact: ${c.lastContactAt}`);
    if (c.source) parts.push(`Source: ${c.source}`);
    if (c.notes) parts.push(`Notes: ${c.notes}`);
    return parts.join('\n  ');
  }).join('\n\n');

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `You are a real estate and SMB CRM expert. Segment these dormant contacts into reactivation categories.

Segments to use:
- "hot-dormant" — last contacted within 6 months, had meaningful engagement
- "warm-dormant" — last contacted 6-18 months ago, some engagement history
- "cold-dormant" — last contacted 18+ months ago or minimal engagement
- "past-client" — previously closed a deal or completed a transaction
- "referral-source" — someone who has referred leads before
- "sphere-of-influence" — personal contacts, friends, family in the database
- "event-lead" — came from an open house, seminar, or event
- "online-lead" — came from website, Zillow, Realtor.com, social media
- "unknown" — not enough info to segment

For each contact, return a JSON array with objects containing "segment" and "reasoning".

Contacts:
${contactSummaries}

Return ONLY a valid JSON array, no other text. Example format:
[{"segment": "warm-dormant", "reasoning": "Last contacted 8 months ago with open house follow-up notes"}]`,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return contacts.map(() => ({ segment: 'unknown', reasoning: 'Failed to parse AI response' }));
    }
    const parsed = JSON.parse(jsonMatch[0]) as SegmentationResult[];
    return parsed;
  } catch {
    return contacts.map(() => ({ segment: 'unknown', reasoning: 'Failed to parse AI response' }));
  }
}

export interface MessageGenerationInput {
  contactFirstName: string | null;
  contactLastName: string | null;
  contactNotes: string | null;
  contactSegment: string | null;
  contactSource: string | null;
  lastContactAt: string | null;
  brandVoice: string | null;
  businessName: string | null;
  channel: 'sms' | 'email';
  stepNumber: number;
  totalSteps: number;
}

export interface GeneratedMessage {
  subject?: string;
  body: string;
}

export async function generateReengagementMessage(
  input: MessageGenerationInput
): Promise<GeneratedMessage> {
  const stepDescription = getStepDescription(input.stepNumber, input.totalSteps);

  const prompt = `You are a re-engagement messaging expert for real estate agents and small businesses. Generate a personalized ${input.channel === 'sms' ? 'SMS text message' : 'email'} to re-engage a dormant contact.

Contact Details:
- Name: ${input.contactFirstName || 'there'} ${input.contactLastName || ''}
- Segment: ${input.contactSegment || 'unknown'}
- Source: ${input.contactSource || 'unknown'}
- Last Contact: ${input.lastContactAt || 'unknown'}
- Notes: ${input.contactNotes || 'none'}

Business Details:
- Business: ${input.businessName || 'our business'}
- Brand Voice: ${input.brandVoice || 'professional, friendly, and helpful'}

Campaign Context:
- This is touch ${input.stepNumber + 1} of ${input.totalSteps} in a re-engagement drip
- ${stepDescription}

Rules:
${input.channel === 'sms' ? `- Keep SMS under 160 characters
- Be conversational and warm
- Include a soft call-to-action (question, not a hard sell)
- Do NOT include links or emojis
- Sign off with the business name` : `- Write a short, personal email (3-5 sentences max)
- Subject line should be curiosity-inducing and personal
- Be warm and conversational, not salesy
- Include one soft question to encourage a reply
- Do NOT use marketing buzzwords`}

${input.channel === 'email' ? 'Return JSON with "subject" and "body" fields. The body should be plain text (it will be wrapped in HTML).' : 'Return JSON with only a "body" field.'}

Return ONLY valid JSON, no other text.`;

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return getDefaultMessage(input);
    }
    const parsed = JSON.parse(jsonMatch[0]) as GeneratedMessage;
    return parsed;
  } catch {
    return getDefaultMessage(input);
  }
}

export interface IntentClassification {
  intent: 'warm' | 'not-now' | 'opt-out' | 'neutral';
  confidence: number;
  reasoning: string;
}

export async function classifyReplyIntent(
  replyBody: string,
  originalMessageBody: string
): Promise<IntentClassification> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Classify the intent of this reply to a re-engagement message.

Original message sent:
"${originalMessageBody}"

Reply received:
"${replyBody}"

Classify as one of:
- "warm" — interested, wants to reconnect, asks questions, positive sentiment
- "not-now" — not interested right now but not hostile (e.g., "busy", "maybe later")
- "opt-out" — wants to stop receiving messages (e.g., "stop", "unsubscribe", "remove me", "don't contact me")
- "neutral" — unclear intent, generic response

Return JSON with "intent", "confidence" (0-1), and "reasoning" fields. Return ONLY valid JSON.`,
      },
    ],
  });

  const responseText = message.content[0].type === 'text' ? message.content[0].text : '';

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { intent: 'neutral', confidence: 0.5, reasoning: 'Failed to parse AI response' };
    }
    return JSON.parse(jsonMatch[0]) as IntentClassification;
  } catch {
    return { intent: 'neutral', confidence: 0.5, reasoning: 'Failed to parse AI response' };
  }
}

function getStepDescription(step: number, total: number): string {
  if (step === 0) return 'First touch — light, friendly reconnection. Just checking in.';
  if (step === 1) return 'Second touch — add value, share something relevant to their situation.';
  if (step === total - 2) return 'Third touch — create gentle urgency or share a success story.';
  if (step === total - 1) return 'Final touch — last attempt, be direct but respectful. Let them know you are there if they need you.';
  return `Touch ${step + 1} — continue building rapport and offering value.`;
}

function getDefaultMessage(input: MessageGenerationInput): GeneratedMessage {
  const name = input.contactFirstName || 'there';
  if (input.channel === 'sms') {
    return {
      body: `Hi ${name}, it's ${input.businessName || 'us'}! Been a while — hope you're doing great. Anything I can help with? Just reply and let me know.`,
    };
  }
  return {
    subject: `Quick check-in, ${name}`,
    body: `Hi ${name},\n\nIt's been a while since we last connected, and I wanted to reach out to see how you're doing.\n\nIf there's anything I can help with, I'm just a reply away.\n\nBest,\n${input.businessName || 'Your team'}`,
  };
}
