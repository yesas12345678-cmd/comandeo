'use client';

import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
}

interface Category {
  id: string;
  name: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface Table {
  id: string;
  number: number;
  status: 'FREE' | 'BUSY';
}

interface Waiter {
  id: string;
  name: string;
}

export default function PDATerminal({ tenantSlug = 'barpaco' }: { tenantSlug?: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL');
  const [tables, setTables] = useState<Table[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [tenantName, setTenantName] = useState('PDA Camarero');

  // Estados de autenticación del camarero
  const [currentWaiter, setCurrentWaiter] = useState<Waiter | null>(null);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string>('');
  const [pinInput, setPinInput] = useState<string>('');

  // Estados del desglose de cuenta
  const [billDetails, setBillDetails] = useState<{ items: any[]; total: number } | null>(null);
  const [isBillLoading, setIsBillLoading] = useState(false);

  // Cargar datos iniciales desde la base de datos
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/init', {
          headers: { 'x-tenant-slug': tenantSlug }
        });
        const data = await response.json();
        if (data.success) {
          setProducts(data.products);
          setCategories(data.categories || []);
          setTables(data.tables);
          setTenantName(data.tenantName);
          setWaiters(data.waiters);
          if (data.waiters.length > 0) {
            setSelectedWaiterId(data.waiters[0].id);
          }
          if (data.tables.length > 0) {
            setSelectedTableId(data.tables[0].id);
          }
        } else {
          setMessage({ type: 'error', text: data.error || 'Fallo al cargar base de datos.' });
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Error de conexión con el backend.' });
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [tenantSlug]);

  // Cargar la cuenta de la mesa cuando cambia la selección o los estados de las mesas
  useEffect(() => {
    if (!selectedTableId) return;
    const selected = tables.find((t) => t.id === selectedTableId);
    
    if (selected && selected.status === 'BUSY') {
      fetchBillDetails(selected.id);
    } else {
      setBillDetails(null);
    }
  }, [selectedTableId, tables]);

  // Consulta de desglose a la API
  const fetchBillDetails = async (tableId: string) => {
    try {
      setIsBillLoading(true);
      const res = await fetch(`/api/tables/${tableId}/bill`, {
        headers: { 'x-tenant-slug': tenantSlug }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setBillDetails({ items: data.items, total: data.total });
      } else {
        setMessage({ type: 'error', text: data.error || 'Error al obtener cuenta.' });
      }
    } catch (err) {
      console.error('Error fetching bill:', err);
    } finally {
      setIsBillLoading(false);
    }
  };

  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => (item.id === productId ? { ...item, quantity: item.quantity - 1 } : item))
        .filter((item) => item.quantity > 0)
    );
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const filteredProducts = selectedCategoryId === 'ALL'
    ? products
    : products.filter((product) => product.categoryId === selectedCategoryId);

  // Obtener el objeto de la mesa seleccionada actualmente
  const selectedTable = tables.find((t) => t.id === selectedTableId);

  // Procesar las pulsaciones del teclado numérico PIN
  const handleKeypadPress = (val: string) => {
    setMessage(null);
    if (val === 'clear') {
      setPinInput('');
      return;
    }
    if (val === 'delete') {
      setPinInput((prev) => prev.slice(0, -1));
      return;
    }
    if (pinInput.length < 4) {
      const newPin = pinInput + val;
      setPinInput(newPin);
      
      // Auto-enviar el PIN al llegar a 4 dígitos
      if (newPin.length === 4) {
        submitLogin(newPin);
      }
    }
  };

