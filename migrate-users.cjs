const { Client } = require('pg');

async function main() {
  const old = new Client({
    connectionString: 'postgresql://postgres:09550732496nerrenze12345ma@localhost:5432/dost_db',
  });

  await old.connect();
  const result = await old.query('SELECT email, "fullName", "passwordHash", role, "isApproved", "contactNo", birthday, "profileImageUrl" FROM users');
  console.log(JSON.stringify(result.rows, null, 2));
  await old.end();
}

main().catch(e => { console.error(e.message); process.exit(1); });
