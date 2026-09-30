/**
 * Small fixes for accessibility problems that live inside VitePress's own
 * components, which the theme cannot change by slot or by style:
 *
 * - A collapsible sidebar group is a button that contains another button (the
 *   caret), which assistive technology cannot reach reliably. The group keeps
 *   the role and the keyboard behaviour; the caret becomes decoration. The
 *   group's open or closed state is now announced.
 * - The caret's label is English on every page; it is translated.
 * - The page footer of the documentation (previous and next) is a second
 *   "contentinfo" landmark next to the site footer; it stops being one (the
 *   pager inside it is already a navigation) and the edit and last-updated
 *   line becomes a labelled region.
 *
 * The changes are idempotent and run after the page renders and after
 * client-side navigation, through one observer that waits a frame.
 */

function portuguese(): boolean {
  return !document.documentElement.lang.startsWith('en');
}

export function patchVitepressAccessibility(): void {
  for (const item of document.querySelectorAll<HTMLElement>('.VPSidebarItem .item')) {
    const group = item.closest('.VPSidebarItem');
    const caret = item.querySelector<HTMLElement>('.caret[role="button"], .caret[role="presentation"]');
    const expanded = String(!group?.classList.contains('collapsed'));

    if (!caret) {
      continue;
    }

    if (item.getAttribute('role') === 'button') {
      item.setAttribute('aria-expanded', expanded);
      caret.setAttribute('role', 'presentation');
      caret.setAttribute('tabindex', '-1');
      caret.removeAttribute('aria-label');
      caret.setAttribute('aria-hidden', 'true');
    } else {
      caret.setAttribute('aria-expanded', expanded);
      caret.setAttribute('aria-label', portuguese() ? 'Abrir ou fechar a seção' : 'Open or close the section');
    }
  }

  for (const footer of document.querySelectorAll<HTMLElement>('footer.VPDocFooter')) {
    footer.setAttribute('role', 'none');

    const info = footer.querySelector<HTMLElement>('.edit-info');

    info?.setAttribute('role', 'region');
    info?.setAttribute('aria-label', portuguese() ? 'Sobre esta página' : 'About this page');
  }
}

let scheduled = false;

export function watchVitepressAccessibility(): void {
  if (typeof window === 'undefined') {
    return;
  }

  const schedule = (): void => {
    if (scheduled) {
      return;
    }

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      patchVitepressAccessibility();
    });
  };

  new MutationObserver(schedule).observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class'],
  });
  schedule();
}