  // Enviar credenciales a la API de inicio de sesión
  const submitLogin = async (pinCode: string) => {
    if (!selectedWaiterId) return;
    setIsSending(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-slug': tenantSlug },
        body: JSON.stringify({ waiterId: selectedWaiterId, pin: pinCode }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setCurrentWaiter(data.waiter);
        setPinInput('');
      } else {
        setMessage({ type: 'error', text: data.error || 'Código PIN incorrecto.' });
        setPinInput('');
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al verificar credenciales.' });
      setPinInput('');
    } finally {
      setIsSending(false);
    }
  };

  // Enviar comanda a la base de datos
  const sendOrderToKitchen = async () => {
    if (cart.length === 0 || !selectedTableId || !currentWaiter) return;
    setIsSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({
          tableId: selectedTableId,
          items: cart,
          total,
          waiterId: currentWaiter.id,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: `¡Comanda enviada con éxito a cocina!` });
        setCart([]);
        
        // Actualizar el estado de la mesa local a BUSY
        setTables((prevTables) =>
          prevTables.map((t) => (t.id === selectedTableId ? { ...t, status: 'BUSY' } : t))
        );
      } else {
        setMessage({ 
          type: 'error', 
          text: `Guardado en BD. Error impresora: ${data.error || 'Desconocido'}` 
        });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error de red o servidor al enviar comanda.' });
    } finally {
      setIsSending(false);
    }
  };

  // Cobrar y liberar mesa (Checkout)
  const checkoutTable = async (method: 'CASH' | 'CARD') => {
    if (!selectedTableId) return;
    setIsSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/tables/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({ tableId: selectedTableId, paymentMethod: method }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: `Mesa cobrada en ${method === 'CASH' ? 'EFECTIVO' : 'TARJETA'} y liberada.` 
        });
        
