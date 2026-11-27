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
  CreditCard,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
  Download,
  Printer,
  UserCheck,
} from 'lucide-react';
import api from '../services/api';
import { downloadInvoicePdf } from '../utils/pdfGenerator';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('day'); // 'day' | 'week' | 'month' | 'year'
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
  const summary = stats?.summary;
  const paymentBreakdown = stats?.paymentBreakdown || [];
  const quotas = stats?.quotas;
  const metrics = stats?.metrics;
  const recentInvoices = stats?.recentInvoices || [];

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
    return max > 0 ? max * 1.15 : 100;
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
      subtitle={store?.slug ? `@${store.slug} • Business Console` : 'Merchant Console'}
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

        {/* 2. CLEAN & MODERN STORE IDENTITY HEADER (Replaces bulky dark banner) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {store?.name || 'Apex Mart Superstore'}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live POS Ready
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                <span className="font-medium text-slate-600">@{store?.slug || 'apex-mart'}</span>
                {store?.phone && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span>{store.phone}</span>
                  </>
                )}
                {store?.gstin && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="font-mono text-[10px] text-slate-600 font-bold">GST: {store.gstin}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Link
              to="/billing"
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <Receipt className="w-4 h-4" />
              <span>Create New Bill (POS)</span>
            </Link>
          </div>
        </div>

        {/* 3. EXECUTIVE PERIOD SWITCHER (DAY / WEEK / MONTH / YEAR) */}
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                <span>Store Business Performance</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Monitor day, week, month, and year sales trends
              </p>
            </div>

            {/* Timeframe selector tabs */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
              <button
                onClick={() => setTimeframe('day')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timeframe === 'day'
                    ? 'bg-white text-slate-900 font-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setTimeframe('week')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timeframe === 'week'
                    ? 'bg-white text-slate-900 font-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeframe('month')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timeframe === 'month'
                    ? 'bg-white text-slate-900 font-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setTimeframe('year')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  timeframe === 'year'
                    ? 'bg-white text-slate-900 font-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Year
              </button>
            </div>
          </div>

          {/* 3.1. DAY VIEW: TODAY VS YESTERDAY PERFORMANCE */}
          {timeframe === 'day' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* TODAY'S SALES */}
                <div className="bg-gradient-to-br from-emerald-50/70 via-teal-50/30 to-white rounded-2xl p-4 sm:p-5 border border-emerald-200/80 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Today's Sales
                    </span>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Live
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="text-3xl sm:text-4xl font-black text-slate-950 font-mono tracking-tight">
                      ₹{loading ? '...' : (salesComp?.today?.sales ?? 0).toLocaleString('en-IN')}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                      <span className="font-bold text-slate-900">
                        {loading ? '...' : salesComp?.today?.count ?? 0} Bills
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        Avg Bill: <strong className="font-bold text-slate-800">₹{salesComp?.today?.aov ?? 0}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* YESTERDAY'S SALES */}
                <div className="bg-gradient-to-br from-slate-50 via-slate-50/50 to-white rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      Yesterday's Sales
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      Completed
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="text-3xl sm:text-4xl font-black text-slate-800 font-mono tracking-tight">
                      ₹{loading ? '...' : (salesComp?.yesterday?.sales ?? 0).toLocaleString('en-IN')}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="font-bold text-slate-700">
                        {loading ? '...' : salesComp?.yesterday?.count ?? 0} Bills
                      </span>
                      <span className="text-slate-300">•</span>
                      <span>
                        Avg Bill: <strong className="font-bold text-slate-700">₹{salesComp?.yesterday?.aov ?? 0}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Day-to-Day Comparison Pill */}
              {salesComp && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    {salesComp.difference >= 0 ? (
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </span>
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center">
                        <TrendingDown className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <span className="font-bold text-slate-800">
                      {salesComp.difference >= 0 ? 'Revenue Growth:' : 'Revenue Drop:'}{' '}
                      <strong className={salesComp.difference >= 0 ? 'text-emerald-700' : 'text-rose-700'}>
                        {salesComp.difference >= 0 ? '+' : ''}₹{salesComp.difference.toLocaleString('en-IN')}{' '}
                        ({salesComp.growthPercent >= 0 ? '+' : ''}{salesComp.growthPercent}%)
                      </strong>
                    </span>
                  </div>

                  <span className="text-slate-500 text-[11px]">
                    Bills comparison:{' '}
                    <strong className="text-slate-800">
                      {salesComp.countDifference >= 0 ? `+${salesComp.countDifference}` : salesComp.countDifference} bills
                    </strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 3.2. WEEK / MONTH / YEAR INTERACTIVE GRAPH & STATS */}
          {timeframe !== 'day' && (
            <div className="space-y-4">
              {/* Summary Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-slate-50 p-3 rounded-2xl border border-slate-100">
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

              {/* Metric Toggle (₹ Revenue vs Bills Count) */}
              <div className="flex items-center justify-end">
                <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-[11px] font-bold">
                  <button
                    onClick={() => setMetricType('sales')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      metricType === 'sales'
                        ? 'bg-white text-slate-950 font-black shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    ₹ Revenue
                  </button>
                  <button
                    onClick={() => setMetricType('count')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      metricType === 'count'
                        ? 'bg-white text-slate-950 font-black shadow-xs'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Bills Count
                  </button>
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

                <div className="h-44 sm:h-52 w-full flex items-end gap-1.5 sm:gap-2 pt-6 px-1 border-b border-slate-100">
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
          )}
        </div>

        {/* 4. LIVE RECENT TRANSACTIONS / BILLS (With Cashier Name & PDF Download) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span>Recent Invoices & Cashier Records</span>
              </h3>
              <p className="text-[11px] text-slate-400">Shows bill number, staff who created it, and 1-click PDF download</p>
            </div>
            <Link
              to="/invoices"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5"
            >
              <span>All Bills ({summary?.totalInvoicesCount || 0})</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading bills...</div>
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
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 truncate">{inv.customerName}</span>
                      <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                        {inv.invoiceNumber}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-slate-500">
                        • {inv.paymentMode}
                      </span>
                    </div>

                    {/* Cashier / Employee who generated the bill */}
                    <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-1 text-slate-600">
                        <UserCheck className="w-3 h-3 text-emerald-600" />
                        <span>Billed By: <strong className="text-slate-800">{inv.billedBy?.name || 'Store Admin'}</strong></span>
                      </span>
                      <span className="text-slate-300">•</span>
                      <span className="text-slate-400">
                        {new Date(inv.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 space-y-1">
                    <span className="font-black text-sm text-slate-950 block">
                      ₹{inv.grandTotal.toLocaleString('en-IN')}
                    </span>
                    <button
                      type="button"
                      onClick={() => downloadInvoicePdf(inv)}
                      className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                      title="Download PDF Invoice"
                    >
                      <Download className="w-3 h-3" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 5. QUOTAS & PAYMENT MODES ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SMS & WhatsApp Booster Quota Meters */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Digital Receipt Quotas</span>
              <Link to="/subscription#booster-packs" className="text-emerald-700 text-[10px] font-bold">
                Get Boosters →
              </Link>
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/subscription#booster-packs"
                className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-100 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100/60 px-1.5 py-0.2 rounded">
                    Recharge
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">SMS Left</span>
                  <div className="text-lg font-black font-mono text-slate-900">
                    {loading ? '...' : quotas?.smsBalance ?? 0}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {quotas?.smsPlanBalance || 0} plan + {quotas?.smsBoosterBalance || 0} booster
                  </p>
                </div>
              </Link>

              <Link
                to="/subscription#booster-packs"
                className="bg-slate-50/70 rounded-2xl p-3.5 border border-slate-100 hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100/60 px-1.5 py-0.2 rounded">
                    Recharge
                  </span>
                </div>
                <div className="mt-2">
                  <span className="text-[10px] font-black uppercase text-slate-400 block">WhatsApp Left</span>
                  <div className="text-lg font-black font-mono text-slate-900">
                    {loading ? '...' : quotas?.whatsAppBalance ?? 0}
                  </div>
                  <p className="text-[9px] text-slate-400 mt-0.5">
                    {quotas?.whatsAppPlanBalance || 0} plan + {quotas?.whatsAppBoosterBalance || 0} booster
                  </p>
                </div>
              </Link>
            </div>
          </div>

          {/* Payment Method Share */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
              <span>Payment Mode Breakdown</span>
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
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
        </div>

        {/* 6. QUICK SHORTCUTS ROW (Add Product, Category, Employees) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            to="/products/new"
            className="p-3.5 bg-slate-900 text-white rounded-2xl flex items-center gap-3 shadow-md shadow-slate-900/10 hover:bg-slate-800 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4 font-black" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate">Add Product</p>
              <p className="text-[10px] text-slate-400 truncate">Total Products: {metrics?.totalProducts ?? 0}</p>
            </div>
          </Link>

          <Link
            to="/categories/new"
            className="p-3.5 bg-white border border-slate-200 text-slate-800 rounded-2xl flex items-center gap-3 shadow-xs hover:bg-slate-50 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Plus className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate">Add Category</p>
              <p className="text-[10px] text-slate-500 truncate">Categories: {metrics?.totalCategories ?? 0}</p>
            </div>
          </Link>

          <Link
            to="/employees"
            className="p-3.5 bg-white border border-slate-200 text-slate-800 rounded-2xl flex items-center gap-3 shadow-xs hover:bg-slate-50 transition-all"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate">Store Staff ({metrics?.totalEmployees ?? 0})</p>
              <p className="text-[10px] text-slate-500 truncate">Cashiers & permissions</p>
            </div>
          </Link>
        </div>

        {/* 7. BUSINESS PROFILE & LEGAL DETAILS CARD */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              <span>Business Profile & Bill Header Details</span>
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
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Registered Store</span>
              <span className="font-black text-slate-900 text-sm mt-0.5 block">{store?.name || '-'}</span>
              <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">Store Code: @{store?.slug || '-'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Billing Contact</span>
              <span className="font-black text-slate-900 text-sm mt-0.5 block">{store?.phone || '-'}</span>
              <span className="text-[11px] text-slate-500 mt-0.5 block truncate">{store?.email || '-'}</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">GSTIN / Tax ID</span>
              <span className="font-black text-slate-900 text-sm font-mono mt-0.5 block">
                {store?.gstin || 'Retail Small Business'}
              </span>
              <span className="text-[11px] text-emerald-700 font-bold mt-0.5 block">
                {store?.gstin ? 'Verified GST Active' : 'Composition Scheme'}
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
              <span className="text-[10px] text-slate-400 block mt-0.5">Printed on QR receipts</span>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
