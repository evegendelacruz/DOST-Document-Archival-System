import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'db-config.json');

function readConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    return { activeDb: 'cloud', lastSync: null, lastSyncDirection: null };
  }
}

function writeConfig(data: object) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2));
}

export async function GET() {
  const config = readConfig();
  return NextResponse.json(config);
}

export async function POST(req: NextRequest) {
  try {
    const { activeDb } = await req.json();
    if (activeDb !== 'cloud' && activeDb !== 'local') {
      return NextResponse.json({ error: 'Invalid activeDb value' }, { status: 400 });
    }
    const config = readConfig();
    config.activeDb = activeDb;
    writeConfig(config);
    return NextResponse.json({ success: true, activeDb });
  } catch {
    return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
  }
}
