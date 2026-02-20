const { Client } = require('pg');
require('dotenv').config();

const users = [
  {
    email: "nerrenzemarata1@gmail.com",
    fullName: "nerrenze 1marata",
    passwordHash: "$2b$10$cbnIO4xONm00QL90S9iL/OOVVXZY5TsoaKzaW5xw1CG2N9ZWxWJ4i",
    role: "STAFF",
    isApproved: true,
    contactNo: "09550732496",
    birthday: "2002-02-22T16:00:00.000Z",
    profileImageUrl: null
  },
  {
    email: "nerrenzemarata4@gmail.com",
    fullName: "nerrenze3 marata",
    passwordHash: "$2b$10$piwEh4B1Qys.eb3RYQUPPuSxiS.1TIrtDQuLa1gcHbHezHCFhM25C",
    role: "ADMIN",
    isApproved: true,
    contactNo: "09550733223",
    birthday: "2332-02-11T16:00:00.000Z",
    profileImageUrl: null
  },
  {
    email: "nerrenzemarata3@gmail.com",
    fullName: "nerrenze2 marata",
    passwordHash: "$2b$10$PSjJEGOF82sJEDXD7.vvJ.eJWYheilr0UV3CHcpYNzIO7bqtc8W2W",
    role: "STAFF",
    isApproved: true,
    contactNo: "09550732496",
    birthday: "2002-02-11T16:00:00.000Z",
    profileImageUrl: null
  },
  {
    email: "nerrenzemarata@gmail.com",
    fullName: "nerrenze marata",
    passwordHash: "$2b$10$1Mh7zMVVPQzkx9iguk9e/OdVA5tBw.iMIoXrc85IVoMgSt.jQ/EGq",
    role: "ADMIN",
    isApproved: true,
    contactNo: "09550732496",
    birthday: "2002-12-27T16:00:00.000Z",
    profileImageUrl: null
  },
  {
    email: "delacruz.evegen30@gmail.com",
    fullName: "evegen dela cruz",
    passwordHash: "$2b$10$mCFivkH4hY/nCUG1LBWPIOrC1AcVqPuY/Wlf6bkBCcPhSILnC0D8.",
    role: "ADMIN",
    isApproved: false,
    contactNo: "09658955212",
    birthday: "2003-06-20T16:00:00.000Z",
    profileImageUrl: null
  },
  {
    email: "evegendelacruz21@gmail.com",
    fullName: "evegen2 delacruz",
    passwordHash: "$2b$10$uF7H5eOksTCe2Vwh5MyAQelxv29RTQCcPZk9ZjJLG/5ihAhBHQfA6",
    role: "STAFF",
    isApproved: true,  // Changed from original - need to verify
    contactNo: "09658955212",
    birthday: "2003-06-20T16:00:00.000Z",
    profileImageUrl: null
  }
];

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set in .env');
    process.exit(1);
  }

  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });
  await client.connect();
  console.log('Connected to CockroachDB');

  let inserted = 0;
  let skipped = 0;

  for (const user of users) {
    // Upsert: skip if email already exists
    const result = await client.query(
      `INSERT INTO users (id, email, "passwordHash", "fullName", role, "isApproved", "contactNo", birthday, "profileImageUrl", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4::\"Role\", $5, $6, $7, $8, NOW(), NOW())
       ON CONFLICT (email) DO NOTHING
       RETURNING email`,
      [
        user.email,
        user.passwordHash,
        user.fullName,
        user.role,
        user.isApproved,
        user.contactNo,
        user.birthday ? new Date(user.birthday) : null,
        user.profileImageUrl,
      ]
    );

    if (result.rowCount > 0) {
      console.log(`  + Inserted: ${user.email} (${user.role})`);
      inserted++;
    } else {
      console.log(`  ~ Skipped (already exists): ${user.email}`);
      skipped++;
    }
  }

  console.log(`\nDone! Inserted: ${inserted}, Skipped: ${skipped}`);
  await client.end();
}

main().catch(e => {
  console.error('Error:', e.message);
  process.exit(1);
});