        // Actualizar el estado local de la mesa a FREE
        setTables((prevTables) =>
          prevTables.map((t) => (t.id === selectedTableId ? { ...t, status: 'FREE' } : t))
        );
        setBillDetails(null);
      } else {
        setMessage({ type: 'error', text: data.error || 'Fallo al procesar el cobro.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al conectar con el servidor.' });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans max-w-md mx-auto shadow-2xl items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-400 font-semibold">Cargando base de datos...</p>
      </div>
    );
  }

  // PANTALLA DE BLOQUEO / TECLADO PIN
  if (!currentWaiter) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans max-w-md mx-auto shadow-2xl p-6 justify-center">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black tracking-tight text-white mb-1">{tenantName}</h1>
          <p className="text-blue-400 font-extrabold uppercase text-xs tracking-widest">Acceso Camarero</p>
        </div>

        {message && (
          <div className="p-3 rounded-xl text-sm font-semibold text-center bg-rose-500/20 text-rose-400 mb-6">
            {message.text}
          </div>
        )}

        {/* Listado de Camareros del Bar */}
        <div className="mb-6">
          <label htmlFor="waiter-select" className="text-slate-400 text-xs uppercase font-extrabold block mb-2 text-center tracking-wider">
            Selecciona tu Nombre
          </label>
          <select
            id="waiter-select"
            value={selectedWaiterId}
            onChange={(e) => {
              setSelectedWaiterId(e.target.value);
              setMessage(null);
            }}
            className="w-full bg-slate-800 text-white rounded-xl border border-slate-700/60 px-4 py-3 font-extrabold text-center outline-none focus:ring-2 focus:ring-blue-500 text-lg shadow-md"
          >
            {waiters.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Indicador de PIN */}
        <div className="flex justify-center gap-4 mb-8">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
                pinInput.length > idx
                  ? 'bg-blue-500 border-blue-400 scale-110 shadow-md'
                  : 'bg-transparent border-slate-700'
              }`}
            />
          ))}
        </div>

        {/* Teclado Numérico Visual */}
        <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
            <button
              key={num}
              onClick={() => handleKeypadPress(num)}
              className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-755 active:scale-95 text-2xl font-black text-white flex items-center justify-center border border-slate-700/60 shadow transition-all"
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => handleKeypadPress('clear')}
            className="w-16 h-16 rounded-full bg-rose-500/10 hover:bg-rose-500/20 active:scale-95 text-xs font-bold text-rose-450 flex items-center justify-center border border-rose-500/20 transition-all uppercase"
          >
            Limpiar
          </button>
          <button
            onClick={() => handleKeypadPress('0')}
            className="w-16 h-16 rounded-full bg-slate-800 hover:bg-slate-755 active:scale-95 text-2xl font-black text-white flex items-center justify-center border border-slate-700/60 shadow transition-all"
          >
            0
          </button>
          <button
            onClick={() => handleKeypadPress('delete')}
            className="w-16 h-16 rounded-full bg-slate-800/40 hover:bg-slate-700/45 active:scale-95 text-lg font-black text-slate-400 flex items-center justify-center border border-slate-700/30 transition-all"
          >
            ⌫
          </button>
        </div>
      </div>
    );
  }

  // PANTALLA PRINCIPAL / COMANDERO
  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans max-w-md mx-auto shadow-2xl">
      {/* Cabecera */}
      <header className="bg-blue-600 px-4 py-3 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-xl font-bold tracking-tight">{tenantName}</h1>
          <p className="text-[10px] text-blue-200 font-extrabold uppercase tracking-wider mt-0.5">
            Camarero: {currentWaiter.name}
          </p>
        </div>
        <button
          onClick={() => {
            setCurrentWaiter(null);
            setMessage(null);
          }}
          className="px-3 py-1.5 bg-blue-750 hover:bg-blue-800 text-white rounded-lg text-xs font-black uppercase tracking-wider transition-colors shadow-inner"
        >
          Bloquear
        </button>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        {/* Notificaciones */}
        {message && (
          <div
            className={`p-3 rounded-lg text-sm font-semibold text-center animate-pulse ${
              message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Selector de Mesas Desplegable */}
        <div>
          <label htmlFor="table-select" className="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-2">
            Selección de Mesa
          </label>
          <div className="relative">
            <select
              id="table-select"
              value={selectedTableId}
              onChange={(e) => {
                setSelectedTableId(e.target.value);
                setMessage(null);
              }}
              className="w-full appearance-none bg-slate-800 text-white rounded-xl border border-slate-700/60 px-4 py-3 font-extrabold outline-none focus:ring-2 focus:ring-blue-500 text-lg shadow-md cursor-pointer transition-all duration-150 pr-10"
            >
              {tables.map((table) => {
                const isBusy = table.status === 'BUSY';
                return (
                  <option key={table.id} value={table.id} className="font-extrabold bg-slate-900 text-slate-100">
                    Mesa {table.number} {isBusy ? '🔴 (Ocupada - Ver Cuenta)' : '🟢 (Libre)'}
                  </option>
                );
              })}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-400">
              <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Panel de Cobro Detallado si la mesa está Ocupada */}
        {selectedTable && selectedTable.status === 'BUSY' && (
          <div className="bg-slate-950/80 border border-amber-500/25 rounded-xl p-4 flex flex-col gap-3 animate-fadeIn shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div>
                <span className="text-amber-400 font-extrabold text-sm block">Mesa Ocupada (Detalle Cuenta)</span>
                <span className="text-slate-400 text-[10px]">Agrupa los consumos pendientes de cobro.</span>
              </div>
              <span className="px-2 py-0.5 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded text-[9px] font-black uppercase">
                Pendiente
              </span>
            </div>

            {isBillLoading ? (
              <div className="text-center py-4 text-xs text-slate-500">Calculando cuenta...</div>
            ) : billDetails ? (
              <div className="space-y-3">
                {/* Desglose de productos */}
                <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {billDetails.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-slate-350">
                      <span>{item.quantity}x {item.name}</span>
                      <span className="font-semibold text-slate-200">{(item.price * item.quantity).toFixed(2)}€</span>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400 font-bold text-xs uppercase">Total Cuenta:</span>
                  <span className="text-lg font-black text-amber-400">{billDetails.total.toFixed(2)}€</span>
                </div>

                {/* Acciones de Cobro */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => checkoutTable('CASH')}
                    disabled={isSending}
                    className="py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black rounded-lg text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1 shadow-md"
                  >
                    💵 Efectivo
                  </button>
                  <button
                    onClick={() => checkoutTable('CARD')}
                    disabled={isSending}
                    className="py-2.5 bg-blue-500 hover:bg-blue-400 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-lg text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1 shadow-md"
                  >
                    💳 Tarjeta
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-rose-450">No hay consumos.</div>
            )}
          </div>
        )}

        {/* Vista por carpetas de categorías o listado de productos */}
        {selectedCategoryId === 'ALL' ? (
          /* Panel de Categorías (Carpetas) */
          <div>
            <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">Categorías (Carpetas)</h2>
            <div className="grid grid-cols-2 gap-4">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategoryId(cat.id);
                    setMessage(null);
                  }}
                  className="flex flex-col items-center justify-center p-6 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all duration-150 rounded-2xl border border-slate-700 h-32 gap-3 shadow group hover:border-blue-500/50"
                >
                  <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200 shadow-inner">
                    {/* Icono de Carpeta */}
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path>
                    </svg>
                  </div>
                  <span className="text-sm font-extrabold text-slate-100 group-hover:text-white transition-colors text-center w-full leading-tight truncate px-1">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Panel de Productos en la Categoría Seleccionada */
          <div>
            <div className="flex items-center gap-3 mb-4">
              <button
                onClick={() => {
                  setSelectedCategoryId('ALL');
                  setMessage(null);
                }}
                className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-90 text-white flex items-center justify-center border border-slate-700/80 transition-all cursor-pointer shadow-md"
                title="Volver a las carpetas"
              >
                {/* Icono de flecha volver */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
              <div>
                <span className="text-[10px] text-blue-450 font-extrabold uppercase tracking-widest block">Categoría</span>
                <h2 className="text-lg font-black text-white leading-tight">
                  {categories.find(c => c.id === selectedCategoryId)?.name || 'Productos'}
                </h2>
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-10 bg-slate-950/20 border border-slate-800/40 rounded-2xl text-xs text-slate-500 font-semibold">
                No hay productos en esta categoría.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="flex flex-col items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all duration-150 rounded-xl border border-slate-700 h-28 text-left group shadow-sm hover:shadow-md"
                  >
                    <span className="text-sm font-bold w-full leading-tight text-slate-100 group-hover:text-white transition-colors">{product.name}</span>
                    <span className="text-blue-400 font-extrabold w-full text-right text-sm">{product.price.toFixed(2)}€</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Resumen del Carrito */}
        <div className="flex-1 bg-slate-950/50 border border-slate-800 rounded-xl p-4 flex flex-col">
          <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-3">Detalle Pedido</h2>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {cart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Sin artículos seleccionados
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-1 border-b border-slate-800/60">
                  <div className="flex-1">
                    <span className="font-bold text-white">{item.name}</span>
                    <span className="text-slate-400 text-xs block">
                      {item.quantity} x {item.price.toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="w-8 h-8 rounded-full bg-slate-850 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center text-slate-400 font-extrabold transition-colors"
                    >
                      -
                    </button>
                    <span className="font-extrabold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => addToCart(item)}
                      className="w-8 h-8 rounded-full bg-slate-850 hover:bg-emerald-500/20 hover:text-emerald-400 flex items-center justify-center text-slate-400 font-extrabold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
            <span className="text-slate-400 font-semibold">Total:</span>
            <span className="text-2xl font-black text-white">{total.toFixed(2)}€</span>
          </div>
        </div>
      </main>

      {/* Botón de Enviar */}
      <footer className="p-4 bg-slate-900 border-t border-slate-800">
        <button
          onClick={sendOrderToKitchen}
          disabled={cart.length === 0 || isSending}
          className={`w-full py-4 rounded-xl text-lg font-black tracking-wide uppercase transition-all shadow-lg active:scale-98 ${
            cart.length === 0 || isSending
              ? 'bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
          }`}
        >
          {isSending ? 'Enviando...' : 'Enviar a Cocina'}
        </button>
      </footer>
    </div>
  );
}
