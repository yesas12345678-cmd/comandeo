'use client';

import React, { useState, useEffect } from 'react';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  categoryId: string;
  category?: Category;
}

interface Waiter {
  id: string;
  name: string;
  pin: string;
  allowedDays?: string;
  startHour?: string;
  endHour?: string;
}

interface Table {
  id: string;
  number: number;
  status: 'FREE' | 'BUSY';
}

interface Order {
  id: string;
  tableId: string;
  items: { id: string; name: string; price: number; quantity: number }[];
  total: number;
  createdAt: string;
}

export default function TenantAdminDashboardClient({ tenantSlug, bypassAuth = false }: { tenantSlug: string; bypassAuth?: boolean }) {
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'sales' | 'products' | 'categories' | 'waiters' | 'tables'>('sales');
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tenantName, setTenantName] = useState('Administración');
  const [isLoading, setIsLoading] = useState(true);

  // Estados de formularios
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductCategoryId, setNewProductCategoryId] = useState('');

  const [newCategoryName, setNewCategoryName] = useState('');

  const [newWaiterName, setNewWaiterName] = useState('');
  const [newWaiterPin, setNewWaiterPin] = useState('');

  const [newTableNumber, setNewTableNumber] = useState('');

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Estados para edición de camarero (Modal de Engranaje)
  const [selectedWaiterForEdit, setSelectedWaiterForEdit] = useState<Waiter | null>(null);
  const [editWaiterName, setEditWaiterName] = useState('');
  const [editWaiterPin, setEditWaiterPin] = useState('');
  const [editWaiterAllowedDays, setEditWaiterAllowedDays] = useState<string[]>([]);
  const [editWaiterStartHour, setEditWaiterStartHour] = useState('00:00');
  const [editWaiterEndHour, setEditWaiterEndHour] = useState('23:59');
  const [isSavingWaiter, setIsSavingWaiter] = useState(false);
  const [editWaiterError, setEditWaiterError] = useState('');

  // Verificar autorización al cargar
  useEffect(() => {
    if (bypassAuth) {
      setIsAuthorized(true);
    } else {
      const isLogged = sessionStorage.getItem(`tenant_auth_${tenantSlug}`) === 'true';
      setIsAuthorized(isLogged);
    }
  }, [tenantSlug, bypassAuth]);

  // Limpiar mensajes al cambiar de pestaña
  useEffect(() => {
    setErrorMsg('');
    setSuccessMsg('');
  }, [activeTab]);

  // Cargar todos los datos
  const loadData = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');

      const headers = { 'x-tenant-slug': tenantSlug };

      // Cargar productos y categorías
      const resProducts = await fetch('/api/admin/products', { headers });
      const dataProducts = await resProducts.json();

      // Cargar pedidos
      const resOrders = await fetch('/api/admin/orders', { headers });
      const dataOrders = await resOrders.json();

      // Cargar camareros
      const resWaiters = await fetch('/api/admin/waiters', { headers });
      const dataWaiters = await resWaiters.json();

      // Cargar mesas y nombre del bar
      const resInit = await fetch('/api/init', { headers });
      const dataInit = await resInit.json();

      if (dataProducts.success) {
        setProducts(dataProducts.products);
        setCategories(dataProducts.categories);
        if (dataProducts.categories.length > 0 && !newProductCategoryId) {
          setNewProductCategoryId(dataProducts.categories[0].id);
        }
      }
      if (dataOrders.success) {
        setOrders(dataOrders.orders);
      }
      if (dataWaiters.success) {
        setWaiters(dataWaiters.waiters);
      }
      if (dataInit.success) {
        setTables(dataInit.tables);
        setTenantName(dataInit.tenantName);
      }
    } catch (err) {
      console.error('Error al cargar datos del panel:', err);
      setErrorMsg('Error de red al intentar sincronizar los datos.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthorized) {
      loadData();
    }
  }, [isAuthorized, tenantSlug]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        sessionStorage.setItem(`tenant_auth_${tenantSlug}`, 'true');
        setIsAuthorized(true);
      } else {
        setLoginError(data.error || 'Credenciales incorrectas.');
      }
    } catch (err) {
      setLoginError('Error de conexión con el servidor.');
    }
  };

  // AGREGAR PRODUCTO
  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newProductName || !newProductPrice || !newProductCategoryId) {
      setErrorMsg('Por favor rellena todos los campos.');
      return;
    }

    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({
          name: newProductName,
          price: parseFloat(newProductPrice),
          categoryId: newProductCategoryId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Producto "${newProductName}" añadido con éxito.`);
        setNewProductName('');
        setNewProductPrice('');
        loadData();
      } else {
        setErrorMsg(data.error || 'Error al guardar el producto.');
      }
    } catch (err) {
      setErrorMsg('Error de conexión.');
    }
  };

  // AGREGAR CATEGORÍA
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newCategoryName) {
      setErrorMsg('Escribe el nombre de la categoría.');
      return;
    }

    try {
      const res = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({ name: newCategoryName }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Categoría "${newCategoryName}" creada.`);
        setNewCategoryName('');
        loadData();
      } else {
        setErrorMsg(data.error || 'Error al guardar la categoría.');
      }
    } catch (err) {
      setErrorMsg('Error de conexión.');
    }
  };

  // AGREGAR CAMARERO
  const handleAddWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newWaiterName || !newWaiterPin) {
      setErrorMsg('Faltan campos obligatorios.');
      return;
    }

    try {
      const res = await fetch('/api/admin/waiters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({ name: newWaiterName, pin: newWaiterPin }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Camarero "${newWaiterName}" dado de alta con PIN ${newWaiterPin}.`);
        setNewWaiterName('');
        setNewWaiterPin('');
        loadData();
      } else {
        setErrorMsg(data.error || 'Error al guardar el camarero.');
      }
    } catch (err) {
      setErrorMsg('Error de conexión.');
    }
  };

  // AGREGAR MESA
  const handleAddTable = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newTableNumber) {
      setErrorMsg('Escribe el número de mesa.');
      return;
    }

    try {
      const res = await fetch('/api/admin/tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({ number: newTableNumber }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Mesa #${newTableNumber} añadida al local.`);
        setNewTableNumber('');
        loadData();
      } else {
        setErrorMsg(data.error || 'Error al guardar la mesa.');
      }
    } catch (err) {
      setErrorMsg('Error de conexión.');
    }
  };

  // ELIMINAR REGISTROS
  const handleDeleteItem = async (url: string, typeName: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar este ${typeName}?`)) return;

    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: { 'x-tenant-slug': tenantSlug }
      });
      const data = await res.json();
      if (data.success) {
        loadData();
      } else {
        alert(data.error || `Error al eliminar el ${typeName}.`);
      }
    } catch (err) {
      alert('Error de conexión.');
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem(`tenant_auth_${tenantSlug}`);
    setIsAuthorized(false);
  };

  // Abrir modal de edición
  const openEditWaiterModal = (w: Waiter) => {
    setSelectedWaiterForEdit(w);
    setEditWaiterName(w.name);
    setEditWaiterPin(w.pin);
    setEditWaiterAllowedDays(w.allowedDays ? w.allowedDays.split(',') : ['1','2','3','4','5','6','7']);
    setEditWaiterStartHour(w.startHour || '00:00');
    setEditWaiterEndHour(w.endHour || '23:59');
    setEditWaiterError('');
  };

  // Guardar cambios del camarero
  const handleUpdateWaiter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWaiterForEdit) return;
    setIsSavingWaiter(true);
    setEditWaiterError('');

    try {
      const res = await fetch(`/api/admin/waiters/${selectedWaiterForEdit.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-slug': tenantSlug
        },
        body: JSON.stringify({
          name: editWaiterName,
          pin: editWaiterPin,
          allowedDays: editWaiterAllowedDays.join(','),
          startHour: editWaiterStartHour,
          endHour: editWaiterEndHour
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Camarero "${editWaiterName}" actualizado con éxito.`);
        setSelectedWaiterForEdit(null);
        loadData();
      } else {
        setEditWaiterError(data.error || 'Error al actualizar el camarero.');
      }
    } catch (err) {
      setEditWaiterError('Error de conexión.');
    } finally {
      setIsSavingWaiter(false);
    }
  };

  // Manejar cambios de día permitido en checkbox
  const handleDayCheckboxChange = (day: string) => {
    setEditWaiterAllowedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const totalSales = orders.reduce((sum, order) => sum + order.total, 0);
  const averageTicket = orders.length > 0 ? totalSales / orders.length : 0;

  // Calcular ranking de productos más vendidos
  const getProductRanking = () => {
    const counts: { [name: string]: number } = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        counts[item.name] = (counts[item.name] || 0) + item.quantity;
      });
    });
    return Object.entries(counts)
      .map(([name, quantity]) => ({ name, quantity }))
      .sort((a, b) => b.quantity - a.quantity);
  };

  if (isAuthorized === null) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // PANTALLA DE LOGIN
  if (!isAuthorized) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8 flex flex-col items-center gap-3">
            <img src="/logo.svg" alt="Comandeo Logo" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-1">Panel del Bar</h1>
              <p className="text-blue-400 font-bold uppercase text-xs tracking-wider">Acceso Propietario ({tenantSlug})</p>
            </div>
          </div>

          {loginError && (
            <div className="p-4 bg-rose-500/10 text-rose-450 border border-rose-500/20 rounded-xl text-sm font-semibold text-center mb-6">
              {loginError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label htmlFor="login-username" className="text-slate-400 text-xs font-bold block mb-1">Usuario</label>
              <input
                id="login-username"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder=""
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="login-password" className="text-slate-400 text-xs font-bold block mb-1">Contraseña</label>
              <input
                id="login-password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-blue-500/10 active:scale-98 uppercase tracking-wider"
            >
              Iniciar Sesión
            </button>
          </form>
        </div>
      </div>
    );
  }

  // CARGANDO DATOS
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
        <p className="text-slate-400 font-semibold text-sm">Cargando Panel de Administración...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Cabecera */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Comandeo Logo" className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white">{tenantName}</h1>
            <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Panel de Administración</p>
          </div>
        </div>
        <div className="flex gap-3">
          <a
            href={`https://wa.me/34641403129?text=Hola,%20necesito%20ayuda%20con%20la%20administraci%C3%B3n%20de%20mi%20bar%20(${encodeURIComponent(tenantName)})%20en%20Comandeo.`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 font-bold rounded-lg text-sm transition-all flex items-center gap-2 border border-blue-500/20"
          >
            💬 Soporte
          </a>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-350 font-bold rounded-lg text-sm transition-all"
          >
            Salir
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto p-6">
        {/* Notificaciones globales */}
        {errorMsg && <div className="p-3 bg-rose-500/20 text-rose-450 rounded-lg text-sm mb-6 font-bold">{errorMsg}</div>}
        {successMsg && <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm mb-6 font-bold">{successMsg}</div>}

        {/* Pestañas */}
        <div className="flex border-b border-slate-800 mb-8 gap-1 overflow-x-auto">
          {[
            { id: 'sales', label: '📊 Resumen de Ventas' },
            { id: 'products', label: '🍔 Productos' },
            { id: 'categories', label: '📁 Categorías' },
            { id: 'waiters', label: '👥 Camareros' },
            { id: 'tables', label: '🪑 Mesas' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-sm font-extrabold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-white font-black'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* PESTAÑA: VENTAS */}
        {activeTab === 'sales' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
                <span className="text-slate-400 text-xs uppercase font-extrabold tracking-wider">Ingresos del Día</span>
                <p className="text-3xl font-black text-white mt-2">{totalSales.toFixed(2)}€</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
                <span className="text-slate-400 text-xs uppercase font-extrabold tracking-wider">Servicios Totales</span>
                <p className="text-3xl font-black text-white mt-2">{orders.length}</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
                <span className="text-slate-400 text-xs uppercase font-extrabold tracking-wider">Ticket Medio</span>
                <p className="text-3xl font-black text-white mt-2">{averageTicket.toFixed(2)}€</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Comandas Recientes */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
                <h2 className="text-lg font-black text-white mb-4">Comandas Recientes</h2>
                {orders.length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">No se han registrado comandas hoy.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400 font-bold">
                          <th className="pb-3">Mesa</th>
                          <th className="pb-3">Fecha y Hora</th>
                          <th className="pb-3">Detalle del Pedido</th>
                          <th className="pb-3 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-slate-850/40">
                            <td className="py-4 font-black text-blue-400">#{order.tableId.replace(/\D/g, '') || order.tableId}</td>
                            <td className="py-4 text-slate-400">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(order.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-4 max-w-xs truncate">
                              {order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')}
                            </td>
                            <td className="py-4 text-right font-bold text-white">{order.total.toFixed(2)}€</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Ranking de Productos */}
              <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
                <h2 className="text-lg font-black text-white mb-4">Ranking de Productos</h2>
                {getProductRanking().length === 0 ? (
                  <p className="text-slate-500 text-sm text-center py-6">No hay datos de consumo aún.</p>
                ) : (
                  <div className="space-y-3">
                    {getProductRanking().map((prod, index) => (
                      <div key={prod.name} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850/60 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center bg-blue-500/10 text-blue-400 rounded-full text-xs font-black">
                            {index + 1}
                          </span>
                          <span className="font-extrabold text-sm text-slate-200">{prod.name}</span>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs font-black">
                          {prod.quantity} {prod.quantity === 1 ? 'ud' : 'uds'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA: PRODUCTOS */}
        {activeTab === 'products' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md h-fit">
              <h2 className="text-lg font-black text-white mb-4">Añadir Producto</h2>
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label htmlFor="prod-name" className="text-slate-400 text-xs font-bold block mb-1">Nombre</label>
                  <input
                    id="prod-name"
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Ej. Tarta de Limón"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="prod-price" className="text-slate-400 text-xs font-bold block mb-1">Precio (€)</label>
                  <input
                    id="prod-price"
                    type="number"
                    step="0.01"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(e.target.value)}
                    placeholder="Ej. 4.90"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="prod-cat" className="text-slate-400 text-xs font-bold block mb-1">Categoría</label>
                  <select
                    id="prod-cat"
                    value={newProductCategoryId}
                    onChange={(e) => setNewProductCategoryId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none font-bold"
                  >
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-sm transition-all"
                >
                  Guardar Producto
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
              <h2 className="text-lg font-black text-white mb-4">Productos en Carta</h2>
              {products.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No hay productos en tu carta.</p>
              ) : (
                <div className="overflow-y-auto max-h-[500px] space-y-3">
                  {products.map((prod) => (
                    <div key={prod.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850/60 rounded-xl">
                      <div>
                        <span className="font-extrabold text-white">{prod.name}</span>
                        <span className="text-slate-400 text-xs block mt-0.5">
                          Categoría: <span className="text-blue-400 font-semibold">{prod.category?.name || 'Ninguna'}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-emerald-400">{prod.price.toFixed(2)}€</span>
                        <button
                          onClick={() => handleDeleteItem(`/api/admin/products/${prod.id}`, 'producto')}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 hover:text-rose-300 rounded text-xs transition-colors font-bold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA: CATEGORÍAS */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md h-fit">
              <h2 className="text-lg font-black text-white mb-4">Nueva Categoría</h2>
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <label htmlFor="cat-name" className="text-slate-400 text-xs font-bold block mb-1">Nombre</label>
                  <input
                    id="cat-name"
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="Ej. Postres Caseros"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-sm transition-all"
                >
                  Crear Categoría
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
              <h2 className="text-lg font-black text-white mb-4">Categorías Creadas</h2>
              {categories.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No has creado categorías todavía.</p>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat) => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850/60 rounded-xl">
                      <span className="font-extrabold text-white">{cat.name}</span>
                      <button
                        onClick={() => handleDeleteItem(`/api/admin/categories/${cat.id}`, 'categoría')}
                        className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 hover:text-rose-300 rounded text-xs transition-colors font-bold"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA: CAMAREROS */}
        {activeTab === 'waiters' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md h-fit">
              <h2 className="text-lg font-black text-white mb-4">Nuevo Camarero</h2>
              <form onSubmit={handleAddWaiter} className="space-y-4">
                <div>
                  <label htmlFor="waiter-name" className="text-slate-400 text-xs font-bold block mb-1">Nombre</label>
                  <input
                    id="waiter-name"
                    type="text"
                    value={newWaiterName}
                    onChange={(e) => setNewWaiterName(e.target.value)}
                    placeholder="Ej. Andrés"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="waiter-pin" className="text-slate-400 text-xs font-bold block mb-1">PIN (4 números)</label>
                  <input
                    id="waiter-pin"
                    type="text"
                    maxLength={4}
                    value={newWaiterPin}
                    onChange={(e) => setNewWaiterPin(e.target.value.replace(/\D/g, ''))}
                    placeholder="Ej. 1234"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-sm transition-all"
                >
                  Dar de Alta
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
              <h2 className="text-lg font-black text-white mb-4">Personal del Restaurante</h2>
              {waiters.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No hay camareros registrados.</p>
              ) : (
                <div className="space-y-3">
                  {waiters.map((w) => (
                    <div key={w.id} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-850/60 rounded-xl">
                      <div>
                        <span className="font-extrabold text-white">{w.name}</span>
                        <span className="text-slate-400 text-xs block mt-0.5">
                          PIN de Acceso: <span className="text-blue-400 font-extrabold">{w.pin}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditWaiterModal(w)}
                          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm transition-all border border-slate-700/80 flex items-center justify-center cursor-pointer"
                          title="Ajustes de Camarero"
                        >
                          ⚙️
                        </button>
                        <button
                          onClick={() => handleDeleteItem(`/api/admin/waiters/${w.id}`, 'camarero')}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 hover:text-rose-300 rounded text-xs transition-colors font-bold h-9 cursor-pointer"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA: MESAS */}
        {activeTab === 'tables' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md h-fit">
              <h2 className="text-lg font-black text-white mb-4">Añadir Mesa</h2>
              <form onSubmit={handleAddTable} className="space-y-4">
                <div>
                  <label htmlFor="tab-num" className="text-slate-400 text-xs font-bold block mb-1">Número de Mesa</label>
                  <input
                    id="tab-num"
                    type="number"
                    value={newTableNumber}
                    onChange={(e) => setNewTableNumber(e.target.value)}
                    placeholder="Ej. 6"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-sm text-white focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-lg text-sm transition-all"
                >
                  Guardar Mesa
                </button>
              </form>
            </div>

            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md">
              <h2 className="text-lg font-black text-white mb-4">Disposición de Mesas</h2>
              {tables.length === 0 ? (
                <p className="text-slate-500 text-sm text-center py-6">No hay mesas configuradas.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {tables.map((t) => (
                    <div key={t.id} className="flex flex-col justify-between p-4 bg-slate-950/40 border border-slate-850/60 rounded-xl gap-3">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-lg text-white">Mesa #{t.number}</span>
                        <span className={`w-2.5 h-2.5 rounded-full ${t.status === 'BUSY' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-slate-400 font-extrabold uppercase">
                          {t.status === 'BUSY' ? 'Ocupada' : 'Libre'}
                        </span>
                        <button
                          onClick={() => handleDeleteItem(`/api/admin/tables/${t.id}`, 'mesa')}
                          className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-450 hover:text-rose-300 rounded text-xs transition-colors font-bold"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal Ajustes de Camarero */}
      {selectedWaiterForEdit && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 md:p-8 shadow-2xl relative animate-scaleUp max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-black text-white mb-2">Ajustes de: {selectedWaiterForEdit.name}</h3>
            <p className="text-xs text-slate-400 mb-6">Modifica el acceso, la contraseña y las restricciones de este camarero.</p>

            {editWaiterError && (
              <div className="p-3 bg-rose-500/10 text-rose-450 border border-rose-500/20 rounded-xl text-xs font-semibold text-center mb-5">
                {editWaiterError}
              </div>
            )}

            <form onSubmit={handleUpdateWaiter} className="space-y-5">
              <div>
                <label className="text-slate-400 text-xs font-bold block mb-1">Nombre</label>
                <input
                  type="text"
                  value={editWaiterName}
                  onChange={(e) => setEditWaiterName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 text-xs font-bold block mb-1">PIN (4 números)</label>
                <input
                  type="text"
                  maxLength={4}
                  value={editWaiterPin}
                  onChange={(e) => setEditWaiterPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none font-mono tracking-widest text-lg font-bold"
                  required
                />
              </div>

              {/* Días Permitidos */}
              <div>
                <label className="text-slate-400 text-xs font-bold block mb-2">Días Permitidos de Acceso</label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                  {[
                    { id: '1', name: 'L' },
                    { id: '2', name: 'M' },
                    { id: '3', name: 'X' },
                    { id: '4', name: 'J' },
                    { id: '5', name: 'V' },
                    { id: '6', name: 'S' },
                    { id: '7', name: 'D' }
                  ].map((day) => {
                    const isChecked = editWaiterAllowedDays.includes(day.id);
                    return (
                      <button
                        key={day.id}
                        type="button"
                        onClick={() => handleDayCheckboxChange(day.id)}
                        className={`py-2 px-1 rounded-lg text-xs font-extrabold border transition-all ${
                          isChecked
                            ? 'bg-blue-600 border-blue-500 text-slate-950'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        {day.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rango de Horas */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Hora Inicio</label>
                  <input
                    type="time"
                    value={editWaiterStartHour}
                    onChange={(e) => setEditWaiterStartHour(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-bold block mb-1">Hora Fin</label>
                  <input
                    type="time"
                    value={editWaiterEndHour}
                    onChange={(e) => setEditWaiterEndHour(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none font-bold"
                    required
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-800">
                <a
                  href={`https://wa.me/34641403129?text=Hola,%20necesito%20ayuda%20para%20configurar%20al%20camarero%20${encodeURIComponent(editWaiterName)}%20en%20mi%20bar%20(${encodeURIComponent(tenantName)}).`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-3 bg-slate-850 hover:bg-slate-800 text-slate-350 font-bold rounded-xl text-xs transition-all uppercase tracking-wider text-center flex items-center justify-center gap-1.5 cursor-pointer border border-slate-800/80"
                >
                  💬 Soporte
                </a>
                <div className="flex gap-2 flex-1">
                  <button
                    type="button"
                    onClick={() => setSelectedWaiterForEdit(null)}
                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-750 text-slate-350 font-bold rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingWaiter}
                    className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-450 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {isSavingWaiter ? 'Guardando...' : 'Guardar'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
