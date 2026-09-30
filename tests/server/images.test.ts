import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { processAvatar } from '../../server/lib/images.ts';

const png = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: { r: 200, g: 80, b: 120 } } }).png().toBuffer();

describe('foto do perfil', () => {
  it('vira sempre um WebP 256 x 256 pequeno', async () => {
    const out = await processAvatar(await png(600, 300));
    const meta = await sharp(out).metadata();

    expect(meta.format).toBe('webp');
    expect([meta.width, meta.height]).toEqual([256, 256]);
    expect(out.byteLength).toBeLessThanOrEqual(64 * 1024);
  });

  it('descarta os metadados, como a localização', async () => {
    const withExif = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#fff' } })
      .jpeg()
      .withExif({ IFD0: { Copyright: 'segredo' } })
      .toBuffer();
    const out = await processAvatar(withExif);

    expect((await sharp(out).metadata()).exif).toBeUndefined();
  });

  it('confere os primeiros bytes, não o tipo declarado', async () => {
    await expect(processAvatar(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'))).rejects.toMatchObject({ code: 'photo_not_image' });
    await expect(processAvatar(Buffer.from('GIF89a....................'))).rejects.toMatchObject({ code: 'photo_not_image' });
    await expect(processAvatar(Buffer.from('<?php echo 1; ?>'))).rejects.toMatchObject({ code: 'photo_not_image' });
  });

  it('recusa arquivo com cara de imagem mas quebrado', async () => {
    const broken = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(100, 1)]);

    await expect(processAvatar(broken)).rejects.toMatchObject({ code: 'photo_unreadable' });
  });

  it('recusa arquivo grande e imagem com pixels demais', async () => {
    await expect(processAvatar(Buffer.alloc(300 * 1024, 1))).rejects.toMatchObject({ code: 'photo_too_large' });

    // 5000 x 5000 de uma cor só é um arquivo minúsculo, mas gigante depois de aberto.
    const bomb = await sharp({ create: { width: 5000, height: 5000, channels: 3, background: '#fff' } })
      .webp({ quality: 1 })
      .toBuffer();

    expect(bomb.byteLength).toBeLessThan(200 * 1024);
    await expect(processAvatar(bomb)).rejects.toMatchObject({ code: 'photo_unreadable' });
  });

  it('recusa WebP animado', async () => {
    const frame = (background: string) => sharp({ create: { width: 32, height: 32, channels: 3, background } }).png().toBuffer();
    const animated = await sharp([await frame('#f00'), await frame('#00f')], { join: { animated: true } })
      .webp({ loop: 0, delay: [100, 100] })
      .toBuffer();

    await expect(processAvatar(animated)).rejects.toMatchObject({ code: 'photo_animated' });
  });
});
