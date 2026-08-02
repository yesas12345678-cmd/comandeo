const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('--- INICIANDO MIGRACIÓN DE CONTRASEÑAS Y PINS A BCRYPT ---');
  
  // 1. Migrar contraseñas de Tenants
  const tenants = await prisma.tenant.findMany();
  console.log(`Encontrados ${tenants.length} tenants.`);
  for (const tenant of tenants) {
    if (!tenant.adminPassword.startsWith('$2a$') && !tenant.adminPassword.startsWith('$2b$')) {
      console.log(`Hasheando contraseña del tenant: ${tenant.slug}`);
      const hashed = await bcrypt.hash(tenant.adminPassword, 10);
      await prisma.tenant.update({
        where: { id: tenant.id },
        data: { adminPassword: hashed }
      });
      console.log(`Tenant ${tenant.slug} actualizado.`);
    } else {
      console.log(`Tenant ${tenant.slug} ya tiene contraseña hasheada.`);
    }
  }
  
  // 2. Migrar PINs de Waiters
  const waiters = await prisma.waiter.findMany();
  console.log(`Encontrados ${waiters.length} camareros.`);
  for (const waiter of waiters) {
    if (!waiter.pin.startsWith('$2a$') && !waiter.pin.startsWith('$2b$')) {
      console.log(`Hasheando PIN de camarero: ${waiter.name} (ID: ${waiter.id})`);
      const hashed = await bcrypt.hash(waiter.pin, 10);
      await prisma.waiter.update({
        where: { id: waiter.id },
        data: { pin: hashed }
      });
      console.log(`Camarero ${waiter.name} actualizado.`);
    } else {
      console.log(`Camarero ${waiter.name} ya tiene PIN hasheado.`);
    }
  }
  
  console.log('--- MIGRACIÓN COMPLETADA CON ÉXITO ---');
}

main()
  .catch((e) => {
    console.error('Error durante la migración:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
