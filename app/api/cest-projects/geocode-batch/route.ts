import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Golden-angle spiral offset so pins at the same base coords don't stack
function applyOffset(lat: number, lng: number, index: number): [number, number] {
  if (index === 0) return [lat, lng];
  const angle = (index * 137.508 * Math.PI) / 180;
  const radius = 0.0008 * Math.ceil(index / 8 + 1);
  return [lat + radius * Math.cos(angle), lng + radius * Math.sin(angle)];
}

export async function POST(req: NextRequest) {
  // Accept optional projectIds to only geocode specific projects
  let targetIds: string[] | null = null;
  try {
    const body = await req.json().catch(() => null);
    if (body?.projectIds && Array.isArray(body.projectIds)) {
      targetIds = body.projectIds;
    }
  } catch { /* ignore */ }

  // Find CEST projects without coordinates
  const projects = await prisma.cestProject.findMany({
    where: {
      coordinates: null,
      ...(targetIds ? { id: { in: targetIds } } : {}),
    },
    select: { id: true, location: true },
  });

  if (projects.length === 0) {
    return NextResponse.json({ updated: 0, skipped: 0 });
  }

  // Group projects by city+province key
  // Location format: "VillaPurok, Barangay, Municipality, Province" or "Barangay, Municipality, Province"
  const cityGroups = new Map<string, { id: string }[]>();
  for (const p of projects) {
    if (!p.location) continue;
    const parts = p.location.split(', ');
    // Municipality is second-to-last, Province is last
    const city = parts[parts.length - 2]?.trim() || '';
    const province = parts[parts.length - 1]?.trim() || '';
    if (!city || !province) continue;
    const key = `${city}, ${province}`;
    if (!cityGroups.has(key)) cityGroups.set(key, []);
    cityGroups.get(key)!.push({ id: p.id });
  }

  let updated = 0;
  let skipped = 0;

  for (const [cityKey, group] of cityGroups) {
    // Respect Nominatim's 1 req/s rate limit
    await new Promise(r => setTimeout(r, 1100));

    let baseLat: number | null = null;
    let baseLng: number | null = null;

    try {
      const url =
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(cityKey + ', Philippines')}&format=json&limit=1&countrycodes=ph`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'DOST-Document-Archival-System/1.0 (dost@region10.gov.ph)' },
      });
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        baseLat = parseFloat(data[0].lat);
        baseLng = parseFloat(data[0].lon);
      }
    } catch { /* skip city */ }

    if (baseLat === null || baseLng === null) {
      skipped += group.length;
      continue;
    }

    // Count how many projects in this city ALREADY have coordinates
    const existing = await prisma.cestProject.count({
      where: {
        location: { contains: cityKey },
        coordinates: { not: null },
      },
    });

    let offsetIndex = existing;
    for (const project of group) {
      const [lat, lng] = applyOffset(baseLat, baseLng, offsetIndex);
      await prisma.cestProject.update({
        where: { id: project.id },
        data: { coordinates: `${lat}, ${lng}` },
      });
      offsetIndex++;
      updated++;
    }
  }

  return NextResponse.json({ updated, skipped });
}
