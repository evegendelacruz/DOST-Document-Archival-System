import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const where: Record<string, unknown> = {};
  if (status) where.status = status.toUpperCase();
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { firm: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }

  const projects = await prisma.setupProject.findMany({
    where,
    orderBy: { code: 'asc' },
  });

  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const data = await req.json();

  // Auto-generate project code as zero-padded string
  const count = await prisma.setupProject.count();
  const code = String(count + 1).padStart(3, '0');

  const project = await prisma.setupProject.create({
    data: { ...data, code },
  });

  return NextResponse.json(project, { status: 201 });
}
