const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Limpiando base de datos anterior...');
  await prisma.printJob.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.table.deleteMany({});
  await prisma.waiter.deleteMany({});
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
      adminUsername: 'admin',
      adminPassword: 'paco123',
    },
  });

  // Categorías de Bar Paco
  const categoriesPaco = {
    benedictinos: await prisma.category.create({ data: { name: '🍳 Benedictinos', tenantId: tenantPaco.id } }),
    rancheros: await prisma.category.create({ data: { name: '🌶️ Rancheros', tenantId: tenantPaco.id } }),
    otrosBrunch: await prisma.category.create({ data: { name: '🥞 Brunch: Otros', tenantId: tenantPaco.id } }),
    ensaladas: await prisma.category.create({ data: { name: '🥗 Ensaladas', tenantId: tenantPaco.id } }),
    tostas: await prisma.category.create({ data: { name: '🍞 Nuestras Tostas', tenantId: tenantPaco.id } }),
    extras: await prisma.category.create({ data: { name: '🥓 Extras', tenantId: tenantPaco.id } }),
    hamburguesas: await prisma.category.create({ data: { name: '🍔 Hamburguesas', tenantId: tenantPaco.id } }),
    coffeeBar: await prisma.category.create({ data: { name: '☕ Coffee Bar', tenantId: tenantPaco.id } }),
    zumos: await prisma.category.create({ data: { name: '🍊 Zumos', tenantId: tenantPaco.id } }),
    smoothiesKombuchas: await prisma.category.create({ data: { name: '🍹 Smoothies, Kombuchas & Tés', tenantId: tenantPaco.id } }),
    cocteles: await prisma.category.create({ data: { name: '🍸 Cócteles', tenantId: tenantPaco.id } }),
    postres: await prisma.category.create({ data: { name: '🍰 Postres', tenantId: tenantPaco.id } }),
  };

  console.log('Insertando productos de Bar Paco...');

  // 🍳 Benedictinos
  await prisma.product.createMany({
    data: [
      { name: 'Benedictinos Clásicos', price: 11.90, categoryId: categoriesPaco.benedictinos.id, tenantId: tenantPaco.id },
      { name: 'El plato de Bunny', price: 15.00, categoryId: categoriesPaco.benedictinos.id, tenantId: tenantPaco.id },
      { name: 'El Chad', price: 13.50, categoryId: categoriesPaco.benedictinos.id, tenantId: tenantPaco.id },
      { name: 'Grattam', price: 13.50, categoryId: categoriesPaco.benedictinos.id, tenantId: tenantPaco.id },
      { name: 'Grace', price: 14.00, categoryId: categoriesPaco.benedictinos.id, tenantId: tenantPaco.id },
      { name: 'El Vegetal', price: 13.00, categoryId: categoriesPaco.benedictinos.id, tenantId: tenantPaco.id },
      { name: 'Piti Picadillo', price: 13.50, categoryId: categoriesPaco.benedictinos.id, tenantId: tenantPaco.id },
      { name: 'The J.O.B', price: 19.00, categoryId: categoriesPaco.benedictinos.id, tenantId: tenantPaco.id },
    ]
  });

  // 🌶️ Rancheros
  await prisma.product.createMany({
    data: [
      { name: 'Carlos’ Rancheros', price: 14.00, categoryId: categoriesPaco.rancheros.id, tenantId: tenantPaco.id },
      { name: 'Huevos Rancheros', price: 12.50, categoryId: categoriesPaco.rancheros.id, tenantId: tenantPaco.id },
      { name: 'Rancheros Veganos', price: 12.00, categoryId: categoriesPaco.rancheros.id, tenantId: tenantPaco.id },
    ]
  });

  // 🥞 Brunch: Otros
  await prisma.product.createMany({
    data: [
      { name: 'Revuelto de Champiñones', price: 11.50, categoryId: categoriesPaco.otrosBrunch.id, tenantId: tenantPaco.id },
      { name: 'French Toast', price: 12.50, categoryId: categoriesPaco.otrosBrunch.id, tenantId: tenantPaco.id },
      { name: 'Americano XXL', price: 15.00, categoryId: categoriesPaco.otrosBrunch.id, tenantId: tenantPaco.id },
      { name: 'Plato Americano', price: 10.50, categoryId: categoriesPaco.otrosBrunch.id, tenantId: tenantPaco.id },
      { name: 'Pancakes', price: 12.00, categoryId: categoriesPaco.otrosBrunch.id, tenantId: tenantPaco.id },
      { name: 'Pancakes Dulces', price: 12.00, categoryId: categoriesPaco.otrosBrunch.id, tenantId: tenantPaco.id },
    ]
  });

  // 🥗 Ensaladas
  await prisma.product.createMany({
    data: [
      { name: 'Ensalada de Salmón Ahumado', price: 13.50, categoryId: categoriesPaco.ensaladas.id, tenantId: tenantPaco.id },
      { name: 'Ensalada del Chef', price: 13.50, categoryId: categoriesPaco.ensaladas.id, tenantId: tenantPaco.id },
    ]
  });

  // 🍞 Nuestras Tostas
  await prisma.product.createMany({
    data: [
      { name: 'Chris Crust (Tosta)', price: 12.50, categoryId: categoriesPaco.tostas.id, tenantId: tenantPaco.id },
      { name: 'La Veggie (Tosta)', price: 12.50, categoryId: categoriesPaco.tostas.id, tenantId: tenantPaco.id },
      { name: 'Bea-licious (Tosta)', price: 12.50, categoryId: categoriesPaco.tostas.id, tenantId: tenantPaco.id },
      { name: 'Gurdi (Tosta)', price: 17.50, categoryId: categoriesPaco.tostas.id, tenantId: tenantPaco.id },
    ]
  });

  // 🥓 Extras
  await prisma.product.createMany({
    data: [
      { name: 'Guacamole (Extra)', price: 5.00, categoryId: categoriesPaco.extras.id, tenantId: tenantPaco.id },
      { name: 'Fritos de Boniato (Extra)', price: 5.00, categoryId: categoriesPaco.extras.id, tenantId: tenantPaco.id },
      { name: 'Jalapeños (Extra)', price: 2.00, categoryId: categoriesPaco.extras.id, tenantId: tenantPaco.id },
      { name: 'Bacon (Extra)', price: 4.00, categoryId: categoriesPaco.extras.id, tenantId: tenantPaco.id },
      { name: 'Hash Browns (Extra)', price: 4.00, categoryId: categoriesPaco.extras.id, tenantId: tenantPaco.id },
      { name: 'Queso de Cabra (Extra)', price: 4.00, categoryId: categoriesPaco.extras.id, tenantId: tenantPaco.id },
      { name: 'Patatas Fritas Caseras (Extra)', price: 4.00, categoryId: categoriesPaco.extras.id, tenantId: tenantPaco.id },
      { name: 'Champiñones (Extra)', price: 4.00, categoryId: categoriesPaco.extras.id, tenantId: tenantPaco.id },
      { name: 'Yogur, Fruta y Granola (Extra)', price: 4.50, categoryId: categoriesPaco.extras.id, tenantId: tenantPaco.id },
      { name: 'Aguacate (Extra)', price: 3.50, categoryId: categoriesPaco.extras.id, tenantId: tenantPaco.id },
      { name: 'Frijoles (Extra)', price: 4.00, categoryId: categoriesPaco.extras.id, tenantId: tenantPaco.id },
      { name: 'Ensalada Mixta (Extra)', price: 4.00, categoryId: categoriesPaco.extras.id, tenantId: tenantPaco.id },
    ]
  });

  // 🍔 Hamburguesas
  await prisma.product.createMany({
    data: [
      { name: 'Steffy’s Burger', price: 13.00, categoryId: categoriesPaco.hamburguesas.id, tenantId: tenantPaco.id },
      { name: 'Tucson Burger', price: 14.00, categoryId: categoriesPaco.hamburguesas.id, tenantId: tenantPaco.id },
      { name: 'Bobo’s Burger', price: 14.00, categoryId: categoriesPaco.hamburguesas.id, tenantId: tenantPaco.id },
      { name: 'Gregorio’s Burger', price: 14.00, categoryId: categoriesPaco.hamburguesas.id, tenantId: tenantPaco.id },
      { name: 'Spicy Sally Burger', price: 12.00, categoryId: categoriesPaco.hamburguesas.id, tenantId: tenantPaco.id },
      { name: 'Brunch Burger', price: 14.00, categoryId: categoriesPaco.hamburguesas.id, tenantId: tenantPaco.id },
      { name: 'Foothills Burger', price: 13.00, categoryId: categoriesPaco.hamburguesas.id, tenantId: tenantPaco.id },
      { name: 'Hammer Burger', price: 13.00, categoryId: categoriesPaco.hamburguesas.id, tenantId: tenantPaco.id },
      { name: 'Mas Que Sea Burger', price: 12.00, categoryId: categoriesPaco.hamburguesas.id, tenantId: tenantPaco.id },
    ]
  });

  // ☕ Coffee Bar
  await prisma.product.createMany({
    data: [
      { name: 'Café Espresso', price: 1.60, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Espresso Doble', price: 2.20, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Café Cortado', price: 1.80, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Café Americano', price: 2.20, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Café con Leche', price: 2.50, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Flat White', price: 2.80, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Chai Latte', price: 3.50, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Dirty Chai', price: 4.00, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Cappuccino', price: 3.00, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Matcha Green Latte', price: 3.50, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Mocha Latte', price: 3.50, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Vanilla Latte', price: 3.50, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Caramel Latte', price: 3.50, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Cúrcuma Latte', price: 4.00, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Café Otoñal Calabaza', price: 3.50, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
      { name: 'Iced Matcha Zumo Naranja', price: 3.50, categoryId: categoriesPaco.coffeeBar.id, tenantId: tenantPaco.id },
    ]
  });

  // 🍊 Zumos
  await prisma.product.createMany({
    data: [
      { name: 'Zumo Naranja (P)', price: 1.80, categoryId: categoriesPaco.zumos.id, tenantId: tenantPaco.id },
      { name: 'Zumo Naranja (M)', price: 3.50, categoryId: categoriesPaco.zumos.id, tenantId: tenantPaco.id },
      { name: 'Zumo Naranja (G)', price: 5.20, categoryId: categoriesPaco.zumos.id, tenantId: tenantPaco.id },
      { name: 'Zumo Temporada (P)', price: 2.00, categoryId: categoriesPaco.zumos.id, tenantId: tenantPaco.id },
      { name: 'Zumo Temporada (M)', price: 4.00, categoryId: categoriesPaco.zumos.id, tenantId: tenantPaco.id },
      { name: 'Zumo Temporada (G)', price: 6.00, categoryId: categoriesPaco.zumos.id, tenantId: tenantPaco.id },
    ]
  });

  // 🍹 Smoothies, Kombuchas & Tés
  await prisma.product.createMany({
    data: [
      { name: 'Smoothie Green Day', price: 7.00, categoryId: categoriesPaco.smoothiesKombuchas.id, tenantId: tenantPaco.id },
      { name: 'Smoothie Purple Rain', price: 7.00, categoryId: categoriesPaco.smoothiesKombuchas.id, tenantId: tenantPaco.id },
      { name: 'Smoothie Peach Pit', price: 7.00, categoryId: categoriesPaco.smoothiesKombuchas.id, tenantId: tenantPaco.id },
      { name: 'Kombucha Komvida', price: 4.00, categoryId: categoriesPaco.smoothiesKombuchas.id, tenantId: tenantPaco.id },
      { name: 'Té caliente / frío', price: 2.00, categoryId: categoriesPaco.smoothiesKombuchas.id, tenantId: tenantPaco.id },
      { name: 'Té helado melocotón/limón', price: 3.00, categoryId: categoriesPaco.smoothiesKombuchas.id, tenantId: tenantPaco.id },
    ]
  });

  // 🍸 Cócteles
  await prisma.product.createMany({
    data: [
      { name: 'Mimosa (Copa)', price: 1.00, categoryId: categoriesPaco.cocteles.id, tenantId: tenantPaco.id },
      { name: 'Mimosa Grande', price: 3.00, categoryId: categoriesPaco.cocteles.id, tenantId: tenantPaco.id },
      { name: 'Botella Cava Blanco Morgades', price: 22.00, categoryId: categoriesPaco.cocteles.id, tenantId: tenantPaco.id },
      { name: 'Botella Cava Rosado Morgades', price: 22.00, categoryId: categoriesPaco.cocteles.id, tenantId: tenantPaco.id },
      { name: 'Jarra de Mimosa', price: 8.00, categoryId: categoriesPaco.cocteles.id, tenantId: tenantPaco.id },
      { name: 'Bloody Mary', price: 7.00, categoryId: categoriesPaco.cocteles.id, tenantId: tenantPaco.id },
      { name: 'Michelada', price: 6.00, categoryId: categoriesPaco.cocteles.id, tenantId: tenantPaco.id },
      { name: 'Aperol Spritz', price: 8.00, categoryId: categoriesPaco.cocteles.id, tenantId: tenantPaco.id },
    ]
  });

  // 🍰 Postres
  await prisma.product.createMany({
    data: [
      { name: 'Tarta de Chocolate', price: 4.50, categoryId: categoriesPaco.postres.id, tenantId: tenantPaco.id },
      { name: 'Tarta de Zanahoria', price: 4.50, categoryId: categoriesPaco.postres.id, tenantId: tenantPaco.id },
      { name: 'Tarta de Maíz Dulce', price: 4.50, categoryId: categoriesPaco.postres.id, tenantId: tenantPaco.id },
      { name: 'Tarta de la Semana', price: 4.50, categoryId: categoriesPaco.postres.id, tenantId: tenantPaco.id },
      { name: 'Bowl Yogur, Fruta y Granola', price: 4.50, categoryId: categoriesPaco.postres.id, tenantId: tenantPaco.id },
      { name: 'Bowl Fruta de Temporada', price: 4.50, categoryId: categoriesPaco.postres.id, tenantId: tenantPaco.id },
    ]
  });

  // Mesas para Bar Paco
  await prisma.table.createMany({
    data: [
      { id: 'paco-t1', number: 1, status: 'FREE', tenantId: tenantPaco.id },
      { id: 'paco-t2', number: 2, status: 'FREE', tenantId: tenantPaco.id },
      { id: 'paco-t3', number: 3, status: 'FREE', tenantId: tenantPaco.id },
      { id: 'paco-t4', number: 4, status: 'FREE', tenantId: tenantPaco.id },
      { id: 'paco-t5', number: 5, status: 'FREE', tenantId: tenantPaco.id },
      { id: 'paco-t6', number: 6, status: 'FREE', tenantId: tenantPaco.id },
      { id: 'paco-t7', number: 7, status: 'FREE', tenantId: tenantPaco.id },
      { id: 'paco-t8', number: 8, status: 'FREE', tenantId: tenantPaco.id },
      { id: 'paco-t9', number: 9, status: 'FREE', tenantId: tenantPaco.id },
      { id: 'paco-t10', number: 10, status: 'FREE', tenantId: tenantPaco.id },
    ],
  });

  // Camareros para Bar Paco
  await prisma.waiter.createMany({
    data: [
      { name: 'Carlos', pin: '1111', tenantId: tenantPaco.id },
      { name: 'María', pin: '2222', tenantId: tenantPaco.id },
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
      apiKey: 'key_barpepe_test_456',
      adminUsername: 'admin',
      adminPassword: 'pepe123',
    },
  });

  const catVinosPepe = await prisma.category.create({
    data: { name: '🍷 Vinos y Licores', tenantId: tenantPepe.id },
  });

  await prisma.product.createMany({
    data: [
      { name: 'Vino Tinto Rioja', price: 3.50, categoryId: catVinosPepe.id, tenantId: tenantPepe.id },
      { name: 'Vino Blanco Rueda', price: 3.20, categoryId: catVinosPepe.id, tenantId: tenantPepe.id },
      { name: 'Vermut de Reus', price: 3.00, categoryId: catVinosPepe.id, tenantId: tenantPepe.id },
    ],
  });

  const catPostresPepe = await prisma.category.create({
    data: { name: '🍰 Postres Caseros', tenantId: tenantPepe.id },
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

  console.log('Creando Camareros para Taberna Pepe...');
  await prisma.waiter.createMany({
    data: [
      { name: 'Juan', pin: '3333', tenantId: tenantPepe.id },
      { name: 'Laura', pin: '4444', tenantId: tenantPepe.id },
    ],
  });

  console.log('Base de datos inicializada con 2 Bares y sus camareros correspondientes.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
