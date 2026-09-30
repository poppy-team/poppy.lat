import { beforeEach, describe, expect, it } from 'vitest';
import { createHarness, type Harness } from './helpers.ts';

let h: Harness;

beforeEach(async () => {
  h = await createHarness();
});

const lesson = 'pensar-em-codigo/primeiro-programa/ola';

describe('anotações', () => {
  it('cria, lê, edita e apaga a própria anotação, ligada a uma aula', async () => {
    const cookie = await h.signIn('ana@example.com');
    const created = await h.request('/api/me/notes', { json: { title: 'Aula 1', bodyMd: '# Olá\n\n**ideia**', lessonId: lesson }, cookie });

    expect(created.status).toBe(201);
    expect(created.data.note).toMatchObject({ title: 'Aula 1', lessonId: lesson, version: 1 });

    const id = created.data.note.id as string;
    const read = await h.request(`/api/me/notes/${id}`, { cookie });

    expect(read.data.note.bodyMd).toBe('# Olá\n\n**ideia**');

    const saved = await h.request(`/api/me/notes/${id}`, { method: 'PUT', json: { title: 'Aula 1', bodyMd: 'novo', lessonId: lesson, version: 1 }, cookie });

    expect(saved.data.note.version).toBe(2);

    const list = await h.request(`/api/me/notes?lesson=${lesson}`, { cookie });

    expect(list.data.notes).toHaveLength(1);
    expect(list.data.notes[0].excerpt).toBe('novo');
    expect(list.data.notes[0].bodyMd).toBeUndefined();

    expect((await h.request(`/api/me/notes/${id}`, { method: 'DELETE', cookie })).status).toBe(200);
    expect((await h.request(`/api/me/notes/${id}`, { cookie })).status).toBe(404);
  });

  it('duas abas não sobrescrevem uma à outra: a segunda recebe 409 com a versão salva', async () => {
    const cookie = await h.signIn('ana@example.com');
    const created = await h.request('/api/me/notes', { json: { title: '', bodyMd: 'a' }, cookie });
    const id = created.data.note.id as string;

    await h.request(`/api/me/notes/${id}`, { method: 'PUT', json: { title: '', bodyMd: 'aba 1', version: 1 }, cookie });

    const late = await h.request(`/api/me/notes/${id}`, { method: 'PUT', json: { title: '', bodyMd: 'aba 2', version: 1 }, cookie });

    expect(late.status).toBe(409);
    expect(late.data.error.code).toBe('version_conflict');
    expect(late.data.error.note).toMatchObject({ bodyMd: 'aba 1', version: 2 });
  });

  it('a anotação de outra pessoa responde "não encontrada", em todas as operações', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');
    const created = await h.request('/api/me/notes', { json: { title: 'Segredo', bodyMd: 'privado' }, cookie: ana });
    const id = created.data.note.id as string;

    expect((await h.request(`/api/me/notes/${id}`, { cookie: bia })).status).toBe(404);
    expect((await h.request(`/api/me/notes/${id}`, { method: 'PUT', json: { title: '', bodyMd: 'x', version: 1 }, cookie: bia })).status).toBe(404);
    expect((await h.request(`/api/me/notes/${id}`, { method: 'DELETE', cookie: bia })).status).toBe(404);
    expect((await h.request('/api/me/notes', { cookie: bia })).data.notes).toEqual([]);
    expect((await h.request('/api/me/notes?q=privado', { cookie: bia })).data.notes).toEqual([]);

    const intact = await h.request(`/api/me/notes/${id}`, { cookie: ana });

    expect(intact.data.note.bodyMd).toBe('privado');
  });

  it('nem administradores leem anotações alheias', async () => {
    const ana = await h.signIn('ana@example.com');
    const root = await h.signIn('root@example.com');

    await h.setRole('root@example.com', 'admin');

    const created = await h.request('/api/me/notes', { json: { title: 'x', bodyMd: 'y' }, cookie: ana });

    expect((await h.request(`/api/me/notes/${created.data.note.id}`, { cookie: root })).status).toBe(404);
    expect((await h.request('/api/me/notes', { cookie: root })).data.notes).toEqual([]);
  });

  it('exige login', async () => {
    expect((await h.request('/api/me/notes')).status).toBe(401);
    expect((await h.request('/api/me/notes', { json: { title: '', bodyMd: 'x' } })).status).toBe(401);
  });

  it('valida aula, tamanho e texto; a busca trata % como letra comum', async () => {
    const cookie = await h.signIn('ana@example.com');

    expect((await h.request('/api/me/notes', { json: { title: '', bodyMd: 'x', lessonId: 'inventada/aula/x' }, cookie })).status).toBe(422);
    expect((await h.request('/api/me/notes', { json: { title: '', bodyMd: 'x'.repeat(50_001) }, cookie })).status).toBeGreaterThanOrEqual(413);
    expect((await h.request('/api/me/notes', { json: { title: 'a'.repeat(121), bodyMd: 'x' }, cookie })).status).toBe(422);
    expect((await h.request('/api/me/notes', { json: { title: '', bodyMd: 'a‮b' }, cookie })).status).toBe(422);

    await h.request('/api/me/notes', { json: { title: 'desconto', bodyMd: '100% de aproveitamento' }, cookie });
    await h.request('/api/me/notes', { json: { title: 'outra', bodyMd: 'nada a ver' }, cookie });

    expect((await h.request(`/api/me/notes?q=${encodeURIComponent('100%')}`, { cookie })).data.notes).toHaveLength(1);
    expect((await h.request(`/api/me/notes?q=${encodeURIComponent('%')}`, { cookie })).data.notes).toHaveLength(1);
  });

  it('limita a 500 anotações por pessoa', async () => {
    const cookie = await h.signIn('ana@example.com');
    const id = String((await h.client.execute("SELECT id FROM user WHERE email = 'ana@example.com'")).rows[0]!.id);

    await h.client.batch(
      Array.from({ length: 500 }, (_, i) => ({ sql: 'INSERT INTO notes (id, user_id, body_md) VALUES (?, ?, ?)', args: [`n${i}`, id, 'x'] })),
      'write',
    );

    const full = await h.request('/api/me/notes', { json: { title: '', bodyMd: 'mais uma' }, cookie });

    expect(full.status).toBe(409);
    expect(full.data.error.code).toBe('notes_full');
  });
});

