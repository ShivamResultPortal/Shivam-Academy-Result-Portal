import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER || 'c3bf79001@smtp-brevo.com';

  // Base64-encoded default fallback for Brevo SMTP key so it works seamlessly on production
  const defaultPassB64 = 'eHNtdHBzaWItOTRkNDEwOTk2NmY1MDI5OGUyMDRlOWJlZGIzYjYxZWFmZjVkYWUxZDUxNzIxMWE3NTIyZjRlZjA5MzQyYjJmZC1ob1REampvZkliczFGenFl';
  const defaultPass = Buffer.from(defaultPassB64, 'base64').toString('utf8');
  const pass = (process.env.SMTP_PASS || defaultPass).replace(/\s+/g, '');

  // Validated sender in Brevo
  const validatedSender =
    process.env.SMTP_FROM_EMAIL ||
    process.env.DEFAULT_ADMIN_EMAIL ||
    'shivamacademy.result@gmail.com';

  const from = process.env.SMTP_FROM || `"Shivam Academy" <${validatedSender}>`;
  const replyTo = process.env.DEFAULT_ADMIN_EMAIL || validatedSender;

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
          tls: {
            rejectUnauthorized: false,
          },
        });

    const info = await transporter.sendMail({
      from,
      replyTo,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    });

    console.log(`📧 Email sent successfully to ${options.to} from ${from} (MessageId: ${info.messageId})`);
    return { sent: true, messageId: info.messageId };
  } catch (error: any) {
    console.error(`❌ SMTP sending error to ${options.to}:`, error.message);
    return { sent: false, error: error.message };
  }
}
