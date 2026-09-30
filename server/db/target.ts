/**
 * Says which database an address points at, without the token and without the
 * path of a private file, so a person running a migration can see where it went.
 */
export function describeTarget(url: string): { remote: boolean; label: string } {
  if (url.startsWith('file:') || url === ':memory:') {
    return { remote: false, label: url === ':memory:' ? 'banco em memória' : `arquivo local (${url.slice('file:'.length)})` };
  }

  try {
    return { remote: true, label: `${new URL(url).host} (remoto)` };
  } catch {
    return { remote: true, label: 'endereço remoto que não consegui ler' };
  }
}
