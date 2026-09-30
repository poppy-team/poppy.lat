import { getCurrentInstance, onMounted, ref, watch } from 'vue';

/**
 * Course progress and reading preferences, kept in the reader's browser.
 *
 * Everything the courses remember goes through this one module, so moving it
 * to a user account later means changing the two storage functions below and
 * nothing in the components. Storage can be missing or throw (private windows,
 * blocked site data), and the pages must work the same without it.
 */

const storageKey = 'poppy.courses.v1';

export type TextSize = 'normal' | 'large' | 'larger';
export type Spacing = 'normal' | 'wide';
export type ReadingFont = 'default' | 'hyperlegible';

export interface ReadingPreferences {
  size: TextSize;
  spacing: Spacing;
  font: ReadingFont;
  focus: boolean;
}

interface CourseState {
  completed: string[];
  lastLesson?: string;
  /** Label of the code tab the reader picked, such as "Ori" or "Aipo". */
  codeTab?: string;
  preferences: ReadingPreferences;
}

const defaults: CourseState = {
  completed: [],
  preferences: { size: 'normal', spacing: 'normal', font: 'default', focus: false },
};

function load(): CourseState {
  try {
    const raw = globalThis.localStorage?.getItem(storageKey);
    const parsed = raw ? (JSON.parse(raw) as Partial<CourseState>) : {};

    return {
      ...defaults,
      ...parsed,
      completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      preferences: { ...defaults.preferences, ...parsed.preferences },
    };
  } catch {
    return structuredClone(defaults);
  }
}

function save(state: CourseState): void {
  try {
    globalThis.localStorage?.setItem(storageKey, JSON.stringify(state));
  } catch {
    // The page keeps working for this visit; nothing is remembered.
  }
}

/** Shared by every component; starts with the defaults during the build. */
export const courseState = ref<CourseState>(structuredClone(defaults));

let loaded = false;

function loadOnce(): void {
  if (loaded) {
    return;
  }

  loaded = true;
  courseState.value = load();
  watch(courseState, (state) => save(state), { deep: true });
  watch(() => courseState.value.preferences, applyPreferences, { deep: true, immediate: true });
}

/**
 * The shared state. The stored values are read after the first component
 * mounts, not during setup, so the first render matches the prebuilt HTML
 * and hydration does not trip over progress that only this browser knows.
 */
export function useCourseState() {
  if (!loaded && typeof window !== 'undefined') {
    if (getCurrentInstance()) {
      onMounted(loadOnce);
    } else {
      loadOnce();
    }
  }

  return courseState;
}

/**
 * Preferences act through attributes on the document element, which the
 * course stylesheet reads, so they apply before and after navigation alike.
 */
export function applyPreferences(preferences: ReadingPreferences): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement.dataset;
  root.readingSize = preferences.size;
  root.readingSpacing = preferences.spacing;
  root.readingFont = preferences.font;
  root.readingFocus = String(preferences.focus);
}

export function isCompleted(route: string): boolean {
  return courseState.value.completed.includes(route);
}

export function setCompleted(route: string, done: boolean): void {
  const others = courseState.value.completed.filter((item) => item !== route);
  courseState.value.completed = done ? [...others, route] : others;
}

/**
 * Keeps the reader's language choice across lessons: a click on an "Ori" or
 * "Aipo" tab in any code group is remembered, and every code group on the
 * next page opens on the same tab.
 */
export function rememberCodeTabs(): void {
  if (typeof document === 'undefined') {
    return;
  }

  document.addEventListener('click', (event) => {
    const input = event.target instanceof Element ? event.target.closest('.vp-code-group input') : null;
    const title = input?.nextElementSibling?.getAttribute('data-title');

    if (title) {
      courseState.value.codeTab = title;
    }
  });
}

export function applyCodeTab(): void {
  const title = courseState.value.codeTab;

  if (!title || typeof document === 'undefined') {
    return;
  }

  for (const label of document.querySelectorAll<HTMLLabelElement>('.vp-code-group .tabs label')) {
    const input = label.previousElementSibling;

    if (label.dataset.title === title && input instanceof HTMLInputElement && !input.checked) {
      label.click();
    }
  }
}
