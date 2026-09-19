const MAX_DIM = 1600;

function readAsBase64(blob) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result).split(',')[1] || '');
    r.onerror = () => reject(new Error('read failed'));
    r.readAsDataURL(blob);
  });
}

export async function fileToUpload(file) {
  if (file.type === 'application/pdf') {
    if (file.size > 4 * 1024 * 1024) throw new Error('That PDF is too large. Try a screenshot of the page with the balance and APR.');
    return { mediaType: 'application/pdf', data: await readAsBase64(file) };
  }
  if (!file.type.startsWith('image/')) throw new Error('Choose a photo or a PDF.');
  let bmp;
  try {
    bmp = await createImageBitmap(file);
  } catch {
    throw new Error('That photo format is not supported here. Take a screenshot instead, or use a JPG or PNG.');
  }
  const scale = Math.min(1, MAX_DIM / Math.max(bmp.width, bmp.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bmp.width * scale);
  canvas.height = Math.round(bmp.height * scale);
  canvas.getContext('2d').drawImage(bmp, 0, 0, canvas.width, canvas.height);
  const data = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
  return { mediaType: 'image/jpeg', data };
}
