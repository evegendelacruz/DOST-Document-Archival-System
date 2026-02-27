import { NextRequest, NextResponse } from 'next/server';
import os from 'os';

export async function GET(req: NextRequest) {
  const port = new URL(req.url).port || '3000';

  // Find local network IP (prefer WiFi/Ethernet, skip loopback and virtual adapters)
  const nets = os.networkInterfaces();
  let localIp: string | null = null;

  for (const name of Object.keys(nets)) {
    // Skip loopback, virtual, docker, WSL virtual adapters
    if (/loopback|lo|docker|veth|vmnet|vbox|wsl|virbr/i.test(name)) continue;

    for (const iface of nets[name] ?? []) {
      if (iface.family !== 'IPv4' || iface.internal) continue;
      // Prefer 192.168.x.x, then 10.x.x.x, then 172.x.x.x
      if (!localIp || iface.address.startsWith('192.168')) {
        localIp = iface.address;
      }
    }
  }

  // Fallback: try to extract from request host header (works when accessed via IP already)
  if (!localIp) {
    const host = req.headers.get('host') ?? '';
    const hostIp = host.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      localIp = hostIp;
    }
  }

  const ip = localIp ?? 'localhost';
  return NextResponse.json({ ip, origin: `http://${ip}:${port}` });
}
