import { describe, expect, it } from 'vitest';
import { badgeFor, can, outranks, type Action, type Actor, type Role } from '../../server/lib/can.ts';
import { handleSchema, nameFromEmail } from '../../server/lib/handle.ts';
import { describeTarget } from '../../server/db/target.ts';
import { describeError, describeLogArg, HttpError } from '../../server/lib/http.ts';
import { linkHref, normalizeLink } from '../../server/lib/links.ts';
import { rateLimit } from '../../server/lib/rate-limit.ts';
import { cleanText, likePattern, text } from '../../server/lib/text.ts';
import { createTestDb } from '../../server/db/client.ts';

const me = (role: Role): Actor => ({ id: 'me', role });

describe('quem pode o quê', () => {
  // As colunas são: visitante, aluno, contribuidor, criador, admin.
  const matrix: [Action, boolean, boolean, boolean, boolean, boolean][] = [
    ['comment:read', true, true, true, true, true],
    ['comment:create', false, true, true, true, true],
    ['comment:react', false, true, true, true, true],
    ['comment:report', false, true, true, true, true],
    ['comment:hide', false, false, true, false, true],
    ['comment:restore', false, false, true, false, true],
    ['comment:pin', false, false, true, false, true],
    ['comment:official', false, false, true, false, true],
    ['report:resolve', false, false, true, false, true],
    ['user:mute', false, false, true, false, true],
    ['photo:remove-other', false, false, true, false, true],
    ['panel:access', false, false, true, true, true],
    ['content:draft', false, false, false, true, true],
    ['content:publish', false, false, false, false, true],
    ['content:edit-any', false, false, false, false, true],
    ['user:list', false, false, false, false, true],
    ['user:ban', false, false, false, false, true],
    ['user:role', false, false, false, false, true],
    ['comment:purge', false, false, false, false, true],
    ['log:read', false, false, false, false, true],
  ];

  it.each(matrix)('%s', (action, visitor, student, contributor, creator, admin) => {
    expect(can(null, action)).toBe(visitor);
    expect(can(me('student'), action)).toBe(student);
    expect(can(me('contributor'), action)).toBe(contributor);
    expect(can(me('creator'), action)).toBe(creator);
    expect(can(me('admin'), action)).toBe(admin);
  });

  it.each(['comment:edit-own', 'comment:delete-own', 'notes:own', 'profile:own'] as const)('%s só vale para o que é da própria pessoa', (action) => {
    for (const role of ['student', 'contributor', 'creator', 'admin'] as const) {
      expect(can(me(role), action, { ownerId: 'me' })).toBe(true);
      expect(can(me(role), action, { ownerId: 'other' }), `${role} em dado alheio`).toBe(false);
      expect(can(me(role), action), `${role} sem dono`).toBe(false);
      expect(can(me(role), action, { ownerId: null }), `${role} dono removido`).toBe(false);
    }

    expect(can(null, action, { ownerId: 'me' })).toBe(false);
  });

  it('uma ação desconhecida é sempre negada', () => {
    expect(can(me('admin'), 'inventada' as Action)).toBe(false);
  });

  it('hierarquia e selo', () => {
    expect(outranks('admin', 'contributor')).toBe(true);
    expect(outranks('contributor', 'student')).toBe(true);
    expect(outranks('contributor', 'contributor')).toBe(false);
    expect(outranks('contributor', 'creator')).toBe(false);
    expect(outranks('creator', 'contributor')).toBe(false);
    expect(outranks('creator', 'student')).toBe(true);
    expect(outranks('admin', 'creator')).toBe(true);
    expect(badgeFor('creator')).toBe('creator');
    expect(outranks('admin', 'admin')).toBe(false);
    expect(badgeFor('student')).toBe('student');
    expect(badgeFor('contributor')).toBe('contributor');
    expect(badgeFor('admin')).toBe('contributor');
  });
});

describe('texto vindo de fora', () => {
  it('normaliza e recusa caracteres que disfarçam o texto', () => {
    expect(cleanText('  café  ')).toBe('café');
    expect(cleanText('a\r\nb', { multiline: true })).toBe('a\nb');

    for (const bad of ['a‮b', 'a​b', 'a\u0000b', 'a⁦b', 'a﻿b']) {
      expect(() => cleanText(bad), JSON.stringify(bad)).toThrow();
    }

    expect(() => cleanText('a\nb')).toThrow();
  });

  it('mede o tamanho em caracteres depois de limpar', () => {
    const field = text(2, 5);

    expect(field.safeParse('  ab  ').success).toBe(true);
    expect(field.safeParse('a').success).toBe(false);
    expect(field.safeParse('abcdef').success).toBe(false);
    expect(field.safeParse('a‮b').success).toBe(false);
  });

  it('a busca trata % e _ como letras comuns', () => {
    expect(likePattern('100%_ok')).toBe('%100\\%\\_ok%');
  });
});

describe('nome de usuário', () => {
  it.each(['ana', 'ana-silva', 'a1b2c3', 'ANA'])('aceita %s', (value) => {
    expect(handleSchema.safeParse(value).success).toBe(true);
  });

  it.each(['ab', '-ana', 'ana-', 'a--b', 'admin', 'poppy', 'aluno-abc123', 'ana silva', 'ana_silva', 'ána', 'a'.repeat(25)])('recusa %s', (value) => {
    expect(handleSchema.safeParse(value).success).toBe(false);
  });

  it('o nome inicial vem do e-mail sem mostrar o endereço', () => {
    expect(nameFromEmail('ana.silva@example.com')).toBe('Ana Silva');
    expect(nameFromEmail('x123@example.com')).toBe('X123');
    expect(nameFromEmail('___@example.com')).toBe('Aluno');
  });
});

