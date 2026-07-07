'use client';

import React, { useState, useEffect } from 'react';
import TenantAdminDashboardClient from '@/app/tenant/[tenantSlug]/admin/TenantAdminDashboardClient';

interface Tenant {
  id: string;
  slug: string;
  name: string;
}

export default function GlobalAdminPage() {
  const [isSuperAuthorized, setIsSuperAuthorized] = useState<boolean | null>(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [selectedTenantSlug, setSelectedTenantSlug] = useState('');
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

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
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Comandeo</h1>
            <p className="text-indigo-400 font-bold uppercase text-xs tracking-wider">Super Administración Global</p>
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
              Acceder al Core
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
          <span className="text-lg font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent uppercase tracking-wider">Super Admin Core</span>
          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-black rounded uppercase tracking-wider">Modo Dios</span>
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
          Cerrar Sesión Core
        </button>
      </div>

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
