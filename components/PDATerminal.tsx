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
  note?: string;
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
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
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

  // Estados para modal de observaciones de producto
  const [noteModalProduct, setNoteModalProduct] = useState<Product | null>(null);
  const [noteModalText, setNoteModalText] = useState('');

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

  const addToCart = (product: Product, note?: string) => {
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.id === product.id && item.note === note);
      if (existing) {
        return prevCart.map((item) =>
          item.id === product.id && item.note === note
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1, note }];
    });
  };

  const removeFromCart = (productId: string, note?: string) => {
    setCart((prevCart) => {
      const itemIndex = prevCart.findIndex((item) => item.id === productId && item.note === note);
      if (itemIndex === -1) return prevCart;

      const item = prevCart[itemIndex];
      if (item.quantity > 1) {
        return prevCart.map((it, idx) =>
          idx === itemIndex ? { ...it, quantity: it.quantity - 1 } : it
        );
      } else {
        return prevCart.filter((_, idx) => idx !== itemIndex);
      }
    });
  };

  const openProductNoteModal = (product: Product) => {
    setNoteModalProduct(product);
    setNoteModalText('');
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

  // Encolar impresión del Ticket de Cuenta (Factura simplificada)
  const printReceiptTicket = async () => {
    if (!selectedTableId) return;
    setIsSending(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/tables/${selectedTableId}/receipt`, {
        method: 'POST',
        headers: {
          'x-tenant-slug': tenantSlug
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Ticket de cuenta encolado para impresión en Barra.' 
        });
      } else {
        setMessage({ type: 'error', text: data.error || 'Fallo al encolar el ticket de cuenta.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al conectar con el servidor.' });
    } finally {
      setIsSending(false);
    }
  };

  // Liberar mesa y marcar comandas como cobradas
  const releaseTable = async () => {
    if (!selectedTableId) return;
    setIsSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/tables/release', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({ tableId: selectedTableId }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Mesa liberada y cobrada con éxito.' 
        });
        
        // Actualizar el estado local de la mesa a FREE
        setTables((prevTables) =>
          prevTables.map((t) => (t.id === selectedTableId ? { ...t, status: 'FREE' } : t))
        );
        setBillDetails(null);
      } else {
        setMessage({ type: 'error', text: data.error || 'Fallo al liberar la mesa.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error al conectar con el servidor.' });
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans w-full max-w-md mx-auto shadow-2xl items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-400 font-semibold">Cargando base de datos...</p>
      </div>
    );
  }

  // PANTALLA DE BLOQUEO / TECLADO PIN
  if (!currentWaiter) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans w-full max-w-md mx-auto shadow-2xl p-6 justify-center">
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
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans w-full max-w-md mx-auto shadow-2xl">
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

        {/* Selector de Mesas Interactivo */}
        <div>
          <label className="text-xs uppercase tracking-wider text-slate-400 font-bold block mb-2">
            Selección de Mesa
          </label>
          <button
            onClick={() => setIsTableModalOpen(true)}
            className="w-full flex items-center justify-between bg-slate-800 hover:bg-slate-750 text-white rounded-xl border border-slate-700/60 px-4 py-3 font-extrabold text-lg shadow-md cursor-pointer transition-all duration-155 active:scale-98"
          >
            <span>🪑 {selectedTable ? `Mesa ${selectedTable.number}` : 'Seleccionar Mesa'}</span>
            <span className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">
                {selectedTable?.status === 'BUSY' ? 'Ocupada' : 'Libre'}
              </span>
              <span className={`w-3.5 h-3.5 rounded-full shadow-inner ${selectedTable?.status === 'BUSY' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
            </span>
          </button>
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
                  {billDetails.items.map((item, idx) => (
                    <div key={idx} className="flex flex-col text-slate-350 border-b border-slate-900/40 pb-1">
                      <div className="flex justify-between">
                        <span>{item.quantity}x {item.name}</span>
                        <span className="font-semibold text-slate-200">{(item.price * item.quantity).toFixed(2)}€</span>
                      </div>
                      {item.note && (
                        <span className="text-amber-400 text-[10px] italic pl-2">↳ {item.note}</span>
                      )}
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
                    onClick={printReceiptTicket}
                    disabled={isSending}
                    className="py-2.5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black rounded-lg text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1 shadow-md cursor-pointer"
                  >
                    🖨️ Imprimir Ticket
                  </button>
                  <button
                    onClick={releaseTable}
                    disabled={isSending}
                    className="py-2.5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black rounded-lg text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-1 shadow-md cursor-pointer"
                  >
                    🔓 Liberar Mesa
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
                  <div
                    key={product.id}
                    className="relative flex flex-col justify-between p-4 bg-slate-800 hover:bg-slate-750 rounded-xl border border-slate-700 h-28 text-left group shadow-sm transition-all duration-150"
                  >
                    {/* Main Clickable Area to add directly */}
                    <button
                      onClick={() => addToCart(product)}
                      className="absolute inset-0 w-full h-full text-left p-4 flex flex-col justify-between cursor-pointer rounded-xl"
                    >
                      <span className="text-sm font-bold w-full pr-6 leading-tight text-slate-100 group-hover:text-white transition-colors">{product.name}</span>
                      <span className="text-blue-400 font-extrabold w-full text-right text-sm">{product.price.toFixed(2)}€</span>
                    </button>
                    
                    {/* Small pencil icon in the top right corner */}
                    <button
                      onClick={() => openProductNoteModal(product)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-slate-900/60 hover:bg-blue-600 hover:text-white text-slate-400 flex items-center justify-center text-xs transition-all border border-slate-700/50 cursor-pointer z-10"
                      title="Añadir con observación"
                    >
                      ✏️
                    </button>
                  </div>
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
                <div key={`${item.id}-${item.note || ''}`} className="flex items-center justify-between py-2 border-b border-slate-800/60 gap-3">
                  <div className="flex-1">
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-sm">{item.name}</span>
                      {item.note && (
                        <span className="text-amber-400 text-[11px] font-semibold mt-0.5 bg-amber-500/10 px-2 py-0.5 rounded w-fit border border-amber-500/25">
                          ✍️ {item.note}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-xs mt-1 block">
                      {item.quantity} x {item.price.toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => removeFromCart(item.id, item.note)}
                      className="w-8 h-8 rounded-full bg-slate-850 hover:bg-rose-500/20 hover:text-rose-400 flex items-center justify-center text-slate-400 font-extrabold transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-extrabold w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => addToCart(item, item.note)}
                      className="w-8 h-8 rounded-full bg-slate-850 hover:bg-emerald-500/20 hover:text-emerald-400 flex items-center justify-center text-slate-400 font-extrabold transition-colors cursor-pointer"
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

      {/* Modal para añadir producto con nota */}
      {noteModalProduct && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative animate-scaleUp">
            <h3 className="text-lg font-black text-white mb-1">Observación para:</h3>
            <span className="text-blue-400 font-black block text-md mb-4">{noteModalProduct.name}</span>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                addToCart(noteModalProduct, noteModalText.trim() || undefined);
                setNoteModalProduct(null);
              }}
              className="space-y-4"
            >
              <div>
                <label className="text-slate-450 text-xs font-bold block mb-1.5 uppercase tracking-wider">Escribe la personalización</label>
                <input
                  type="text"
                  value={noteModalText}
                  onChange={(e) => setNoteModalText(e.target.value)}
                  placeholder="Ej. Sin cebolla, sin queso, muy hecho..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none font-semibold"
                  autoFocus
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setNoteModalProduct(null)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-350 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                >
                  Añadir a la comanda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE SELECCIÓN DE MESA (GRID INTERACTIVO) */}
      {isTableModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-black text-white text-base">Seleccionar Mesa</h3>
                <p className="text-[10px] text-slate-400">Púlsa una mesa para empezar a tomar nota.</p>
              </div>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Grid of Tables */}
            <div className="p-6 overflow-y-auto">
              {tables.length === 0 ? (
                <p className="text-slate-500 text-xs text-center py-6">No hay mesas registradas.</p>
              ) : (
                <div className="grid grid-cols-4 gap-2">
                  {tables.map((table) => {
                    const isBusy = table.status === 'BUSY';
                    return (
                      <button
                        key={table.id}
                        onClick={() => {
                          setSelectedTableId(table.id);
                          setIsTableModalOpen(false);
                          setMessage(null);
                        }}
                        className={`py-3.5 px-1 flex flex-col items-center justify-center rounded-xl border text-center transition-all cursor-pointer select-none active:scale-95 shadow-md ${
                          isBusy
                            ? 'bg-rose-500/10 hover:bg-rose-500/15 border-rose-500/25 text-rose-455 hover:border-rose-500/40'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/25 text-emerald-450 hover:border-emerald-500/40'
                        }`}
                      >
                        <span className="text-xl font-black">{table.number}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Leyenda footer */}
            <div className="px-6 py-3 bg-slate-950/40 border-t border-slate-850 flex justify-center gap-4 text-[9px] uppercase tracking-wider font-extrabold text-slate-400">
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" /> Libre
              </div>
              <div className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" /> Ocupada
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
