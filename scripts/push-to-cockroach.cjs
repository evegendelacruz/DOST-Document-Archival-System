const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const exportDir = path.join(__dirname, '..', 'Design', 'db-export');

function loadJson(name) {
  return JSON.parse(fs.readFileSync(path.join(exportDir, name + '.json'), 'utf-8'));
}

async function main() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  console.log('Connected to CockroachDB\n');

  // ─── CLEAR ALL DATA (in dependency order) ─────────────────────────
  console.log('Clearing existing data...');
  const clearOrder = [
    'user_logs', 'user_permissions', 'cest_project_documents', 'project_documents',
    'setup_projects', 'cest_projects', 'map_pins', 'archival_records',
    'barangays', 'municipalities', 'provinces', 'calendar_events', 'users',
  ];
  for (const table of clearOrder) {
    await client.query(`DELETE FROM "${table}"`);
    console.log(`  Cleared ${table}`);
  }
  console.log('');

  // ─── 1. USERS ─────────────────────────────────────────────────────
  const users = loadJson('users');
  for (const u of users) {
    await client.query(
      `INSERT INTO users (id, email, "passwordHash", "fullName", role, "createdAt", "updatedAt", birthday, "contactNo", "resetOtp", "resetOtpExpiresAt", "profileImageUrl", "isApproved")
       VALUES ($1, $2, $3, $4, $5::"Role", $6, $7, $8, $9, $10, $11, $12, $13)`,
      [u.id, u.email, u.passwordHash, u.fullName, u.role,
       u.createdAt, u.updatedAt, u.birthday, u.contactNo,
       u.resetOtp, u.resetOtpExpiresAt, u.profileImageUrl, u.isApproved]
    );
  }
  console.log(`Users: ${users.length} inserted`);

  // ─── 2. PROVINCES ─────────────────────────────────────────────────
  const provinces = loadJson('provinces');
  for (const p of provinces) {
    await client.query(
      `INSERT INTO provinces (id, name, "createdAt", "updatedAt") VALUES ($1, $2, $3, $4)`,
      [p.id, p.name, p.createdAt, p.updatedAt]
    );
  }
  console.log(`Provinces: ${provinces.length} inserted`);

  // ─── 3. MUNICIPALITIES ────────────────────────────────────────────
  const municipalities = loadJson('municipalities');
  for (const m of municipalities) {
    await client.query(
      `INSERT INTO municipalities (id, name, "provinceId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5)`,
      [m.id, m.name, m.provinceId, m.createdAt, m.updatedAt]
    );
  }
  console.log(`Municipalities: ${municipalities.length} inserted`);

  // ─── 4. BARANGAYS ─────────────────────────────────────────────────
  const barangays = loadJson('barangays');
  for (const b of barangays) {
    await client.query(
      `INSERT INTO barangays (id, name, "municipalityId", "createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5)`,
      [b.id, b.name, b.municipalityId, b.createdAt, b.updatedAt]
    );
  }
  console.log(`Barangays: ${barangays.length} inserted`);

  // ─── 5. SETUP PROJECTS ────────────────────────────────────────────
  const setupProjects = loadJson('setup_projects');
  for (const s of setupProjects) {
    await client.query(
      `INSERT INTO setup_projects (id, code, title, firm, "typeOfFirm", address, coordinates, "corporatorName", "contactNumbers", emails, status, "prioritySector", "firmSize", fund, "typeOfFund", assignee, "companyLogoUrl", "createdAt", "updatedAt", year, "dropdownData")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::"SetupStatus", $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)`,
      [s.id, s.code, s.title, s.firm, s.typeOfFirm, s.address, s.coordinates,
       s.corporatorName, s.contactNumbers, s.emails, s.status, s.prioritySector,
       s.firmSize, s.fund, s.typeOfFund, s.assignee, s.companyLogoUrl,
       s.createdAt, s.updatedAt, s.year,
       s.dropdownData ? JSON.stringify(s.dropdownData) : (s.dropdown_data ? JSON.stringify(s.dropdown_data) : null)]
    );
  }
  console.log(`Setup Projects: ${setupProjects.length} inserted`);

  // ─── 6. CEST PROJECTS ─────────────────────────────────────────────
  const cestProjects = loadJson('cest_projects');
  for (const c of cestProjects) {
    await client.query(
      `INSERT INTO cest_projects (id, code, "projectTitle", location, beneficiaries, "programFunding", status, "approvedAmount", "releasedAmount", "projectDuration", "staffAssigned", year, "dateOfApproval", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
      [c.id, c.code, c.projectTitle, c.location, c.beneficiaries, c.programFunding,
       c.status, c.approvedAmount, c.releasedAmount, c.projectDuration,
       c.staffAssigned, c.year, c.dateOfApproval, c.createdAt, c.updatedAt]
    );
  }
  console.log(`CEST Projects: ${cestProjects.length} inserted`);

  // ─── 7. PROJECT DOCUMENTS (SETUP) ─────────────────────────────────
  const projectDocs = loadJson('project_documents');
  for (const d of projectDocs) {
    const fileBuffer = d.fileData && d.fileData.data ? Buffer.from(d.fileData.data) : null;
    await client.query(
      `INSERT INTO project_documents (id, "projectId", phase, "templateItemId", "fileName", "fileUrl", "createdAt", "updatedAt", "fileData", "mimeType")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [d.id, d.projectId, d.phase, d.templateItemId, d.fileName, d.fileUrl,
       d.createdAt, d.updatedAt, fileBuffer, d.mimeType]
    );
  }
  console.log(`Project Documents (SETUP): ${projectDocs.length} inserted`);

  // ─── 8. CEST PROJECT DOCUMENTS ────────────────────────────────────
  const cestDocs = loadJson('cest_project_documents');
  for (const d of cestDocs) {
    const fileBuffer = d.fileData && d.fileData.data ? Buffer.from(d.fileData.data) : null;
    await client.query(
      `INSERT INTO cest_project_documents (id, "projectId", phase, "templateItemId", "fileName", "fileUrl", "mimeType", "fileData", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [d.id, d.projectId, d.phase, d.templateItemId, d.fileName, d.fileUrl,
       d.mimeType, fileBuffer, d.createdAt, d.updatedAt]
    );
  }
  console.log(`CEST Project Documents: ${cestDocs.length} inserted`);

  // ─── 9. MAP PINS ──────────────────────────────────────────────────
  const mapPins = loadJson('map_pins');
  for (const m of mapPins) {
    await client.query(
      `INSERT INTO map_pins (id, lat, lng, label, district, program, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6::"MapProgram", $7, $8)`,
      [m.id, m.lat, m.lng, m.label, m.district, m.program, m.createdAt, m.updatedAt]
    );
  }
  console.log(`Map Pins: ${mapPins.length} inserted`);

  // ─── 10. ARCHIVAL RECORDS ─────────────────────────────────────────
  const archival = loadJson('archival_records');
  for (const a of archival) {
    await client.query(
      `INSERT INTO archival_records (id, "userName", title, company, contact, year, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [a.id, a.userName, a.title, a.company, a.contact, a.year, a.createdAt, a.updatedAt]
    );
  }
  console.log(`Archival Records: ${archival.length} inserted`);

  // ─── 11. USER LOGS ────────────────────────────────────────────────
  const userLogs = loadJson('user_logs');
  for (const l of userLogs) {
    await client.query(
      `INSERT INTO user_logs (id, "userId", action, timestamp, details, "resourceId", "resourceTitle", "resourceType")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [l.id, l.userId, l.action, l.timestamp, l.details, l.resourceId, l.resourceTitle, l.resourceType]
    );
  }
  console.log(`User Logs: ${userLogs.length} inserted`);

  // ─── 12. USER PERMISSIONS ─────────────────────────────────────────
  const userPerms = loadJson('user_permissions');
  for (const p of userPerms) {
    await client.query(
      `INSERT INTO user_permissions (id, "userId", "canAccessSetup", "canAccessCest", "canAccessMaps", "canAccessCalendar", "canAccessArchival", "canManageUsers")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [p.id, p.userId, p.canAccessSetup, p.canAccessCest, p.canAccessMaps,
       p.canAccessCalendar, p.canAccessArchival, p.canManageUsers]
    );
  }
  console.log(`User Permissions: ${userPerms.length} inserted`);

  // ─── 13. CALENDAR EVENTS ──────────────────────────────────────────
  const calEvents = loadJson('calendar_events');
  for (const e of calEvents) {
    await client.query(
      `INSERT INTO calendar_events (id, title, date, location, "bookedBy", "bookedService", "bookedPersonnel", priority, "staffInvolved", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [e.id, e.title, e.date, e.location, e.bookedBy, e.bookedService,
       e.bookedPersonnel, e.priority, e.staffInvolved, e.createdAt, e.updatedAt]
    );
  }
  console.log(`Calendar Events: ${calEvents.length} inserted`);

  // ─── VERIFY ───────────────────────────────────────────────────────
  console.log('\n--- Verification ---');
  const allTables = ['users','provinces','municipalities','barangays','setup_projects','cest_projects',
    'project_documents','cest_project_documents','map_pins','archival_records','user_logs','user_permissions','calendar_events'];
  for (const t of allTables) {
    const r = await client.query(`SELECT COUNT(*) FROM "${t}"`);
    console.log(`  ${t}: ${r.rows[0].count} rows`);
  }

  console.log('\nMigration complete!');
  await client.end();
}

main().catch(e => {
  console.error('Error:', e.message);
  console.error(e.stack);
  process.exit(1);
});
