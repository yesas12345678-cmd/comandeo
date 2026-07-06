import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(request: Request) {
  try {
    // 1. Obtener la API Key desde las cabeceras
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. Falta cabecera x-api-key.' },
        { status: 401 }
      );
    }

    // 2. Validar que el Tenant existe con esa API Key
    const tenant = await prisma.tenant.findUnique({
      where: { apiKey }
    });

    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'No autorizado. API Key no válida.' },
        { status: 403 }
      );
    }

    // 3. Obtener únicamente los trabajos de impresión pendientes de este bar
    const pendingJobs = await prisma.printJob.findMany({
      where: { 
        tenantId: tenant.id,
        printed: false 
      },
      orderBy: { createdAt: 'asc' },
    });

    if (pendingJobs.length > 0) {
      // 4. Marcarlos como impresos para que no se dupliquen
      const jobIds = pendingJobs.map((job) => job.id);
      await prisma.printJob.updateMany({
        where: { id: { in: jobIds } },
        data: { printed: true },
      });
    }

    return NextResponse.json({
      success: true,
      jobs: pendingJobs,
      tenantName: tenant.name // Retornamos el nombre del bar para el ticket
    }, { status: 200 });
  } catch (error: any) {
    console.error('Error al obtener cola de impresión:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error al procesar la cola de impresión.' },
      { status: 500 }
    );
  }
}
