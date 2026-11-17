import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ sent: boolean; messageId?: string; error?: string }> {
  const host = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
  const user = process.env.SMTP_USER || 'c3bf79001@smtp-brevo.com';

  // Base64-encoded default fallback for Brevo SMTP key so it works seamlessly on production
  const defaultPassB64 = 'eHNtdHBzaWItOTRkNDEwOTk2NmY1MDI5OGUyMDRlOWJlZGIzYjYxZWFmZjVkYWUxZDUxNzIxMWE3NTIyZjRlZjA5MzQyYjJmZC1ob1REampvZkliczFGenFl';
  const defaultPass = Buffer.from(defaultPassB64, 'base64').toString('utf8');
  const pass = (process.env.SMTP_PASS || defaultPass).replace(/\s+/g, '');

  const validatedSender =
    process.env.SMTP_FROM_EMAIL ||
    process.env.DEFAULT_ADMIN_EMAIL ||
    'shivamacademy.result@gmail.com';

  const from = process.env.SMTP_FROM || `"Shivam Academy" <${validatedSender}>`;
  const replyTo = process.env.DEFAULT_ADMIN_EMAIL || validatedSender;

  if (!pass) {
    console.error('❌ SMTP password (SMTP_PASS) not configured.');
    return { sent: false, error: 'SMTP password not configured' };
  }

  // Cloud hosts like Railway often block port 587 but allow port 465 (SSL) or port 2525
  // We try configured port or default to [465, 587, 2525]
  const preferredPort = Number(process.env.SMTP_PORT) || 465;
  const portsToTry = preferredPort === 465 ? [465, 587, 2525] : [preferredPort, 465, 2525, 587];

  let lastError: any = null;

  for (const currentPort of portsToTry) {
    try {
      const isGmail = host === 'smtp.gmail.com';
      const isSecure = currentPort === 465;

      console.log(`🔌 Attempting SMTP connection to ${host}:${currentPort} (secure: ${isSecure})...`);

      const transporter = isGmail
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass },
            connectionTimeout: 10000,
          })
        : nodemailer.createTransport({
            host,
            port: currentPort,
            secure: isSecure,
            auth: { user, pass },
            connectionTimeout: 8000,
            greetingTimeout: 8000,
            socketTimeout: 10000,
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

      console.log(`📧 Email sent successfully to ${options.to} via port ${currentPort} (MessageId: ${info.messageId})`);
      return { sent: true, messageId: info.messageId };
    } catch (err: any) {
      console.warn(`⚠️ SMTP attempt failed on port ${currentPort}:`, err.message);
      lastError = err;
    }
  }

  console.error(`❌ All SMTP attempts failed for ${options.to}:`, lastError?.message);
  return { sent: false, error: lastError?.message || 'SMTP connection failed across all ports' };
}
