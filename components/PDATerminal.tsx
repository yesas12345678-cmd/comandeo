'use client';

import React, { useState, useEffect } from 'react';

interface Product {
  id: string;
  name: string;
  price: number;
}

interface CartItem extends Product {
  quantity: number;
}

interface Table {
  id: string;
  number: number;
  status: 'FREE' | 'BUSY';
}

export default function PDATerminal() {
  const [products, setProducts] = useState<Product[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cargar datos iniciales desde la base de datos
  useEffect(() => {
    async function loadData() {
      try {
        const response = await fetch('/api/init');
        const data = await response.json();
        if (data.success) {
          setProducts(data.products);
          setTables(data.tables);
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
  }, []);

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

  const sendOrderToKitchen = async () => {
    if (cart.length === 0 || !selectedTableId) return;
    setIsSending(true);
    setMessage(null);

    try {
      const response = await fetch('/api/order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tableId: selectedTableId,
          items: cart,
          total,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setMessage({ type: 'success', text: `¡Comanda enviada con éxito a cocina!` });
        setCart([]);
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

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans max-w-md mx-auto shadow-2xl items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-400 font-semibold">Cargando base de datos...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-900 text-slate-100 font-sans max-w-md mx-auto shadow-2xl">
      <header className="bg-blue-600 px-4 py-3 flex items-center justify-between shadow-md">
        <h1 className="text-xl font-bold tracking-tight">PDA Camarero</h1>
        <div className="flex items-center gap-2">
          <label htmlFor="table-select" className="text-sm font-semibold">Mesa:</label>
          <select
            id="table-select"
            value={selectedTableId}
            onChange={(e) => setSelectedTableId(e.target.value)}
            className="bg-blue-700 text-white rounded px-2 py-1 font-bold outline-none focus:ring-2 focus:ring-blue-300"
          >
            {tables.map((table) => (
              <option key={table.id} value={table.id}>
                #{table.number}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="flex-1 p-4 flex flex-col gap-4 overflow-y-auto">
        {message && (
          <div
            className={`p-3 rounded-lg text-sm font-semibold text-center animate-pulse ${
              message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
            }`}
          >
            {message.text}
          </div>
        )}

        <div>
          <h2 className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-2">Productos</h2>
          <div className="grid grid-cols-2 gap-3">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => addToCart(product)}
                className="flex flex-col items-center justify-between p-4 bg-slate-800 hover:bg-slate-700 active:scale-95 transition-all rounded-xl border border-slate-700 h-28 text-left"
              >
                <span className="text-lg font-bold w-full leading-tight">{product.name}</span>
                <span className="text-blue-400 font-extrabold w-full text-right">{product.price.toFixed(2)}€</span>
              </button>
            ))}
          </div>
        </div>

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
