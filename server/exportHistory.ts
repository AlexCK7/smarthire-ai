import { Pool } from 'pg';
import fs from 'fs';

async function exportHistory() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const result = await pool.query('SELECT * FROM resume_history ORDER BY created_at DESC');

  const rows = result.rows;
  const csv = [
    'id,filename,score,top_job,created_at',
    ...rows.map(r => `${r.id},"${r.filename}",${r.score},${r.top_job},${r.created_at}`)
  ].join('\n');

  fs.writeFileSync('history.csv', csv);
  console.log("✅ history.csv exported successfully");

  await pool.end();
}

exportHistory().catch(console.error);
