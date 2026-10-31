import nodemailer from 'nodemailer';
import { logger } from './logger.js';

let transporter: nodemailer.Transporter | null = null;

async function getTransporter(): Promise<nodemailer.Transporter> {
  if (transporter) return transporter;

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // Ethereal / test transporter
    const testAccount = await nodemailer.createTestAccount().catch(() => null);
    if (testAccount) {
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      logger.info({ etherealUser: testAccount.user }, 'Ethereal email test account created');
    } else {
      // Fallback stub transporter
      transporter = nodemailer.createTransport({
        streamTransport: true,
        newline: 'windows',
      });
    }
  }

  return transporter;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    const mailer = await getTransporter();
    const info = await mailer.sendMail({
      from: process.env.EMAIL_FROM || '"Brightloop Billing" <billing@brightloop.io>',
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''),
      html,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      logger.info({ to, subject, previewUrl }, 'Email sent (Ethereal preview link)');
    } else {
      logger.info({ to, subject, messageId: info.messageId }, 'Email sent successfully');
    }

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (error) {
    logger.error({ error, to, subject }, 'Failed to dispatch email');
    return { success: false, error };
  }
}