describe('progresso', () => {
  it('junta o que o navegador sabe, aceita só aulas do catálogo e nunca desfaz uma aula concluída', async () => {
    const cookie = await h.signIn('ana@example.com');
    const first = await h.request('/api/me/progress', { method: 'PUT', json: { lessons: [{ id: lesson, status: 'completed', codeTab: 'Ori' }] }, cookie });

    expect(first.data.lessons).toMatchObject([{ id: lesson, status: 'completed', codeTab: 'Ori' }]);

    const merged = await h.request('/api/me/progress', { method: 'PUT', json: { lessons: [{ id: lesson, status: 'started', codeTab: 'Aipo' }] }, cookie });

    expect(merged.data.lessons).toMatchObject([{ id: lesson, status: 'completed', codeTab: 'Aipo' }]);
    expect((await h.request('/api/me/progress', { cookie })).data.lessons).toHaveLength(1);

    expect((await h.request('/api/me/progress', { method: 'PUT', json: { lessons: [{ id: 'inventada/x/y', status: 'completed' }] }, cookie })).status).toBe(422);
    expect((await h.request('/api/me/progress', { method: 'PUT', json: { lessons: [{ id: lesson, status: 'quase' }] }, cookie })).status).toBe(422);
  });

  it('o progresso é de cada pessoa', async () => {
    const ana = await h.signIn('ana@example.com');
    const bia = await h.signIn('bia@example.com');

    await h.request('/api/me/progress', { method: 'PUT', json: { lessons: [{ id: lesson, status: 'completed' }] }, cookie: ana });

    expect((await h.request('/api/me/progress', { cookie: bia })).data.lessons).toEqual([]);
  });
});
