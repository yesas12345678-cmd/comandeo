const net = require('net');

// Configuración. En producción, cambiarías localhost por el dominio real de tu VPS (ej: https://tpv.tudominio.com/api/print-jobs)
const API_URL = process.env.API_URL || 'http://localhost:3000/api/print-jobs';
const PRINTER_IP = process.env.PRINTER_IP || '192.168.1.100';
const PRINTER_PORT = parseInt(process.env.PRINTER_PORT || '9100', 10);
const POLLING_INTERVAL_MS = 2000; // Consulta cada 2 segundos

console.log('=============================================');
console.log('      AGENTE DE IMPRESIÓN LOCAL INICIADO     ');
console.log('=============================================');
console.log(`Servidor Cloud: ${API_URL}`);
console.log(`Impresora Destino: ${PRINTER_IP}:${PRINTER_PORT}`);
console.log('Escuchando nuevas comandas... (Pulsa Ctrl+C para salir)\n');

async function checkAndPrint() {
  try {
    const res = await fetch(API_URL, {
      headers: {
        'x-api-key': process.env.API_KEY || 'key_barpaco_test_123',
      }
    });
    if (!res.ok) {
      console.error(`[Servidor] Error HTTP: ${res.status}`);
      return;
    }
    const data = await res.json();

    if (data.success && data.jobs && data.jobs.length > 0) {
      const tenantName = data.tenantName || 'TPV Cloud';
      for (const job of data.jobs) {
        console.log(`\n[TRABAJO DETECTADO] Tipo: ${job.type} | Mesa: ${job.tableNum} | Total: ${job.total.toFixed(2)}€`);
        
        // MOSTRAR DETALLE DE PRODUCTOS EN LA CONSOLA LOCAL
        console.log('Detalle de Consumos:');
        job.items.forEach((item) => {
          console.log(`   * ${item.quantity}x ${item.name} (${item.price.toFixed(2)}€/ud)`);
        });
        console.log('---------------------------------------------');
        
        try {
          await printTicket(job, tenantName);
        } catch (printError) {
          // Si falla físicamente, lo registramos pero continuamos con los siguientes trabajos
          console.error(`[Error] Falló la impresión física del trabajo ${job.id}`);
        }
      }
    }
  } catch (err) {
    console.error('[Error de Red] No se pudo conectar con el servidor:', err.message);
  }
}

