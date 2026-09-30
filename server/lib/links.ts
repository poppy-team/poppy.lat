import { HttpError } from './http.ts';

export const linkServices = ['github', 'x', 'linkedin', 'instagram', 'youtube', 'email', 'site'] as const;
export type LinkService = (typeof linkServices)[number];

const labels: Record<LinkService, string> = {
  github: 'GitHub',
  x: 'X',
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  youtube: 'YouTube',
  email: 'E-mail',
  site: 'Site',
};

export function isLinkService(value: string): value is LinkService {
  return (linkServices as readonly string[]).includes(value);
}

function invalid(service: LinkService, message: string): never {
  throw new HttpError(422, 'invalid_link', message, { service });
}

/** The public address for a stored value. Only the fixed part is ours; the rest is what was validated. */
export function linkHref(service: LinkService, value: string): string | null {
  switch (service) {
    case 'github':
      return `https://github.com/${value}`;
    case 'x':
      return `https://x.com/${value}`;
    case 'linkedin':
      return `https://www.linkedin.com/in/${value}`;
    case 'instagram':
      return `https://www.instagram.com/${value}`;
    case 'youtube':
      return `https://www.youtube.com/${value}`;
    case 'site':
      return value;
    case 'email':
      return null;
  }
}

export function linkLabel(service: LinkService): string {
  return labels[service];
}

function validSite(value: string): string {
  if (value.length > 200 || !/^[!-~]+$/u.test(value)) {
    invalid('site', 'Use um endereço https com até 200 caracteres, sem espaços nem acentos.');
  }

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return invalid('site', 'Use um endereço https completo, como https://seusite.com.');
  }

  const host = url.hostname;
  const looksLikeAddress = /^[0-9.]+$/u.test(host) || host.startsWith('[') || host.includes(':');

  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    !host.includes('.') ||
    looksLikeAddress ||
    host === 'localhost' ||
    host.endsWith('.localhost') ||
    host.endsWith('.local') ||
    host.endsWith('.internal') ||
    !/^[a-z0-9.-]+$/u.test(host)
  ) {
    invalid('site', 'Use um endereço https completo, como https://seusite.com.');
  }

  const text = url.href;

  if (text.length > 200) {
    invalid('site', 'Esse endereço ficou longo demais.');
  }

  return text;
}

/**
 * Checks what the person typed with the rule of that service and returns the
 * value to store: the handle alone (or the https address for the site), so no
 * one can save an arbitrary address in place of a GitHub profile.
 */
export function normalizeLink(service: LinkService, input: string): string {
  const value = input.trim();

  switch (service) {
    case 'github': {
      if (!/^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/u.test(value) || value.includes('--') || value.endsWith('-')) {
        invalid(service, 'Use só letras, números e hífen (até 39), sem hífen no fim.');
      }

      return value;
    }
    case 'x': {
      const handle = value.replace(/^@/u, '');

      if (!/^[A-Za-z0-9_]{1,15}$/u.test(handle)) {
        invalid(service, 'Use só letras, números e _ (até 15).');
      }

      return handle;
    }
    case 'linkedin': {
      if (!/^[A-Za-z0-9-]{3,100}$/u.test(value)) {
        invalid(service, 'Use só o final do endereço: letras, números e hífen.');
      }

      return value;
    }
    case 'instagram': {
      const handle = value.replace(/^@/u, '');

      if (!/^[A-Za-z0-9._]{1,30}$/u.test(handle) || handle.startsWith('.') || handle.endsWith('.')) {
        invalid(service, 'Use só letras, números, ponto e _ (até 30).');
      }

      return handle;
    }
    case 'youtube': {
      const handle = value.replace(/^@/u, '');

      if (!/^[A-Za-z0-9._-]{3,30}$/u.test(handle)) {
        invalid(service, 'Use o seu @canal, com letras, números, ponto, _ e hífen.');
      }

      return `@${handle}`;
    }
    case 'email': {
      if (value.length > 120 || !/^[A-Za-z0-9._%+-]{1,64}@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/u.test(value)) {
        invalid(service, 'Escreva um e-mail completo, como nome@exemplo.com.');
      }

      return value.toLowerCase();
    }
    case 'site':
      return validSite(value);
  }
}
