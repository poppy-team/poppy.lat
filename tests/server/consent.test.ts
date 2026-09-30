import { beforeEach, describe, expect, it } from 'vitest';
import { ageOn, termsVersion } from '../../server/lib/consent.ts';
import { createHarness, type Harness } from './helpers.ts';

let h: Harness;

beforeEach(async () => {
  h = await createHarness();
});

describe('idade', () => {
  it('conta anos completos e recusa datas que não existem', () => {
    const today = new Date(Date.UTC(2026, 8, 30));

    expect(ageOn('2008-09-30', today)).toBe(18);
    expect(ageOn('2008-10-01', today)).toBe(17);
    expect(ageOn('2007-02-29', today)).toBeNull();
    expect(ageOn('2008-02-29', today)).toBe(18);
    expect(ageOn('2027-01-01', today)).toBeNull();
    expect(ageOn('30/09/2008', today)).toBeNull();
  });
});

describe('maioridade e termos', () => {
  it('bloqueia a conta até a pessoa confirmar a idade e aceitar os Termos', async () => {
    const cookie = await h.signIn('ana@example.com', { consent: false });

    const who = await h.request('/api/whoami', { cookie });
    expect(who.data.me.consented).toBe(false);

    const blocked = await h.request('/api/me/notes', { cookie });
    expect(blocked.status).toBe(403);
    expect(blocked.data.error.code).toBe('consent_required');

    expect((await h.request('/api/me', { cookie })).status).toBe(200);
    expect((await h.request('/api/me/export', { cookie })).status).toBe(200);

    const ok = await h.request('/api/me/consent', { cookie, json: { birthDate: '1990-05-20', acceptTerms: true } });
    expect(ok.status).toBe(200);
    expect(ok.data.termsVersion).toBe(termsVersion);

    expect((await h.request('/api/me/notes', { cookie })).status).toBe(200);
    expect((await h.request('/api/whoami', { cookie })).data.me.consented).toBe(true);
  });

  it('guarda só a confirmação, nunca a data de nascimento', async () => {
    const cookie = await h.signIn('ana@example.com');
    const exported = await h.request('/api/me/export', { cookie });
    const text = JSON.stringify(exported.data);

    expect(exported.data.consent).toMatchObject({ termsVersion });
    expect(text).not.toContain('1990-05-20');

    const columns = (await h.client.execute('PRAGMA table_info(profiles)')).rows.map((row) => String(row.name));
    expect(columns.some((name) => /birth|nasc/u.test(name))).toBe(false);
  });

  it('apaga a conta de quem tem menos de 18 anos', async () => {
    const cookie = await h.signIn('bia@example.com', { consent: false });
    const young = new Date();
    young.setUTCFullYear(young.getUTCFullYear() - 15);

    const refused = await h.request('/api/me/consent', { cookie, json: { birthDate: young.toISOString().slice(0, 10), acceptTerms: true } });
    expect(refused.status).toBe(403);
    expect(refused.data.error.code).toBe('underage');

    const users = await h.client.execute({ sql: 'SELECT count(*) AS n FROM user WHERE email = ?', args: ['bia@example.com'] });
    expect(Number(users.rows[0]!.n)).toBe(0);
    expect((await h.request('/api/whoami', { cookie })).data.me).toBeNull();
  });

  it('exige aceitar os Termos e uma data válida', async () => {
    const cookie = await h.signIn('ana@example.com', { consent: false });

    for (const json of [
      { birthDate: '1990-05-20', acceptTerms: false },
      { birthDate: '1990-05-20' },
      { birthDate: '1990-05-20', acceptTerms: true, extra: 1 },
    ]) {
      expect((await h.request('/api/me/consent', { cookie, json })).status, JSON.stringify(json)).toBe(422);
    }

    const bad = await h.request('/api/me/consent', { cookie, json: { birthDate: '1990-02-30', acceptTerms: true } });
    expect(bad.data.error.code).toBe('invalid_birth_date');
  });

  it('pede de novo quando a versão dos Termos muda', async () => {
    const cookie = await h.signIn('ana@example.com');

    await h.client.execute("UPDATE profiles SET terms_version = '2000-01-01'");

    expect((await h.request('/api/me/notes', { cookie })).data.error.code).toBe('consent_required');
  });
});

describe('códigos de login', () => {
  it('apaga os códigos expirados no próximo pedido de login', async () => {
    await h.request('/api/auth/sign-in/magic-link', { json: { email: 'ana@example.com' } });
    await h.client.execute({ sql: 'UPDATE verification SET expires_at = ?', args: [Date.now() - 1000] });

    await h.request('/api/auth/sign-in/magic-link', { json: { email: 'bia@example.com' } });

    const rows = await h.client.execute('SELECT identifier FROM verification');
    expect(rows.rows).toHaveLength(1);
  });
});
