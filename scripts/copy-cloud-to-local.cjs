const { Client } = require("pg");

const tables = [
  "users",
  "provinces",
  "municipalities",
  "barangays",
  "setup_projects",
  "cest_projects",
  "project_documents",
  "cest_project_documents",
  "map_pins",
  "archival_records",
  "calendar_events",
  "user_permissions",
  "user_logs",
  "time_records",
];

const q = (s) => `"${s}"`;

async function main() {
  const cloud = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  const local = new Client({
    connectionString: process.env.LOCAL_DATABASE_URL,
  });

  await cloud.connect();
  await local.connect();

  for (const table of tables) {
    const result = await cloud.query(`SELECT * FROM ${q(table)}`);
    console.log(`${table}: ${result.rowCount} rows found`);

    for (const row of result.rows) {
      const cols = Object.keys(row);
      const vals = Object.values(row);

      const sql = `
        INSERT INTO ${q(table)} (${cols.map(q).join(", ")})
        VALUES (${cols.map((_, i) => `$${i + 1}`).join(", ")})
        ON CONFLICT DO NOTHING
      `;

      await local.query(sql, vals);
    }

    console.log(`${table}: copied`);
  }

  await cloud.end();
  await local.end();
  console.log("DONE");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
