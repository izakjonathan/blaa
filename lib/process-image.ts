import sharp from 'sharp';
export async function processImage(input: Buffer) {
  if (!input.length || input.length > 25000000) throw new Error('Image must be smaller than 25 MB.');
  try {
    return await sharp(input, { limitInputPixels:80000000, animated:false }).rotate().resize({ width:2400, height:2400, fit:'inside', withoutEnlargement:true }).webp({ quality:92 }).toBuffer({ resolveWithObject:true });
  } catch { throw new Error('Image could not be read. Choose a JPEG, PNG or WebP image.'); }
}
