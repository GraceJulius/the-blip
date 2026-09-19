import { ready } from './store';
import { parseStudentId } from './ids';
import { checkStudent } from './engine';

export async function studentFrom(raw) {
  await ready();
  const id = parseStudentId(raw);
  if (!id) return { error: Response.json({ error: 'That student id is not valid.' }, { status: 400 }) };
  const c = checkStudent(id);
  if (!c.ok) return { error: Response.json({ error: c.error }, { status: c.status }) };
  return { id };
}
