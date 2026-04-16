import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@/app/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const CONFIG_PATH = path.join(process.cwd(), 'db-config.json');

function readConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); }
  catch { return { activeDb: 'cloud', lastSync: null, lastSyncDirection: null }; }
}

function writeConfig(data: object) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

function createSyncClient(url: string): PrismaClient {
  const adapter = new PrismaPg({ connectionString: url });
  return new PrismaClient({ adapter });
}

async function chunkInsert<T extends object>(
  items: T[],
  insertFn: (chunk: any[]) => Promise<unknown>,
  chunkSize = 50
) {
  for (let i = 0; i < items.length; i += chunkSize) {
    await insertFn(items.slice(i, i + chunkSize));
  }
}

export async function POST(req: NextRequest) {
  const sourceClient: PrismaClient | null = null;
  const targetClient: PrismaClient | null = null;

  try {
    const { from, to } = await req.json() as { from: 'cloud' | 'local'; to: 'cloud' | 'local' };

    if (!from || !to || from === to) {
      return NextResponse.json({ error: 'Invalid sync direction' }, { status: 400 });
    }

    const cloudUrl = process.env.DATABASE_URL;
    const localUrl = process.env.LOCAL_DATABASE_URL;

    if (!cloudUrl) return NextResponse.json({ error: 'DATABASE_URL not set' }, { status: 500 });
    if (!localUrl) return NextResponse.json({ error: 'LOCAL_DATABASE_URL not set' }, { status: 500 });

    const sourceUrl = from === 'cloud' ? cloudUrl : localUrl;
    const targetUrl = to === 'cloud' ? cloudUrl : localUrl;

    const source = createSyncClient(sourceUrl);
    const target = createSyncClient(targetUrl);

    try {
      // ── 1. Read ALL data from source ──────────────────────────
      const [
        users, permissions, timeRecords, userLogs,
        setupProjects, projectDocuments,
        cestProjects, cestDocuments, cestDropdownOptions,
        mapPins, archivalRecords, calendarEvents,
        conversations, participants, messages,
        notifications, provinces, municipalities, barangays,
      ] = await Promise.all([
        source.user.findMany(),
        source.userPermission.findMany(),
        source.timeRecord.findMany(),
        source.userLog.findMany(),
        source.setupProject.findMany(),
        source.projectDocument.findMany(),
        source.cestProject.findMany(),
        source.cestProjectDocument.findMany(),
        source.cestDropdownOption.findMany(),
        source.mapPin.findMany(),
        source.archivalRecord.findMany(),
        source.calendarEvent.findMany(),
        source.conversation.findMany(),
        source.conversationParticipant.findMany(),
        source.message.findMany(),
        source.notification.findMany(),
        source.province.findMany(),
        source.municipality.findMany(),
        source.barangay.findMany(),
      ]);

      // ── 2. Clear target (reverse FK order) ────────────────────
      await target.message.deleteMany();
      await target.conversationParticipant.deleteMany();
      await target.notification.deleteMany();
      await target.userLog.deleteMany();
      await target.timeRecord.deleteMany();
      await target.userPermission.deleteMany();
      await target.barangay.deleteMany();
      await target.municipality.deleteMany();
      await target.province.deleteMany();
      await target.mapPin.deleteMany();
      await target.calendarEvent.deleteMany();
      await target.archivalRecord.deleteMany();
      await target.cestProjectDocument.deleteMany();
      await target.cestDropdownOption.deleteMany();
      await target.cestProject.deleteMany();
      await target.projectDocument.deleteMany();
      await target.setupProject.deleteMany();
      await target.message.deleteMany();
      await target.conversationParticipant.deleteMany();
      await target.conversation.deleteMany();
      await target.user.deleteMany();

      // ── 3. Insert to target (forward FK order) ─────────────────
      await chunkInsert(users, (chunk) => target.user.createMany({ data: chunk }));
      await chunkInsert(permissions, (chunk) => target.userPermission.createMany({ data: chunk }));
      await chunkInsert(timeRecords, (chunk) => target.timeRecord.createMany({ data: chunk }));
      await chunkInsert(userLogs, (chunk) => target.userLog.createMany({ data: chunk }));
      await chunkInsert(setupProjects, (chunk) => target.setupProject.createMany({ data: chunk }));
      await chunkInsert(projectDocuments, (chunk) => target.projectDocument.createMany({ data: chunk }));
      await chunkInsert(cestDropdownOptions, (chunk) => target.cestDropdownOption.createMany({ data: chunk }));
      await chunkInsert(cestProjects, (chunk) => target.cestProject.createMany({ data: chunk }));
      await chunkInsert(cestDocuments, (chunk) => target.cestProjectDocument.createMany({ data: chunk }));
      await chunkInsert(mapPins, (chunk) => target.mapPin.createMany({ data: chunk }));
      await chunkInsert(archivalRecords, (chunk) => target.archivalRecord.createMany({ data: chunk }));
      await chunkInsert(calendarEvents, (chunk) => target.calendarEvent.createMany({ data: chunk }));
      await chunkInsert(provinces, (chunk) => target.province.createMany({ data: chunk }));
      await chunkInsert(municipalities, (chunk) => target.municipality.createMany({ data: chunk }));
      await chunkInsert(barangays, (chunk) => target.barangay.createMany({ data: chunk }));
      await chunkInsert(conversations, (chunk) => target.conversation.createMany({ data: chunk }));
      await chunkInsert(participants, (chunk) => target.conversationParticipant.createMany({ data: chunk }));
      await chunkInsert(messages, (chunk) => target.message.createMany({ data: chunk }));
      await chunkInsert(notifications, (chunk) => target.notification.createMany({ data: chunk }));

      // ── 4. Update config ──────────────────────────────────────
      const config = readConfig();
      config.lastSync = new Date().toISOString();
      config.lastSyncDirection = `${from} → ${to}`;
      writeConfig(config);

      return NextResponse.json({
        success: true,
        synced: {
          users: users.length,
          setupProjects: setupProjects.length,
          projectDocuments: projectDocuments.length,
          cestProjects: cestProjects.length,
          cestDocuments: cestDocuments.length,
          mapPins: mapPins.length,
          calendarEvents: calendarEvents.length,
          archivalRecords: archivalRecords.length,
          conversations: conversations.length,
          messages: messages.length,
          notifications: notifications.length,
          provinces: provinces.length,
          municipalities: municipalities.length,
          barangays: barangays.length,
        },
        lastSync: config.lastSync,
        direction: config.lastSyncDirection,
      });

    } finally {
      await source.$disconnect();
      await target.$disconnect();
    }

  } catch (err: unknown) {
    console.error('[db-sync]', err);
    const message = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
