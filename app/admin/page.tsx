'use client';

import React, { useState, useEffect } from 'react';
import TenantAdminDashboardClient from '@/app/tenant/[tenantSlug]/admin/TenantAdminDashboardClient';

interface Tenant {
  id: string;
  slug: string;
  name: string;
  adminUsername?: string;
  adminPassword?: string;
  hasTwoPrinters?: boolean;
  drinksCategoryId?: string;
  barPrinterIp?: string;
  barPrinterPort?: number;
  kitchenPrinterIp?: string;
  kitchenPrinterPort?: number;
}

export default function GlobalAdminPage() {
  const [isSuperAuthorized, setIsSuperAuthorized] = useState<boolean | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantSlug, setSelectedTenantSlug] = useState('');
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  // States for selected tenant settings/credentials editing
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [hasTwoPrinters, setHasTwoPrinters] = useState(false);
  const [barPrinterIp, setBarPrinterIp] = useState('192.168.1.100');
  const [barPrinterPort, setBarPrinterPort] = useState('9100');
  const [kitchenPrinterIp, setKitchenPrinterIp] = useState('192.168.1.101');
  const [kitchenPrinterPort, setKitchenPrinterPort] = useState('9100');

  const [isUpdatingCredentials, setIsUpdatingCredentials] = useState(false);
  const [credMessage, setCredMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentTenant = tenants.find((t) => t.slug === selectedTenantSlug);

  // Check superadmin session
  useEffect(() => {
    const isLogged = sessionStorage.getItem('global_admin_auth') === 'true';
    setIsSuperAuthorized(isLogged);
  }, []);

  // Fetch tenants if authorized
  useEffect(() => {
    if (isSuperAuthorized) {
      async function fetchTenants() {
        try {
          setIsLoadingTenants(true);
          const res = await fetch('/api/admin/tenants');
          const data = await res.json();
          if (data.success) {
            setTenants(data.tenants);
            if (data.tenants.length > 0) {
              setSelectedTenantSlug(data.tenants[0].slug);
            }
          }
        } catch (err) {
          console.error('Error fetching tenants:', err);
        } finally {
          setIsLoadingTenants(false);
        }
      }
      fetchTenants();
    }
  }, [isSuperAuthorized]);

  // Sync inputs when selected tenant changes
  useEffect(() => {
    if (currentTenant) {
      setAdminUsername(currentTenant.adminUsername || '');
      setAdminPassword(currentTenant.adminPassword || '');
      setHasTwoPrinters(currentTenant.hasTwoPrinters || false);
      setBarPrinterIp(currentTenant.barPrinterIp || '192.168.1.100');
      setBarPrinterPort(currentTenant.barPrinterPort?.toString() || '9100');
      setKitchenPrinterIp(currentTenant.kitchenPrinterIp || '192.168.1.101');
      setKitchenPrinterPort(currentTenant.kitchenPrinterPort?.toString() || '9100');
      setCredMessage(null);
    }
  }, [selectedTenantSlug, tenants]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameInput === 'zVaito' && passwordInput === 'Manuel1214$') {
      sessionStorage.setItem('global_admin_auth', 'true');
      setIsSuperAuthorized(true);
      setLoginError('');
    } else {
      setLoginError('Usuario o contraseña incorrectos.');
    }
  };

  const handleUpdateCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;
    setIsUpdatingCredentials(true);
    setCredMessage(null);
    try {
      const res = await fetch('/api/admin/tenants', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentTenant.id,
          adminUsername,
          adminPassword,
          hasTwoPrinters,
          barPrinterIp,
          barPrinterPort: parseInt(barPrinterPort) || 9100,
          kitchenPrinterIp,
          kitchenPrinterPort: parseInt(kitchenPrinterPort) || 9100,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCredMessage({ type: 'success', text: 'Configuración y credenciales del bar guardadas con éxito.' });
        setTenants(prev =>
          prev.map(t =>
            t.id === currentTenant.id
              ? {
                  ...t,
                  adminUsername,
                  adminPassword,
                  hasTwoPrinters,
                  barPrinterIp,
                  barPrinterPort: parseInt(barPrinterPort) || 9100,
                  kitchenPrinterIp,
                  kitchenPrinterPort: parseInt(kitchenPrinterPort) || 9100,
                }
              : t
          )
        );
      } else {
        setCredMessage({ type: 'error', text: data.error || 'Error al guardar la configuración.' });
      }
    } catch (err) {
      setCredMessage({ type: 'error', text: 'Error de red.' });
    } finally {
      setIsUpdatingCredentials(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('global_admin_auth');
    setIsSuperAuthorized(false);
  };

  if (isSuperAuthorized === null) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 items-center justify-center font-sans">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!isSuperAuthorized) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 font-sans items-center justify-center p-6">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8 flex flex-col items-center gap-3">
            <img src="/logo.svg" alt="Comandeo Logo" className="w-16 h-16 object-contain" />
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight mb-1">Comandeo</h1>
              <p className="text-indigo-400 font-bold uppercase text-xs tracking-wider">Super Administración Global</p>
            </div>
          </div>

          {loginError && (
            <div className="p-4 bg-rose-500/10 text-rose-450 border border-rose-500/20 rounded-xl text-sm font-semibold text-center mb-6">
              {loginError}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div>
              <label htmlFor="super-username" className="text-slate-400 text-xs font-bold block mb-1">Usuario</label>
              <input
                id="super-username"
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder=""
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>
            <div>
              <label htmlFor="super-password" className="text-slate-400 text-xs font-bold block mb-1">Contraseña</label>
              <input
                id="super-password"
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg shadow-indigo-500/10 active:scale-98 uppercase tracking-wider"
            >
              Acceder al Panel General
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans">
      {/* Super Admin Control Bar */}
      <div className="bg-indigo-950 border-b border-indigo-900 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Comandeo Logo" className="w-8 h-8 object-contain" />
          <span className="text-lg font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent uppercase tracking-wider">Super Administrador</span>
        </div>

        {/* Tenant Selector Dropdown */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs text-indigo-300 font-bold uppercase whitespace-nowrap">Gestionar Bar:</span>
          {isLoadingTenants ? (
            <span className="text-xs text-indigo-400 animate-pulse">Cargando bares...</span>
          ) : (
            <select
              value={selectedTenantSlug}
              onChange={(e) => setSelectedTenantSlug(e.target.value)}
              className="bg-slate-900 text-white rounded-xl border border-indigo-800 px-4 py-2 font-extrabold outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-md cursor-pointer transition-all"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.slug} className="bg-slate-950 font-extrabold">
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-indigo-900/60 hover:bg-indigo-800 text-indigo-200 hover:text-white font-bold rounded-lg text-xs transition-all uppercase tracking-wider"
        >
          Cerrar Sesión
        </button>
      </div>

      {/* Credenciales del Bar Seleccionado */}
      {currentTenant && (
        <div className="bg-slate-900 border-b border-slate-800 p-6 flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/80 pb-4 gap-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">Ajustes Generales de: <span className="text-indigo-400">{currentTenant.name}</span></h3>
              <p className="text-slate-400 text-xs mt-1">Configura credenciales de acceso e impresoras térmicas ESC/POS.</p>
            </div>
            {credMessage && (
              <div className={`px-4 py-2 rounded-lg text-xs font-bold text-center ${
                credMessage.type === 'success' ? 'bg-emerald-500/15 text-emerald-450' : 'bg-rose-500/15 text-rose-450'
              }`}>
                {credMessage.text}
              </div>
            )}
          </div>

          <form onSubmit={handleUpdateCredentials} className="space-y-6">
            {/* Fila 1: Credenciales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="w-full">
                <label className="text-slate-400 text-[10px] font-bold block mb-1 uppercase tracking-wider">Usuario Admin Bar</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none w-full font-bold"
                  required
                />
              </div>
              <div className="w-full">
                <label className="text-slate-400 text-[10px] font-bold block mb-1 uppercase tracking-wider">Contraseña Admin Bar</label>
                <input
                  type="text"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none w-full font-bold"
                  required
                />
              </div>
              <div className="w-full">
                <label className="text-slate-400 text-[10px] font-bold block mb-1 uppercase tracking-wider">Modo Impresoras</label>
                <select
                  value={hasTwoPrinters ? 'true' : 'false'}
                  onChange={(e) => setHasTwoPrinters(e.target.value === 'true')}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-indigo-500 outline-none w-full font-bold cursor-pointer"
                >
                  <option value="false">1 Impresora (Solo Barra)</option>
                  <option value="true">2 Impresoras (Barra y Cocina)</option>
                </select>
              </div>
            </div>

            {/* Fila 2: Red Impresoras */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-800/40">
              <div className="p-4 bg-slate-950/40 border border-slate-850 rounded-xl space-y-3">
                <span className="text-blue-400 text-xs font-black uppercase tracking-wider block">🖨️ Impresora Barra (Principal y Tickets)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-450 text-[9px] font-bold block mb-1 uppercase">Dirección IP</label>
                    <input
                      type="text"
                      value={barPrinterIp}
                      onChange={(e) => setBarPrinterIp(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none w-full font-bold"
                      placeholder="192.168.1.100"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-slate-450 text-[9px] font-bold block mb-1 uppercase">Puerto Raw</label>
                    <input
                      type="text"
                      value={barPrinterPort}
                      onChange={(e) => setBarPrinterPort(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none w-full font-bold"
                      placeholder="9100"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={`p-4 border rounded-xl space-y-3 transition-opacity ${
                hasTwoPrinters
                  ? 'bg-slate-950/40 border-slate-850 opacity-100'
                  : 'bg-slate-950/10 border-slate-900/60 opacity-40 pointer-events-none'
              }`}>
                <span className="text-indigo-400 text-xs font-black uppercase tracking-wider block">🍳 Impresora Cocina (Solo Comida)</span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-450 text-[9px] font-bold block mb-1 uppercase">Dirección IP</label>
                    <input
                      type="text"
                      value={kitchenPrinterIp}
                      onChange={(e) => setKitchenPrinterIp(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none w-full font-bold"
                      placeholder="192.168.1.101"
                      required={hasTwoPrinters}
                    />
                  </div>
                  <div>
                    <label className="text-slate-450 text-[9px] font-bold block mb-1 uppercase">Puerto Raw</label>
                    <input
                      type="text"
                      value={kitchenPrinterPort}
                      onChange={(e) => setKitchenPrinterPort(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none w-full font-bold"
                      placeholder="9100"
                      required={hasTwoPrinters}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fila 3: Acciones y Guía */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-850 gap-4">
              <div className="text-[11px] text-slate-400 text-left">
                💡 <strong>Guía rápida de conexión:</strong> Conecta la impresora al mismo router local mediante cable de red RJ45. Asigna una IP fija estática en el rango de tu red (ej. 192.168.1.100) utilizando el software de configuración del fabricante y conéctalo al puerto RAW (generalmente 9100).
              </div>
              <button
                type="submit"
                disabled={isUpdatingCredentials}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 disabled:text-slate-500 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider transition-all w-full sm:w-auto cursor-pointer flex-shrink-0"
              >
                {isUpdatingCredentials ? 'Guardando...' : '💾 Guardar Configuración'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Embedded Tenant Dashboard */}
      {selectedTenantSlug ? (
        <div className="animate-fadeIn">
          <TenantAdminDashboardClient tenantSlug={selectedTenantSlug} bypassAuth={true} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-12 text-slate-500">
          No hay bares registrados en la plataforma.
        </div>
      )}
    </div>
  );
}
