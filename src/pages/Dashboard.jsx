import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  TrendingUp,
  TrendingDown,
  Receipt,
  AlertTriangle,
  BarChart3,
  CreditCard,
  FileSpreadsheet,
} from 'lucide-react';
import api from '../services/api';
import { DashboardSkeleton } from '../components/Skeletons';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('day'); // 'day' | 'week' | 'month' | 'year'
  const [metricType, setMetricType] = useState('sales'); // 'sales' | 'count' | 'profit'
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
  const periodStats = stats?.periodStats || {};
  const charts = stats?.charts || {};
  const paymentBreakdown = stats?.paymentBreakdown || [];
  const quotas = stats?.quotas;

  // Selected period data
  const currentPeriod = useMemo(() => {
    if (timeframe === 'week') return periodStats.week || { revenue: 0, bills: 0, aov: 0, profit: 0 };
    if (timeframe === 'month') return periodStats.month || { revenue: 0, bills: 0, aov: 0, profit: 0 };
    if (timeframe === 'year') return periodStats.year || { revenue: 0, bills: 0, aov: 0, profit: 0 };
    return periodStats.day || { revenue: 0, bills: 0, aov: 0, profit: 0, prevRevenue: 0, prevBills: 0, growthPercent: 0 };
  }, [periodStats, timeframe]);

  // Active chart dataset
  const activeChartData = useMemo(() => {
    if (!charts) return [];
    if (timeframe === 'day') return charts.day || [];
    if (timeframe === 'month') return charts.month || [];
    if (timeframe === 'year') return charts.year || [];
    return charts.week || [];
  }, [charts, timeframe]);

  // Max value calculation for SVG scaling
  const maxChartValue = useMemo(() => {
    if (!activeChartData.length) return 100;
    const values = activeChartData.map((d) => {
      if (metricType === 'count') return d.count || 0;
      if (metricType === 'profit') return d.profit || 0;
      return d.sales || 0;
    });
    const max = Math.max(...values, 0);
    return max > 0 ? max * 1.15 : 100;
  }, [activeChartData, metricType]);

  return (
    <AppLayout
      title={store?.name || 'Dashboard'}
      subtitle={store?.slug ? `@${store.slug} • Business Analytics` : 'Store Analytics'}
    >
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-3.5 pb-6">

        {/* 1. SUBSCRIPTION EXPIRY ALERT (ONLY IF <= 10 DAYS) */}
        {sub?.isExpiringSoon && (
          <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-3 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-black text-amber-900 block truncate">
                  Subscription Expire in {sub.daysRemaining} {sub.daysRemaining === 1 ? 'day' : 'days'}
                </span>
                <span className="text-[11px] text-amber-800 block truncate">
                  Plan: {sub.planName} • Renew to keep POS active
                </span>
              </div>
            </div>
            <Link
              to="/subscription"
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-black rounded-lg shrink-0"
            >
              Renew →
            </Link>
          </div>
        )}

        {/* 2. TIMEFRAME SELECTOR BAR (Day | Week | Month | Year) */}
        <div className="bg-white rounded-2xl p-1.5 border border-slate-200/80 shadow-xs flex items-center justify-between gap-1">
          <div className="grid grid-cols-4 w-full gap-1 text-xs font-bold">
            <button
              onClick={() => setTimeframe('day')}
              className={`py-1.5 rounded-xl transition-all ${timeframe === 'day'
                  ? 'bg-slate-900 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              Day
            </button>
            <button
              onClick={() => setTimeframe('week')}
              className={`py-1.5 rounded-xl transition-all ${timeframe === 'week'
                  ? 'bg-slate-900 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              Week
            </button>
            <button
              onClick={() => setTimeframe('month')}
              className={`py-1.5 rounded-xl transition-all ${timeframe === 'month'
                  ? 'bg-slate-900 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              Month
            </button>
            <button
              onClick={() => setTimeframe('year')}
              className={`py-1.5 rounded-xl transition-all ${timeframe === 'year'
                  ? 'bg-slate-900 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
            >
              Year
            </button>
          </div>
        </div>

        {/* 3. FOUR COMPACT EXECUTIVE KPI CARDS (Revenue, Bills, Profit, AOV) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
          {/* Card 1: Revenue / Earnings */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                {timeframe === 'day' ? "Today's Revenue" : `${timeframe.toUpperCase()} Revenue`}
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded">
                Earned
              </span>
            </div>
            <div className="mt-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight block">
                ₹{loading ? '...' : (currentPeriod.revenue ?? 0).toLocaleString('en-IN')}
              </span>
              <div className="flex items-center gap-1 mt-1 text-[10px] font-bold">
                {timeframe === 'day' && periodStats.day && (
                  <span
                    className={`inline-flex items-center gap-0.5 ${periodStats.day.growthPercent >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                  >
                    {periodStats.day.growthPercent >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {periodStats.day.growthPercent >= 0 ? '+' : ''}
                    {periodStats.day.growthPercent}% vs Yesterday
                  </span>
                )}
                {timeframe !== 'day' && (
                  <span className="text-slate-400 font-normal">Total collected</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Number of Bills */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Number of Bills
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.2 rounded">
                Counter
              </span>
            </div>
            <div className="mt-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight block">
                {loading ? '...' : currentPeriod.bills ?? 0}{' '}
                <span className="text-xs font-bold text-slate-400">Bills</span>
              </span>
              <div className="mt-1 text-[10px] text-slate-500 font-medium">
                {timeframe === 'day'
                  ? `Yesterday: ${periodStats.day?.prevBills ?? 0} bills`
                  : `Active in this ${timeframe}`}
              </div>
            </div>
          </div>

          {/* Card 3: Estimated Gross Profit */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Estimated Profit
              </span>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded">
                ~22% Margin
              </span>
            </div>
            <div className="mt-1.5">
              <span className="text-xl sm:text-2xl font-black text-emerald-800 font-mono tracking-tight block">
                ₹{loading ? '...' : (currentPeriod.profit ?? 0).toLocaleString('en-IN')}
              </span>
              <div className="mt-1 text-[10px] text-slate-400 font-medium">
                Gross earnings estimate
              </div>
            </div>
          </div>

          {/* Card 4: Average Bill (AOV) */}
          <div className="bg-white rounded-2xl p-3 sm:p-3.5 border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Avg Bill (AOV)
              </span>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.2 rounded">
                Per Customer
              </span>
            </div>
            <div className="mt-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-950 font-mono tracking-tight block">
                ₹{loading ? '...' : (currentPeriod.aov ?? 0).toLocaleString('en-IN')}
              </span>
              <div className="mt-1 text-[10px] text-slate-400 font-medium">
                Revenue / Total bills
              </div>
            </div>
          </div>
        </div>

        {/* 3.1. COMPACT YESTERDAY VS TODAY STRIP (Shown in Day view) */}
        {timeframe === 'day' && periodStats.day && (
          <div className="bg-white rounded-2xl p-3 border border-slate-200/80 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Today: ₹{periodStats.day.revenue?.toLocaleString('en-IN')} ({periodStats.day.bills} bills)
              </span>
              <span className="text-slate-500 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-300" />
                Yesterday: ₹{periodStats.day.prevRevenue?.toLocaleString('en-IN')} ({periodStats.day.prevBills} bills)
              </span>
            </div>

            {/* Split Comparison Bar */}
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex">
              <div
                className="h-full bg-emerald-500 transition-all duration-500"
                style={{
                  width: `${(periodStats.day.revenue + periodStats.day.prevRevenue) > 0
                      ? Math.round((periodStats.day.revenue / (periodStats.day.revenue + periodStats.day.prevRevenue)) * 100)
                      : 50
                    }%`,
                }}
              />
              <div
                className="h-full bg-slate-300 transition-all duration-500"
                style={{
                  width: `${(periodStats.day.revenue + periodStats.day.prevRevenue) > 0
                      ? Math.round((periodStats.day.prevRevenue / (periodStats.day.revenue + periodStats.day.prevRevenue)) * 100)
                      : 50
                    }%`,
                }}
              />
            </div>
          </div>
        )}

        {/* 4. MAIN INTERACTIVE VISUAL CHART & BARS */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                {timeframe.toUpperCase()} Performance Graph
              </h3>
            </div>

            {/* Metric Toggle Buttons: Revenue | Bills | Profit */}
            <div className="bg-slate-100 p-0.5 rounded-xl flex items-center text-[10px] font-bold">
              <button
                onClick={() => setMetricType('sales')}
                className={`px-2.5 py-1 rounded-lg transition-all ${metricType === 'sales'
                    ? 'bg-white text-slate-950 font-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                ₹ Revenue
              </button>
              <button
                onClick={() => setMetricType('count')}
                className={`px-2.5 py-1 rounded-lg transition-all ${metricType === 'count'
                    ? 'bg-white text-slate-950 font-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                Bills Count
              </button>
              <button
                onClick={() => setMetricType('profit')}
                className={`px-2.5 py-1 rounded-lg transition-all ${metricType === 'profit'
                    ? 'bg-white text-slate-950 font-black shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                  }`}
              >
                Profit
              </button>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="relative pt-1">
            {hoveredPoint && (
              <div className="absolute top-0 right-0 bg-slate-900 text-white px-2.5 py-1 rounded-lg text-[11px] font-mono shadow-md z-10 flex items-center gap-1.5">
                <span className="text-emerald-400 font-bold">{hoveredPoint.label}:</span>
                <span>₹{hoveredPoint.sales?.toLocaleString('en-IN')}</span>
                <span className="text-slate-400">({hoveredPoint.count} bills)</span>
                <span className="text-teal-300">P: ₹{hoveredPoint.profit}</span>
              </div>
            )}

            <div className="h-40 sm:h-48 w-full flex items-end gap-1.5 sm:gap-2 pt-6 px-1 border-b border-slate-100">
              {activeChartData.map((d, index) => {
                const val = metricType === 'count' ? d.count : metricType === 'profit' ? d.profit : d.sales;
                const heightPercent = maxChartValue > 0 ? Math.max((val / maxChartValue) * 100, 4) : 4;
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
                      className={`transition-all duration-300 w-full rounded-t-lg ${isHovered
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
                    className={`flex-1 text-center truncate ${d.label === 'Today' ? 'text-emerald-700 font-black' : ''
                      }`}
                  >
                    {d.label}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* 5. BREAKDOWN DATA TABLE (For Selected Period) */}
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>{timeframe.toUpperCase()} Data Breakdown</span>
            </h3>
            <span className="text-[10px] text-slate-400">Date-wise numbers</span>
          </div>

          <div className="divide-y divide-slate-100 text-xs">
            {activeChartData.map((row, idx) => (
              <div key={idx} className="py-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-bold ${row.label === 'Today' ? 'text-emerald-700 font-black' : 'text-slate-800'
                      }`}
                  >
                    {row.label}
                  </span>
                  {row.date && <span className="text-[10px] text-slate-400 font-mono">{row.date}</span>}
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px]">
                  <span className="text-slate-500">{row.count} bills</span>
                  <span className="text-teal-700 font-bold">P: ₹{row.profit?.toLocaleString('en-IN')}</span>
                  <span className="font-black text-slate-950 text-right min-w-[70px]">
                    ₹{row.sales?.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. PAYMENT MODE BREAKDOWN & QUOTAS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {/* Payment Mode Share */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-900 block pb-1 border-b border-slate-100">
              Payment Mode Share
            </span>
            <div className="space-y-2">
              {paymentBreakdown.map((pm) => (
                <div key={pm.mode} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-slate-400" />
                      {pm.mode}
                    </span>
                    <span className="text-slate-900 font-mono">
                      ₹{pm.sales.toLocaleString('en-IN')}{' '}
                      <span className="text-slate-400 text-[10px]">({pm.percent}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${pm.mode === 'UPI'
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

          {/* Quick Balance Meters (SMS & WhatsApp) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100">
              <span className="text-xs font-black uppercase tracking-wider text-slate-900">
                Message Quotas
              </span>
              <Link to="/subscription#booster-packs" className="text-emerald-700 text-[10px] font-bold">
                Top-up →
              </Link>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-black uppercase text-slate-400 block">SMS Left</span>
                <span className="text-base font-black font-mono text-slate-900">
                  {loading ? '...' : quotas?.smsBalance ?? 0}
                </span>
                <span className="text-[9px] text-slate-400 block">
                  {quotas?.smsPlanBalance || 0} plan + {quotas?.smsBoosterBalance || 0} booster
                </span>
              </div>

              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <span className="text-[10px] font-black uppercase text-slate-400 block">WhatsApp Left</span>
                <span className="text-base font-black font-mono text-slate-900">
                  {loading ? '...' : quotas?.whatsAppBalance ?? 0}
                </span>
                <span className="text-[9px] text-slate-400 block">
                  {quotas?.whatsAppPlanBalance || 0} plan + {quotas?.whatsAppBoosterBalance || 0} booster
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
      )}
    </AppLayout>
  );
}
