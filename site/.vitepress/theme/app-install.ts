import { ref } from 'vue';

/**
 * Installing the site as an app. Chromium browsers (desktop and Android) offer
 * the install prompt through an event, which is kept until the person asks for
 * it. Safari on iPhone and iPad has no prompt: there the way is the Share
 * menu, so the page shows those steps instead. Nothing here runs on the server.
 */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let promptEvent: InstallPromptEvent | null = null;
let started = false;

/** True when the browser can show its own install prompt right now. */
export const canPrompt = ref(false);
/** True on Safari for iPhone and iPad, where installing is done from the Share menu. */
export const needsManualSteps = ref(false);
/** True once the site runs as an installed app, or was just installed. */
export const installed = ref(false);

function runsAsApp(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  const { userAgent, platform, maxTouchPoints } = navigator;

  // iPadOS reports itself as a Mac with a touch screen.
  return /iPad|iPhone|iPod/u.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1);
}

export function watchInstall(): void {
  if (started || typeof window === 'undefined') {
    return;
  }

  started = true;
  installed.value = runsAsApp();
  needsManualSteps.value = !installed.value && isIos();

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    promptEvent = event as InstallPromptEvent;
    canPrompt.value = true;
  });

  window.addEventListener('appinstalled', () => {
    promptEvent = null;
    canPrompt.value = false;
    installed.value = true;
  });
}

/** Shows the browser's install prompt. Returns whether the person accepted. */
export async function promptInstall(): Promise<boolean> {
  if (!promptEvent) {
    return false;
  }

  const event = promptEvent;

  // The event can be used once.
  promptEvent = null;
  canPrompt.value = false;
  await event.prompt();

  return (await event.userChoice).outcome === 'accepted';
}

/** Registers the service worker of the app, in the built site only. */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !import.meta.env.PROD || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
  });
}
