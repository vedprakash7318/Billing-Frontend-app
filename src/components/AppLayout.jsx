import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Layers,
  Store,
  Receipt,
  ChevronLeft,
  Plus,
  X,
  Users,
  Printer,
  History,
  Sparkles,
  HelpCircle,
  CreditCard,
  Tag,
  ShoppingBag,
} from 'lucide-react';

export default function AppLayout({
  children,
  title,
  subtitle,
  backTo,
  actionButton,
  hideBottomNav = false,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem('client_admin_user') || '{}');
  const storeName = user?.tenant?.businessName || user?.name || 'My Store';

  // Read current cart count from localStorage
  const [cartCount, setCartCount] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);

  const updateCartCount = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('pos_cart') || '[]');
      const count = stored.reduce((sum, item) => sum + (item.quantity || 1), 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  useEffect(() => {
    updateCartCount();
    window.addEventListener('pos_cart_updated', updateCartCount);
    window.addEventListener('storage', updateCartCount);
    return () => {
      window.removeEventListener('pos_cart_updated', updateCartCount);
      window.removeEventListener('storage', updateCartCount);
    };
  }, [location.pathname]);

  const shortcuts = [
    {
      label: 'Create Bill (POS)',
      path: '/billing',
      icon: Receipt,
      desc: 'Quick sales invoice & print',
      color: 'bg-emerald-500 text-white',
    },
    {
      label: 'Add Product',
      path: '/products/new',
      icon: Package,
      desc: 'Add item with price & MRP',
      color: 'bg-teal-500 text-white',
    },
    {
      label: 'Add Category',
      path: '/categories/new',
      icon: Tag,
      desc: 'Group items into catalog',
      color: 'bg-blue-500 text-white',
    },
    {
      label: 'Add Employee',
      path: '/employees/new',
      icon: Users,
      desc: 'Cashier & staff login account',
      color: 'bg-indigo-500 text-white',
    },
    {
      label: 'Subscription Plans',
      path: '/subscription',
      icon: CreditCard,
      desc: 'View & activate license plans',
      color: 'bg-purple-500 text-white',
    },
    {
      label: 'Thermal Receipt Settings',
      path: '/bill-settings',
      icon: Printer,
      desc: 'Header, footer & GST details',
      color: 'bg-slate-800 text-white',
    },
    {
      label: 'Past Bills History',
      path: '/invoices',
      icon: History,
      desc: 'Sales reports & reprints',
      color: 'bg-amber-600 text-white',
    },
    {
      label: 'Help & Support',
      path: '/help',
      icon: HelpCircle,
      desc: 'Live WhatsApp & FAQs',
      color: 'bg-rose-500 text-white',
    },
  ];

  return (
    <div className="h-screen w-full bg-slate-950 flex justify-center selection:bg-emerald-500 selection:text-white overflow-hidden">
      {/* Mobile App Container (Constrained & Scrollable) */}
      <div className="w-full max-w-md h-full bg-slate-50 flex flex-col relative shadow-[0_0_50px_rgba(0,0,0,0.5)] border-x border-slate-800/40 overflow-hidden">
        
        {/* Top App Header (Fixed at top) */}
        <header className="shrink-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            {backTo ? (
              <button
                type="button"
                onClick={() => (backTo === -1 ? navigate(-1) : navigate(backTo))}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition-all shrink-0"
                aria-label="Back"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
                <Store className="w-5 h-5" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm text-slate-900 truncate leading-tight flex items-center gap-1.5">
                <span>{title || storeName}</span>
              </h1>
              <p className="text-[11px] font-medium text-slate-500 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                <span>{subtitle || 'Billing Client Admin'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {actionButton ? (
              actionButton
            ) : (
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-2xs">
                Live POS
              </span>
            )}
          </div>
        </header>

        {/* Scrollable App Body (Full native momentum scrolling without scrollbar) */}
        <main
          className={`flex-1 overflow-y-auto overscroll-contain p-3.5 sm:p-4 no-scrollbar ${
            hideBottomNav ? 'pb-8' : 'pb-24'
          }`}
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {children}
        </main>

        {/* Fixed App-like Bottom Navigation Bar with Center '+' Quick Action Button */}
        {!hideBottomNav && (
          <nav className="shrink-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around shadow-[0_-4px_25px_rgba(0,0,0,0.06)] relative">
            
            {/* 1. Home */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-150 select-none active:scale-90 ${
                  isActive ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`
              }
            >
              <div className="w-8 h-7 flex items-center justify-center">
                <LayoutDashboard className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight font-semibold">Home</span>
            </NavLink>

            {/* 2. Bill POS */}
            <NavLink
              to="/billing"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-150 select-none active:scale-90 ${
                  isActive ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`
              }
            >
              <div className="relative w-8 h-7 flex items-center justify-center">
                <Receipt className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 bg-emerald-600 text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-xs border-2 border-white">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight font-semibold">Bill POS</span>
            </NavLink>

            {/* 3. CENTER '+' QUICK ACTIONS BUTTON */}
            <button
              type="button"
              onClick={() => setShowShortcuts(true)}
              className="w-11 h-11 -mt-5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/35 active:scale-90 hover:scale-105 transition-all border-3 border-white shrink-0"
              title="Quick Action Shortcuts"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>

            {/* 4. Products */}
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-150 select-none active:scale-90 ${
                  isActive ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`
              }
            >
              <div className="w-8 h-7 flex items-center justify-center">
                <Package className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight font-semibold">Products</span>
            </NavLink>

            {/* 5. Store Profile */}
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all duration-150 select-none active:scale-90 ${
                  isActive ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`
              }
            >
              <div className="w-8 h-7 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight font-semibold">Store</span>
            </NavLink>
          </nav>
        )}

        {/* QUICK SHORTCUTS MODAL / BOTTOM SHEET */}
        {showShortcuts && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200 space-y-4 max-h-[85vh] flex flex-col">
              
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">Quick Shortcuts</h3>
                    <p className="text-[10px] text-slate-400 font-medium">Fast navigation & actions</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowShortcuts(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-500 flex items-center justify-center transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Grid of Shortcuts */}
              <div className="grid grid-cols-2 gap-2.5 overflow-y-auto no-scrollbar py-1">
                {shortcuts.map((sc, i) => {
                  const Icon = sc.icon;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => {
                        setShowShortcuts(false);
                        navigate(sc.path);
                      }}
                      className="p-3 bg-slate-50 hover:bg-emerald-50/60 active:scale-95 border border-slate-200/80 hover:border-emerald-300 rounded-2xl flex items-start gap-2.5 text-left transition-all"
                    >
                      <div className={`w-8 h-8 rounded-xl ${sc.color} flex items-center justify-center shrink-0 shadow-2xs`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-900 leading-tight truncate">
                          {sc.label}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate mt-0.5">
                          {sc.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Close Button */}
              <div className="pt-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowShortcuts(false)}
                  className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all"
                >
                  Close Shortcuts
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
