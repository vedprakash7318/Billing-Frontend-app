import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Package,
  Layers,
  Users,
  Plus,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Receipt,
  Smartphone,
  MessageSquare,
  AlertTriangle,
  Clock,
  ChevronRight,
  Store,
  DollarSign,
  Calendar,
  BarChart3,
  CheckCircle2,
  Percent,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
} from 'lucide-react';
import api from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week'); // 'week' | 'month' | 'year'
  const [metricType, setMetricType] = useState('sales'); // 'sales' | 'count'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      if (res.data?.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const store = stats?.store;
  const sub = stats?.subscription;
  const salesComp = stats?.salesComparison;
  const charts = stats?.charts;
  const paymentBreakdown = stats?.paymentBreakdown || [];
  const quotas = stats?.quotas;
  const metrics = stats?.metrics;
  const recentInvoices = stats?.recentInvoices || [];
  const recentProducts = stats?.recentProducts || [];

  // Active chart dataset based on timeframe tab
  const activeChartData = useMemo(() => {
    if (!charts) return [];
    if (timeframe === 'month') return charts.month || [];
    if (timeframe === 'year') return charts.year || [];
    return charts.week || [];
  }, [charts, timeframe]);

  // Max value calculation for responsive SVG chart scaling
  const maxChartValue = useMemo(() => {
    if (!activeChartData.length) return 100;
    const values = activeChartData.map((d) => (metricType === 'sales' ? d.sales : d.count));
    const max = Math.max(...values, 0);
    return max > 0 ? max * 1.15 : 100; // 15% headroom
  }, [activeChartData, metricType]);

  // Selected timeframe summary
  const timeframeSummary = useMemo(() => {
    if (!activeChartData.length) return { totalSales: 0, totalCount: 0, peakLabel: '-', peakValue: 0 };
    let totalSales = 0;
    let totalCount = 0;
    let peakLabel = '-';
    let peakValue = -1;

    activeChartData.forEach((d) => {
      totalSales += d.sales || 0;
      totalCount += d.count || 0;
      const val = metricType === 'sales' ? d.sales : d.count;
      if (val > peakValue) {
        peakValue = val;
        peakLabel = d.label;
      }
    });

    return { totalSales, totalCount, peakLabel, peakValue };
  }, [activeChartData, metricType]);

  return (
    <AppLayout
      title={store?.name || 'Store Dashboard'}
      subtitle={store?.slug ? `@${store.slug} • Live POS` : 'Merchant Console'}
    >
      <div className="space-y-4 sm:space-y-5 pb-6">

        {/* 1. SUBSCRIPTION EXPIRY ALERT BADGE (Show ONLY when remaining days <= 10) */}
        {sub?.isExpiringSoon && (
          <div className="relative overflow-hidden bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 border-2 border-amber-500/40 rounded-3xl p-4 sm:p-5 shadow-lg shadow-amber-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 animate-pulse">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-900">
                      Subscription Expiring Soon
                    </span>
                    <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                      Expire in {sub.daysRemaining} {sub.daysRemaining === 1 ? 'day' : 'days'}
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 font-medium mt-1">
                    Aapka <strong className="font-bold">"{sub.planName}"</strong> plan agle {sub.daysRemaining} dino me expire ho jayega. POS billing continue rakhne ke liye abhi renew karein.
                  </p>
                </div>
              </div>

              <Link
                to="/subscription"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-black rounded-xl shadow-md shadow-amber-600/20 active:scale-95 transition-all shrink-0 self-start sm:self-auto"
              >
                <span>Renew Plan Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* 1.1. EXPIRED ALERT (If daysRemaining <= 0) */}
        {sub?.isExpired && (
          <div className="relative overflow-hidden bg-gradient-to-r from-rose-500/15 via-red-500/15 to-rose-500/10 border-2 border-rose-500/40 rounded-3xl p-4 sm:p-5 shadow-lg shadow-rose-500/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-600/30 animate-bounce">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black uppercase tracking-wider text-rose-900">
                      Subscription Expired
                    </span>
                    <span className="text-xs font-black font-mono px-2.5 py-0.5 rounded-full bg-rose-600 text-white">
                      Expired
                    </span>
                  </div>
                  <p className="text-xs text-rose-800/90 font-medium mt-1">
                    Aapka plan expire ho chuka hai. Customers ke naye bills print aur send karne ke liye subscription recharge karein.
                  </p>
                </div>
              </div>

              <Link
                to="/subscription"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md shadow-rose-600/20 active:scale-95 transition-all shrink-0 self-start sm:self-auto"
              >
                <span>Reactivate Plan</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* 2. STORE BUSINESS HERO BANNER */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-slate-950/20 relative overflow-hidden border border-slate-700/50">
          <div className="absolute -right-8 -top-8 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-40 h-40 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live POS Ready
                </span>
                <span className="px-2.5 py-1 rounded-full bg-white/10 text-slate-300 border border-white/10 text-[10px] font-black uppercase tracking-wider">
                  {sub?.planName || 'Active Plan'}
                </span>
              </div>

              {/* Expiry pill: shown subtly if not expiring soon */}
              {!sub?.isExpiringSoon && !sub?.isExpired && typeof sub?.daysRemaining === 'number' && (
                <span className="text-[11px] font-mono font-bold text-emerald-300/90 flex items-center gap-1 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                  <Clock className="w-3.5 h-3.5" />
                  {sub.stackedDisplay || `${sub.daysRemaining} days active`}
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <Store className="w-6 h-6 text-emerald-400 shrink-0" />
                  <span>{store?.name || 'Apex Mart Superstore'}</span>
                </h1>
                <p className="text-xs text-slate-300 mt-1 max-w-md">
                  {store?.tagline || 'Best Quality Groceries & Household Needs • Central Billing Console'}
                </p>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
                  {store?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-emerald-400" />
                      {store.phone}
                    </span>
                  )}
                  {store?.gstin ? (
                    <span className="font-mono bg-white/10 px-1.5 py-0.5 rounded text-[10px] text-emerald-300 font-bold">
                      GST: {store.gstin}
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400">Retail Composition</span>
                  )}
                </div>
              </div>

              {/* Big POS Action Button */}
              <Link
                to="/billing"
                className="inline-flex items-center justify-center gap-2.5 px-5 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/25 active:scale-95 transition-all shrink-0"
              >
                <Receipt className="w-5 h-5 text-slate-950" />
                <span>Create New Bill (POS)</span>
                <ArrowRight className="w-4 h-4 text-slate-950" />
              </Link>
            </div>
          </div>
        </div>

        {/* 3. HERO COMPARISON: TODAY VS YESTERDAY SALES */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Sales Comparison: Today vs Yesterday</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Real-time revenue and bill counter analysis</p>
            </div>

            {/* Growth indicator badge */}
            {salesComp && (
              <div
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black ${
                  salesComp.difference >= 0
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}
              >
                {salesComp.difference >= 0 ? (
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                )}
                <span>
                  {salesComp.difference >= 0 ? '+' : ''}₹{Math.abs(salesComp.difference).toLocaleString('en-IN')}{' '}
                  ({salesComp.growthPercent >= 0 ? '+' : ''}{salesComp.growthPercent}% vs Yesterday)
                </span>
              </div>
            )}
          </div>

          {/* Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* TODAY'S SALES CARD */}
            <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/40 to-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Today's Sales
                </span>
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  Live Today
                </span>
              </div>

              <div className="mt-3">
                <div className="text-3xl sm:text-4xl font-black text-slate-950 font-mono tracking-tight">
                  ₹{loading ? '...' : (salesComp?.today?.sales ?? 0).toLocaleString('en-IN')}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                  <span className="font-bold text-slate-900">
                    {loading ? '...' : salesComp?.today?.count ?? 0} Bills Generated
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>
                    Avg Bill: <strong className="font-bold text-slate-800">₹{salesComp?.today?.aov ?? 0}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* YESTERDAY'S SALES CARD */}
            <div className="bg-gradient-to-br from-slate-50 via-slate-50/50 to-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  Yesterday's Sales
                </span>
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  Closed
                </span>
              </div>

              <div className="mt-3">
                <div className="text-3xl sm:text-4xl font-black text-slate-800 font-mono tracking-tight">
                  ₹{loading ? '...' : (salesComp?.yesterday?.sales ?? 0).toLocaleString('en-IN')}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                  <span className="font-bold text-slate-700">
                    {loading ? '...' : salesComp?.yesterday?.count ?? 0} Bills Generated
                  </span>
                  <span className="text-slate-300">•</span>
                  <span>
                    Avg Bill: <strong className="font-bold text-slate-700">₹{salesComp?.yesterday?.aov ?? 0}</strong>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Comparison Progress Bar */}
          {salesComp && (
            <div className="pt-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>Today (₹{salesComp.today.sales.toLocaleString('en-IN')})</span>
                <span>Yesterday (₹{salesComp.yesterday.sales.toLocaleString('en-IN')})</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500"
                  style={{
                    width: `${
                      salesComp.today.sales + salesComp.yesterday.sales > 0
                        ? Math.round(
                            (salesComp.today.sales / (salesComp.today.sales + salesComp.yesterday.sales)) * 100
                          )
                        : 50
                    }%`,
                  }}
                />
                <div
                  className="h-full bg-slate-300 transition-all duration-500"
                  style={{
                    width: `${
                      salesComp.today.sales + salesComp.yesterday.sales > 0
                        ? Math.round(
                            (salesComp.yesterday.sales / (salesComp.today.sales + salesComp.yesterday.sales)) * 100
                          )
                        : 50
                    }%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. MULTI-TIMEFRAME INTERACTIVE SALES GRAPH (WEEK / MONTH / YEAR) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Sales Trend & Growth Graph</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">Switch between week, month, and full year views</p>
            </div>

            {/* Timeframe & Metric Switcher Controls */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Metric Toggle (₹ vs Count) */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
                <button
                  onClick={() => setMetricType('sales')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    metricType === 'sales'
                      ? 'bg-white text-slate-950 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  ₹ Revenue
                </button>
                <button
                  onClick={() => setMetricType('count')}
                  className={`px-2.5 py-1 rounded-lg transition-all ${
                    metricType === 'count'
                      ? 'bg-white text-slate-950 shadow-xs font-black'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  Bills Count
                </button>
              </div>

              {/* Timeframe Toggle (Week | Month | Year) */}
              <div className="bg-slate-900 text-white p-1 rounded-xl flex items-center text-xs font-bold shadow-xs">
                <button
                  onClick={() => setTimeframe('week')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    timeframe === 'week' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setTimeframe('month')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    timeframe === 'month' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Month
                </button>
                <button
                  onClick={() => setTimeframe('year')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    timeframe === 'year' ? 'bg-emerald-500 text-slate-950 font-black' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Year
                </button>
              </div>
            </div>
          </div>

          {/* Timeframe Summary Highlights */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Revenue</span>
              <span className="text-sm font-black text-slate-900 font-mono">
                ₹{timeframeSummary.totalSales.toLocaleString('en-IN')}
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Bills</span>
              <span className="text-sm font-black text-slate-900 font-mono">
                {timeframeSummary.totalCount} Bills
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Peak Performance</span>
              <span className="text-sm font-black text-emerald-700 truncate block">
                {timeframeSummary.peakLabel} ({metricType === 'sales' ? `₹${timeframeSummary.peakValue}` : `${timeframeSummary.peakValue} bills`})
              </span>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Average Ticket</span>
              <span className="text-sm font-black text-slate-900 font-mono">
                ₹{timeframeSummary.totalCount > 0 ? Math.round(timeframeSummary.totalSales / timeframeSummary.totalCount) : 0}
              </span>
            </div>
          </div>

          {/* Responsive SVG Chart */}
          <div className="relative pt-2">
            {hoveredPoint && (
              <div className="absolute top-0 right-0 bg-slate-900 text-white px-3 py-1.5 rounded-xl text-xs font-mono shadow-md z-10 flex items-center gap-2">
                <span className="text-emerald-400 font-bold">{hoveredPoint.label}:</span>
                <span>₹{hoveredPoint.sales.toLocaleString('en-IN')}</span>
                <span className="text-slate-400">({hoveredPoint.count} bills)</span>
              </div>
            )}

            <div className="h-48 sm:h-56 w-full flex items-end gap-1.5 sm:gap-2 pt-6 px-1 border-b border-slate-100">
              {activeChartData.map((d, index) => {
                const value = metricType === 'sales' ? d.sales : d.count;
                const heightPercent = maxChartValue > 0 ? Math.max((value / maxChartValue) * 100, 4) : 4;
                const isHovered = hoveredPoint?.label === d.label;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(d)}
                    onMouseLeave={() => setHoveredPoint(null)}
                    onTouchStart={() => setHoveredPoint(d)}
                  >
                    {/* Tooltip on bar hover */}
                    <div
                      className={`transition-all duration-300 w-full rounded-t-lg ${
                        isHovered
                          ? 'bg-gradient-to-t from-emerald-600 to-teal-400 shadow-md shadow-emerald-500/30'
                          : d.label === 'Today'
                          ? 'bg-gradient-to-t from-emerald-500 to-teal-400'
                          : 'bg-slate-200 group-hover:bg-emerald-300'
                      }`}
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* X-Axis Labels */}
            <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 pt-2 px-1">
              {activeChartData.map((d, index) => {
                // If 30 days, skip some labels for clean display
                if (activeChartData.length > 15 && index % 4 !== 0 && index !== activeChartData.length - 1) {
                  return <span key={index} className="flex-1 text-center" />;
                }
                return (
                  <span
                    key={index}
                    className={`flex-1 text-center truncate ${
                      d.label === 'Today' ? 'text-emerald-700 font-black' : ''
                    }`}
                  >
                    {d.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. PAYMENT MODES & BOOSTER QUOTA ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Payment Method Breakdown Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Payment Mode Share</span>
              <span className="text-[10px] text-slate-400 font-normal">All Transactions</span>
            </h3>

            <div className="space-y-2.5">
              {paymentBreakdown.map((pm) => (
                <div key={pm.mode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                      {pm.mode}
                    </span>
                    <span className="text-slate-900 font-mono">
                      ₹{pm.sales.toLocaleString('en-IN')}{' '}
                      <span className="text-slate-400 text-[10px]">({pm.percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        pm.mode === 'UPI'
                          ? 'bg-emerald-500'
                          : pm.mode === 'Cash'
                          ? 'bg-teal-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${pm.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SMS & WhatsApp Quota Cards */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/subscription#booster-packs"
                className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs hover:border-indigo-300 transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                    Top-up
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    SMS Left
                  </span>
                  <div className="text-xl font-black font-mono text-slate-900">
                    {loading ? '...' : quotas?.smsBalance ?? 0}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {quotas?.smsPlanBalance || 0} plan + {quotas?.smsBoosterBalance || 0} booster
                  </p>
                </div>
              </Link>

              <Link
                to="/subscription#booster-packs"
                className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-colors flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Top-up
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    WhatsApp Left
                  </span>
                  <div className="text-xl font-black font-mono text-slate-900">
                    {loading ? '...' : quotas?.whatsAppBalance ?? 0}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                    {quotas?.whatsAppPlanBalance || 0} plan + {quotas?.whatsAppBoosterBalance || 0} booster
                  </p>
                </div>
              </Link>
            </div>

            {/* Catalog Metrics (Products & Categories) */}
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/products"
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:bg-slate-50 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Products</span>
                    <span className="text-sm font-black text-slate-900">
                      {loading ? '...' : metrics?.totalProducts ?? 0}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>

              <Link
                to="/categories"
                className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs hover:bg-slate-50 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 block">Categories</span>
                    <span className="text-sm font-black text-slate-900">
                      {loading ? '...' : metrics?.totalCategories ?? 0}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </Link>
            </div>
          </div>
        </div>

        {/* 6. QUICK ACTIONS & STORE EMPLOYEES */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/products/new"
            className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center gap-3 shadow-md shadow-slate-900/10 hover:bg-slate-800 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4 font-black" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate">Add Product</p>
              <p className="text-[10px] text-slate-400 truncate">Create SKU / Barcode</p>
            </div>
          </Link>

          <Link
            to="/categories/new"
            className="p-3.5 bg-white border border-slate-200 text-slate-800 rounded-2xl flex items-center gap-3 shadow-xs hover:bg-slate-50 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate">Add Category</p>
              <p className="text-[10px] text-slate-500 truncate">Group items</p>
            </div>
          </Link>

          <Link
            to="/employees"
            className="p-3.5 bg-white border border-slate-200 text-slate-800 rounded-2xl flex items-center gap-3 shadow-xs hover:bg-slate-50 transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate">Store Staff ({metrics?.totalEmployees ?? 0})</p>
              <p className="text-[10px] text-slate-500 truncate">Cashiers & access</p>
            </div>
          </Link>
        </div>

        {/* 7. LIVE RECENT TRANSACTIONS / INVOICES */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Recent Invoices & Transactions</span>
              </h3>
              <p className="text-[11px] text-slate-400">Live bill records across counters</p>
            </div>
            <Link
              to="/invoices"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading invoices...</div>
          ) : recentInvoices.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-medium">No bills generated yet.</p>
              <Link
                to="/billing"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-xs font-bold rounded-xl"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Bill</span>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentInvoices.map((inv) => (
                <div key={inv.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{inv.customerName}</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(inv.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        • {inv.paymentMode}
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-black text-sm text-slate-950 block">
                      ₹{inv.grandTotal.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">PAID</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 8. PROPER ADMIN BUSINESS DETAILS CARD */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Business Profile & Legal Details</span>
            </h3>
            <Link
              to="/bill-settings"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
            >
              Edit Settings →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered Store Name</span>
              <span className="font-black text-slate-900 text-sm mt-0.5 block">{store?.name || '-'}</span>
              <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">Store Code: @{store?.slug || '-'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Contact & Billing Phone</span>
              <span className="font-black text-slate-900 text-sm mt-0.5 block">{store?.phone || '-'}</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block truncate">{store?.email || '-'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">GSTIN / Tax Identification</span>
              <span className="font-black text-slate-900 text-sm font-mono mt-0.5 block">
                {store?.gstin || 'Not Registered (Retail)'}
              </span>
              <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">
                {store?.gstin ? 'Verified GST Active' : 'Regular Small Business'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 sm:col-span-2 lg:col-span-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Store Address</span>
              <span className="font-medium text-slate-800 text-xs mt-0.5 block flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                {store?.address || 'Shop 101, Central Market, MG Road, Mumbai'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Store UPI ID</span>
              <span className="font-mono font-bold text-slate-800 text-xs mt-0.5 block">
                {store?.upiId || 'apexmart@okaxis'}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Printed on QR thermal bills</span>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
