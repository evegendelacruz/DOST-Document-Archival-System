import { NextRequest, NextResponse } from 'next/server';
import os from 'os';
import { execSync } from 'child_process';

function isWSL(): boolean {
  try {
    const version = require('fs').readFileSync('/proc/version', 'utf8');
    return /microsoft/i.test(version);
  } catch {
    return false;
  }
}

function getWindowsLanIP(): string | null {
  try {
    // Ask PowerShell for all IPv4 addresses and pick the first LAN one
    const raw = execSync(
      'powershell.exe -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -match \'^(192\\.168\\.|10\\.|172\\.(1[6-9]|2[0-9]|3[01])\\.)\'}).IPAddress"',
      { timeout: 3000 }
    ).toString().trim();

    // execSync returns \r\n on Windows; grab the first valid line
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    return lines[0] ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const hostName = host.split(':')[0];

  // If running on a public/cloud host (Vercel or any non-LAN host), return the public HTTPS origin
  const isLocal = hostName === 'localhost' || hostName === '127.0.0.1' || /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(hostName);
  if (!isLocal) {
    return NextResponse.json({ ip: hostName, origin: `https://${hostName}` });
  }

  const port = new URL(req.url).port || '3000';

  // WSL2: the Node process sees only the virtual eth0 (172.x.x.x).
  // Ask Windows for the real LAN IP so QR codes work on the same network.
  if (isWSL()) {
    const winIp = getWindowsLanIP();
    if (winIp) {
      return NextResponse.json({ ip: winIp, origin: `http://${winIp}:${port}` });
    }
  }

  // Native Linux / macOS: walk network interfaces
  const nets = os.networkInterfaces();
  let localIp: string | null = null;

  for (const name of Object.keys(nets)) {
    if (/loopback|lo|docker|veth|vmnet|vbox|wsl|virbr/i.test(name)) continue;
    for (const iface of nets[name] ?? []) {
      if (iface.family !== 'IPv4' || iface.internal) continue;
      if (!localIp || iface.address.startsWith('192.168')) {
        localIp = iface.address;
      }
    }
  }

  if (!localIp && hostName !== 'localhost' && hostName !== '127.0.0.1') {
    localIp = hostName;
  }

  const ip = localIp ?? 'localhost';
  return NextResponse.json({ ip, origin: `http://${ip}:${port}` });
}
