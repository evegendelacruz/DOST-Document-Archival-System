import { NextRequest, NextResponse } from 'next/server';
import os from 'os';

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const hostName = host.split(':')[0];

  // If running on a public/cloud host (Vercel or any non-LAN host), return the public HTTPS origin
  const isLocal = hostName === 'localhost' || hostName === '127.0.0.1' || /^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\./.test(hostName);
  if (!isLocal) {
    return NextResponse.json({ ip: hostName, origin: `https://${hostName}` });
  }

  // Local dev: find LAN IP so QR codes work on the same network
  const port = new URL(req.url).port || '3000';
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
