import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID!;
const authToken = process.env.TWILIO_AUTH_TOKEN!;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER!;

let twilioClient: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!twilioClient) {
    twilioClient = twilio(accountSid, authToken);
  }
  return twilioClient;
}

export interface SendSmsParams {
  to: string;
  body: string;
  from?: string;
}

export async function sendSms({ to, body, from }: SendSmsParams): Promise<{ sid: string; status: string }> {
  const client = getClient();
  const message = await client.messages.create({
    to,
    from: from || twilioPhoneNumber,
    body,
  });
  return { sid: message.sid, status: message.status };
}

export interface TwilioInboundSms {
  From: string;
  To: string;
  Body: string;
  MessageSid: string;
  AccountSid: string;
  NumMedia: string;
}

export function parseTwilioWebhook(formData: FormData): TwilioInboundSms {
  return {
    From: formData.get('From') as string || '',
    To: formData.get('To') as string || '',
    Body: formData.get('Body') as string || '',
    MessageSid: formData.get('MessageSid') as string || '',
    AccountSid: formData.get('AccountSid') as string || '',
    NumMedia: formData.get('NumMedia') as string || '0',
  };
}

export function validateTwilioSignature(
  url: string,
  params: Record<string, string>,
  signature: string
): boolean {
  const twilioLib = twilio;
  return twilioLib.validateRequest(authToken, signature, url, params);
}

export function twimlResponse(message: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${message}</Message></Response>`;
}
