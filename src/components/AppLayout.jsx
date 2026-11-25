import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate, Link } from 'react-router-dom';
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
  LogOut,
  Sliders,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { toastSuccess } from '../utils/alerts';

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
  const roleName = user?.role === 'STAFF' ? (user?.designation || 'Cashier') : 'Store Admin';
  const planName = user?.tenant?.currentSubscription?.plan?.name || 'Active Plan';

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

  const handleLogout = () => {
    localStorage.removeItem('client_admin_token');
    localStorage.removeItem('client_admin_user');
    toastSuccess('Logged out successfully');
    navigate('/login');
  };

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

  const desktopNavItems = [
    { label: 'Dashboard', path: '/', icon: LayoutDashboard },
    { label: 'Bill POS', path: '/billing', icon: Receipt, badge: cartCount },
    { label: 'Products', path: '/products', icon: Package },
    { label: 'Categories', path: '/categories', icon: Layers },
    { label: 'Invoices', path: '/invoices', icon: History },
    { label: 'Staff', path: '/employees', icon: Users },
    { label: 'Plans', path: '/subscription', icon: CreditCard },
    { label: 'Settings', path: '/bill-settings', icon: Sliders },
    { label: 'Help', path: '/help', icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* ========================================================================= */}
      {/* 1. DESKTOP / TABLET TOP NAVIGATION BAR (Visible on md: and larger screens) */}
      {/* ========================================================================= */}
      <header className="hidden md:block sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Left: Branding & Store Name */}
            <div className="flex items-center gap-3 shrink-0">
              <Link to="/" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {storeName}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                      Live POS
                    </span>
                  </div>
                  <p className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{planName}</span>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-400">{roleName}</span>
                  </p>
                </div>
              </Link>
            </div>

            {/* Center: Desktop Navigation Links */}
            <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {desktopNavItems.map((item) => {
                const Icon = item.icon;
                const isActive =
                  item.path === '/'
                    ? location.pathname === '/'
                    : location.pathname.startsWith(item.path);

                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all relative whitespace-nowrap ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 shadow-2xs font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                    {item.badge > 0 && (
                      <span className="ml-1 min-w-[18px] h-[18px] px-1 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Right: Quick Action Button & User Actions */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => setShowShortcuts(true)}
                className="px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-all"
                title="Quick Shortcuts"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden lg:inline">Quick Action</span>
              </button>

              <Link
                to="/billing"
                className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                title="Open POS Terminal"
              >
                <Receipt className="w-3.5 h-3.5 text-emerald-400" />
                <span>New Bill</span>
                {cartCount > 0 && (
                  <span className="bg-emerald-500 text-slate-950 font-black text-[10px] px-1.5 py-0.2 rounded-full">
                    {cartCount}
                  </span>
                )}
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 active:scale-95 text-slate-500 flex items-center justify-center transition-all"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MOBILE TOP APP HEADER (Visible on small screens < md)                  */}
      {/* ========================================================================= */}
      <header className="md:hidden sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 py-2.5 flex items-center justify-between shadow-2xs">
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
            <Link to="/" className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0">
              <Store className="w-5 h-5" />
            </Link>
          )}
          <div className="min-w-0">
            <h1 className="font-extrabold text-sm text-slate-900 truncate leading-tight">
              {title || storeName}
            </h1>
            <p className="text-[11px] font-medium text-slate-500 truncate flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>{subtitle || `${planName} • ${roleName}`}</span>
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

      {/* ========================================================================= */}
      {/* 3. MAIN CONTENT CONTAINER (Responsive width & proper safe area padding)   */}
      {/* ========================================================================= */}
      <main
        className={`flex-1 w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 ${
          hideBottomNav ? 'pb-8' : 'pb-28 md:pb-12'
        }`}
      >
        {children}
      </main>

      {/* ========================================================================= */}
      {/* 4. MOBILE BOTTOM NAVIGATION BAR (Fixed at bottom on phones, 100% visible) */}
      {/* ========================================================================= */}
      {!hideBottomNav && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.08)]"
          style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="max-w-lg mx-auto px-2 py-1 flex items-center justify-around relative">

            {/* 1. Home */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 select-none active:scale-90 ${
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
                `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 select-none active:scale-90 ${
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
              className="w-12 h-12 -mt-5 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/40 active:scale-90 hover:scale-105 transition-all border-[3px] border-white shrink-0"
              title="Quick Action Shortcuts"
              aria-label="Quick Action Shortcuts"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>

            {/* 4. Products */}
            <NavLink
              to="/products"
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 select-none active:scale-90 ${
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
                `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 select-none active:scale-90 ${
                  isActive ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
                }`
              }
            >
              <div className="w-8 h-7 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <span className="text-[10px] tracking-tight font-semibold">Store</span>
            </NavLink>

          </div>
        </nav>
      )}

      {/* ========================================================================= */}
      {/* 5. QUICK SHORTCUTS MODAL / BOTTOM SHEET (Responsive mobile & desktop)    */}
      {/* ========================================================================= */}
      {showShortcuts && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-200 animate-in slide-in-from-bottom duration-200 space-y-4 max-h-[85vh] flex flex-col">

            {/* Modal Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
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
  );
}
