import type { Env } from '../env.ts';

export interface Mail {
  to: string;
  subject: string;
  text: string;
}

export type Mailer = (mail: Mail) => Promise<void>;

/**
 * Sends the login link. In production it goes through Resend; in development
 * it is printed in the terminal so no account is needed to try the site.
 */
export function createMailer(env: Env): Mailer {
  if (env.RESEND_API_KEY) {
    const key = env.RESEND_API_KEY;

    return async (mail) => {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
        body: JSON.stringify({ from: env.MAIL_FROM, to: [mail.to], subject: mail.subject, text: mail.text }),
      });

      if (!response.ok) {
        // The body may echo the address; only the status is logged.
        throw new Error(`Resend answered ${response.status}`);
      }
    };
  }

  if (env.NODE_ENV === 'production') {
    throw new Error('RESEND_API_KEY is required in production.');
  }

  return async (mail) => {
    console.log(`\n[e-mail de desenvolvimento] para ${mail.to}\n${mail.subject}\n${mail.text}\n`);
  };
}

export function loginMail(url: string): Pick<Mail, 'subject' | 'text'> {
  return {
    subject: 'Seu link de acesso ao Aprender',
    text: [
      'Olá!',
      '',
      'Use este link para entrar no Aprender, da Poppy Team. Ele vale por 10 minutos e só funciona uma vez:',
      '',
      url,
      '',
      'Se você não pediu este e-mail, pode ignorá-lo: nada acontece sem o clique.',
    ].join('\n'),
  };
}
