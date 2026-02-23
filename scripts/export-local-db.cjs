const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:09550732496nerrenze12345ma@localhost:5432/dost_db',
  });

  await client.connect();
  console.log('Connected to local PostgreSQL');

  // Get all tables
  const tables = await client.query(
    "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != '_prisma_migrations' ORDER BY tablename"
  );

  const outDir = path.join(__dirname, '..', 'Design', 'db-export');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const row of tables.rows) {
    const tableName = row.tablename;
    const result = await client.query(`SELECT * FROM "${tableName}"`);
    const filePath = path.join(outDir, `${tableName}.json`);
    fs.writeFileSync(filePath, JSON.stringify(result.rows, null, 2));
    console.log(`  ${tableName}: ${result.rows.length} rows -> ${filePath}`);
  }

  console.log('\nExport complete! Files saved to Design/db-export/');
  await client.end();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
