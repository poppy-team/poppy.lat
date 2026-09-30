/**
 * Talking to the accounts API. Everything here is optional: when the build
 * does not set `VITE_ACCOUNTS=1`, no account interface is drawn and the site
 * is exactly the static site it was before.
 */
export const accountsEnabled = import.meta.env.VITE_ACCOUNTS === '1';

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly body: Record<string, unknown>;

  constructor(status: number, code: string, message: string, body: Record<string, unknown> = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.body = body;
  }
}

interface Options {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  json?: unknown;
  body?: BodyInit;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

export async function api<T>(path: string, options: Options = {}): Promise<T> {
  const init: RequestInit = {
    method: options.method ?? (options.json !== undefined || options.body !== undefined ? 'POST' : 'GET'),
    credentials: 'same-origin',
    headers: { ...(options.json !== undefined ? { 'content-type': 'application/json' } : {}), ...options.headers },
  };

  if (options.json !== undefined) {
    init.body = JSON.stringify(options.json);
  } else if (options.body !== undefined) {
    init.body = options.body;
  }

  if (options.signal) {
    init.signal = options.signal;
  }

  let response: Response;

  try {
    response = await fetch(path, init);
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    throw new ApiError(0, 'network', 'Sem conexão com o servidor. Confira a internet e tente de novo.');
  }

  const data: unknown = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = (data as { error?: { code?: string; message?: string } }).error ?? {};

    throw new ApiError(
      response.status,
      error.code ?? 'unknown',
      error.message ?? 'Algo deu errado. Tente de novo em instantes.',
      (error as Record<string, unknown>) ?? {},
    );
  }

  return data as T;
}

export interface LinkView {
  service: 'github' | 'x' | 'linkedin' | 'instagram' | 'youtube' | 'email' | 'site';
  label: string;
  value: string;
  href: string | null;
}

export interface ProfileView {
  handle: string;
  name: string;
  bio: string;
  badge: 'student' | 'contributor';
  isPublic: boolean;
  showInRankings: boolean;
  memberSince: string | null;
  photoUrl: string | null;
  links: LinkView[];
}

export interface Me {
  user: { id: string; name: string; email: string; role: 'student' | 'contributor' | 'admin' };
  profile: ProfileView;
}

export const badgeLabel = { student: 'Aluno', contributor: 'Contribuidor' } as const;

export function isStaff(me: Me | null): boolean {
  return me?.user.role === 'contributor' || me?.user.role === 'admin';
}

/** "12 de março de 2026", in the reader's language settings. */
export function longDate(value: string | null): string {
  return value ? new Date(value).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
}

export function shortDateTime(value: string | null): string {
  return value
    ? new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
    : '';
}

export interface CommentView {
  id: string;
  targetType: string;
  targetId: string;
  parentId: string | null;
  author: { handle: string; name: string; badge: 'student' | 'contributor'; profilePublic: boolean; photoUrl: string | null } | null;
  bodyMd: string | null;
  status: 'visible' | 'hidden_by_moderator' | 'deleted_by_author';
  hiddenReason: string | null;
  isPinned: boolean;
  isOfficial: boolean;
  createdAt: string | null;
  editedAt: string | null;
  mine: boolean;
  reactions: { emoji: string; count: number; mine: boolean }[];
}

export const reactionEmojis = ['👍', '❤️', '🎉', '💡', '🤔', '😅'] as const;

export interface DashboardView {
  comments: {
    written: number;
    repliesReceived: number;
    recent: { id: string; lessonId: string; excerpt: string; createdAt: string | null; replies: number }[];
  };
}

export interface NotificationItem {
  id: string;
  lessonId: string;
  excerpt: string;
  createdAt: string | null;
  isNew: boolean;
  by: { name: string; handle: string | null };
}
