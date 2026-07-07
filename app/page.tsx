import React from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Comandeo | El TPV Móvil Definitivo para tu Restaurante',
  description: 'Digitaliza las comandas de tu bar, envía tickets directamente a cocina en tiempo real e incrementa la velocidad de tu servicio con nuestra PDA en la nube.',
};

export default function LandingPage() {
  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen font-sans overflow-x-hidden selection:bg-blue-600 selection:text-white">
      <header className="max-w-6xl mx-auto px-6 py-6 flex justify-between items-center border-b border-slate-900">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-black bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">Comandeo</span>
          <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-[10px] font-black rounded uppercase tracking-wider">Cloud</span>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-16 md:py-24 flex flex-col md:flex-row items-center gap-12">
        <div className="flex-1 flex flex-col gap-6 text-center md:text-left">
          <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight text-white">
            El TPV en el bolsillo de tus <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">camareros</span>.
          </h1>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed font-medium">
            Agiliza tu servicio de mesas, elimina errores al tomar nota y encola comandas a la impresora de cocina de forma instantánea. Diseñado para bares, cafeterías y restaurantes de ritmo rápido.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mt-4 justify-center md:justify-start">
            <a 
              href="mailto:ventas@comandeo.com?subject=Contratar%20Comandeo"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-slate-950 font-black rounded-xl text-lg transition-all text-center shadow-lg shadow-blue-500/20 active:scale-98"
            >
              Comenzar prueba gratis
            </a>
            <a 
              href="#features"
              className="px-8 py-4 bg-slate-900 hover:bg-slate-850 text-slate-350 hover:text-white font-bold rounded-xl text-lg transition-all text-center border border-slate-800"
            >
              Saber más
            </a>
          </div>
        </div>

        {/* Hero Visual Mockup */}
        <div className="flex-1 w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-3xl blur opacity-20 group-hover:opacity-30 transition duration-1000"></div>
          <div className="relative bg-slate-950 rounded-2xl p-4 flex flex-col gap-4 border border-slate-850">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <span className="font-extrabold text-white text-sm">Bar Paco</span>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold rounded uppercase">Mesa 4 • Ocupada</span>
            </div>
            
            {/* Categorías Visual folders */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-2">
                <span className="text-lg">🍳</span>
                <span className="font-bold text-slate-200">Benedictinos</span>
              </div>
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center gap-2">
                <span className="text-lg">🍔</span>
                <span className="font-bold text-slate-200">Hamburguesas</span>
              </div>
            </div>

            {/* Ticket Preview */}
            <div className="bg-slate-900/60 rounded-xl p-3 border border-slate-850 text-xs flex flex-col gap-2">
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>2x Benedictinos Clásicos</span>
                <span>23.80€</span>
              </div>
              <div className="flex justify-between text-slate-400 font-semibold">
                <span>1x Steffy’s Burger</span>
                <span>13.00€</span>
              </div>
              <div className="flex justify-between border-t border-slate-850 pt-2 font-black text-white">
                <span>Total</span>
                <span className="text-blue-400">36.80€</span>
              </div>
            </div>
            
            <button className="w-full py-3 bg-emerald-500 text-slate-950 font-black rounded-lg text-xs uppercase tracking-wider text-center cursor-default">
              Imprimir Ticket en Barra
            </button>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="border-t border-slate-900 bg-slate-950/50 py-20">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="text-xs uppercase font-extrabold tracking-widest text-blue-500 text-center mb-2">Ventajas</h2>
          <p className="text-3xl md:text-4xl font-black text-white text-center mb-12">Diseñado para simplificar tu día a día</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/50 border border-slate-850 rounded-2xl p-6 hover:border-slate-800 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 text-2xl mb-4">
                📱
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Interfaz Táctil Rápida</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Navega cómodamente por carpetas de categorías, añade productos al carrito y selecciona mesas en un desplegable instantáneo.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-850 rounded-2xl p-6 hover:border-slate-800 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 text-2xl mb-4">
                🖨️
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Agente de Impresión Físico</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Un agente local recibe las comandas en cola e imprime tickets directamente en tu impresora térmica ESC/POS por puerto 9100.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-850 rounded-2xl p-6 hover:border-slate-800 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 text-2xl mb-4">
                📈
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Multi-Inquilino (Multi-tenant)</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Cada bar dispone de su subdominio independiente para la PDA y de su panel de control privado para configurar productos y precios.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-12 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} Comandeo Cloud TPV. Todos los derechos reservados.</p>
      </footer>
    </div>
  );
}
