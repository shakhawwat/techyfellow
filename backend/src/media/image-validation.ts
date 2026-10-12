import { BadRequestException, PayloadTooLargeException } from '@nestjs/common';
import sharp from 'sharp';
export type ImageLimits = { bytes: number; dimension: number; pixels: number };
export function altText(value: unknown): string {
  if (typeof value !== 'string' || value.trim().length < 3 || value.trim().length > 500 || !/[\p{L}\p{N}]/u.test(value) || /[\u0000-\u001F]/.test(value)) throw new BadRequestException({ fields: ['altText'] });
  return value.trim();
}
export async function validateImage(buffer: Buffer, originalname: string, limits: ImageLimits) {
  if (!buffer?.length) throw new BadRequestException({ fields: ['file'] });
  if (buffer.length > limits.bytes) throw new PayloadTooLargeException();
  const png = buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255;
  const webp = buffer.toString('ascii',0,4) === 'RIFF' && buffer.toString('ascii',8,12) === 'WEBP';
  if (!png && !jpeg && !webp) throw new BadRequestException({ fields: ['file'] });
  try {
    const image = sharp(buffer, { limitInputPixels: limits.pixels, failOn: 'warning', animated: true }).timeout({ seconds: 5 });
    const meta = await image.metadata();
    if (!['jpeg','png','webp'].includes(meta.format ?? '') || !meta.width || !meta.height || (meta.pages ?? 1) !== 1 ||
      meta.width > limits.dimension || meta.height > limits.dimension || meta.width * meta.height > limits.pixels) throw new Error();
    // Decode every pixel and re-encode, stripping metadata and trailing bytes; never store original untrusted input.
    const { data, info } = await image.rotate().toFormat(meta.format as 'jpeg' | 'png' | 'webp').toBuffer({ resolveWithObject: true });
    if (data.length > limits.bytes) throw new PayloadTooLargeException();
    if (info.width > limits.dimension || info.height > limits.dimension || info.width * info.height > limits.pixels) throw new Error();
    const extension = meta.format === 'jpeg' ? 'jpg' : meta.format;
    const stem = (originalname ?? 'image').split(/[\\/]/).at(-1)!.replace(/\.[^.]*$/, '').replace(/[^a-zA-Z0-9 _-]/g,'').trim().slice(0,100) || 'image';
    return { data, filename: `${stem}.${extension}`, mimeType: `image/${meta.format}`, size: data.length, width: info.width, height: info.height, extension };
  } catch (error) { if (error instanceof PayloadTooLargeException) throw error; throw new BadRequestException({ fields: ['file'] }); }
}
