import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string; docId: string }> }) {
  const { docId } = await params;

  await prisma.cestProjectDocument.delete({ where: { id: docId } });

  return NextResponse.json({ success: true });
}
