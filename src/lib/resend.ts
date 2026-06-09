import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY!;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'campaigns@reactivate.app';

let resendClient: Resend | null = null;

function getClient(): Resend {
  if (!resendClient) {
    resendClient = new Resend(resendApiKey);
  }
  return resendClient;
}

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
}

export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
}: SendEmailParams): Promise<{ id: string }> {
  const client = getClient();
  const { data, error } = await client.emails.send({
    from: from || fromEmail,
    to: [to],
    subject,
    html,
    replyTo,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return { id: data?.id || '' };
}

export function wrapEmailHtml(body: string, businessName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999; }
    .footer a { color: #999; }
  </style>
</head>
<body>
  ${body}
  <div class="footer">
    <p>Sent by ${businessName}</p>
    <p>Reply STOP to unsubscribe from future messages.</p>
  </div>
</body>
</html>`;
}