function printTicket(job, tenantName) {
  return new Promise((resolve, reject) => {
    const client = new net.Socket();
    client.setTimeout(5000); // 5 segundos max de espera de conexión

    const ip = job.printerIp || PRINTER_IP;
    const port = job.printerPort || PRINTER_PORT;

    console.log(`[Impresora] Conectando a ${ip}:${port} para trabajo ${job.id} (${job.type})...`);

    client.connect(port, ip, () => {
      try {
        const ESC = 0x1B;
        const GS = 0x1D;

        // 1. Inicializar la impresora
        client.write(Buffer.from([ESC, 0x40]));

        if (job.type === 'RECEIPT') {
          // ==========================================
          // TICKET DE CLIENTE (FACTURA SIMPLIFICADA)
          // ==========================================
          // Nombre del restaurante grande, centrado y negrita
          client.write(Buffer.from([ESC, 0x61, 1])); // Centrado
          client.write(Buffer.from([GS, 0x21, 0x11])); // Doble altura y doble anchura
          client.write(Buffer.from([ESC, 0x45, 1])); // Negrita
          client.write(Buffer.from(`${tenantName.toUpperCase()}\n`));

          // Subtítulo normal
          client.write(Buffer.from([GS, 0x21, 0x00])); 
          client.write(Buffer.from([ESC, 0x45, 0])); 
          client.write(Buffer.from("FACTURA SIMPLIFICADA\n"));
          client.write(Buffer.from(`Mesa: #${job.tableNum}\n`));
          client.write(Buffer.from(`Fecha: ${new Date(job.createdAt).toLocaleString('es-ES')}\n`));
          client.write(Buffer.from('--------------------------------\n'));

          // Detalle de productos alineado a la izquierda con precios
          client.write(Buffer.from([ESC, 0x61, 0])); 
          job.items.forEach((item) => {
            const qtyText = `${item.quantity}x `;
            const priceText = ` ${(item.price * item.quantity).toFixed(2)}€`;
            const maxNameLen = 32 - qtyText.length - priceText.length;
            const nameText = item.name.padEnd(maxNameLen).substring(0, maxNameLen);

            client.write(Buffer.from(`${qtyText}${nameText}${priceText}\n`, 'latin1'));
            if (item.note) {
              client.write(Buffer.from(`   * NOTA: ${item.note}\n`, 'latin1'));
            }
          });

          // Totalizador
          client.write(Buffer.from('--------------------------------\n'));
          client.write(Buffer.from([ESC, 0x61, 1])); // Centrado
          client.write(Buffer.from([GS, 0x21, 0x11])); // Grande
          client.write(Buffer.from([ESC, 0x45, 1])); // Negrita
          client.write(Buffer.from(`TOTAL: ${job.total.toFixed(2)}€\n\n`));

          // Pie de ticket
          client.write(Buffer.from([GS, 0x21, 0x00])); 
          client.write(Buffer.from([ESC, 0x45, 0])); 
          client.write(Buffer.from("¡Gracias por su visita!\n\n\n"));

        } else {
          // ==========================================
          // COMANDA DE COCINA (SIN PRECIOS)
          // ==========================================
          // Título comanda grande y centrado
          client.write(Buffer.from([ESC, 0x61, 1])); 
          client.write(Buffer.from([GS, 0x21, 0x11])); 
          client.write(Buffer.from([ESC, 0x45, 1])); 
          client.write(Buffer.from("COMANDA COCINA\n"));
          client.write(Buffer.from(`MESA #${job.tableNum}\n`));

          // Info normal
          client.write(Buffer.from([GS, 0x21, 0x00])); 
          client.write(Buffer.from([ESC, 0x45, 0])); 
          client.write(Buffer.from(`Hora: ${new Date(job.createdAt).toLocaleTimeString('es-ES')}\n`));
          client.write(Buffer.from('--------------------------------\n'));

          // Detalle de productos alineado a la izquierda (Solo cantidades, sin precios)
          client.write(Buffer.from([ESC, 0x61, 0])); 
          job.items.forEach((item) => {
            const qtyText = `${item.quantity}x `;
            const maxNameLen = 32 - qtyText.length;
            const nameText = item.name.padEnd(maxNameLen).substring(0, maxNameLen);

            client.write(Buffer.from(`${qtyText}${nameText}\n`, 'latin1'));
            if (item.note) {
              client.write(Buffer.from(`  ↳ NOTA: ${item.note.toUpperCase()}\n`, 'latin1'));
            }
          });
          client.write(Buffer.from('--------------------------------\n\n\n'));
        }

        // Comando de corte físico de papel
        client.write(Buffer.from([GS, 0x56, 66, 0]));

        client.end();
        console.log(`[OK] Impreso tipo ${job.type} para Mesa ${job.tableNum} y papel cortado.`);
        resolve();
      } catch (err) {
        client.destroy();
        reject(err);
      }
    });

    client.on('error', (err) => {
      client.destroy();
      console.error(`[Fallo Impresora] No se puede establecer conexión:`, err.message);
      reject(err);
    });

    client.on('timeout', () => {
      client.destroy();
      console.error(`[Timeout] Tiempo de espera agotado al conectar a la impresora.`);
      reject(new Error('Timeout de impresora'));
    });
  });
}

// Iniciar consultas recurrentes cada 2 segundos
setInterval(checkAndPrint, POLLING_INTERVAL_MS);
