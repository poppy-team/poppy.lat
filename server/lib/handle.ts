import { randomBytes } from 'node:crypto';
import { z } from 'zod';

/** Names that would look official or collide with pages of the site. */
const reserved = new Set([
  'admin', 'administrador', 'administrator', 'moderador', 'moderator', 'mod', 'staff', 'suporte', 'support',
  'poppy', 'poppyteam', 'poppy-team', 'ori', 'aipo', 'oride', 'prumo', 'contribuidor', 'contributor', 'oficial',
  'official', 'root', 'system', 'sistema', 'api', 'me', 'eu', 'perfil', 'profile', 'aprender', 'learn', 'entrar',
  'sair', 'anotacoes', 'notes', 'moderacao', 'null', 'undefined',
]);

export const handleSchema = z
  .string()
  .transform((value) => value.trim().toLowerCase())
  .pipe(
    z
      .string()
      .regex(/^[a-z0-9](?:[a-z0-9-]{1,22})[a-z0-9]$/u, 'Use de 3 a 24 letras minúsculas, números ou hífens, sem começar nem terminar com hífen.')
      .refine((value) => !value.includes('--'), 'Não use dois hífens seguidos.')
      .refine((value) => !reserved.has(value), 'Este nome é reservado.')
      .refine((value) => !/^aluno-[a-z0-9]{6}$/u.test(value), 'Este formato é usado nos nomes automáticos.'),
  );

/** The name given to a new account until its owner picks another one. */
export function generateHandle(): string {
  return `aluno-${randomBytes(4).toString('hex').slice(0, 6)}`;
}

/** A friendly starting display name taken from the address, never the whole address. */
export function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? '';
  const words = local
    .replace(/[^a-zA-Z0-9]+/gu, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2);
  const name = words.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');

  return name.slice(0, 40) || 'Aluno';
}
