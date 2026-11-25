import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Lock,
  Zap,
  ShieldCheck,
  CreditCard,
  Check,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ChevronLeft,
} from 'lucide-react';
import api from '../services/api';
import { confirmDialog, toastSuccess, toastError } from '../utils/alerts';

export default function SubscriptionPlans() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activatingId, setActivatingId] = useState(null);

  const fetchSubscription = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/subscription');
      if (res.data?.success) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error(err);
      toastError(err.response?.data?.error || 'Failed to load subscription details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const handleActivatePlan = async (plan) => {
    const isFree = plan.price === 0 || plan.planType === 'FREE_TRIAL' || plan.planType === 'FREE';
    const confirmed = await confirmDialog({
      title: `Activate ${plan.name}?`,
      text: isFree
        ? `Activate this ${plan.durationType} plan for free?`
        : `Activate ${plan.name} for ₹${plan.price}? Valid for ${plan.durationType}.`,
      confirmButtonText: 'Yes, Activate Plan',
      confirmButtonColor: '#10b981',
    });

    if (!confirmed) return;

    setActivatingId(plan.id || plan._id);
    try {
      const res = await api.post('/admin/subscription/activate', {
        planId: plan.id || plan._id,
        paymentMethod: 'UPI',
      });
      if (res.data?.success) {
        toastSuccess(res.data.message || 'Plan activated successfully!');
        fetchSubscription();
      }
    } catch (err) {
      toastError(err.response?.data?.error || err.message || 'Failed to activate plan');
    } finally {
      setActivatingId(null);
    }
  };

  const current = data?.currentSubscription;
  const canActivate = data?.canActivate;
  const daysRemaining = data?.daysRemaining;
  const plans = data?.availablePlans || [];
  const history = data?.history || [];

  return (
    <AppLayout
      title="Subscription Plans"
      subtitle="Store License & Upgrades"
      backTo="/profile"
    >
      <div className="max-w-6xl mx-auto space-y-5 pb-12">
        {loading ? (
          <div className="py-20 text-center text-xs text-slate-400 animate-pulse">
            Loading subscription details & plans...
          </div>
        ) : (
          <>
            {/* 1. CURRENT SUBSCRIPTION BANNER */}
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white rounded-3xl p-5 shadow-xl relative overflow-hidden border border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
                      Current Plan
                    </h3>
                    <p className="text-sm font-black text-white">{current?.planName || 'No Active Plan'}</p>
                  </div>
                </div>

                {typeof daysRemaining === 'number' && (
                  <span
                    className={`text-xs font-black px-2.5 py-1 rounded-full border ${
                      daysRemaining > 7
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : daysRemaining > 0
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    }`}
                  >
                    {daysRemaining > 0 ? `${daysRemaining} days left` : 'Expired'}
                  </span>
                )}
              </div>

              {/* Status & Validity Dates */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px]">Start Date</span>
                  <span className="font-bold text-slate-200">
                    {current?.startDate ? new Date(current.startDate).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                </div>
                <div className="p-2.5 bg-white/5 rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px]">Expiry Date</span>
                  <span className="font-bold text-slate-200">
                    {current?.endDate ? new Date(current.endDate).toLocaleDateString('en-IN') : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Renewal Rule Notice */}
              <div className="mt-3">
                {!canActivate && typeof daysRemaining === 'number' && daysRemaining > 7 ? (
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5 text-[11px] text-amber-200/90 leading-relaxed">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-amber-300 block">Renewal Locked ({daysRemaining} days remaining)</span>
                      <span>
                        Aapka current plan abhi active hai. New plan activate / renew karne ka option expiry ke <strong>7 din pehle</strong> open hoga.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/25 rounded-2xl flex items-center gap-2.5 text-[11px] text-emerald-200">
                    <Zap className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>
                      <strong>Renewal Open!</strong> Aap neeche diye gaye kisi bhi plan ko activate ya renew kar sakte hain.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2. AVAILABLE PLANS GRID */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                  Available Plans ({plans.length})
                </h3>
                <span className="text-[10px] text-slate-400 font-medium">Added by Admin</span>
              </div>

              {plans.length === 0 ? (
                <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 text-xs text-slate-400">
                  No subscription plans available currently. Please contact Super Admin.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {plans.map((p) => {
                    const isCurrent = current?.planId === (p.id || p._id);
                    const isActivating = activatingId === (p.id || p._id);
                    const isLocked = !canActivate && typeof daysRemaining === 'number' && daysRemaining > 7;

                    return (
                      <div
                        key={p.id || p._id}
                        className={`bg-white rounded-3xl p-4 sm:p-5 border transition-all ${
                          isCurrent
                            ? 'border-emerald-500 shadow-md ring-2 ring-emerald-500/20'
                            : 'border-slate-200/80 shadow-xs hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-black text-sm text-slate-900">{p.name}</h4>
                              {isCurrent && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                  Current
                                </span>
                              )}
                              {p.isPopular && (
                                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                                  Popular
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1">{p.description || 'Full POS & Billing Access'}</p>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-lg font-black text-slate-950 block">
                              {p.price === 0 ? 'Free' : `₹${p.price}`}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">
                              {p.durationType}
                            </span>
                          </div>
                        </div>

                        {/* Features List */}
                        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-700">
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Unlimited Invoices & Thermal Printing</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>SMS & WhatsApp Digital Receipt Sharing</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Unlimited Products, Categories & Barcode Scanning</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Staff & Cashier Employee Logins</span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-4 pt-3 border-t border-slate-100">
                          {isCurrent && isLocked ? (
                            <button
                              disabled
                              className="w-full py-2.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Current Active Plan ({daysRemaining} days left)</span>
                            </button>
                          ) : isLocked ? (
                            <button
                              disabled
                              className="w-full py-2.5 bg-slate-100 text-slate-400 text-xs font-bold rounded-xl cursor-not-allowed flex items-center justify-center gap-1.5"
                              title="Available within 7 days of expiry"
                            >
                              <Lock className="w-3.5 h-3.5" />
                              <span>Renewal Locked (Available in {daysRemaining - 7} days)</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={isActivating}
                              onClick={() => handleActivatePlan(p)}
                              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs font-black rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                            >
                              {isActivating ? (
                                <span>Activating...</span>
                              ) : (
                                <>
                                  <Zap className="w-4 h-4" />
                                  <span>{isCurrent ? 'Renew Plan' : 'Activate Plan'}</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 3. SUBSCRIPTION HISTORY */}
            {history.length > 0 && (
              <div className="bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 pb-1 border-b border-slate-100">
                  License History
                </h3>
                <div className="space-y-2 divide-y divide-slate-100">
                  {history.map((h) => (
                    <div key={h.id} className="pt-2 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold text-slate-800 block">{h.planName}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(h.startDate).toLocaleDateString('en-IN')} -{' '}
                          {new Date(h.endDate).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-slate-900 block">
                          {h.amountPaid === 0 ? 'Free' : `₹${h.amountPaid}`}
                        </span>
                        <span className="text-[10px] text-emerald-700 uppercase font-bold">
                          {h.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppLayout>
  );
}
