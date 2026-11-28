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
  History,
  Sparkles,
  Tag,
  AlertTriangle,
  User,
} from 'lucide-react';
import api from '../services/api';

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
  const currentSub = user?.tenant?.currentSubscription;
  const planName = currentSub?.plan?.name || 'Active Plan';

  // Live subscription data
  const [subData, setSubData] = useState(() => {
    return user?.tenant?.currentSubscription || null;
  });

  useEffect(() => {
    api
      .get('/admin/subscription')
      .then((res) => {
        if (res.data?.data?.subscription) {
          setSubData(res.data.data.subscription);
        }
      })
      .catch(() => {});
  }, [location.pathname]);

  // Subscription status badge calculation
  const getSubBadge = () => {
    const sub = subData || user?.tenant?.currentSubscription;
    const now = new Date();

    if (!sub) {
      return {
        text: 'Active',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100',
        dot: 'bg-emerald-500',
      };
    }

    const endDate = sub.endDate ? new Date(sub.endDate) : null;
    let daysLeft = sub.daysRemaining;

    if (daysLeft === undefined || daysLeft === null) {
      if (endDate) {
        daysLeft = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      }
    }

    const isExpired =
      sub.isExpired ||
      sub.status === 'EXPIRED' ||
      user?.tenant?.status === 'EXPIRED' ||
      (endDate && endDate < now) ||
      (typeof daysLeft === 'number' && daysLeft <= 0);

    if (isExpired) {
      return {
        text: 'Expire',
        className: 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100',
        dot: 'bg-rose-500',
      };
    }

    if (typeof daysLeft === 'number' && daysLeft <= 10) {
      return {
        text: `${daysLeft}d left`,
        className: 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100',
        dot: 'bg-amber-500',
      };
    }

    return {
      text: 'Active',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100',
      dot: 'bg-emerald-500',
    };
  };

  const subBadge = getSubBadge();

  // Check if store subscription is expired
  const now = new Date();
  const isSubscriptionExpired =
    !currentSub ||
    currentSub?.status === 'EXPIRED' ||
    user?.tenant?.status === 'EXPIRED' ||
    (currentSub?.endDate && new Date(currentSub.endDate) < now);

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
      label: 'New Bill',
      path: '/billing',
      icon: Receipt,
      desc: 'Quick sales invoice & POS',
      color: 'bg-emerald-500 text-white',
    },
    {
      label: 'Past Bills',
      path: '/invoices',
      icon: History,
      desc: 'Sales reports & reprint',
      color: 'bg-amber-500 text-white',
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
  ];

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-slate-100/80 flex justify-center selection:bg-emerald-500 selection:text-white">
      {/* Responsive App Frame: Full width on phone, expands gracefully up to max-w-5xl on desktop */}
      <div className="w-full max-w-5xl min-h-screen min-h-[100dvh] bg-slate-50 flex flex-col relative sm:shadow-lg sm:border-x sm:border-slate-200/90">

        {/* Top Header */}
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3.5 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between shadow-2xs">
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
              <Link
                to="/"
                className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/25 shrink-0"
              >
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
              <Link
                to="/subscription"
                className={`px-2.5 py-1 sm:px-3 sm:py-1 rounded-xl text-xs font-black border flex items-center gap-1.5 shadow-2xs active:scale-95 transition-all ${subBadge.className}`}
                title="Store Subscription Status"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${subBadge.dot}`} />
                <span>{subBadge.text}</span>
              </Link>
            )}
          </div>
        </header>

        {/* Expired Subscription Alert Banner */}
        {isSubscriptionExpired && (
          <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-rose-700 text-white px-3.5 py-2 shadow-md z-30">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-200" />
                <span className="font-bold text-[11px] truncate">
                  Subscription Expired — Billing paused
                </span>
              </div>
              <Link
                to="/subscription"
                className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-700 font-black rounded-lg text-[10px] whitespace-nowrap shadow-sm shrink-0"
              >
                Renew Plan
              </Link>
            </div>
          </div>
        )}

        {/* Main Content Container */}
        <main
          className={`flex-1 w-full px-3.5 sm:px-6 md:px-8 py-4 sm:py-6 ${
            hideBottomNav ? 'pb-8 sm:pb-12' : 'pb-28 sm:pb-32'
          }`}
        >
          {children}
        </main>

        {/* Fixed Mobile Bottom Navigation Bar (Centered within responsive container) */}
        {!hideBottomNav && (
          <nav
            className="fixed bottom-0 left-0 right-0 max-w-md sm:max-w-xl md:max-w-2xl mx-auto z-40 bg-white/95 backdrop-blur-xl border border-slate-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.08)] sm:rounded-t-3xl"
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
          >
            <div className="px-2 py-1 flex items-center justify-around relative">

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

              {/* 5. Profile */}
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all duration-150 select-none active:scale-90 ${
                    isActive ? 'text-emerald-600 font-bold' : 'text-slate-400 hover:text-slate-600 font-medium'
                  }`
                }
              >
                <div className="w-8 h-7 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <span className="text-[10px] tracking-tight font-semibold">Profile</span>
              </NavLink>

            </div>
          </nav>
        )}

        {/* Quick Shortcuts Bottom Sheet */}
        {showShortcuts && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-end justify-center p-0">
            <div className="w-full max-w-md bg-white rounded-t-3xl p-5 shadow-2xl border-t border-slate-200 animate-in slide-in-from-bottom duration-200 space-y-4 max-h-[85vh] flex flex-col">

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
