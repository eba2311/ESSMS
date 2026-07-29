import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from '../utils/logger';

let transporter: nodemailer.Transporter | null = null;

const getTransporter = (): nodemailer.Transporter => {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.user,
        pass: config.smtp.password,
      },
    });
  }
  return transporter;
};

export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export const sendEmail = async (options: EmailOptions): Promise<boolean> => {
  if (!config.smtp.user || !config.smtp.password) {
    logger.warn('SMTP not configured — skipping email send');
    return false;
  }

  try {
    const t = getTransporter();
    await t.sendMail({
      from: config.emailFrom,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || options.text,
    });
    logger.debug(`Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    logger.error('Failed to send email', {
      to: options.to,
      subject: options.subject,
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
};
