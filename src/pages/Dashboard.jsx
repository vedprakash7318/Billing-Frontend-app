import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Package,
  Layers,
  Users,
  Plus,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
  TrendingUp,
  Tag,
  Receipt,
  Printer,
} from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const store = stats?.store;
  const sub = stats?.subscription;
  const metrics = stats?.metrics;

  return (
    <AppLayout
      title={store?.name || 'My Store Dashboard'}
      subtitle={store?.slug ? `store: ${store.slug}` : 'Merchant Admin'}
    >
      <div className="space-y-4">
        {/* Subscription Validity Banner */}
        <Link
          to="/subscription"
          className="block bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 rounded-3xl p-5 text-white shadow-xl shadow-emerald-600/20 relative overflow-hidden active:scale-[0.99] transition-transform"
        >
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white backdrop-blur-sm border border-white/20">
                {sub?.planName || 'Active Subscription'}
              </span>
              {typeof sub?.daysRemaining === 'number' && (
                <span className="text-xs font-bold text-emerald-100 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {sub.daysRemaining > 0 ? `${sub.daysRemaining} days left` : 'Expired'}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight">{store?.name || 'Welcome!'}</h2>
                <p className="text-xs text-emerald-100/90 mt-0.5">
                  Tap to view subscription plans & renewals
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-emerald-200 shrink-0" />
            </div>
          </div>
        </Link>

        {/* Quick Metrics Grid (2 cols) */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/products"
            className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {loading ? '...' : metrics?.totalProducts ?? 0}
              </span>
              <p className="text-xs font-bold text-slate-500 mt-0.5">Total Products</p>
            </div>
          </Link>

          <Link
            to="/categories"
            className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div className="mt-3">
              <span className="text-2xl font-black text-slate-900">
                {loading ? '...' : metrics?.totalCategories ?? 0}
              </span>
              <p className="text-xs font-bold text-slate-500 mt-0.5">Categories</p>
            </div>
          </Link>
        </div>

        {/* Big POS Billing Card */}
        <Link
          to="/billing"
          className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl flex items-center justify-between shadow-xl shadow-slate-950/20 hover:scale-[1.01] transition-transform"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-black text-white">Create New Bill</h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  POS
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">Quick customer invoice & thermal receipt</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-emerald-400 shrink-0" />
        </Link>

        {/* Quick App Action Shortcuts */}
        <div className="grid grid-cols-2 gap-3">
          <Link
            to="/products/new"
            className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center gap-2.5 shadow-md shadow-slate-900/10 hover:bg-slate-800 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Add Product</p>
              <p className="text-[10px] text-slate-400 truncate">Catalog item</p>
            </div>
          </Link>

          <Link
            to="/categories/new"
            className="p-3.5 bg-white border border-slate-200 text-slate-800 rounded-2xl flex items-center gap-2.5 shadow-xs hover:bg-slate-50 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">Add Category</p>
              <p className="text-[10px] text-slate-500 truncate">Group items</p>
            </div>
          </Link>
        </div>

        {/* Employees Management Quick Card */}
        <Link
          to="/employees"
          className="p-3.5 bg-white border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-xs hover:bg-slate-50 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">
                Store Employees ({loading ? '...' : metrics?.totalEmployees ?? 0})
              </p>
              <p className="text-[11px] text-slate-500">Add or manage cashiers & staff</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </Link>

        {/* Recent Products Card */}
        <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-500">
              Recent Products
            </h3>
            <Link
              to="/products"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading products...</div>
          ) : !stats?.recentProducts || stats.recentProducts.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Package className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No products added yet.</p>
              <Link
                to="/products/new"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Your First Product</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {stats.recentProducts.map((p) => (
                <Link
                  key={p.id}
                  to={`/products/${p.id}/edit`}
                  className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50 rounded-xl px-2 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-xs text-slate-900 truncate">{p.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                          {p.uniqueCode}
                        </span>
                        <span className="text-[10px] text-slate-400">•</span>
                        <span className="text-[10px] text-slate-500 truncate">{p.categoryName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-black text-xs text-slate-900">₹{p.price}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
