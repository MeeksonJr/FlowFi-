import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(to: string, name: string) {
  try {
    const data = await resend.emails.send({
      from: 'FlowFi <onboarding@resend.dev>', 
      to: [to],
      subject: 'Welcome to FlowFi!',
      html: `<strong>Hi ${name},</strong><br><br>Welcome to FlowFi! We're thrilled to help you manage your freelance finances.`,
    });

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    return null;
  }
}
