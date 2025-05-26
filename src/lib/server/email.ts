import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { generateEmailHtml } from '$lib/components/email-templates';

function getResendClient() {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }
  return new Resend(env.RESEND_API_KEY);
}

type _EmailOptions = {
  to: string;
  subject: string;
  html: string;
  from?: string;
};

export async function sendEmail({
  to,
  subject,
  html,
  from = 'no-reply@budgetmaker.io',
}: _EmailOptions) {
  const resend = getResendClient();
  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      console.error('Email sending error:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }

    console.log('Email sent successfully:', data?.id);
    return data;
  } catch (error) {
    console.error('Email service error:', error);
    throw error;
  }
}

export function generateVerificationEmailHtml(verificationUrl: string, firstName?: string | null) {
  return generateEmailHtml({
    buttonTitle: 'Verify Email Address',
    expireInHours: 24,
    firstName,
    requestLinkUrl: verificationUrl,
    requestTo: 'verify your email address',
    title: 'Verify Your Email',
  });
}
