import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ sent: boolean; messageId?: string }> {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || 'c3bf79001@smtp-brevo.com';
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, '');
  const from = process.env.SMTP_FROM || `"Shivam Academy" <${user}>`;
  const replyTo = process.env.DEFAULT_ADMIN_EMAIL || 'shivamacademy.result@gmail.com';

  if (!pass) {
    console.error('❌ SMTP password (SMTP_PASS) not configured.');
    return { sent: false };
  }

  try {
    const isGmail = host === 'smtp.gmail.com';
    const transporter = isGmail
      ? nodemailer.createTransport({
          service: 'gmail',
          auth: { user, pass },
        })
      : nodemailer.createTransport({
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
        });

    const info = await transporter.sendMail({
      from,
      replyTo,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`📧 Email sent to ${options.to} (MessageId: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ SMTP sending error to ${options.to}:`, error.message);
    return { sent: false };
  }
}
