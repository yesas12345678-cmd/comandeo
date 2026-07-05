const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Limpiando base de datos anterior...');
  await prisma.printJob.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.tenant.deleteMany({});

  // ==========================================
  // 1. CREAR TENANT 1: BAR PACO
  // ==========================================
  console.log('Creando Tenant 1 ("Bar Paco")...');
  const tenantPaco = await prisma.tenant.create({
    data: {
      name: 'Bar Paco',
      slug: 'barpaco',
      apiKey: 'key_barpaco_test_123',
    },
  });

  const catBebidasPaco = await prisma.category.create({
    data: { name: 'Bebidas', tenantId: tenantPaco.id },
  });

  await prisma.product.createMany({
    data: [
      { name: 'Cerveza Caña', price: 2.50, categoryId: catBebidasPaco.id, tenantId: tenantPaco.id },
      { name: 'Coca-Cola', price: 2.80, categoryId: catBebidasPaco.id, tenantId: tenantPaco.id },
      { name: 'Agua Mineral', price: 1.80, categoryId: catBebidasPaco.id, tenantId: tenantPaco.id },
    ],
  });

  const catComidaPaco = await prisma.category.create({
    data: { name: 'Tapas y Raciones', tenantId: tenantPaco.id },
  });

  await prisma.product.createMany({
    data: [
      { name: 'Patatas Bravas', price: 6.50, categoryId: catComidaPaco.id, tenantId: tenantPaco.id },
      { name: 'Croquetas de Jamón', price: 8.00, categoryId: catComidaPaco.id, tenantId: tenantPaco.id },
      { name: 'Calamares a la Romana', price: 10.50, categoryId: catComidaPaco.id, tenantId: tenantPaco.id },
    ],
  });

  await prisma.table.createMany({
    data: [
      { id: 't1', number: 1, status: 'FREE', tenantId: tenantPaco.id },
      { id: 't2', number: 2, status: 'FREE', tenantId: tenantPaco.id },
      { id: 't3', number: 3, status: 'FREE', tenantId: tenantPaco.id },
      { id: 't4', number: 4, status: 'FREE', tenantId: tenantPaco.id },
      { id: 't5', number: 5, status: 'FREE', tenantId: tenantPaco.id },
    ],
  });

  // ==========================================
  // 2. CREAR TENANT 2: TABERNA PEPE
  // ==========================================
  console.log('Creando Tenant 2 ("Taberna Pepe")...');
  const tenantPepe = await prisma.tenant.create({
    data: {
      name: 'Taberna Pepe',
      slug: 'barpepe',
      apiKey: 'key_barpepe_test_456', // Su propia API Key
    },
  });

  const catVinosPepe = await prisma.category.create({
    data: { name: 'Vinos y Licores', tenantId: tenantPepe.id },
  });

  await prisma.product.createMany({
    data: [
      { name: 'Vino Tinto Rioja', price: 3.50, categoryId: catVinosPepe.id, tenantId: tenantPepe.id },
      { name: 'Vino Blanco Rueda', price: 3.20, categoryId: catVinosPepe.id, tenantId: tenantPepe.id },
      { name: 'Vermut de Reus', price: 3.00, categoryId: catVinosPepe.id, tenantId: tenantPepe.id },
    ],
  });

  const catPostresPepe = await prisma.category.create({
    data: { name: 'Postres Caseros', tenantId: tenantPepe.id },
  });

  await prisma.product.createMany({
    data: [
      { name: 'Tarta de Queso', price: 5.50, categoryId: catPostresPepe.id, tenantId: tenantPepe.id },
      { name: 'Flan de Huevo', price: 4.00, categoryId: catPostresPepe.id, tenantId: tenantPepe.id },
    ],
  });

  await prisma.table.createMany({
    data: [
      { id: 'pepe-t10', number: 10, status: 'FREE', tenantId: tenantPepe.id },
      { id: 'pepe-t11', number: 11, status: 'FREE', tenantId: tenantPepe.id },
      { id: 'pepe-t12', number: 12, status: 'FREE', tenantId: tenantPepe.id },
    ],
  });

  console.log('Base de datos inicializada con 2 Bares de prueba.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
