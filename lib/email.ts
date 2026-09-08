import { Resend } from 'resend';

const resendApiKey = process.env.RESEND_API_KEY || '';

export const resend = resendApiKey ? new Resend(resendApiKey) : null;

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

/**
 * Sends an email using Resend, with graceful logging fallback if not configured.
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = 'Pashudhan Kavach <onboarding@resend.dev>',
}: SendEmailOptions) {
  if (!resend) {
    console.warn('[Email Service] RESEND_API_KEY not configured. Email simulated:', {
      to,
      subject,
    });
    return { success: false, error: 'Resend API key missing' };
  }

  try {
    const data = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    return { success: true, data };
  } catch (error) {
    console.error('[Email Service] Failed to send email:', error);
    return { success: false, error };
  }
}

