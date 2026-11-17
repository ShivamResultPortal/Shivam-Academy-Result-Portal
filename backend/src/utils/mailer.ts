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

  // Brevo login usernames (e.g. c3bf79001@smtp-brevo.com) cannot be used as sender email addresses.
  // The sender MUST be a validated sender address registered in Brevo or your configured email.
  const validatedSender =
    process.env.SMTP_FROM_EMAIL ||
    process.env.DEFAULT_ADMIN_EMAIL ||
    (user.includes('@smtp-brevo.com') ? 'shivamacademy.result@gmail.com' : user);

  const from = process.env.SMTP_FROM || `"Shivam Academy" <${validatedSender}>`;
  const replyTo = process.env.DEFAULT_ADMIN_EMAIL || validatedSender;

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

    console.log(`📧 Email sent to ${options.to} from ${from} (MessageId: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ SMTP sending error to ${options.to}:`, error.message);
    return { sent: false };
  }
}
