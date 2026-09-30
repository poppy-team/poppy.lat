import sharp from 'sharp';
import { HttpError } from './http.ts';

export const avatarMaxInputBytes = 200 * 1024;
export const avatarMaxStoredBytes = 64 * 1024;

const signatures: { name: string; test: (bytes: Uint8Array) => boolean }[] = [
  { name: 'png', test: (b) => b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  { name: 'jpeg', test: (b) => b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    name: 'webp',
    test: (b) =>
      b.length > 12 &&
      String.fromCharCode(b[0]!, b[1]!, b[2]!, b[3]!) === 'RIFF' &&
      String.fromCharCode(b[8]!, b[9]!, b[10]!, b[11]!) === 'WEBP',
  },
];

/**
 * The server never keeps what it was sent. The bytes are checked by their
 * first bytes (not by the declared type), decoded with a pixel limit, and
 * drawn again as a 256 x 256 WebP. Metadata such as the location is dropped
 * by the re-encode, and animated or oversized images are refused.
 */
export async function processAvatar(input: Uint8Array): Promise<Buffer> {
  if (input.byteLength > avatarMaxInputBytes) {
    throw new HttpError(413, 'photo_too_large', 'A foto está grande demais. O site compacta a foto antes de enviar; tente escolher a imagem de novo.');
  }

  if (!signatures.some((signature) => signature.test(input))) {
    throw new HttpError(415, 'photo_not_image', 'Esse arquivo não é uma imagem que o site aceita (PNG, JPEG ou WebP).');
  }

  try {
    const source = sharp(input, { limitInputPixels: 4_200_000, failOn: 'error', animated: false });
    const meta = await source.metadata();

    if ((meta.pages ?? 1) > 1) {
      throw new HttpError(415, 'photo_animated', 'Fotos animadas não são aceitas.');
    }

    for (const quality of [80, 65, 50, 35]) {
      const out = await source
        .clone()
        .rotate()
        .resize(256, 256, { fit: 'cover', position: 'centre' })
        .webp({ quality })
        .toBuffer();

      if (out.byteLength <= avatarMaxStoredBytes) {
        return out;
      }
    }

    throw new HttpError(413, 'photo_too_large', 'Não consegui deixar essa foto pequena o bastante. Tente outra.');
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError(415, 'photo_unreadable', 'Não consegui abrir essa imagem. Tente outra.');
  }
}
