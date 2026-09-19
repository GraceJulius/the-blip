let pool = null;

async function getPool() {
  if (!pool) {
    const { default: pg } = await import('pg');
    const ssl = process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false };
    pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl, max: 2 });
  }
  return pool;
}

export async function loadSnapshot() {
  const p = await getPool();
  await p.query('create table if not exists blip_state (id int primary key, data jsonb not null, updated_at timestamptz not null default now())');
  const r = await p.query('select data from blip_state where id = 1');
  return r.rows[0] ? r.rows[0].data : null;
}

export async function saveSnapshot(data) {
  const p = await getPool();
  await p.query(
    'insert into blip_state (id, data, updated_at) values (1, $1, now()) on conflict (id) do update set data = excluded.data, updated_at = now()',
    [JSON.stringify(data)]
  );
}
