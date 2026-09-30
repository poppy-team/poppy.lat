import { ref } from 'vue';
import { lessonAt } from '../data/courses';
import { coursesRoot } from '../data/courses';
import { courseState } from '../course-state';
import { accountsEnabled, api, ApiError, type Me } from './api';

/** The person who is logged in, or null. Loaded once per page load, after mount. */
export const me = ref<Me | null>(null);
export const sessionStatus = ref<'idle' | 'loading' | 'ready'>('idle');

let started = false;

const prefix = `${coursesRoot}/`;

function toId(route: string): string | undefined {
  const place = lessonAt(route);

  return place?.lesson.status === 'available' ? route.replace(/(\.html|\/)$/u, '').slice(prefix.length) : undefined;
}

/**
 * Merges this browser's finished lessons into the account and brings the
 * account's back. Neither side loses anything: the result is the union.
 */
async function syncProgress(): Promise<void> {
  const local = courseState.value.completed.map(toId).filter((id): id is string => Boolean(id));
  const result = await api<{ lessons: { id: string; status: string }[] }>('/api/me/progress', {
    method: 'PUT',
    json: { lessons: local.map((id) => ({ id, status: 'completed' })) },
  });
  const fromServer = result.lessons.filter((lesson) => lesson.status === 'completed').map((lesson) => `${prefix}${lesson.id}`);

  courseState.value.completed = [...new Set([...courseState.value.completed, ...fromServer])];
}

export async function refreshMe(): Promise<Me | null> {
  try {
    me.value = (await api<{ me: Me | null }>('/api/whoami')).me;
  } catch (error) {
    // The API being down must not break a lesson: the page simply stays as a visitor's.
    console.warn('[conta] não foi possível ler a sessão', error instanceof ApiError ? error.status : '');

    me.value = null;
  }

  return me.value;
}

export function startSession(): void {
  if (started || !accountsEnabled || typeof window === 'undefined') {
    return;
  }

  started = true;
  sessionStatus.value = 'loading';

  void refreshMe().then(async (current) => {
    sessionStatus.value = 'ready';

    if (current) {
      await syncProgress().catch(() => undefined);
    }
  });

  // A lesson marked or unmarked in the lesson footer is sent to the account too.
  window.addEventListener('poppy:completed', (event) => {
    const { route, done } = (event as CustomEvent<{ route: string; done: boolean }>).detail;
    const id = toId(route);

    if (!me.value || !id) {
      return;
    }

    void (done
      ? api('/api/me/progress', { method: 'PUT', json: { lessons: [{ id, status: 'completed' }] } })
      : api(`/api/me/progress?lesson=${encodeURIComponent(id)}`, { method: 'DELETE' })
    ).catch(() => undefined);
  });
}

export async function signOut(): Promise<void> {
  await api('/api/auth/sign-out', { method: 'POST', json: {} }).catch(() => undefined);
  me.value = null;
  window.location.assign('/aprender/');
}
