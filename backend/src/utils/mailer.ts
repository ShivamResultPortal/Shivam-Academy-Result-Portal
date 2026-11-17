import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ sent: boolean; messageId?: string; simulated?: boolean }> {
  let host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, ''); // strip spaces from Google app password
  let port = Number(process.env.SMTP_PORT) || 465;

  // Auto-detect Gmail if host not specified or user is @gmail.com
  if (!host && user && user.endsWith('@gmail.com')) {
    host = 'smtp.gmail.com';
    port = 465;
  }

  const from = process.env.SMTP_FROM || `"Shivam Academy" <${user || 'no-reply@shivamacademy.com'}>`;

  // If SMTP credentials are configured, send real email via nodemailer
  if (host && user && pass) {
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
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log(`📧 Email sent to ${options.to} (MessageId: ${info.messageId})`);
      return { sent: true, messageId: info.messageId, simulated: false };
    } catch (error: any) {
      console.error(`❌ SMTP sending error to ${options.to}:`, error.message);
      return { sent: false, simulated: false };
    }
  }

  // Fallback when SMTP is not configured: log securely to server console
  console.log(`\n======================================================`);
  console.log(`📧 [Simulated Email] To: ${options.to}`);
  console.log(`📝 Subject: ${options.subject}`);
  if (options.text) console.log(`📄 Text:\n${options.text}`);
  console.log(`======================================================\n`);
  return { sent: true, simulated: true };
}
