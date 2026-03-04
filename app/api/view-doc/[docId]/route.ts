import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Find which table the doc belongs to (lightweight — no fileData)
async function findDocSource(docId: string): Promise<'cest' | 'setup' | null> {
  try {
    const cest = await prisma.cestProjectDocument.findUnique({
      where: { id: docId },
      select: { id: true },
    });
    if (cest) return 'cest';
  } catch { /* not found in cest */ }

  try {
    const setup = await prisma.projectDocument.findUnique({
      where: { id: docId },
      select: { id: true },
    });
    if (setup) return 'setup';
  } catch { /* not found in setup */ }

  return null;
}

// GET: check if doc exists and if it has a PIN set
export async function GET(req: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  try {
    const { docId } = await params;

    // Try CEST first
    const cest = await prisma.cestProjectDocument.findUnique({
      where: { id: docId },
      select: { id: true, fileName: true, mimeType: true, qrPin: true },
    }).catch(() => null);

    if (cest) {
      return NextResponse.json({ id: cest.id, fileName: cest.fileName, mimeType: cest.mimeType, hasPin: !!cest.qrPin });
    }

    // Try Setup
    const setup = await prisma.projectDocument.findUnique({
      where: { id: docId },
      select: { id: true, fileName: true, mimeType: true, qrPin: true },
    }).catch(() => null);

    if (setup) {
      return NextResponse.json({ id: setup.id, fileName: setup.fileName, mimeType: setup.mimeType, hasPin: !!setup.qrPin });
    }

    return NextResponse.json({ error: 'Document not found' }, { status: 404 });
  } catch (err) {
    console.error('[view-doc GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// POST: verify PIN, then serve the file
export async function POST(req: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  try {
    const { docId } = await params;
    const { pin } = await req.json();

    // Try CEST first
    const cest = await prisma.cestProjectDocument.findUnique({
      where: { id: docId },
      select: { fileData: true, fileName: true, mimeType: true, qrPin: true },
    }).catch(() => null);

    const doc = cest ?? await prisma.projectDocument.findUnique({
      where: { id: docId },
      select: { fileData: true, fileName: true, mimeType: true, qrPin: true },
    }).catch(() => null);

    if (!doc || !doc.fileData) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    if (doc.qrPin && doc.qrPin !== pin) {
      return NextResponse.json({ error: 'Invalid PIN' }, { status: 401 });
    }

    return new NextResponse(doc.fileData, {
      headers: {
        'Content-Type': doc.mimeType,
        'Content-Disposition': `inline; filename="${encodeURIComponent(doc.fileName)}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[view-doc POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// PATCH: set/update the PIN for a document
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ docId: string }> }) {
  try {
    const { docId } = await params;
    const { pin } = await req.json();

    if (pin !== null && pin !== undefined && (typeof pin !== 'string' || pin.length !== 4 || !/^\d+$/.test(pin))) {
      return NextResponse.json({ error: 'PIN must be exactly 4 digits' }, { status: 400 });
    }

    const source = await findDocSource(docId);
    if (!source) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    let updated: { id: string; fileName: string; qrPin: string | null };

    if (source === 'cest') {
      updated = await prisma.cestProjectDocument.update({
        where: { id: docId },
        data: { qrPin: pin ?? null },
        select: { id: true, fileName: true, qrPin: true },
      });
    } else {
      updated = await prisma.projectDocument.update({
        where: { id: docId },
        data: { qrPin: pin ?? null },
        select: { id: true, fileName: true, qrPin: true },
      });
    }

    return NextResponse.json({ id: updated.id, fileName: updated.fileName, hasPin: !!updated.qrPin });
  } catch (err) {
    console.error('[view-doc PATCH]', err);
    return NextResponse.json({ error: 'Failed to save PIN' }, { status: 500 });
  }
}