describe('links do perfil', () => {
  it('guarda só o apelido e monta o endereço no servidor', () => {
    expect(normalizeLink('github', 'raillen')).toBe('raillen');
    expect(normalizeLink('x', '@raillen')).toBe('raillen');
    expect(normalizeLink('youtube', 'canal')).toBe('@canal');
    expect(linkHref('github', 'raillen')).toBe('https://github.com/raillen');
    expect(linkHref('email', 'a@b.co')).toBeNull();
  });

  it.each([
    ['github', 'https://github.com/x'],
    ['github', 'a/b'],
    ['github', '-x'],
    ['github', 'x-'],
    ['x', 'x'.repeat(16)],
    ['instagram', '.x'],
    ['linkedin', 'a b c'],
    ['email', 'sem-arroba'],
    ['email', 'a@b'],
    ['site', 'http://exemplo.com'],
    ['site', 'javascript:alert(1)'],
    ['site', 'https://localhost'],
    ['site', 'https://127.0.0.1'],
    ['site', 'https://[::1]/'],
    ['site', 'https://user:pass@exemplo.com'],
    ['site', 'https://exemplo.internal'],
    ['site', 'https://exemplo.com/a b'],
    ['site', `https://exemplo.com/${'a'.repeat(200)}`],
  ] as const)('recusa %s = %s', (service, value) => {
    expect(() => normalizeLink(service, value)).toThrow(HttpError);
  });

  it('aceita um site https comum', () => {
    expect(normalizeLink('site', 'https://poppy.lat/aprender')).toBe('https://poppy.lat/aprender');
  });
});

describe('limite de requisições', () => {
  it('conta por janela e volta a liberar depois dela', async () => {
    const { client } = await createTestDb();
    const t0 = 1_000_000;

    for (let i = 0; i < 3; i += 1) {
      await rateLimit(client, 'x', 'ana', 3, 60, t0 + i);
    }

    await expect(rateLimit(client, 'x', 'ana', 3, 60, t0 + 10)).rejects.toMatchObject({ status: 429, code: 'rate_limited' });
    await expect(rateLimit(client, 'x', 'bia', 3, 60, t0 + 10)).resolves.toBeUndefined();
    await expect(rateLimit(client, 'x', 'ana', 3, 60, t0 + 61_000)).resolves.toBeUndefined();
  });
});

describe('describeError', () => {
  it('diz o código e a mensagem do motor do banco, sem o SQL nem os parâmetros', () => {
    const engine = Object.assign(new Error('SQLITE_UNKNOWN: S3 error: failed to list objects'), { name: 'LibsqlError', code: 'SQLITE_UNKNOWN' });
    const wrapped = new Error('Failed query: select * from user where email = ? params: ana@example.com', { cause: engine });

    wrapped.name = 'DrizzleQueryError';

    expect(describeError(wrapped)).toBe('DrizzleQueryError SQLITE_UNKNOWN: SQLITE_UNKNOWN: S3 error: failed to list objects');
    expect(describeError(wrapped)).not.toContain('ana@example.com');
    expect(describeError(engine)).toContain('LibsqlError SQLITE_UNKNOWN');
  });

  it('um erro do banco que carrega uma causa de rede mostra as duas', () => {
    const network = new TypeError('fetch failed');
    const engine = Object.assign(new Error('SERVER_ERROR: Server returned HTTP status 502', { cause: network }), { name: 'LibsqlError', code: 'SERVER_ERROR' });

    expect(describeError(engine)).toBe('LibsqlError SERVER_ERROR: SERVER_ERROR: Server returned HTTP status 502 (causa: TypeError: fetch failed)');
  });

  it('também reconhece o erro de lote do banco', () => {
    const batch = Object.assign(new Error('SQLITE_CONSTRAINT: UNIQUE constraint failed: user.email'), { name: 'LibsqlBatchError', code: 'SQLITE_CONSTRAINT' });

    expect(describeError(batch)).toBe('LibsqlBatchError SQLITE_CONSTRAINT: SQLITE_CONSTRAINT: UNIQUE constraint failed: user.email');
  });

  it('para outros erros, só o nome', () => {
    expect(describeError(new TypeError('segredo'))).toBe('TypeError');
    expect(describeError('texto')).toBe('unknown');
  });
});

describe('describeTarget', () => {
  it('distingue o banco remoto do arquivo local, sem mostrar o token', () => {
    expect(describeTarget('libsql://poppy-aprender-raillen.turso.io?authToken=segredo')).toEqual({
      remote: true,
      label: 'poppy-aprender-raillen.turso.io (remoto)',
    });
    expect(describeTarget('file:./local.db')).toEqual({ remote: false, label: 'arquivo local (./local.db)' });
    expect(describeTarget('FILE:./local.db').remote).toBe(false);
    expect(describeTarget(':memory:').remote).toBe(false);
    expect(describeTarget('isto não é um endereço').remote).toBe(true);
  });
});

describe('describeLogArg', () => {
  it('mantém a mensagem de um erro comum e esconde a de um erro com SQL e parâmetros', () => {
    const plain = new Error('Resend answered 401');
    const drizzle = new Error('Failed query: insert into user values (?)\nparams: ana@example.com', { cause: Object.assign(new Error('SQLITE_BUSY'), { name: 'LibsqlError', code: 'SQLITE_BUSY' }) });

    drizzle.name = 'DrizzleQueryError';

    expect(describeLogArg(plain)).toBe('Error: Resend answered 401');
    expect(describeLogArg(drizzle)).not.toContain('ana@example.com');
    expect(describeLogArg(drizzle)).toContain('SQLITE_BUSY');
    expect(describeLogArg({ accessToken: 'segredo' })).toBe('');
    expect(describeLogArg('texto')).toBe('texto');
  });
});
