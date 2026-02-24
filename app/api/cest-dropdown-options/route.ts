import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    const where = type ? { type } : {};
    const options = await prisma.cestDropdownOption.findMany({
      where,
      orderBy: { value: 'asc' },
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error('GET /api/cest-dropdown-options error:', error);
    return NextResponse.json({ error: 'Failed to fetch options' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { type, value } = await req.json();

    if (!type || !value) {
      return NextResponse.json({ error: 'Type and value are required' }, { status: 400 });
    }

    // Check if option already exists
    const existing = await prisma.cestDropdownOption.findUnique({
      where: { type_value: { type, value } },
    });

    if (existing) {
      return NextResponse.json(existing);
    }

    const option = await prisma.cestDropdownOption.create({
      data: { type, value },
    });

    return NextResponse.json(option, { status: 201 });
  } catch (error) {
    console.error('POST /api/cest-dropdown-options error:', error);
    return NextResponse.json({ error: 'Failed to create option' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    await prisma.cestDropdownOption.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/cest-dropdown-options error:', error);
    return NextResponse.json({ error: 'Failed to delete option' }, { status: 500 });
  }
}
