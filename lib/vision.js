export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
export const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;

export function validateUpload(mediaType, data) {
  const isImage = IMAGE_TYPES.includes(mediaType);
  if (!isImage && mediaType !== 'application/pdf') return 'Upload a photo (JPG, PNG or WebP) or a PDF.';
  if (typeof data !== 'string' || data.length < 100) return 'That file looks empty.';
  if (data.length * 0.75 > MAX_UPLOAD_BYTES) return 'That file is too large. Try a smaller photo or a cropped screenshot.';
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(data)) return 'That file could not be read.';
  return null;
}

export function visionContent(mediaType, data, instruction) {
  const block = mediaType === 'application/pdf'
    ? { type: 'document', source: { type: 'base64', media_type: mediaType, data } }
    : { type: 'image', source: { type: 'base64', media_type: mediaType, data } };
  return [block, { type: 'text', text: instruction }];
}
