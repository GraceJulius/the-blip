export const ID_RE = /^[A-Za-z0-9_-]{1,40}$/;

export function parseStudentId(value) {
  if (value === undefined || value === null || value === '') return 's1';
  const s = String(value);
  return ID_RE.test(s) ? s : null;
}
